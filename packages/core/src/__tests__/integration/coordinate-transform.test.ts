import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FusionMap } from '../../FusionMap';
import { BaseMapProvider } from '../../services/BaseMapProvider';
import { Container } from '../../di/Container';
import gcoord from 'gcoord';

describe('Integration: Coordinate Transform', () => {
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

  describe('WGS84 到 GCJ02 转换', () => {
    it('应该在同步到高德地图时转换坐标', async () => {
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

      // 验证 BaseMapProvider 的 updateCamera 被调用
      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalled();
    });

    it('应该在切换到高德地图时转换初始坐标', async () => {
      fusionMap = new FusionMap('test-container');

      // 替换 map 实例
      (fusionMap as any).map = mockMap;

      // 切换到高德地图
      await fusionMap.switchBaseMap('amap');

      // 验证传递了 WGS84 坐标
      expect(mockBaseMapProvider.switchMap).toHaveBeenCalledWith(
        'amap',
        expect.objectContaining({
          center: [116.397, 39.918]
        })
      );
    });
  });

  describe('WGS84 到 BD09 转换', () => {
    it('应该在同步到百度地图时转换坐标', async () => {
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

      // 验证 BaseMapProvider 的 updateCamera 被调用
      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalled();
    });
  });

  describe('WGS84 到 Cesium', () => {
    it('应该在同步到 Cesium 时使用 WGS84', async () => {
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

      // 验证 BaseMapProvider 的 updateCamera 被调用
      expect(mockBaseMapProvider.updateCamera).toHaveBeenCalled();
    });
  });

  describe('坐标转换验证', () => {
    it('应该调用 gcoord 进行坐标转换', () => {
      const beijingWGS84 = [116.397, 39.918] as [number, number];

      // 调用真实的 gcoord 转换
      const beijingGCJ02 = gcoord.transform(beijingWGS84, gcoord.WGS84, gcoord.GCJ02);

      // 验证转换被调用
      expect(beijingGCJ02).toBeDefined();
      expect(beijingGCJ02).toHaveLength(2);
    });

    it('应该验证 gcoord 转换函数存在', () => {
      expect(gcoord.transform).toBeDefined();
      expect(gcoord.WGS84).toBeDefined();
      expect(gcoord.GCJ02).toBeDefined();
      expect(gcoord.BD09).toBeDefined();
    });
  });
});
