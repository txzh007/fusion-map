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
export { BaseOverlay } from './entities/BaseOverlay';

// 导出具体覆盖物类
export { Marker } from './entities/Marker';
export { Polyline } from './entities/Polyline';
export { Polygon } from './entities/Polygon';

// 导出工厂和管理器
export { OverlayFactory } from './manager/OverlayFactory';
export { OverlayManager } from './manager/OverlayManager';
export { PointsModule } from './modules/PointsModule';
export { LinesModule } from './modules/LinesModule';
export { PolygonsModule } from './modules/PolygonsModule';

// 导出默认实例和工具函数
import { overlayFactory, createMarker, createPolyline, createPolygon } from './manager/OverlayFactory';
export { overlayFactory, createMarker, createPolyline, createPolygon };

// 默认导出
import { OverlayFactory as OverlayFactoryClass } from './manager/OverlayFactory';
import { OverlayManager as OverlayManagerClass } from './manager/OverlayManager';
import { BaseOverlay as BaseOverlayClass } from './entities/BaseOverlay';
import { Marker as MarkerClass } from './entities/Marker';
import { Polyline as PolylineClass } from './entities/Polyline';
import { Polygon as PolygonClass } from './entities/Polygon';

const overlays = {
  // 工厂
  factory: overlayFactory,
  
  // 创建函数
  createMarker,
  createPolyline,
  createPolygon,
  
  // 类
  BaseOverlay: BaseOverlayClass,
  Marker: MarkerClass,
  Polyline: PolylineClass,
  Polygon: PolygonClass,
  OverlayFactory: OverlayFactoryClass,
  OverlayManager: OverlayManagerClass,
};

export default overlays;
