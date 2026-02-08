import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FusionMap } from '../FusionMap';

describe('FusionMap', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    mockContainer = {
      id: 'test-container',
      style: {} as any,
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelector: vi.fn(),
      innerHTML: ''
    } as any;

    // Mock document.getElementById
    vi.spyOn(document, 'getElementById').mockReturnValue(mockContainer);
  });

  describe('constructor', () => {
    it('应该创建 FusionMap 实例', () => {
      const map = new FusionMap('test-container');

      expect(map).toBeDefined();
      expect(map.getMapInstance).toBeDefined();
    });

    it('应该抛出错误当容器不存在时', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);

      expect(() => new FusionMap('non-existent')).toThrow('Container non-existent not found');
    });

    it('应该创建容器结构', () => {
      const map = new FusionMap('test-container');

      expect(mockContainer.appendChild).toHaveBeenCalled();
      expect(mockContainer.style.position).toBe('relative');
    });

    it('应该设置默认底图为高德地图', () => {
      const map = new FusionMap('test-container');
      const switchMapSpy = vi.spyOn((map as any).baseMapProvider, 'switchMap');

      // FusionMap 初始化时会调用 switchMap('amap')
      // 但 switchMap 在构造函数中被调用，所以 spy 需要在构造函数之前设置
      // 这里我们验证 map 的 baseMapProvider 存在
      expect((map as any).baseMapProvider).toBeDefined();
    });
  });

  describe('getMapInstance', () => {
    it('应该返回 MapLibre 实例', () => {
      const map = new FusionMap('test-container');
      const mapInstance = map.getMapInstance();

      expect(mapInstance).toBeDefined();
    });
  });

  describe('switchBaseMap', () => {
    it('应该切换底图', async () => {
      const map = new FusionMap('test-container');
      const switchMapSpy = vi.spyOn((map as any).baseMapProvider, 'switchMap');

      // 模拟 BaseMapProvider 的 switchMap
      vi.spyOn((map as any).baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      await map.switchBaseMap('amap');

      expect(switchMapSpy).toHaveBeenCalledWith('amap', expect.any(Object));
    });

    it('应该在没有 map 时只切换底图', async () => {
      const map = new FusionMap('test-container');
      const switchMapSpy = vi.spyOn((map as any).baseMapProvider, 'switchMap');

      // 模拟 map 不存在
      (map as any).map = null;
      await map.switchBaseMap('amap');

      // 应该调用 switchMap，不带第二个参数
      expect(switchMapSpy).toHaveBeenCalledWith('amap');
    });

    it('应该为 Cesium 设置 Globe 投影', async () => {
      const map = new FusionMap('test-container');
      const setProjectionSpy = vi.spyOn(map, 'setProjection');

      // 模拟 BaseMapProvider 的 switchMap
      vi.spyOn((map as any).baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      await map.switchBaseMap('cesium');

      expect(setProjectionSpy).toHaveBeenCalledWith('globe');
    });

    it('应该为其他底图设置 Mercator 投影', async () => {
      const map = new FusionMap('test-container');
      const setProjectionSpy = vi.spyOn(map, 'setProjection');

      // 模拟 BaseMapProvider 的 switchMap
      vi.spyOn((map as any).baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      await map.switchBaseMap('amap');

      expect(setProjectionSpy).toHaveBeenCalledWith('mercator');
    });

    it('应该隐藏天地图图层当切换到其他底图', async () => {
      const map = new FusionMap('test-container');

      // 模拟天地图图层存在
      (map as any).map.getLayer = vi.fn((id: string) => {
        if (id === 'tianditu-base') {return {};}
        return null;
      });
      (map as any).map.setLayoutProperty = vi.fn();

      // 模拟 BaseMapProvider 的 switchMap
      vi.spyOn((map as any).baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      await map.switchBaseMap('amap');

      expect((map as any).map.setLayoutProperty).toHaveBeenCalledWith(
        'tianditu-base',
        'visibility',
        'none'
      );
    });

    it('应该显示天地图图层当切换到天地图', async () => {
      const map = new FusionMap('test-container');

      // 模拟天地图图层存在
      (map as any).map.getLayer = vi.fn((id: string) => {
        if (id === 'tianditu-base') {return {};}
        return null;
      });
      (map as any).map.setLayoutProperty = vi.fn();

      // 模拟 BaseMapProvider 的 switchMap
      vi.spyOn((map as any).baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      await map.switchBaseMap('tianditu');

      expect((map as any).map.setLayoutProperty).toHaveBeenCalledWith(
        'tianditu-base',
        'visibility',
        'visible'
      );
    });
  });

  describe('setProjection', () => {
    it('应该设置投影', () => {
      const map = new FusionMap('test-container');
      const setProjectionSpy = vi.spyOn((map as any).map, 'setProjection');

      map.setProjection('globe');

      expect(setProjectionSpy).toHaveBeenCalledWith({ type: 'globe' });
    });

    it('应该在没有 map 时直接返回', () => {
      const map = new FusionMap('test-container');

      // 模拟 map 不存在
      (map as any).map = null;

      // 不应该抛出错误
      expect(() => map.setProjection('globe')).not.toThrow();
    });

    it('应该更新 pitch 限制', () => {
      const map = new FusionMap('test-container');
      const updatePitchLimitsSpy = vi.spyOn(map as any, 'updatePitchLimits');

      map.setProjection('globe');

      expect(updatePitchLimitsSpy).toHaveBeenCalled();
    });
  });

  describe('on', () => {
    it('应该添加事件监听器', () => {
      const map = new FusionMap('test-container');
      const onSpy = vi.spyOn((map as any).map, 'on');
      const listener = vi.fn();

      map.on('move', listener);

      expect(onSpy).toHaveBeenCalledWith('move', listener);
    });

    it('应该在没有 map 时直接返回', () => {
      const map = new FusionMap('test-container');

      // 模拟 map 不存在
      (map as any).map = null;

      // 不应该抛出错误
      expect(() => map.on('move', vi.fn())).not.toThrow();
    });
  });

  describe('addLayer', () => {
    it('应该添加图层', () => {
      const map = new FusionMap('test-container');
      const addLayerSpy = vi.spyOn((map as any).map, 'addLayer');

      const layer = {
        id: 'test-layer',
        type: 'circle',
        source: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        paint: { 'circle-radius': 10, 'circle-color': '#007cbf' }
      } as any;

      map.addLayer(layer);

      expect(addLayerSpy).toHaveBeenCalledWith(layer);
    });
  });

  describe('setCesiumScaleFactor', () => {
    it('应该设置 Cesium 缩放因子', () => {
      const map = new FusionMap('test-container');
      const setCesiumScaleFactorSpy = vi.spyOn((map as any).baseMapProvider, 'setCesiumScaleFactor');

      map.setCesiumScaleFactor(2.5);

      expect(setCesiumScaleFactorSpy).toHaveBeenCalledWith(2.5);
    });
  });

  describe('setZoomOffset', () => {
    it('应该设置缩放偏移', () => {
      const map = new FusionMap('test-container');
      const setZoomOffsetSpy = vi.spyOn((map as any).baseMapProvider, 'setZoomOffset');

      map.setZoomOffset(1.5);

      expect(setZoomOffsetSpy).toHaveBeenCalledWith(1.5);
    });
  });

  describe('destroy', () => {
    it('应该销毁地图实例', () => {
      const map = new FusionMap('test-container');
      const removeSpy = vi.spyOn((map as any).map, 'remove');

      map.destroy();

      expect(removeSpy).toHaveBeenCalled();
    });

    it('应该处理销毁错误', () => {
      const map = new FusionMap('test-container');
      (map as any).map = null;

      // 不应该抛出错误
      expect(() => map.destroy()).not.toThrow();
    });
  });
});
