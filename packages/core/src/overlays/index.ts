/**
 * Fusion Map 覆盖物 API 入口
 */

// 导出类型
export type {
  Point,
  LngLat,
  Bounds,
  OverlayOptions,
  IOverlay,
  OverlayFactory as OverlayFactoryType,
  IOverlayFactory,
  MarkerOptions,
  IMarker,
  PolylineOptions,
  IPolyline,
  PolygonOptions,
  IPolygon,
  CircleOptions,
  ICircle,
  RectangleOptions,
  IRectangle,
  InfoWindowOptions,
  IInfoWindow,
  GeoJSONOptions,
  IGeoJSON,
  SVGOverlayOptions,
  ISVGOverlay,
  OverlayManagerOptions,
  IOverlayManager,
  OverlayEventType,
  OverlayEventData,
  OverlayEventListener,
} from '../types/overlays';

// 导出基类
export { BaseOverlay } from './BaseOverlay';

// 导出具体覆盖物类
export { Marker } from './Marker';
export { Polyline } from './Polyline';

// 导出工厂和管理器
export { OverlayFactory } from './OverlayFactory';
export { OverlayManager } from './OverlayManager';

// 导出默认实例和工具函数
import { overlayFactory, createMarker, createPolyline } from './OverlayFactory';
export { overlayFactory, createMarker, createPolyline };

// 默认导出
import OverlayFactoryClass from './OverlayFactory';
import OverlayManagerClass from './OverlayManager';

const overlays = {
  // 工厂
  factory: overlayFactory,
  
  // 创建函数
  createMarker,
  createPolyline,
  
  // 类
  BaseOverlay: BaseOverlay,
  Marker: Marker,
  Polyline: Polyline,
  OverlayFactory: OverlayFactoryClass,
  OverlayManager: OverlayManagerClass,
};

export default overlays;