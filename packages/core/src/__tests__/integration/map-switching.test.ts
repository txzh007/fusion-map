import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FusionMap } from '../../FusionMap';
import { BaseMapProvider } from '../../services/BaseMapProvider';
import { Container } from '../../di/Container';

describe('Integration: Map Switching', () => {
  let mockContainer: HTMLElement;
  let fusionMap: FusionMap;

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

    // Mock BaseMapProvider
    const mockBaseMapProvider = {
      updateCamera: vi.fn(),
      switchMap: vi.fn().mockResolvedValue(undefined),
      setContainer: vi.fn(),
      setTokens: vi.fn(),
      errors$: { subscribe: vi.fn() },
      loading$: { subscribe: vi.fn() },
      // 添加必要的属性以避免类型错误
      activeMapType: 'amap' as const,
      container: null,
      viewer: null,
      tokens: {},
      cesiumCalibrationFactor: 1.9,
      genericZoomOffset: 0,
      instances: {
        amap: null,
        baidu: null,
        cesium: null,
        google: null
      },
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
  });

  describe('地图切换流程', () => {
    it('应该从高德地图切换到百度地图', async () => {
      fusionMap = new FusionMap('test-container');

      // 模拟地图实例
      const mockMap = {
        on: vi.fn(),
        getCenter: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        getZoom: vi.fn(() => 12),
        getPitch: vi.fn(() => 45),
        getBearing: vi.fn(() => 90),
        setMaxPitch: vi.fn(),
        dragRotate: { enable: vi.fn() },
        touchZoomRotate: { enableRotation: vi.fn() },
        addLayer: vi.fn(),
        addSource: vi.fn(),
        getLayer: vi.fn(() => null),
        setLayoutProperty: vi.fn(),
        remove: vi.fn(),
        flyTo: vi.fn(),
        project: vi.fn(() => ({ x: 100, y: 100 })),
        unproject: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        setProjection: vi.fn(),
        getProjection: vi.fn(() => ({ type: 'mercator' }))
      };

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      const switchMapSpy = vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      // 切换到百度地图
      await fusionMap.switchBaseMap('baidu');

      expect(switchMapSpy).toHaveBeenCalledWith('baidu', expect.any(Object));
    });

    it('应该从高德地图切换到 Cesium 3D', async () => {
      fusionMap = new FusionMap('test-container');

      // 模拟地图实例
      const mockMap = {
        on: vi.fn(),
        getCenter: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        getZoom: vi.fn(() => 12),
        getPitch: vi.fn(() => 45),
        getBearing: vi.fn(() => 90),
        setMaxPitch: vi.fn(),
        dragRotate: { enable: vi.fn() },
        touchZoomRotate: { enableRotation: vi.fn() },
        addLayer: vi.fn(),
        addSource: vi.fn(),
        getLayer: vi.fn(() => null),
        setLayoutProperty: vi.fn(),
        remove: vi.fn(),
        flyTo: vi.fn(),
        project: vi.fn(() => ({ x: 100, y: 100 })),
        unproject: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        setProjection: vi.fn(),
        getProjection: vi.fn(() => ({ type: 'mercator' }))
      };

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      const switchMapSpy = vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);
      const setProjectionSpy = vi.spyOn(fusionMap, 'setProjection');

      // 切换到 Cesium
      await fusionMap.switchBaseMap('cesium');

      expect(switchMapSpy).toHaveBeenCalledWith('cesium', expect.any(Object));
      expect(setProjectionSpy).toHaveBeenCalledWith('globe');
    });

    it('应该保持相机状态在切换时', async () => {
      fusionMap = new FusionMap('test-container');

      // 模拟地图实例
      const mockMap = {
        on: vi.fn(),
        getCenter: vi.fn(() => ({ lng: 121.4737, lat: 31.2304 })),
        getZoom: vi.fn(() => 15),
        getPitch: vi.fn(() => 60),
        getBearing: vi.fn(() => 45),
        setMaxPitch: vi.fn(),
        dragRotate: { enable: vi.fn() },
        touchZoomRotate: { enableRotation: vi.fn() },
        addLayer: vi.fn(),
        addSource: vi.fn(),
        getLayer: vi.fn(() => null),
        setLayoutProperty: vi.fn(),
        remove: vi.fn(),
        flyTo: vi.fn(),
        project: vi.fn(() => ({ x: 100, y: 100 })),
        unproject: vi.fn(() => ({ lng: 121.4737, lat: 31.2304 })),
        setProjection: vi.fn(),
        getProjection: vi.fn(() => ({ type: 'mercator' }))
      };

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      const switchMapSpy = vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      // 切换到百度地图
      await fusionMap.switchBaseMap('baidu');

      // 验证传递了当前相机状态
      expect(switchMapSpy).toHaveBeenCalledWith('baidu', {
        center: [121.4737, 31.2304],
        zoom: 15,
        pitch: 60,
        bearing: 45
      });
    });
  });

  describe('天地图图层管理', () => {
    it('应该在切换到天地图时显示图层', async () => {
      fusionMap = new FusionMap('test-container');

      // 模拟地图实例
      const mockMap = {
        on: vi.fn(),
        getCenter: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        getZoom: vi.fn(() => 12),
        getPitch: vi.fn(() => 0),
        getBearing: vi.fn(() => 0),
        setMaxPitch: vi.fn(),
        dragRotate: { enable: vi.fn() },
        touchZoomRotate: { enableRotation: vi.fn() },
        addLayer: vi.fn(),
        addSource: vi.fn(),
        getLayer: vi.fn(() => ({})),
        setLayoutProperty: vi.fn(),
        remove: vi.fn(),
        flyTo: vi.fn(),
        project: vi.fn(() => ({ x: 100, y: 100 })),
        unproject: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        setProjection: vi.fn(),
        getProjection: vi.fn(() => ({ type: 'mercator' }))
      };

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      // 切换到天地图
      await fusionMap.switchBaseMap('tianditu');

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'tianditu-base',
        'visibility',
        'visible'
      );
    });

    it('应该在切换到其他底图时隐藏天地图图层', async () => {
      fusionMap = new FusionMap('test-container');

      // 模拟地图实例
      const mockMap = {
        on: vi.fn(),
        getCenter: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        getZoom: vi.fn(() => 12),
        getPitch: vi.fn(() => 0),
        getBearing: vi.fn(() => 0),
        setMaxPitch: vi.fn(),
        dragRotate: { enable: vi.fn() },
        touchZoomRotate: { enableRotation: vi.fn() },
        addLayer: vi.fn(),
        addSource: vi.fn(),
        getLayer: vi.fn(() => ({})),
        setLayoutProperty: vi.fn(),
        remove: vi.fn(),
        flyTo: vi.fn(),
        project: vi.fn(() => ({ x: 100, y: 100 })),
        unproject: vi.fn(() => ({ lng: 116.397, lat: 39.918 })),
        setProjection: vi.fn(),
        getProjection: vi.fn(() => ({ type: 'mercator' }))
      };

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 模拟 BaseMapProvider 的 switchMap
      const baseMapProvider = (fusionMap as any).baseMapProvider;
      vi.spyOn(baseMapProvider, 'switchMap').mockResolvedValue(undefined);

      // 切换到高德地图
      await fusionMap.switchBaseMap('amap');

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'tianditu-base',
        'visibility',
        'none'
      );
    });
  });
});
