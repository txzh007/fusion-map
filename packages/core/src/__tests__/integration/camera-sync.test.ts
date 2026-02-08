import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FusionMap } from '../../FusionMap';
import { SyncEngine } from '../../services/SyncEngine';
import { BaseMapProvider } from '../../services/BaseMapProvider';
import { Container } from '../../di/Container';

describe('Integration: Camera Sync', () => {
  let mockContainer: HTMLElement;
  let fusionMap: FusionMap;
  let mockMap: any;
  let mockBaseMapProvider: any;

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

    // 创建 mock map
    mockMap = {
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

    // 创建 mock provider
    mockBaseMapProvider = {
      updateCamera: vi.fn(),
      switchMap: vi.fn().mockResolvedValue(undefined),
      setContainer: vi.fn(),
      setTokens: vi.fn(),
      errors$: { subscribe: vi.fn() },
      loading$: { subscribe: vi.fn() }
    };

    // 注入 mock
    Container.setInstance(BaseMapProvider, mockBaseMapProvider);
  });

  describe('相机同步流程', () => {
    it('应该在地图移动时同步相机到高德地图', async () => {
      fusionMap = new FusionMap('test-container');

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 获取 SyncEngine
      const syncEngine = (fusionMap as any).syncEngine;
      syncEngine.bind(mockMap);

      // 模拟地图移动事件
      const moveCallback = mockMap.on.mock.calls.find(
        (call: any[]) => call[0] === 'move'
      )?.[1];

      if (moveCallback) {
        moveCallback();
      }

      // 等待防抖完成
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalledWith({
        center: [116.397, 39.918],
        zoom: 12,
        pitch: 45,
        bearing: 90
      });
    });

    it('应该在地图移动时同步相机到百度地图', async () => {
      fusionMap = new FusionMap('test-container');

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 切换到百度地图
      await fusionMap.switchBaseMap('baidu');

      // 获取 SyncEngine
      const syncEngine = (fusionMap as any).syncEngine;
      syncEngine.bind(mockMap);

      // 模拟地图移动事件
      const moveCallback = mockMap.on.mock.calls.find(
        (call: any[]) => call[0] === 'move'
      )?.[1];

      if (moveCallback) {
        moveCallback();
      }

      // 等待防抖完成
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalledWith({
        center: [116.397, 39.918],
        zoom: 12,
        pitch: 45,
        bearing: 90
      });
    });

    it('应该在地图移动时同步相机到 Cesium', async () => {
      fusionMap = new FusionMap('test-container');

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 切换到 Cesium
      await fusionMap.switchBaseMap('cesium');

      // 获取 SyncEngine
      const syncEngine = (fusionMap as any).syncEngine;
      syncEngine.bind(mockMap);

      // 模拟地图移动事件
      const moveCallback = mockMap.on.mock.calls.find(
        (call: any[]) => call[0] === 'move'
      )?.[1];

      if (moveCallback) {
        moveCallback();
      }

      // 等待防抖完成
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalledWith({
        center: [116.397, 39.918],
        zoom: 12,
        pitch: 45,
        bearing: 90
      });
    });
  });

  describe('相机状态保持', () => {
    it('应该在切换底图时保持当前相机状态', async () => {
      fusionMap = new FusionMap('test-container');

      // 设置不同的相机状态
      mockMap.getCenter.mockReturnValue({ lng: 121.4737, lat: 31.2304 });
      mockMap.getZoom.mockReturnValue(15);
      mockMap.getPitch.mockReturnValue(60);
      mockMap.getBearing.mockReturnValue(45);

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 切换到百度地图
      await fusionMap.switchBaseMap('baidu');

      // 验证传递了当前相机状态
      expect(mockBaseMapProvider.switchMap).toHaveBeenCalledWith('baidu', {
        center: [121.4737, 31.2304],
        zoom: 15,
        pitch: 60,
        bearing: 45
      });
    });
  });
});
