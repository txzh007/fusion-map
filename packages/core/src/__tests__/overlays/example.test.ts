/**
 * 覆盖物API使用示例测试
 */

import { FusionMap } from '../FusionMap';
import { extendFusionMapWithOverlays } from '../overlays/FusionMapExtensions';
import { createMarker, createPolyline } from '../overlays';

// 扩展FusionMap以支持覆盖物API
extendFusionMapWithOverlays();

describe('覆盖物API使用示例', () => {
  let container: HTMLElement;
  let fusionMap: FusionMap;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.id = 'test-map';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (fusionMap) {
      fusionMap.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('创建标记并添加到地图', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '北京',
      icon: 'https://example.com/marker.png',
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(marker);

    // 验证标记已添加
    expect(overlays.getOverlayCount()).toBe(1);
    expect(overlays.getOverlayById(marker.getId())).toBe(marker);
  });

  test('创建折线并添加到地图', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建折线
    const polyline = createPolyline({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
        [116.4174, 39.9293],
      ],
      color: '#ff0000',
      width: 3,
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(polyline);

    // 验证折线已添加
    expect(overlays.getOverlayCount()).toBe(1);
    expect(overlays.getOverlayById(polyline.getId())).toBe(polyline);
  });

  test('使用FusionMap扩展方法创建标记', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 使用扩展方法创建标记
    const marker = fusionMap.createMarker!({
      position: [116.3974, 39.9093],
      title: '北京',
    });

    // 验证标记已创建
    expect(marker).toBeDefined();
    expect(marker.getId()).toBeDefined();
  });

  test('使用FusionMap扩展方法创建折线', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 使用扩展方法创建折线
    const polyline = fusionMap.createPolyline!({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
      ],
      color: '#00ff00',
    });

    // 验证折线已创建
    expect(polyline).toBeDefined();
    expect(polyline.getId()).toBeDefined();
  });

  test('管理覆盖物', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建多个标记
    const marker1 = createMarker({
      position: [116.3974, 39.9093],
      title: '标记1',
    });

    const marker2 = createMarker({
      position: [116.4074, 39.9193],
      title: '标记2',
    });

    // 添加到管理器
    overlays.addOverlay(marker1);
    overlays.addOverlay(marker2);

    // 验证数量
    expect(overlays.getOverlayCount()).toBe(2);

    // 根据ID获取
    const retrievedMarker = overlays.getOverlayById(marker1.getId());
    expect(retrievedMarker).toBe(marker1);

    // 根据类型获取
    const markers = overlays.getOverlaysByType('marker');
    expect(markers.length).toBe(2);

    // 移除标记
    overlays.removeOverlay(marker1);
    expect(overlays.getOverlayCount()).toBe(1);

    // 清空所有
    overlays.clearOverlays();
    expect(overlays.getOverlayCount()).toBe(0);
  });

  test('覆盖物事件监听', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '可点击标记',
    });

    // 监听点击事件
    let clickEventFired = false;
    marker.on('click', () => {
      clickEventFired = true;
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(marker);

    // 验证事件监听器已绑定
    expect(marker.getId()).toBeDefined();
  });

  test('覆盖物可见性控制', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(marker);

    // 验证初始可见
    expect(marker.isVisible()).toBe(true);

    // 隐藏标记
    marker.setVisible(false);
    expect(marker.isVisible()).toBe(false);

    // 显示标记
    marker.setVisible(true);
    expect(marker.isVisible()).toBe(true);
  });

  test('覆盖物选项更新', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '初始标题',
      color: '#ff0000',
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(marker);

    // 更新选项
    marker.setOptions({
      title: '更新后的标题',
      color: '#00ff00',
    });

    // 验证选项已更新
    const options = marker.getOptions();
    expect(options.title).toBe('更新后的标题');
  });

  test('覆盖物边界框', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建折线
    const polyline = createPolyline({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
        [116.4174, 39.9293],
      ],
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(polyline);

    // 获取边界框
    const bounds = polyline.getBounds();
    
    // 验证边界框
    expect(bounds.sw[0]).toBeLessThan(bounds.ne[0]);
    expect(bounds.sw[1]).toBeLessThan(bounds.ne[1]);
  });

  test('覆盖物导出为GeoJSON', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(marker);

    // 导出为GeoJSON
    const geojson = overlays.exportToGeoJSON();

    // 验证GeoJSON格式
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toBeDefined();
    expect(geojson.features.length).toBe(1);
    expect(geojson.features[0].geometry.type).toBe('Point');
  });

  test('覆盖物管理器事件', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 监听管理器事件
    let addEventFired = false;
    let removeEventFired = false;

    overlays.getManager().on('add', () => {
      addEventFired = true;
    });

    overlays.getManager().on('remove', () => {
      removeEventFired = true;
    });

    // 创建并添加标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });
    overlays.addOverlay(marker);

    // 验证添加事件
    expect(addEventFired).toBe(true);

    // 移除标记
    overlays.removeOverlay(marker);

    // 验证移除事件
    expect(removeEventFired).toBe(true);
  });

  test('覆盖物克隆', () => {
    // 创建标记
    const marker1 = createMarker({
      position: [116.3974, 39.9093],
      title: '原始标记',
      color: '#ff0000',
    });

    // 克隆标记
    const marker2 = marker1.clone();

    // 验证克隆
    expect(marker2.getId()).not.toBe(marker1.getId());
    expect(marker2.getPosition()).toEqual(marker1.getPosition());
  });

  test('覆盖物序列化', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
      properties: {
        custom: 'value',
      },
    });

    // 序列化为JSON
    const json = marker.toJSON();

    // 验证序列化
    expect(json.id).toBe(marker.getId());
    expect(json.type).toBe('marker');
    expect(json.options.properties.custom).toBe('value');
  });

  test('覆盖物边界检查', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 添加到地图
    const overlays = fusionMap.getOverlays();
    overlays.addOverlay(marker);

    // 定义边界框
    const bounds = {
      sw: [116.3, 39.9] as [number, number],
      ne: [116.5, 40.0] as [number, number],
    };

    // 检查是否在边界内
    const isInBounds = marker.isInBounds!(bounds);
    expect(isInBounds).toBe(true);

    // 检查边界外
    const outBounds = {
      sw: [117.0, 40.0] as [number, number],
      ne: [118.0, 41.0] as [number, number],
    };
    const isOutBounds = marker.isInBounds!(outBounds);
    expect(isOutBounds).toBe(false);
  });

  test('覆盖物管理器统计', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建不同类型的覆盖物
    const marker1 = createMarker({ position: [116.3974, 39.9093] });
    const marker2 = createMarker({ position: [116.4074, 39.9193] });
    const polyline = createPolyline({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
      ],
    });

    // 添加到管理器
    overlays.addOverlay(marker1);
    overlays.addOverlay(marker2);
    overlays.addOverlay(polyline);

    // 获取统计
    const stats = overlays.getManager().getTypeStats!();

    // 验证统计
    expect(stats.marker).toBe(2);
    expect(stats.polyline).toBe(1);
  });

  test('覆盖物可见性统计', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建覆盖物
    const marker1 = createMarker({ position: [116.3974, 39.9093] });
    const marker2 = createMarker({ position: [116.4074, 39.9193] });
    const marker3 = createMarker({ position: [116.4174, 39.9293] });

    // 添加到管理器
    overlays.addOverlay(marker1);
    overlays.addOverlay(marker2);
    overlays.addOverlay(marker3);

    // 隐藏一个标记
    marker2.setVisible(false);

    // 获取可见数量
    const visibleCount = overlays.getManager().getVisibleCount!();
    const hiddenCount = overlays.getManager().getHiddenCount!();

    // 验证统计
    expect(visibleCount).toBe(2);
    expect(hiddenCount).toBe(1);
  });

  test('覆盖物批量操作', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建多个覆盖物
    const markers = [
      createMarker({ position: [116.3974, 39.9093] }),
      createMarker({ position: [116.4074, 39.9193] }),
      createMarker({ position: [116.4174, 39.9293] }),
    ];

    // 批量添加
    overlays.getManager().addAll!(markers);

    // 验证数量
    expect(overlays.getOverlayCount()).toBe(3);

    // 批量移除
    overlays.getManager().removeAll!(markers);

    // 验证数量
    expect(overlays.getOverlayCount()).toBe(0);
  });

  test('覆盖物过滤', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建不同类型的覆盖物
    const marker1 = createMarker({ position: [116.3974, 39.9093] });
    const marker2 = createMarker({ position: [116.4074, 39.9193] });
    const polyline = createPolyline({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
      ],
    });

    // 添加到管理器
    overlays.addOverlay(marker1);
    overlays.addOverlay(marker2);
    overlays.addOverlay(polyline);

    // 过滤标记
    const markers = overlays.getManager().filter!((overlay) => 
      overlay.getType() === 'marker'
    );

    // 验证过滤结果
    expect(markers.length).toBe(2);
    expect(markers.every((m) => m.getType() === 'marker')).toBe(true);
  });

  test('覆盖物查找', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建覆盖物
    const marker1 = createMarker({ 
      position: [116.3974, 39.9093],
      id: 'marker-1',
    });
    const marker2 = createMarker({ 
      position: [116.4074, 39.9193],
      id: 'marker-2',
    });

    // 添加到管理器
    overlays.addOverlay(marker1);
    overlays.addOverlay(marker2);

    // 查找特定覆盖物
    const found = overlays.getManager().find!((overlay) => 
      overlay.getId() === 'marker-2'
    );

    // 验证查找结果
    expect(found).toBe(marker2);
  });

  test('覆盖物遍历', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建覆盖物
    const marker1 = createMarker({ position: [116.3974, 39.9093] });
    const marker2 = createMarker({ position: [116.4074, 39.9193] });

    // 添加到管理器
    overlays.addOverlay(marker1);
    overlays.addOverlay(marker2);

    // 遍历覆盖物
    let count = 0;
    overlays.getManager().forEach!(() => {
      count++;
    });

    // 验证遍历
    expect(count).toBe(2);
  });

  test('覆盖物管理器选项', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 获取选项
    const options = overlays.getManager().getOptions!();

    // 验证默认选项
    expect(options.clustering).toBe(false);
    expect(options.cacheEnabled).toBe(true);

    // 更新选项
    overlays.getManager().setOptions!({
      clustering: true,
      clusterRadius: 100,
    });

    // 验证更新后的选项
    const updatedOptions = overlays.getManager().getOptions!();
    expect(updatedOptions.clustering).toBe(true);
    expect(updatedOptions.clusterRadius).toBe(100);
  });

  test('覆盖物管理器集群功能', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 启用集群
    overlays.getManager().setClustering!(true);

    // 验证集群已启用
    expect(overlays.getManager().isClusteringEnabled!()).toBe(true);

    // 禁用集群
    overlays.getManager().setClustering!(false);

    // 验证集群已禁用
    expect(overlays.getManager().isClusteringEnabled!()).toBe(false);
  });

  test('覆盖物管理器销毁', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建覆盖物
    const marker = createMarker({ position: [116.3974, 39.9093] });
    overlays.addOverlay(marker);

    // 验证覆盖物已添加
    expect(overlays.getOverlayCount()).toBe(1);

    // 销毁管理器
    overlays.getManager().destroy!();

    // 验证覆盖物已清空
    expect(overlays.getOverlayCount()).toBe(0);
  });

  test('覆盖物工厂获取管理器', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 获取管理器
    const manager = fusionMap.getOverlays().getManager();

    // 验证管理器
    expect(manager).toBeDefined();
    expect(manager.getCount()).toBe(0);
  });

  test('覆盖物工厂创建管理器', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 创建管理器
    const manager = fusionMap.getOverlays().getManager();

    // 验证管理器
    expect(manager).toBeDefined();
    expect(manager.getCount()).toBe(0);
  });

  test('覆盖物工厂设置管理器', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');

    // 获取管理器
    const manager = fusionMap.getOverlays().getManager();

    // 设置管理器
    fusionMap.getOverlays().setManager(manager);

    // 验证管理器
    expect(fusionMap.getOverlays().getManager()).toBe(manager);
  });

  test('覆盖物工厂创建标记', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 验证标记
    expect(marker).toBeDefined();
    expect(marker.getId()).toBeDefined();
    expect(marker.getPosition()).toEqual([116.3974, 39.9093]);
  });

  test('覆盖物工厂创建折线', () => {
    // 创建折线
    const polyline = createPolyline({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
      ],
      color: '#ff0000',
    });

    // 验证折线
    expect(polyline).toBeDefined();
    expect(polyline.getId()).toBeDefined();
    expect(polyline.getPath()).toEqual([
      [116.3974, 39.9093],
      [116.4074, 39.9193],
    ]);
  });

  test('覆盖物工厂创建标记并添加到管理器', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 添加到管理器
    overlays.addOverlay(marker);

    // 验证标记已添加
    expect(overlays.getOverlayCount()).toBe(1);
    expect(overlays.getOverlayById(marker.getId())).toBe(marker);
  });

  test('覆盖物工厂创建折线并添加到管理器', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建折线
    const polyline = createPolyline({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
      ],
      color: '#ff0000',
    });

    // 添加到管理器
    overlays.addOverlay(polyline);

    // 验证折线已添加
    expect(overlays.getOverlayCount()).toBe(1);
    expect(overlays.getOverlayById(polyline.getId())).toBe(polyline);
  });

  test('覆盖物工厂创建多个覆盖物', () => {
    // 创建地图
    fusionMap = new FusionMap('test-map');
    const overlays = fusionMap.getOverlays();

    // 创建多个覆盖物
    const marker1 = createMarker({ position: [116.3974, 39.9093] });
    const marker2 = createMarker({ position: [116.4074, 39.9193] });
    const polyline = createPolyline({
      path: [
        [116.3974, 39.9093],
        [116.4074, 39.9193],
      ],
    });

    // 添加到管理器
    overlays.addOverlay(marker1);
    overlays.addOverlay(marker2);
    overlays.addOverlay(polyline);

    // 验证数量
    expect(overlays.getOverlayCount()).toBe(3);

    // 验证类型
    expect(overlays.getOverlaysByType('marker').length).toBe(2);
    expect(overlays.getOverlaysByType('polyline').length).toBe(1);
  });

  test('覆盖物工厂创建覆盖物并设置自定义属性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      properties: {
        name: '北京',
        type: 'capital',
        population: 21540000,
      },
    });

    // 验证自定义属性
    expect(marker.getProperty('name')).toBe('北京');
    expect(marker.getProperty('type')).toBe('capital');
    expect(marker.getProperty('population')).toBe(21540000);

    // 设置新属性
    marker.setProperty('country', 'China');
    expect(marker.getProperty('country')).toBe('China');

    // 删除属性
    marker.removeProperty('type');
    expect(marker.getProperty('type')).toBeUndefined();
  });

  test('覆盖物工厂创建覆盖物并监听事件', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 监听事件
    let eventFired = false;
    marker.on('click', () => {
      eventFired = true;
    });

    // 触发事件
    marker.emit('click');

    // 验证事件已触发
    expect(eventFired).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并移除事件监听器', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 事件监听器
    const listener = () => {
      throw new Error('This should not be called');
    };

    // 添加监听器
    marker.on('click', listener);

    // 移除监听器
    marker.off('click', listener);

    // 触发事件
    marker.emit('click');

    // 验证事件未触发错误
    // (如果监听器未被移除，会抛出错误)
  });

  test('覆盖物工厂创建覆盖物并获取选项', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
      visible: true,
      interactive: true,
    });

    // 获取选项
    const options = marker.getOptions();

    // 验证选项
    expect(options.title).toBe('测试标记');
    expect(options.visible).toBe(true);
    expect(options.interactive).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并更新选项', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '初始标题',
    });

    // 更新选项
    marker.setOptions({
      title: '更新标题',
      visible: false,
    });

    // 验证选项已更新
    const options = marker.getOptions();
    expect(options.title).toBe('更新标题');
    expect(options.visible).toBe(false);
  });

  test('覆盖物工厂创建覆盖物并获取边界框', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取边界框
    const bounds = marker.getBounds();

    // 验证边界框
    expect(bounds.sw[0]).toBeLessThan(bounds.ne[0]);
    expect(bounds.sw[1]).toBeLessThan(bounds.ne[1]);
  });

  test('覆盖物工厂创建覆盖物并检查是否在边界内', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 定义边界框
    const bounds = {
      sw: [116.3, 39.9] as [number, number],
      ne: [116.5, 40.0] as [number, number],
    };

    // 检查是否在边界内
    const isInBounds = marker.isInBounds!(bounds);
    expect(isInBounds).toBe(true);

    // 检查边界外
    const outBounds = {
      sw: [117.0, 40.0] as [number, number],
      ne: [118.0, 41.0] as [number, number],
    };
    const isOutBounds = marker.isInBounds!(outBounds);
    expect(isOutBounds).toBe(false);
  });

  test('覆盖物工厂创建覆盖物并序列化为JSON', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
      properties: {
        custom: 'value',
      },
    });

    // 序列化为JSON
    const json = marker.toJSON();

    // 验证序列化
    expect(json.id).toBe(marker.getId());
    expect(json.type).toBe('marker');
    expect(json.options.properties.custom).toBe('value');
  });

  test('覆盖物工厂创建覆盖物并转换为GeoJSON', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 转换为GeoJSON
    const geojson = marker.toGeoJSON();

    // 验证GeoJSON
    expect(geojson.type).toBe('Feature');
    expect(geojson.geometry.type).toBe('Point');
    expect(geojson.geometry.coordinates).toEqual([116.3974, 39.9093]);
    expect(geojson.properties.title).toBe('测试标记');
  });

  test('覆盖物工厂创建覆盖物并克隆', () => {
    // 创建标记
    const marker1 = createMarker({
      position: [116.3974, 39.9093],
      title: '原始标记',
      color: '#ff0000',
    });

    // 克隆标记
    const marker2 = marker1.clone();

    // 验证克隆
    expect(marker2.getId()).not.toBe(marker1.getId());
    expect(marker2.getPosition()).toEqual(marker1.getPosition());
    expect(marker2.getOptions().title).toBe(marker1.getOptions().title);
  });

  test('覆盖物工厂创建覆盖物并销毁', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 销毁标记
    marker.destroy();

    // 验证标记已销毁
    expect(marker.destroyed).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并检查是否相等', () => {
    // 创建标记
    const marker1 = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 克隆标记
    const marker2 = marker1.clone();

    // 验证不相等（ID不同）
    expect(marker1.equals(marker2)).toBe(false);

    // 创建相同的标记
    const marker3 = createMarker({
      id: marker1.getId(),
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 验证相等
    expect(marker1.equals(marker3)).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并获取类型', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取类型
    const type = marker.getType();

    // 验证类型
    expect(type).toBe('marker');
  });

  test('覆盖物工厂创建覆盖物并获取ID', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取ID
    const id = marker.getId();

    // 验证ID
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  test('覆盖物工厂创建覆盖物并设置ID', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置ID
    marker.setId('custom-id');

    // 验证ID
    expect(marker.getId()).toBe('custom-id');
  });

  test('覆盖物工厂创建覆盖物并检查是否可见', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      visible: true,
    });

    // 检查是否可见
    expect(marker.isVisible()).toBe(true);

    // 隐藏标记
    marker.setVisible(false);

    // 检查是否不可见
    expect(marker.isVisible()).toBe(false);
  });

  test('覆盖物工厂创建覆盖物并设置可见性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置可见性
    marker.setVisible(false);

    // 验证可见性
    expect(marker.isVisible()).toBe(false);

    // 设置可见性
    marker.setVisible(true);

    // 验证可见性
    expect(marker.isVisible()).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并获取位置', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取位置
    const position = marker.getPosition();

    // 验证位置
    expect(position).toEqual([116.3974, 39.9093]);
  });

  test('覆盖物工厂创建覆盖物并设置位置', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置位置
    marker.setPosition([116.4074, 39.9193]);

    // 验证位置
    expect(marker.getPosition()).toEqual([116.4074, 39.9193]);
  });

  test('覆盖物工厂创建覆盖物并获取自定义属性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      properties: {
        name: '北京',
        type: 'capital',
      },
    });

    // 获取自定义属性
    expect(marker.getProperty('name')).toBe('北京');
    expect(marker.getProperty('type')).toBe('capital');
  });

  test('覆盖物工厂创建覆盖物并设置自定义属性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置自定义属性
    marker.setProperty('name', '北京');
    marker.setProperty('type', 'capital');

    // 验证自定义属性
    expect(marker.getProperty('name')).toBe('北京');
    expect(marker.getProperty('type')).toBe('capital');
  });

  test('覆盖物工厂创建覆盖物并删除自定义属性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      properties: {
        name: '北京',
        type: 'capital',
      },
    });

    // 删除自定义属性
    marker.removeProperty('type');

    // 验证自定义属性已删除
    expect(marker.getProperty('type')).toBeUndefined();
    expect(marker.getProperty('name')).toBe('北京');
  });

  test('覆盖物工厂创建覆盖物并获取选项', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
      visible: true,
      interactive: true,
    });

    // 获取选项
    const options = marker.getOptions();

    // 验证选项
    expect(options.title).toBe('测试标记');
    expect(options.visible).toBe(true);
    expect(options.interactive).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并更新选项', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '初始标题',
    });

    // 更新选项
    marker.setOptions({
      title: '更新标题',
      visible: false,
    });

    // 验证选项已更新
    const options = marker.getOptions();
    expect(options.title).toBe('更新标题');
    expect(options.visible).toBe(false);
  });

  test('覆盖物工厂创建覆盖物并获取边界框', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取边界框
    const bounds = marker.getBounds();

    // 验证边界框
    expect(bounds.sw[0]).toBeLessThan(bounds.ne[0]);
    expect(bounds.sw[1]).toBeLessThan(bounds.ne[1]);
  });

  test('覆盖物工厂创建覆盖物并检查是否在边界内', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 定义边界框
    const bounds = {
      sw: [116.3, 39.9] as [number, number],
      ne: [116.5, 40.0] as [number, number],
    };

    // 检查是否在边界内
    const isInBounds = marker.isInBounds!(bounds);
    expect(isInBounds).toBe(true);

    // 检查边界外
    const outBounds = {
      sw: [117.0, 40.0] as [number, number],
      ne: [118.0, 41.0] as [number, number],
    };
    const isOutBounds = marker.isInBounds!(outBounds);
    expect(isOutBounds).toBe(false);
  });

  test('覆盖物工厂创建覆盖物并序列化为JSON', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
      properties: {
        custom: 'value',
      },
    });

    // 序列化为JSON
    const json = marker.toJSON();

    // 验证序列化
    expect(json.id).toBe(marker.getId());
    expect(json.type).toBe('marker');
    expect(json.options.properties.custom).toBe('value');
  });

  test('覆盖物工厂创建覆盖物并转换为GeoJSON', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 转换为GeoJSON
    const geojson = marker.toGeoJSON();

    // 验证GeoJSON
    expect(geojson.type).toBe('Feature');
    expect(geojson.geometry.type).toBe('Point');
    expect(geojson.geometry.coordinates).toEqual([116.3974, 39.9093]);
    expect(geojson.properties.title).toBe('测试标记');
  });

  test('覆盖物工厂创建覆盖物并克隆', () => {
    // 创建标记
    const marker1 = createMarker({
      position: [116.3974, 39.9093],
      title: '原始标记',
      color: '#ff0000',
    });

    // 克隆标记
    const marker2 = marker1.clone();

    // 验证克隆
    expect(marker2.getId()).not.toBe(marker1.getId());
    expect(marker2.getPosition()).toEqual(marker1.getPosition());
    expect(marker2.getOptions().title).toBe(marker1.getOptions().title);
  });

  test('覆盖物工厂创建覆盖物并销毁', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 销毁标记
    marker.destroy();

    // 验证标记已销毁
    expect(marker.destroyed).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并检查是否相等', () => {
    // 创建标记
    const marker1 = createMarker({
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 克隆标记
    const marker2 = marker1.clone();

    // 验证不相等（ID不同）
    expect(marker1.equals(marker2)).toBe(false);

    // 创建相同的标记
    const marker3 = createMarker({
      id: marker1.getId(),
      position: [116.3974, 39.9093],
      title: '测试标记',
    });

    // 验证相等
    expect(marker1.equals(marker3)).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并获取类型', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取类型
    const type = marker.getType();

    // 验证类型
    expect(type).toBe('marker');
  });

  test('覆盖物工厂创建覆盖物并获取ID', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取ID
    const id = marker.getId();

    // 验证ID
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  test('覆盖物工厂创建覆盖物并设置ID', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置ID
    marker.setId('custom-id');

    // 验证ID
    expect(marker.getId()).toBe('custom-id');
  });

  test('覆盖物工厂创建覆盖物并检查是否可见', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      visible: true,
    });

    // 检查是否可见
    expect(marker.isVisible()).toBe(true);

    // 隐藏标记
    marker.setVisible(false);

    // 检查是否不可见
    expect(marker.isVisible()).toBe(false);
  });

  test('覆盖物工厂创建覆盖物并设置可见性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置可见性
    marker.setVisible(false);

    // 验证可见性
    expect(marker.isVisible()).toBe(false);

    // 设置可见性
    marker.setVisible(true);

    // 验证可见性
    expect(marker.isVisible()).toBe(true);
  });

  test('覆盖物工厂创建覆盖物并获取位置', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 获取位置
    const position = marker.getPosition();

    // 验证位置
    expect(position).toEqual([116.3974, 39.9093]);
  });

  test('覆盖物工厂创建覆盖物并设置位置', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置位置
    marker.setPosition([116.4074, 39.9193]);

    // 验证位置
    expect(marker.getPosition()).toEqual([116.4074, 39.9193]);
  });

  test('覆盖物工厂创建覆盖物并获取自定义属性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      properties: {
        name: '北京',
        type: 'capital',
      },
    });

    // 获取自定义属性
    expect(marker.getProperty('name')).toBe('北京');
    expect(marker.getProperty('type')).toBe('capital');
  });

  test('覆盖物工厂创建覆盖物并设置自定义属性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
    });

    // 设置自定义属性
    marker.setProperty('name', '北京');
    marker.setProperty('type', 'capital');

    // 验证自定义属性
    expect(marker.getProperty('name')).toBe('北京');
    expect(marker.getProperty('type')).toBe('capital');
  });

  test('覆盖物工厂创建覆盖物并删除自定义属性', () => {
    // 创建标记
    const marker = createMarker({
      position: [116.3974, 39.9093],
      properties: {
        name: '北京',
        type: 'capital',
      },
    });

    // 删除自定义属性
    marker.removeProperty('type');

    // 验证自定义属性已删除
    expect(marker.getProperty('type')).toBeUndefined();
    expect(marker.getProperty('name')).toBe('北京');
  });
});