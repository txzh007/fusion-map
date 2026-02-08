# Fusion Map 覆盖物 API

基于 MapLibre GL JS 的通用覆盖物 API，实现"一次编写，到处运行"的目标。

## 特性

- ✅ **统一API**：基于MapLibre GL JS设计，可在任何地图上使用
- ✅ **类型安全**：完整的TypeScript类型定义
- ✅ **事件系统**：支持丰富的事件监听
- ✅ **覆盖物管理**：统一管理所有覆盖物
- ✅ **GeoJSON支持**：支持GeoJSON导入导出
- ✅ **可扩展**：易于扩展新的覆盖物类型

## 安装

```bash
npm install @fusion-map/core
```

## 快速开始

### 1. 扩展FusionMap以支持覆盖物

```typescript
import { FusionMap } from '@fusion-map/core';
import { extendFusionMapWithOverlays } from '@fusion-map/core/overlays';

// 扩展FusionMap以支持覆盖物API
extendFusionMapWithOverlays();
```

### 2. 创建标记

```typescript
// 创建地图
const map = new FusionMap('map-container');

// 创建标记
const marker = map.createMarker({
  position: [116.3974, 39.9093], // [经度, 纬度]
  title: '北京',
  icon: 'https://example.com/marker.png',
  visible: true,
  interactive: true,
});

// 监听点击事件
marker.on('click', (event) => {
  console.log('标记被点击', event);
});
```

### 3. 创建折线

```typescript
// 创建折线
const polyline = map.createPolyline({
  path: [
    [116.3974, 39.9093],
    [116.4074, 39.9193],
    [116.4174, 39.9293],
  ],
  color: '#ff0000',
  width: 3,
  opacity: 0.8,
});

// 监听鼠标事件
polyline.on('mouseenter', (event) => {
  console.log('鼠标进入折线');
});

polyline.on('mouseleave', (event) => {
  console.log('鼠标离开折线');
});
```

### 4. 使用覆盖物管理器

```typescript
// 获取覆盖物管理器
const overlays = map.getOverlays();

// 添加覆盖物
overlays.addOverlay(marker);
overlays.addOverlay(polyline);

// 获取覆盖物数量
const count = overlays.getOverlayCount();

// 根据ID获取覆盖物
const foundMarker = overlays.getOverlayById(marker.getId());

// 根据类型获取覆盖物
const markers = overlays.getOverlaysByType('marker');

// 获取所有覆盖物
const allOverlays = overlays.getAllOverlays();

// 显示所有覆盖物
overlays.showAllOverlays();

// 隐藏所有覆盖物
overlays.hideAllOverlays();

// 清空所有覆盖物
overlays.clearOverlays();
```

## API 参考

### 标记 (Marker)

#### 创建标记

```typescript
const marker = map.createMarker({
  position: [lng, lat],           // 必需：标记位置 [经度, 纬度]
  id: 'marker-1',                 // 可选：唯一标识符
  title: '标记标题',              // 可选：标记标题
  icon: 'url/to/icon.png',        // 可选：图标URL或HTML元素
  iconSize: [30, 30],             // 可选：图标大小 [宽度, 高度]
  anchor: [0.5, 1],               // 可选：锚点位置 [x, y] (0-1)
  rotation: 0,                    // 可选：旋转角度（度）
  rotationOrigin: 'center',       // 可选：旋转原点
  offset: [0, 0],                 // 可选：偏移量 [x, y]
  draggable: false,               // 可选：是否可拖动
  popup: '<div>内容</div>',       // 可选：弹出内容
  popupOffset: [0, -10],          // 可选：弹出内容偏移量
  visible: true,                  // 可选：是否可见
  interactive: true,              // 可选：是否可交互
  zIndex: 0,                      // 可选：图层顺序
  properties: {},                 // 可选：自定义属性
});
```

#### 标记方法

```typescript
// 获取/设置位置
marker.getPosition();
marker.setPosition([lng, lat]);

// 获取/设置图标
marker.getIcon();
marker.setIcon('url/to/icon.png');

// 获取/设置旋转角度
marker.getRotation();
marker.setRotation(45);

// 弹出窗口
marker.openPopup();
marker.closePopup();
marker.togglePopup();

// 获取/设置弹出内容
marker.getPopupContent();
marker.setPopupContent('<div>新内容</div>');

// 获取/设置可见性
marker.isVisible();
marker.setVisible(true);

// 获取/设置选项
marker.getOptions();
marker.setOptions({ title: '新标题' });

// 获取/设置自定义属性
marker.getProperty('name');
marker.setProperty('name', '北京');
marker.removeProperty('name');

// 获取边界框
marker.getBounds();

// 检查是否在边界内
marker.isInBounds(bounds);

// 序列化
marker.toJSON();
marker.toGeoJSON();

// 克隆
const clone = marker.clone();

// 销毁
marker.destroy();
```

#### 标记事件

```typescript
// 点击事件
marker.on('click', (event) => {
  console.log('点击', event);
});

// 双击事件
marker.on('dblclick', (event) => {
  console.log('双击', event);
});

// 鼠标进入
marker.on('mouseenter', (event) => {
  console.log('鼠标进入', event);
});

// 鼠标离开
marker.on('mouseleave', (event) => {
  console.log('鼠标离开', event);
});

// 拖拽开始
marker.on('dragstart', (event) => {
  console.log('拖拽开始', event);
});

// 拖拽中
marker.on('drag', (event) => {
  console.log('拖拽中', event);
});

// 拖拽结束
marker.on('dragend', (event) => {
  console.log('拖拽结束', event);
});

// 可见性变化
marker.on('visibilitychange', (event) => {
  console.log('可见性变化', event);
});

// 属性变化
marker.on('propertychange', (event) => {
  console.log('属性变化', event);
});
```

### 折线 (Polyline)

#### 创建折线

```typescript
const polyline = map.createPolyline({
  path: [[lng1, lat1], [lng2, lat2], [lng3, lat3]],  // 必需：路径点数组
  id: 'polyline-1',                                   // 可选：唯一标识符
  color: '#3388ff',                                   // 可选：线条颜色
  width: 2,                                           // 可选：线条宽度
  opacity: 1,                                         // 可选：线条透明度
  lineStyle: 'solid',                                 // 可选：线条样式
  dashPattern: [10, 5],                               // 可选：虚线模式
  strokeColor: '#000000',                             // 可选：描边颜色
  strokeWidth: 1,                                     // 可选：描边宽度
  editable: false,                                    // 可选：是否可编辑
  measurable: false,                                  // 可选：是否可测量
  minZoom: 0,                                         // 可选：最小缩放可见级别
  maxZoom: 22,                                        // 可选：最大缩放可见级别
  visible: true,                                      // 可选：是否可见
  interactive: true,                                  // 可选：是否可交互
  zIndex: 0,                                          // 可选：图层顺序
  properties: {},                                     // 可选：自定义属性
});
```

#### 折线方法

```typescript
// 获取/设置路径
polyline.getPath();
polyline.setPath([[lng1, lat1], [lng2, lat2]]);

// 添加/删除点
polyline.addPoint([lng, lat], index);
polyline.removePoint(index);

// 获取/设置颜色
polyline.getColor();
polyline.setColor('#ff0000');

// 获取/设置宽度
polyline.getWidth();
polyline.setWidth(3);

// 获取/设置透明度
polyline.getOpacity();
polyline.setOpacity(0.8);

// 计算长度（米）
const length = polyline.getLength();

// 获取/设置可见性
polyline.isVisible();
polyline.setVisible(true);

// 获取/设置选项
polyline.getOptions();
polyline.setOptions({ color: '#00ff00' });

// 获取/设置自定义属性
polyline.getProperty('name');
polyline.setProperty('name', '路线');
polyline.removeProperty('name');

// 获取边界框
polyline.getBounds();

// 检查是否在边界内
polyline.isInBounds(bounds);

// 序列化
polyline.toJSON();
polyline.toGeoJSON();

// 克隆
const clone = polyline.clone();

// 销毁
polyline.destroy();
```

#### 折线事件

```typescript
// 点击事件
polyline.on('click', (event) => {
  console.log('点击', event);
});

// 鼠标进入
polyline.on('mouseenter', (event) => {
  console.log('鼠标进入', event);
});

// 鼠标离开
polyline.on('mouseleave', (event) => {
  console.log('鼠标离开', event);
});

// 可见性变化
polyline.on('visibilitychange', (event) => {
  console.log('可见性变化', event);
});

// 属性变化
polyline.on('propertychange', (event) => {
  console.log('属性变化', event);
});
```

### 覆盖物管理器 (OverlayManager)

#### 创建管理器

```typescript
// 使用默认管理器
const overlays = map.getOverlays();

// 创建自定义管理器
const customManager = overlays.getManager();

// 创建带选项的管理器
const manager = overlays.createManager({
  clustering: false,           // 是否启用集群
  clusterRadius: 50,           // 集群半径（像素）
  clusterMaxZoom: 14,          // 集群最大缩放级别
  cacheEnabled: true,          // 是否启用缓存
  cacheSize: 1000,             // 缓存大小
});
```

#### 管理器方法

```typescript
// 添加覆盖物
overlays.addOverlay(marker);

// 移除覆盖物
overlays.removeOverlay(marker);
overlays.removeOverlayById('marker-1');

// 清空所有覆盖物
overlays.clearOverlays();

// 获取覆盖物数量
const count = overlays.getOverlayCount();

// 获取覆盖物
const marker = overlays.getOverlayById('marker-1');
const markers = overlays.getOverlaysByType('marker');
const all = overlays.getAllOverlays();

// 显示/隐藏覆盖物
overlays.showAllOverlays();
overlays.hideAllOverlays();

// 获取边界内的覆盖物
const inBounds = overlays.getManager().getInBounds!(bounds);

// 遍历覆盖物
overlays.getManager().forEach!((overlay) => {
  console.log(overlay.getId());
});

// 过滤覆盖物
const filtered = overlays.getManager().filter!((overlay) => 
  overlay.getType() === 'marker'
);

// 查找覆盖物
const found = overlays.getManager().find!((overlay) => 
  overlay.getId() === 'marker-1'
);

// 批量操作
overlays.getManager().addAll!([marker1, marker2, polyline]);
overlays.getManager().removeAll!([marker1, marker2]);

// 导出为GeoJSON
const geojson = overlays.exportToGeoJSON();

// 获取统计信息
const stats = overlays.getManager().getTypeStats!();
const visibleCount = overlays.getManager().getVisibleCount!();
const hiddenCount = overlays.getManager().getHiddenCount!();

// 获取/设置选项
const options = overlays.getManager().getOptions!();
overlays.getManager().setOptions!({ clustering: true });

// 启用/禁用集群
overlays.getManager().setClustering!(true);
const isClustering = overlays.getManager().isClusteringEnabled!();

// 销毁管理器
overlays.getManager().destroy!();
```

#### 管理器事件

```typescript
// 添加覆盖物事件
overlays.getManager().on('add', (event) => {
  console.log('覆盖物已添加', event.overlay);
});

// 移除覆盖物事件
overlays.getManager().on('remove', (event) => {
  console.log('覆盖物已移除', event.overlay);
});

// 清空覆盖物事件
overlays.getManager().on('clear', (event) => {
  console.log('覆盖物已清空', event.count);
});

// 显示所有覆盖物事件
overlays.getManager().on('showAll', () => {
  console.log('所有覆盖物已显示');
});

// 隐藏所有覆盖物事件
overlays.getManager().on('hideAll', () => {
  console.log('所有覆盖物已隐藏');
});

// 选项变化事件
overlays.getManager().on('optionsChanged', (event) => {
  console.log('选项已变化', event.options);
});

// 集群变化事件
overlays.getManager().on('clusteringChanged', (event) => {
  console.log('集群状态已变化', event.enabled);
});
```

### 覆盖物工厂 (OverlayFactory)

#### 使用工厂

```typescript
import { overlayFactory, createMarker, createPolyline } from '@fusion-map/core/overlays';

// 创建标记
const marker = createMarker({
  position: [116.3974, 39.9093],
  title: '北京',
});

// 创建折线
const polyline = createPolyline({
  path: [
    [116.3974, 39.9093],
    [116.4074, 39.9193],
  ],
  color: '#ff0000',
});

// 使用工厂创建管理器
const manager = overlayFactory.createManager();
```

## 高级用法

### 1. 自定义覆盖物

```typescript
import { BaseOverlay } from '@fusion-map/core/overlays';
import type { IOverlay, OverlayOptions } from '@fusion-map/core/overlays';

interface CustomOverlayOptions extends OverlayOptions {
  customProperty: string;
}

class CustomOverlay extends BaseOverlay {
  private customProperty: string;

  constructor(options: CustomOverlayOptions) {
    super(options);
    this.customProperty = options.customProperty;
  }

  addTo(map: any): void {
    // 实现添加到地图的逻辑
  }

  remove(): void {
    // 实现从地图移除的逻辑
  }

  protected updateVisibility(): void {
    // 实现可见性更新逻辑
  }

  protected onOptionsChanged(changedProps: string[]): void {
    // 实现选项变化处理逻辑
  }

  protected calculateBounds(): Bounds {
    // 实现边界框计算逻辑
    return { sw: [0, 0], ne: [0, 0] };
  }

  toGeoJSON(): any {
    // 实现转换为GeoJSON的逻辑
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
    };
  }

  getType(): string {
    return 'custom';
  }

  clone(): CustomOverlay {
    return new CustomOverlay({
      ...this.getOptions(),
      customProperty: this.customProperty,
    });
  }
}

// 使用自定义覆盖物
const custom = new CustomOverlay({
  position: [116.3974, 39.9093],
  customProperty: 'value',
});
```

### 2. GeoJSON导入导出

```typescript
// 导出为GeoJSON
const geojson = overlays.exportToGeoJSON();

// 从GeoJSON导入
const factory = {
  createMarker: (feature: any) => {
    return createMarker({
      position: feature.geometry.coordinates,
      properties: feature.properties,
    });
  },
  createPolyline: (feature: any) => {
    return createPolyline({
      path: feature.geometry.coordinates,
      properties: feature.properties,
    });
  },
};

overlays.getManager().fromGeoJSON!(geojson, factory);
```

### 3. 覆盖物集群

```typescript
// 启用集群
overlays.getManager().setClustering!(true);

// 设置集群选项
overlays.getManager().setOptions!({
  clustering: true,
  clusterRadius: 100,
  clusterMaxZoom: 15,
});
```

### 4. 覆盖物边界检查

```typescript
// 检查覆盖物是否在边界内
const bounds = {
  sw: [116.3, 39.9] as [number, number],
  ne: [116.5, 40.0] as [number, number],
};

const inBounds = overlays.getManager().getInBounds!(bounds);
```

### 5. 覆盖物序列化

```typescript
// 序列化为JSON
const json = marker.toJSON();

// 从JSON恢复
const restoredMarker = createMarker({
  ...json.options,
  id: json.id,
});
```

## 事件系统

### 覆盖物事件

覆盖物支持以下事件类型：

- `click` - 点击事件
- `dblclick` - 双击事件
- `mousedown` - 鼠标按下
- `mouseup` - 鼠标释放
- `mouseenter` - 鼠标进入
- `mouseleave` - 鼠标离开
- `mousemove` - 鼠标移动
- `dragstart` - 拖拽开始
- `drag` - 拖拽中
- `dragend` - 拖拽结束
- `contextmenu` - 右键菜单
- `add` - 添加到地图
- `remove` - 从地图移除
- `visibilitychange` - 可见性变化
- `propertychange` - 属性变化

### 管理器事件

管理器支持以下事件类型：

- `add` - 添加覆盖物
- `remove` - 移除覆盖物
- `clear` - 清空覆盖物
- `showAll` - 显示所有覆盖物
- `hideAll` - 隐藏所有覆盖物
- `optionsChanged` - 选项变化
- `clusteringChanged` - 集群状态变化

## 类型定义

### 基础类型

```typescript
// 坐标点
type LngLat = [number, number];

// 边界框
interface Bounds {
  sw: LngLat;  // 西南角
  ne: LngLat;  // 东北角
}

// 覆盖物选项
interface OverlayOptions {
  id?: string;
  visible?: boolean;
  interactive?: boolean;
  zIndex?: number;
  properties?: Record<string, any>;
}
```

### 标记类型

```typescript
// 标记选项
interface MarkerOptions extends OverlayOptions {
  position: LngLat;
  icon?: string | HTMLElement;
  iconSize?: [number, number];
  anchor?: [number, number];
  rotation?: number;
  rotationOrigin?: string;
  offset?: [number, number];
  draggable?: boolean;
  popup?: string | HTMLElement;
  popupOffset?: [number, number];
  title?: string;
  scaleWithZoom?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

// 标记接口
interface IMarker extends IOverlay {
  getPosition(): LngLat;
  setPosition(position: LngLat): void;
  getIcon(): string | HTMLElement | undefined;
  setIcon(icon: string | HTMLElement): void;
  getRotation(): number;
  setRotation(rotation: number): void;
  openPopup(): void;
  closePopup(): void;
  togglePopup(): void;
  getPopupContent(): string | HTMLElement | undefined;
  setPopupContent(content: string | HTMLElement): void;
  onDragStart(listener: (event: any) => void): void;
  onDrag(listener: (event: any) => void): void;
  onDragEnd(listener: (event: any) => void): void;
  onClick(listener: (event: any) => void): void;
}
```

### 折线类型

```typescript
// 折线选项
interface PolylineOptions extends OverlayOptions {
  path: LngLat[];
  color?: string;
  width?: number;
  opacity?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  dashPattern?: [number, number];
  strokeColor?: string;
  strokeWidth?: number;
  editable?: boolean;
  measurable?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

// 折线接口
interface IPolyline extends IOverlay {
  getPath(): LngLat[];
  setPath(path: LngLat[]): void;
  addPoint(point: LngLat, index?: number): void;
  removePoint(index: number): void;
  getColor(): string;
  setColor(color: string): void;
  getWidth(): number;
  setWidth(width: number): void;
  getOpacity(): number;
  setOpacity(opacity: number): void;
  getLength(): number;
  onClick(listener: (event: any) => void): void;
  onMouseEnter(listener: (event: any) => void): void;
  onMouseLeave(listener: (event: any) => void): void;
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 批量操作
const markers = [];
for (let i = 0; i < 1000; i++) {
  markers.push(createMarker({ position: [lng + i * 0.001, lat] }));
}
overlays.getManager().addAll!(markers);

// 使用缓存
const manager = overlayFactory.createManager({
  cacheEnabled: true,
  cacheSize: 1000,
});
```

### 2. 内存管理

```typescript
// 及时销毁不需要的覆盖物
marker.destroy();

// 清空管理器
overlays.clearOverlays();

// 销毁管理器
overlays.getManager().destroy!();
```

### 3. 错误处理

```typescript
try {
  const marker = createMarker({
    position: [116.3974, 39.9093],
  });
  overlays.addOverlay(marker);
} catch (error) {
  console.error('创建标记失败:', error);
}
```

### 4. 事件清理

```typescript
// 绑定事件
const listener = (event: any) => {
  console.log('点击', event);
};
marker.on('click', listener);

// 解绑事件
marker.off('click', listener);

// 销毁时清理所有事件
marker.destroy();
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 问题反馈

如有问题，请在GitHub Issues中反馈。