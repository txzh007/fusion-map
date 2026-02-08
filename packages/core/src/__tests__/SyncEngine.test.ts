import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncEngine } from '../services/SyncEngine';
import { BaseMapProvider } from '../services/BaseMapProvider';
import { Container } from '../di/Container';

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;
  let mockMap: any;
  let mockBaseMapProvider: any;

  beforeEach(() => {
    // 清理容器
    Container.clear();

    // 创建 mock provider
    mockBaseMapProvider = {
      updateCamera: vi.fn()
    };

    // 注入 mock provider 到容器
    Container.setInstance(BaseMapProvider, mockBaseMapProvider);

    // 创建 SyncEngine 实例
    syncEngine = new SyncEngine();

    mockMap = {
      on: vi.fn(),
      getCenter: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
      getZoom: vi.fn(() => 12),
      getPitch: vi.fn(() => 45),
      getBearing: vi.fn(() => 90)
    };
  });

  describe('bind', () => {
    it('应该绑定 MapLibre 实例', () => {
      syncEngine.bind(mockMap);

      expect((syncEngine as any).map).toBe(mockMap);
    });

    it('应该调用 attachListeners', () => {
      const attachListenersSpy = vi.spyOn(syncEngine as any, 'attachListeners');

      syncEngine.bind(mockMap);

      expect(attachListenersSpy).toHaveBeenCalled();
    });

    it('应该只绑定一次', () => {
      syncEngine.bind(mockMap);
      const firstCallCount = mockMap.on.mock.calls.length;

      syncEngine.bind(mockMap);
      const secondCallCount = mockMap.on.mock.calls.length;

      // 第二次绑定不应该添加新的事件监听器
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('attachListeners', () => {
    it('应该自动绑定 @Watch 事件', () => {
      syncEngine.bind(mockMap);

      expect(mockMap.on).toHaveBeenCalledWith('move', expect.any(Function));
      expect(mockMap.on).toHaveBeenCalledWith('zoom', expect.any(Function));
    });

    it('应该在没有 map 时直接返回', () => {
      (syncEngine as any).attachListeners();

      // 不应该抛出错误
      expect(true).toBe(true);
    });

    it('应该记录绑定信息', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      syncEngine.bind(mockMap);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SyncEngine] Auto-binding event')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('onCameraMove', () => {
    it('应该传递 WGS84 坐标给 BaseMapProvider', async () => {
      syncEngine.bind(mockMap);
      (syncEngine as any).onCameraMove();

      // 等待防抖完成
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalledWith({
        center: [116.397, 39.918],
        zoom: 12,
        pitch: 45,
        bearing: 90
      });
    });

    it('应该在没有 map 时直接返回', () => {
      (syncEngine as any).onCameraMove();

      // 不应该抛出错误
      expect(mockBaseMapProvider.updateCamera).not.toHaveBeenCalled();
    });

    it('应该传递正确的相机参数', async () => {
      syncEngine.bind(mockMap);

      // 设置不同的相机状态
      mockMap.getCenter.mockReturnValue({ lng: 121.4737, lat: 31.2304 });
      mockMap.getZoom.mockReturnValue(15);
      mockMap.getPitch.mockReturnValue(60);
      mockMap.getBearing.mockReturnValue(45);

      (syncEngine as any).onCameraMove();

      // 等待防抖完成
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalledWith({
        center: [121.4737, 31.2304],
        zoom: 15,
        pitch: 60,
        bearing: 45
      });
    });
  });

  describe('onZoomChange', () => {
    it('应该记录日志', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      (syncEngine as any).onZoomChange();

      expect(consoleSpy).toHaveBeenCalledWith('[SyncEngine] Zoom changed, adjusting LOD...');

      consoleSpy.mockRestore();
    });
  });
});

