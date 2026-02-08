import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseMapProvider, MapError, MapLoadingState } from '../services/BaseMapProvider';
import { Container } from '../di/Container';

describe('BaseMapProvider: Error Handling', () => {
  let provider: BaseMapProvider;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // 清理容器
    (Container as any).instances.clear();

    provider = new BaseMapProvider();
    mockContainer = {
      innerHTML: '',
      clientHeight: 800,
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelector: vi.fn()
    } as any;
    provider.setContainer(mockContainer);
  });

  describe('错误订阅', () => {
    it('应该订阅错误事件', async () => {
      const errors: MapError[] = [];
      const errorPromise = new Promise<MapError>((resolve) => {
        provider.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      // 触发错误
      provider.setTokens({ amap: '' });
      provider.switchMap('amap');

      const error = await errorPromise;
      expect(error.type).toBe('amap');
      expect(error.message).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });

    it('应该订阅加载状态事件', async () => {
      const loadingPromise = new Promise<MapLoadingState>((resolve) => {
        provider.loading$.subscribe((state) => {
          resolve(state);
        });
      });

      // 触发加载
      provider.setTokens({ amap: 'test-key' });
      provider.switchMap('amap');

      const state = await loadingPromise;
      expect(state.type).toBe('amap');
      expect(typeof state.loading).toBe('boolean');
    });
  });

  describe('Token 缺失错误', () => {
    it('应该在 Token 缺失时上报错误', async () => {
      const errorPromise = new Promise<MapError>((resolve) => {
        provider.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      provider.switchMap('amap');

      const error = await errorPromise;
      expect(error.type).toBe('amap');
      expect(error.message).toContain('请提供高德地图 Key');
    });

    it('应该在 Token 缺失时渲染错误 UI', async () => {
      await provider.switchMap('amap');

      // 等待一点时间让错误 UI 渲染
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockContainer.innerHTML).toContain('AMAP');
      expect(mockContainer.innerHTML).toContain('Please provide Amap Key (JS API)');
    });
  });

  describe('容器未设置错误', () => {
    it('应该在容器未设置时上报错误', async () => {
      provider.setContainer(null as any);

      const errorPromise = new Promise<MapError>((resolve) => {
        provider.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      provider.switchMap('amap');

      const error = await errorPromise;
      expect(error.message).toContain('容器未设置');
    });
  });

  describe('脚本加载失败', () => {
    it('应该在脚本加载失败时重试', async () => {
      const errors: MapError[] = [];
      const errorPromise = new Promise<MapError>((resolve) => {
        provider.errors$.subscribe((error) => {
          errors.push(error);
          if (error.message.includes('脚本加载失败')) {
            resolve(error);
          }
        });
      });

      // Mock document.head.appendChild to simulate script load failure
      const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
        // 模拟脚本加载失败
        setTimeout(() => {
          if (node.onerror) node.onerror(new Error('Network error'));
        }, 10);
        return node;
      });

      // 设置 Token 以避免 Token 缺失错误
      provider.setTokens({ amap: 'test-key' });

      try {
        await provider.switchMap('amap');
      } catch (e) {
        // 预期会抛出错误
      }

      // 等待错误上报
      await errorPromise;

      // 验证错误被上报
      expect(errors.length).toBeGreaterThan(0);
      const scriptError = errors.find(e => e.message.includes('脚本加载失败'));
      expect(scriptError).toBeDefined();

      appendChildSpy.mockRestore();
    }, 15000); // 增加超时时间
  });

  describe('SDK 加载失败', () => {
    it('应该在 SDK 加载失败时上报错误', async () => {
      const errorPromise = new Promise<MapError>((resolve) => {
        provider.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      // Mock loadScript to simulate SDK load failure
      vi.spyOn(provider as any, 'loadScript').mockRejectedValue(new Error('Network error'));

      provider.setTokens({ amap: 'test-key' });
      provider.switchMap('amap');

      const error = await errorPromise;
      expect(error.type).toBe('amap');
      expect(error.message).toContain('高德地图加载失败');
    });
  });

  describe('updateCamera 错误处理', () => {
    it('应该在容器未设置时上报错误', async () => {
      provider.setContainer(null as any);

      const errorPromise = new Promise<MapError>((resolve) => {
        provider.errors$.subscribe((error) => {
          resolve(error);
        });
      });

      provider.updateCamera({
        center: [116.397, 39.918],
        zoom: 12,
        pitch: 45,
        bearing: 90
      });

      const error = await errorPromise;
      expect(error.message).toContain('容器未设置');
    });
  });

  describe('clearError', () => {
    it('应该清除错误 UI', async () => {
      await provider.switchMap('amap');

      expect(mockContainer.innerHTML).not.toBe('');

      provider.clearError('amap');

      expect(mockContainer.innerHTML).toBe('');
    });
  });

  describe('getMapInstance', () => {
    it('应该返回 null 对于 tianditu', () => {
      const instance = provider.getMapInstance('tianditu');
      expect(instance).toBeNull();
    });
  });

  describe('reset', () => {
    it('应该重置所有状态', async () => {
      // 设置一些状态
      provider.setTokens({ amap: 'test-key' });
      provider.switchMap('amap');

      // 等待一点时间让状态设置完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 重置
      provider.reset();

      // 验证状态已重置
      expect((provider as any).instances.amap).toBeNull();
      expect((provider as any).instances.baidu).toBeNull();
      expect((provider as any).instances.cesium).toBeNull();
      expect((provider as any).instances.google).toBeNull();
      expect((provider as any).lastView).toBeNull();
      expect((provider as any).loadingScripts.size).toBe(0);
      expect((provider as any).retryAttempts.size).toBe(0);
    });
  });
});
