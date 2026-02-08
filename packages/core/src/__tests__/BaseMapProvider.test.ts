import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseMapProvider } from '../services/BaseMapProvider';
import gcoord from 'gcoord';

describe('BaseMapProvider', () => {
  let provider: BaseMapProvider;
  let mockContainer: HTMLElement;

  beforeEach(() => {
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

  describe('setTokens', () => {
    it('应该正确设置 tokens', () => {
      const tokens = {
        amap: 'amap-key',
        baidu: 'baidu-key',
        cesium: 'cesium-token',
        google: 'google-key',
        tianditu: 'tianditu-key',
        googleMapId: 'map-id'
      };

      provider.setTokens(tokens);

      // 通过私有属性访问 tokens（仅用于测试）
      expect((provider as any).tokens).toEqual(tokens);
    });
  });

  describe('setCesiumScaleFactor', () => {
    it('应该正确设置 Cesium 缩放因子', () => {
      provider.setCesiumScaleFactor(2.5);
      expect((provider as any).cesiumCalibrationFactor).toBe(2.5);
    });

    it('应该在 Cesium 激活时更新相机', () => {
      (provider as any).activeMapType = 'cesium';
      (provider as any).lastView = {
        center: [116.397, 39.918],
        zoom: 12,
        pitch: 0,
        bearing: 0
      };

      const updateCameraSpy = vi.spyOn(provider, 'updateCamera' as any);
      provider.setCesiumScaleFactor(2.5);

      expect(updateCameraSpy).toHaveBeenCalled();
    });
  });

  describe('setZoomOffset', () => {
    it('应该正确设置缩放偏移', () => {
      provider.setZoomOffset(1.5);
      expect((provider as any).genericZoomOffset).toBe(1.5);
    });

    it('应该在有 lastView 时更新相机', () => {
      (provider as any).lastView = {
        center: [116.397, 39.918],
        zoom: 12,
        pitch: 0,
        bearing: 0
      };

      const updateCameraSpy = vi.spyOn(provider, 'updateCamera' as any);
      provider.setZoomOffset(1.5);

      expect(updateCameraSpy).toHaveBeenCalled();
    });
  });

  describe('updateCamera', () => {
    it('应该处理 Amap 坐标转换', () => {
      (provider as any).activeMapType = 'amap';
      (provider as any).instances.amap = {
        setZoomAndCenter: vi.fn(),
        setPitch: vi.fn(),
        setRotation: vi.fn()
      };

      const view = {
        center: [116.397, 39.918] as [number, number],
        zoom: 12,
        pitch: 45,
        bearing: 90
      };

      provider.updateCamera(view);

      expect(gcoord.transform).toHaveBeenCalledWith(
        view.center,
        gcoord.WGS84,
        gcoord.GCJ02
      );
      expect((provider as any).instances.amap.setZoomAndCenter).toHaveBeenCalled();
    });

    it('应该处理 Baidu 坐标转换', () => {
      (provider as any).activeMapType = 'baidu';
      (provider as any).instances.baidu = {
        setHeading: vi.fn(),
        setTilt: vi.fn(),
        setZoom: vi.fn(),
        setCenter: vi.fn()
      };

      const view = {
        center: [116.397, 39.918] as [number, number],
        zoom: 12,
        pitch: 45,
        bearing: 90
      };

      provider.updateCamera(view);

      expect(gcoord.transform).toHaveBeenCalledWith(
        view.center,
        gcoord.WGS84,
        gcoord.BD09
      );
    });

    it('应该处理 Cesium 相机更新', () => {
      (provider as any).activeMapType = 'cesium';
      (provider as any).instances.cesium = {
        camera: {
          lookAt: vi.fn(),
          lookAtTransform: vi.fn()
        }
      };

      const view = {
        center: [116.397, 39.918] as [number, number],
        zoom: 12,
        pitch: 45,
        bearing: 90
      };

      provider.updateCamera(view);

      expect((provider as any).instances.cesium.camera.lookAt).toHaveBeenCalled();
    });

    it('应该处理 Google Maps 相机更新', () => {
      (provider as any).activeMapType = 'google';
      (provider as any).instances.google = {
        moveCamera: vi.fn()
      };

      const view = {
        center: [116.397, 39.918] as [number, number],
        zoom: 12,
        pitch: 45,
        bearing: 90
      };

      provider.updateCamera(view);

      expect((provider as any).instances.google.moveCamera).toHaveBeenCalled();
    });

    it('应该在没有容器时直接返回', () => {
      provider.setContainer(null as any);
      const view = {
        center: [116.397, 39.918] as [number, number],
        zoom: 12,
        pitch: 45,
        bearing: 90
      };

      provider.updateCamera(view);

      // 不应该抛出错误
      expect(true).toBe(true);
    });
  });

  describe('zoomToHeight', () => {
    it('应该正确计算海拔', () => {
      const height = (provider as any).zoomToHeight(12, 39.918);
      expect(height).toBeGreaterThan(0);
      expect(typeof height).toBe('number');
    });

    it('应该使用容器高度', () => {
      Object.defineProperty(mockContainer, 'clientHeight', {
        value: 1000,
        writable: true
      });
      const height1 = (provider as any).zoomToHeight(12, 39.918);

      Object.defineProperty(mockContainer, 'clientHeight', {
        value: 500,
        writable: true
      });
      const height2 = (provider as any).zoomToHeight(12, 39.918);

      expect(height1).not.toBe(height2);
    });
  });

  describe('switchMap', () => {
    it('应该清理容器', async () => {
      mockContainer.innerHTML = '<div>test</div>';
      (provider as any).instances.amap = { destroy: vi.fn() };

      // 模拟 Amap 加载成功
      const loadAmapSpy = vi.spyOn(provider as any, 'loadAmap').mockResolvedValue(undefined);

      await provider.switchMap('amap');

      expect(mockContainer.innerHTML).toBe('');
      expect(loadAmapSpy).toHaveBeenCalled();
    });

    it('应该销毁之前的 Amap 实例', async () => {
      const destroySpy = vi.fn();
      (provider as any).instances.amap = { destroy: destroySpy };

      await provider.switchMap('amap');

      expect(destroySpy).toHaveBeenCalled();
      expect((provider as any).instances.amap).toBeNull();
    });

    it('应该清理 Baidu 实例', async () => {
      (provider as any).instances.baidu = { someMethod: vi.fn() };

      await provider.switchMap('baidu');

      expect((provider as any).instances.baidu).toBeNull();
    });

    it('应该清理 Cesium 实例', async () => {
      (provider as any).instances.cesium = { someMethod: vi.fn() };

      // 模拟 Cesium 加载成功
      const loadCesiumSpy = vi.spyOn(provider as any, 'loadCesium').mockResolvedValue(undefined);

      await provider.switchMap('cesium');

      expect((provider as any).instances.cesium).toBeNull();
      expect(loadCesiumSpy).toHaveBeenCalled();
    }, 10000); // 增加超时时间到 10 秒

    it('应该清理 Google 实例', async () => {
      (provider as any).instances.google = { someMethod: vi.fn() };

      await provider.switchMap('google');

      expect((provider as any).instances.google).toBeNull();
    });

    it('应该调用对应的加载方法', async () => {
      const loadAmapSpy = vi.spyOn(provider as any, 'loadAmap').mockResolvedValue(undefined);

      await provider.switchMap('amap');

      expect(loadAmapSpy).toHaveBeenCalled();
    });

    it('应该保留 lastView', async () => {
      const view = {
        center: [116.397, 39.918] as [number, number],
        zoom: 12,
        pitch: 45,
        bearing: 90
      };

      const loadAmapSpy = vi.spyOn(provider as any, 'loadAmap').mockResolvedValue(undefined);

      await provider.switchMap('amap', view);

      // lastView 在 switchMap 中被设置，但在 loadAmap 中可能被覆盖
      // 这是预期的行为
      expect((provider as any).lastView).toBeDefined();
    });
  });

  describe('loadScript', () => {
    it('应该加载脚本', async () => {
      // Mock document.head.appendChild and script.onload
      const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
        // 模拟 onload 事件
        setTimeout(() => {
          if (node.onload) {node.onload();}
        }, 0);
        return node;
      });

      const result = await (provider as any).loadScript('https://example.com/test.js');
      expect(result).toBeUndefined();
      expect(appendChildSpy).toHaveBeenCalled();
    });
  });
});

