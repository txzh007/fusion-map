import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseMapProvider, MapError, MapLoadingState } from '../services/BaseMapProvider';
import { Container } from '../di/Container';
import { ErrorCode } from '../errors';

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
      expect(error.message).toContain('Token is required for Amap map provider');
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
      expect(error.message).toContain('Container is not set');
    });
  });

  describe('脚本加载失败', () => {
    it('应该失败后重试并最终抛出 SCRIPT_LOAD_FAILED', async () => {
      (provider as any).maxRetries = 2;
      (provider as any).scriptRetryDelayMs = 1;
      (provider as any).scriptTimeoutMs = 200;

      const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
        setTimeout(() => {
          if (node.onerror) {node.onerror(new Error('Network error'));}
        }, 0);
        return node;
      });

      await expect((provider as any).loadScript('https://example.com/fail.js'))
        .rejects
        .toMatchObject({ code: ErrorCode.SCRIPT_LOAD_FAILED });

      expect(appendChildSpy).toHaveBeenCalledTimes(3);
      appendChildSpy.mockRestore();
    });

    it('应该在超时时抛出 TIMEOUT', async () => {
      (provider as any).maxRetries = 0;
      (provider as any).scriptTimeoutMs = 5;

      const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => node);

      await expect((provider as any).loadScript('https://example.com/timeout.js'))
        .rejects
        .toMatchObject({ code: ErrorCode.TIMEOUT });

      appendChildSpy.mockRestore();
    });

    it('应该复用同一脚本的并发加载请求', async () => {
      (provider as any).maxRetries = 0;
      (provider as any).scriptTimeoutMs = 200;

      const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
        setTimeout(() => {
          if (node.onload) {node.onload(new Event('load'));}
        }, 0);
        return node;
      });

      const p1 = (provider as any).loadScript('https://example.com/same.js');
      const p2 = (provider as any).loadScript('https://example.com/same.js');

      await Promise.all([p1, p2]);

      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      appendChildSpy.mockRestore();
    });
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
      expect(error.message).toContain('Failed to load Amap');
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
      expect(error.message).toContain('Container is not set');
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
