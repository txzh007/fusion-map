import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FusionMap } from '../FusionMap';
import { Container } from '../di/Container';
import { BaseMapProvider } from '../services/BaseMapProvider';

describe('FusionMap: Error Handling', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // 清理容器
    Container.clear();

    mockContainer = {
      id: 'test-container',
      style: {} as any,
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelector: vi.fn(),
      innerHTML: ''
    } as any;

    vi.spyOn(document, 'getElementById').mockReturnValue(mockContainer);
  });

  afterEach(() => {
    // 清理所有 mock
    vi.restoreAllMocks();
  });

  describe('错误订阅', () => {
    it('应该订阅错误事件', async () => {
      // 创建 mock provider
      const mockBaseMapProvider = {
        updateCamera: vi.fn(),
        switchMap: vi.fn().mockRejectedValue(new Error('Network error')),
        setContainer: vi.fn(),
        setTokens: vi.fn(),
        errors$: { subscribe: vi.fn() },
        loading$: { subscribe: vi.fn() },
        activeMapType: 'amap' as const,
        container: null,
        viewer: null,
        tokens: {},
        cesiumCalibrationFactor: 1.9,
        genericZoomOffset: 0,
        instances: { amap: null, baidu: null, cesium: null, google: null },
        loadingScripts: new Map(),
        retryAttempts: new Map(),
        maxRetries: 3,
        lastView: null,
        getMapInstance: vi.fn(),
        clearError: vi.fn(),
        getActiveMapType: vi.fn(),
        reset: vi.fn(),
        setCesiumScaleFactor: vi.fn(),
        setZoomOffset: vi.fn()
      } as any;

      Container.setInstance(BaseMapProvider, mockBaseMapProvider);

      const fusionMap = new FusionMap('test-container');
      const errorPromise = new Promise<any>((resolve) => {
        fusionMap.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      try {
        await fusionMap.switchBaseMap('amap');
      } catch (e) {
        // 预期会抛出错误
      }

      const error = await errorPromise;
      expect(error.message).toContain('切换到 amap 失败');
    });

    it('应该订阅加载状态事件', async () => {
      const fusionMap = new FusionMap('test-container');
      const loadingPromise = new Promise<any>((resolve) => {
        fusionMap.loading$.subscribe((state) => {
          if (state.type === 'amap') {
            resolve(state);
          }
        });
      });

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      const switchMapSpy = vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      fusionMap.switchBaseMap('amap');

      const state = await loadingPromise;
      expect(state.type).toBe('amap');
      expect(typeof state.loading).toBe('boolean');

      switchMapSpy.mockRestore();
    });
  });

  describe('容器不存在错误', () => {
    it('应该在容器不存在时抛出错误', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);

      expect(() => new FusionMap('non-existent')).toThrow('Container non-existent not found');
    });
  });

  describe('地图切换错误', () => {
    it('应该在地图切换失败时上报错误', async () => {
      const fusionMap = new FusionMap('test-container');
      const errorPromise = new Promise<any>((resolve) => {
        fusionMap.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      // 模拟地图切换失败
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      const switchMapSpy = vi.spyOn(baseMapProvider, 'switchMap').mockRejectedValue(new Error('Network error'));

      try {
        await fusionMap.switchBaseMap('amap');
      } catch (e) {
        // 预期会抛出错误
      }

      const error = await errorPromise;
      expect(error.message).toContain('切换到 amap 失败');

      switchMapSpy.mockRestore();
    });

    it('应该在地图切换失败时设置加载状态为 false', async () => {
      const fusionMap = new FusionMap('test-container');
      const loadingStates: boolean[] = [];

      fusionMap.loading$.subscribe((state) => {
        if (state.type === 'amap') {
          loadingStates.push(state.loading);
        }
      });

      // 模拟地图切换失败
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      const switchMapSpy = vi.spyOn(baseMapProvider, 'switchMap').mockRejectedValue(new Error('Network error'));

      try {
        await fusionMap.switchBaseMap('amap');
      } catch (e) {
        // 预期会抛出错误
      }

      // 等待一点时间让状态更新
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证加载状态变化：true -> false
      expect(loadingStates).toContain(true);
      expect(loadingStates).toContain(false);

      switchMapSpy.mockRestore();
    });
  });

  describe('销毁错误', () => {
    it('应该在销毁失败时上报错误', async () => {
      const fusionMap = new FusionMap('test-container');
      const errorPromise = new Promise<any>((resolve) => {
        fusionMap.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      // 模拟销毁失败
      (fusionMap as any).map = {
        remove: vi.fn(() => {
          throw new Error('Destroy failed');
        })
      };

      fusionMap.destroy();

      const error = await errorPromise;
      expect(error.message).toContain('销毁地图失败');
    });
  });

  describe('加载状态管理', () => {
    it('应该在切换地图时设置加载状态为 true', async () => {
      const fusionMap = new FusionMap('test-container');
      const loadingPromise = new Promise<boolean>((resolve) => {
        fusionMap.loading$.subscribe((state) => {
          if (state.type === 'amap') {
            resolve(state.loading);
          }
        });
      });

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      fusionMap.switchBaseMap('amap');

      const isLoading = await loadingPromise;
      expect(isLoading).toBe(true);
    });

    it('应该在切换完成后设置加载状态为 false', async () => {
      const fusionMap = new FusionMap('test-container');
      const loadingStates: boolean[] = [];

      fusionMap.loading$.subscribe((state) => {
        if (state.type === 'amap') {
          loadingStates.push(state.loading);
        }
      });

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      await fusionMap.switchBaseMap('amap');

      // 验证加载状态变化：true -> false
      expect(loadingStates).toContain(true);
      expect(loadingStates).toContain(false);
    });
  });
});
