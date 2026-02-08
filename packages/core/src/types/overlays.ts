/**
 * Fusion Map 覆盖物 API 类型定义
 */

import type { LngLatLike, LngLatBoundsLike, Map as MapLibreMap, MapMouseEvent, GeoJSONSourceSpecification, PointLike } from 'maplibre-gl';

// ============ 基础几何类型 ============

/**
 * 坐标点类型
 */
export interface Point {
  /** 经度 */
  lng: number;
  /** 纬度 */
  lat: number;
}

/**
 * 地理坐标
 */
export type LngLat = [number, number];

/**
 * 边界框
 */
export interface Bounds {
  /** 西南角坐标 */
  sw: LngLat;
  /** 东北角坐标 */
  ne: LngLat;
}

// ============ 覆盖物基类接口 ============

/**
 * 覆盖物选项基础接口
 */
export interface OverlayOptions {
  /** 覆盖物唯一标识符 */
  id?: string;
  /** 是否可见 */
  visible?: boolean;
  /** 是否可交互 */
  interactive?: boolean;
  /** 图层顺序 */
  zIndex?: number;
  /** 自定义属性 */
  properties?: Record<string, any>;
  /** 偏移量 [x, y] */
  offset?: [number, number];
  /** 锚点位置 [x, y] (0-1) */
  anchor?: [number, number];
  /** 旋转原点 */
  rotationOrigin?: string;
  /** 标记图标大小 [宽度, 高度] */
  iconSize?: [number, number];
  /** 标记标题 */
  title?: string;
  /** 是否可关闭 */
  closable?: boolean;
  /** 是否自动关闭 */
  autoClose?: boolean;
  /** 弹出内容偏移量 */
  popupOffset?: [number, number];
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 自动关闭时间（毫秒） */
  autoCloseTime?: number;
  /** 关闭按钮文本 */
  closeButtonText?: string;
}

/**
 * 覆盖物基类接口
 */
export interface IOverlay {
  /** 获取覆盖物ID */
  getId(): string;
  
  /** 设置覆盖物ID */
  setId(id: string): void;
  
  /** 添加覆盖物到地图 */
  addTo(map: MapLibreMap): void;
  
  /** 从地图移除覆盖物 */
  remove(): void;
  
  /** 获取覆盖物是否可见 */
  isVisible(): boolean;
  
  /** 设置覆盖物可见性 */
  setVisible(visible: boolean): void;
  
  /** 获取覆盖物位置 */
  getPosition?(): LngLat;
  
  /** 设置覆盖物位置 */
  setPosition?(position: LngLat): void;
  
  /** 获取覆盖物边界框 */
  getBounds?(): Bounds;
  
  /** 检查是否在边界框内 */
  isInBounds?(bounds: Bounds): boolean;
  
  /** 更新覆盖物选项 */
  setOptions(options: Partial<OverlayOptions>): void;
  
  /** 获取覆盖物选项 */
  getOptions(): OverlayOptions;
  
  /** 获取覆盖物类型 */
  getType(): string;
  
  /** 销毁覆盖物 */
  destroy(): void;
  
  /** 序列化为JSON */
  toJSON?(): any;
  
  /** 转换为GeoJSON */
  toGeoJSON?(): any;
  
  /** 绑定事件监听器 */
  on(type: string, listener: (event: any) => void): void;
  
  /** 解绑事件监听器 */
  off(type: string, listener: (event: any) => void): void;
  
  /** 触发事件 */
  emit(type: string, data?: any): void;
}

// ============ 覆盖物工厂接口 ============

/**
 * 覆盖物创建工厂
 */
export interface OverlayFactory {
  /** 创建标记 */
  createMarker(options: MarkerOptions): IMarker;
  
  /** 创建折线 */
  createPolyline(options: PolylineOptions): IPolyline;
  
  /** 创建多边形 */
  createPolygon(options: PolygonOptions): IPolygon;
  
  /** 创建圆形 */
  createCircle(options: CircleOptions): ICircle;
  
  /** 创建矩形 */
  createRectangle(options: RectangleOptions): IRectangle;
  
  /** 创建信息窗口 */
  createInfoWindow(options: InfoWindowOptions): IInfoWindow;
  
  /** 创建自定义GeoJSON覆盖物 */
  createGeoJSON(options: GeoJSONOptions): IGeoJSON;
  
  /** 创建自定义SVG覆盖物 */
  createSVGOverlay(options: SVGOverlayOptions): ISVGOverlay;
}

// ============ 具体覆盖物类型接口 ============

/**
 * 标记选项
 */
export interface MarkerOptions extends OverlayOptions {
  /** 标记位置 */
  position: LngLat;
  /** 标记图标URL或HTML元素 */
  icon?: string | HTMLElement;
  /** 标记图标大小 [宽度, 高度] */
  iconSize?: [number, number];
  /** 标记锚点位置 [x, y] (0-1) */
  anchor?: [number, number];
  /** 旋转角度（度） */
  rotation?: number;
  /** 旋转原点 */
  rotationOrigin?: string;
  /** 偏移量 [x, y] */
  offset?: [number, number];
  /** 是否可拖动 */
  draggable?: boolean;
  /** 弹出内容 */
  popup?: string | HTMLElement;
  /** 弹出内容偏移量 */
  popupOffset?: [number, number];
  /** 标记标题 */
  title?: string;
  /** 是否在缩放时保持标记大小 */
  scaleWithZoom?: boolean;
  /** 最小缩放可见级别 */
  minZoom?: number;
  /** 最大缩放可见级别 */
  maxZoom?: number;
}

/**
 * 标记接口
 */
export interface IMarker extends IOverlay {
  /** 获取标记位置 */
  getPosition(): LngLat;
  
  /** 设置标记位置 */
  setPosition(position: LngLat): void;
  
  /** 获取标记图标 */
  getIcon(): string | HTMLElement | undefined;
  
  /** 设置标记图标 */
  setIcon(icon: string | HTMLElement): void;
  
  /** 获取旋转角度 */
  getRotation(): number;
  
  /** 设置旋转角度 */
  setRotation(rotation: number): void;
  
  /** 打开弹出窗口 */
  openPopup(): void;
  
  /** 关闭弹出窗口 */
  closePopup(): void;
  
  /** 切换弹出窗口 */
  togglePopup(): void;
  
  /** 获取弹出内容 */
  getPopupContent(): string | HTMLElement | undefined;
  
  /** 设置弹出内容 */
  setPopupContent(content: string | HTMLElement): void;
  
  /** 绑定拖拽事件 */
  onDragStart(listener: (event: any) => void): void;
  onDrag(listener: (event: any) => void): void;
  onDragEnd(listener: (event: any) => void): void;
  onClick(listener: (event: any) => void): void;
}

/**
 * 折线选项
 */
export interface PolylineOptions extends OverlayOptions {
  /** 路径点数组 */
  path: LngLat[];
  /** 线条颜色 */
  color?: string;
  /** 线条宽度 */
  width?: number;
  /** 线条透明度 */
  opacity?: number;
  /** 线条样式：实线、虚线、点线 */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** 虚线模式 [实线长度, 间隔长度] */
  dashPattern?: [number, number];
  /** 描边颜色 */
  strokeColor?: string;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 是否可编辑 */
  editable?: boolean;
  /** 是否可测量 */
  measurable?: boolean;
  /** 最小缩放可见级别 */
  minZoom?: number;
  /** 最大缩放可见级别 */
  maxZoom?: number;
}

/**
 * 折线接口
 */
export interface IPolyline extends IOverlay {
  /** 获取路径 */
  getPath(): LngLat[];
  
  /** 设置路径 */
  setPath(path: LngLat[]): void;
  
  /** 添加点 */
  addPoint(point: LngLat, index?: number): void;
  
  /** 删除点 */
  removePoint(index: number): void;
  
  /** 获取线条颜色 */
  getColor(): string;
  
  /** 设置线条颜色 */
  setColor(color: string): void;
  
  /** 获取线条宽度 */
  getWidth(): number;
  
  /** 设置线条宽度 */
  setWidth(width: number): void;
  
  /** 获取线条透明度 */
  getOpacity(): number;
  
  /** 设置线条透明度 */
  setOpacity(opacity: number): void;
  
  /** 计算折线长度（米） */
  getLength(): number;
  
  /** 绑定点击事件 */
  onClick(listener: (event: any) => void): void;
  onMouseEnter(listener: (event: any) => void): void;
  onMouseLeave(listener: (event: any) => void): void;
}

/**
 * 多边形选项
 */
export interface PolygonOptions extends OverlayOptions {
  /** 多边形顶点数组 */
  path: LngLat[];
  /** 填充颜色 */
  fillColor?: string;
  /** 填充透明度 */
  fillOpacity?: number;
  /** 边框颜色 */
  strokeColor?: string;
  /** 边框宽度 */
  strokeWidth?: number;
  /** 边框透明度 */
  strokeOpacity?: number;
  /** 边框样式 */
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  /** 描边虚线模式 */
  strokeDashPattern?: [number, number];
  /** 是否可编辑 */
  editable?: boolean;
  /** 是否可测量 */
  measurable?: boolean;
  /** 最小缩放可见级别 */
  minZoom?: number;
  /** 最大缩放可见级别 */
  maxZoom?: number;
}

/**
 * 多边形接口
 */
export interface IPolygon extends IOverlay {
  /** 获取路径 */
  getPath(): LngLat[];
  
  /** 设置路径 */
  setPath(path: LngLat[]): void;
  
  /** 添加点 */
  addPoint(point: LngLat, index?: number): void;
  
  /** 删除点 */
  removePoint(index: number): void;
  
  /** 获取填充颜色 */
  getFillColor(): string;
  
  /** 设置填充颜色 */
  setFillColor(color: string): void;
  
  /** 获取填充透明度 */
  getFillOpacity(): number;
  
  /** 设置填充透明度 */
  setFillOpacity(opacity: number): void;
  
  /** 计算多边形面积（平方米） */
  getArea(): number;
  
  /** 获取多边形中心点 */
  getCenter(): LngLat;
  
  /** 绑定点击事件 */
  onClick(listener: (event: any) => void): void;
  onMouseEnter(listener: (event: any) => void): void;
  onMouseLeave(listener: (event: any) => void): void;
}

/**
 * 圆形选项
 */
export interface CircleOptions extends OverlayOptions {
  /** 圆心位置 */
  center: LngLat;
  /** 半径（米） */
  radius: number;
  /** 填充颜色 */
  fillColor?: string;
  /** 填充透明度 */
  fillOpacity?: number;
  /** 边框颜色 */
  strokeColor?: string;
  /** 边框宽度 */
  strokeWidth?: number;
  /** 边框透明度 */
  strokeOpacity?: number;
  /** 边框样式 */
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  /** 描边虚线模式 */
  strokeDashPattern?: [number, number];
  /** 是否可编辑 */
  editable?: boolean;
  /** 最小缩放可见级别 */
  minZoom?: number;
  /** 最大缩放可见级别 */
  maxZoom?: number;
}

/**
 * 圆形接口
 */
export interface ICircle extends IOverlay {
  /** 获取圆心位置 */
  getCenter(): LngLat;
  
  /** 设置圆心位置 */
  setCenter(center: LngLat): void;
  
  /** 获取半径 */
  getRadius(): number;
  
  /** 设置半径 */
  setRadius(radius: number): void;
  
  /** 获取填充颜色 */
  getFillColor(): string;
  
  /** 设置填充颜色 */
  setFillColor(color: string): void;
  
  /** 计算圆形面积 */
  getArea(): number;
  
  /** 计算圆形周长 */
  getPerimeter(): number;
}

/**
 * 矩形选项
 */
export interface RectangleOptions extends OverlayOptions {
  /** 矩形边界 */
  bounds: Bounds;
  /** 填充颜色 */
  fillColor?: string;
  /** 填充透明度 */
  fillOpacity?: number;
  /** 边框颜色 */
  strokeColor?: string;
  /** 边框宽度 */
  strokeWidth?: number;
  /** 边框透明度 */
  strokeOpacity?: number;
  /** 边框样式 */
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  /** 描边虚线模式 */
  strokeDashPattern?: [number, number];
  /** 是否可编辑 */
  editable?: boolean;
  /** 最小缩放可见级别 */
  minZoom?: number;
  /** 最大缩放可见级别 */
  maxZoom?: number;
}

/**
 * 矩形接口
 */
export interface IRectangle extends IOverlay {
  /** 获取矩形边界 */
  getBounds(): Bounds;
  
  /** 设置矩形边界 */
  setBounds(bounds: Bounds): void;
  
  /** 获取填充颜色 */
  getFillColor(): string;
  
  /** 设置填充颜色 */
  setFillColor(color: string): void;
  
  /** 计算矩形面积 */
  getArea(): number;
  
  /** 计算矩形中心点 */
  getCenter(): LngLat;
}

/**
 * 信息窗口选项
 */
export interface InfoWindowOptions extends OverlayOptions {
  /** 信息窗口位置 */
  position: LngLat;
  /** 信息窗口内容 */
  content: string | HTMLElement;
  /** 信息窗口偏移量 */
  offset?: [number, number];
  /** 信息窗口大小 [宽度, 高度] */
  size?: [number, number];
  /** 是否自动关闭 */
  autoClose?: boolean;
  /** 自动关闭时间（毫秒） */
  autoCloseTime?: number;
  /** 是否可关闭 */
  closable?: boolean;
  /** 关闭按钮文本 */
  closeButtonText?: string;
  /** 信息窗口标题 */
  title?: string;
  /** 信息窗口最大宽度 */
  maxWidth?: number;
  /** 信息窗口最大高度 */
  maxHeight?: number;
}

/**
 * 信息窗口接口
 */
export interface IInfoWindow extends IOverlay {
  /** 获取信息窗口位置 */
  getPosition(): LngLat;
  
  /** 设置信息窗口位置 */
  setPosition(position: LngLat): void;
  
  /** 获取信息窗口内容 */
  getContent(): string | HTMLElement;
  
  /** 设置信息窗口内容 */
  setContent(content: string | HTMLElement): void;
  
  /** 打开信息窗口 */
  open(): void;
  
  /** 关闭信息窗口 */
  close(): void;
  
  /** 切换信息窗口 */
  toggle(): void;
  
  /** 是否已打开 */
  isOpen(): boolean;
  
  /** 绑定关闭事件 */
  onClose(listener: () => void): void;
}

/**
 * GeoJSON选项
 */
export interface GeoJSONOptions extends OverlayOptions {
  /** GeoJSON数据 */
  data: any;
  /** 填充颜色 */
  fillColor?: string;
  /** 填充透明度 */
  fillOpacity?: number;
  /** 线条颜色 */
  lineColor?: string;
  /** 线条宽度 */
  lineWidth?: number;
  /** 线条透明度 */
  lineOpacity?: number;
  /** 点半径 */
  pointRadius?: number;
  /** 点颜色 */
  pointColor?: string;
  /** 最小缩放可见级别 */
  minZoom?: number;
  /** 最大缩放可见级别 */
  maxZoom?: number;
  /** 点击事件 */
  onClick?: (event: any) => void;
}

/**
 * GeoJSON接口
 */
export interface IGeoJSON extends IOverlay {
  /** 获取GeoJSON数据 */
  getData(): any;
  
  /** 设置GeoJSON数据 */
  setData(data: any): void;
  
  /** 添加GeoJSON数据 */
  addData(data: any): void;
  
  /** 清空GeoJSON数据 */
  clear(): void;
  
  /** 获取边界框 */
  getBounds(): Bounds;
}

/**
 * SVG覆盖物选项
 */
export interface SVGOverlayOptions extends OverlayOptions {
  /** SVG内容 */
  svg: string;
  /** 覆盖物边界 */
  bounds: Bounds;
  /** 是否保持比例 */
  preserveAspectRatio?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 最小缩放可见级别 */
  minZoom?: number;
  /** 最大缩放可见级别 */
  maxZoom?: number;
}

/**
 * SVG覆盖物接口
 */
export interface ISVGOverlay extends IOverlay {
  /** 获取SVG内容 */
  getSVG(): string;
  
  /** 设置SVG内容 */
  setSVG(svg: string): void;
  
  /** 获取边界框 */
  getBounds(): Bounds;
  
  /** 设置边界框 */
  setBounds(bounds: Bounds): void;
}

// ============ 事件类型 ============

/**
 * 覆盖物事件类型
 */
export type OverlayEventType =
  | 'click'
  | 'dblclick'
  | 'mousedown'
  | 'mouseup'
  | 'mouseenter'
  | 'mouseleave'
  | 'mousemove'
  | 'dragstart'
  | 'drag'
  | 'dragend'
  | 'contextmenu'
  | 'add'
  | 'remove'
  | 'visibilitychange'
  | 'propertychange';

/**
 * 覆盖物事件数据
 */
export interface OverlayEventData {
  /** 事件类型 */
  type: OverlayEventType;
  /** 覆盖物实例 */
  overlay: IOverlay;
  /** 原始事件 */
  originalEvent?: any;
  /** 坐标点 */
  lnglat?: LngLat;
  /** 屏幕坐标 */
  screenPoint?: [number, number];
  /** 时间戳 */
  timestamp: number;
}

/**
 * 覆盖物事件监听器
 */
export type OverlayEventListener = (event: OverlayEventData) => void;

// ============ 覆盖物管理器接口 ============

/**
 * 覆盖物管理器选项
 */
export interface OverlayManagerOptions {
  /** 是否启用集群 */
  clustering?: boolean;
  /** 集群半径（像素） */
  clusterRadius?: number;
  /** 集群最大缩放级别 */
  clusterMaxZoom?: number;
  /** 是否启用覆盖物缓存 */
  cacheEnabled?: boolean;
  /** 缓存大小 */
  cacheSize?: number;
}

/**
 * 覆盖物管理器接口
 */
export interface IOverlayManager {
  /** 绑定地图实例 */
  bindMap?(map: any): void;
  
  /** 解绑地图实例 */
  unbindMap?(): void;
  
  /** 添加覆盖物 */
  add(overlay: IOverlay): void;
  
  /** 移除覆盖物 */
  remove(overlay: IOverlay): boolean;
  
  /** 根据ID移除覆盖物 */
  removeById?(id: string): boolean;
  
  /** 移除所有覆盖物 */
  clear(): void;
  
  /** 获取覆盖物数量 */
  getCount(): number;
  
  /** 根据ID获取覆盖物 */
  getById(id: string): IOverlay | undefined;
  
  /** 根据类型获取覆盖物列表 */
  getByType(type: string): IOverlay[];
  
  /** 获取所有覆盖物 */
  getAll(): IOverlay[];
  
  /** 显示所有覆盖物 */
  showAll(): void;
  
  /** 隐藏所有覆盖物 */
  hideAll(): void;
  
  /** 根据边界框获取覆盖物 */
  getInBounds?(bounds: Bounds): IOverlay[];
  
  /** 导出为GeoJSON */
  toGeoJSON?(): any;
  
  /** 销毁管理器 */
  destroy?(): void;
  
  /** 绑定管理器事件 */
  on(event: string, listener: (event: any) => void): void;
  
  /** 解绑管理器事件 */
  off(event: string, listener: (event: any) => void): void;
}

/**
 * 覆盖物工厂实例
 */
export interface IOverlayFactory extends OverlayFactory {
  /** 创建覆盖物管理器 */
  createManager(options?: OverlayManagerOptions): IOverlayManager;
  
  /** 获取覆盖物管理器 */
  getManager(): IOverlayManager | undefined;
}