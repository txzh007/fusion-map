/**
 * Fusion Map SDK
 * 通用地图适配器 - 统一对接多种地图服务商
 */

// ============ 核心类 ============

/**
 * Fusion Map 主类
 * 统一对接多种地图服务商
 */
export { FusionMap, createFusionMap } from './FusionMap';

// ============ 类型定义 ============

/**
 * 地图类型枚举
 */
export type MapType = 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';

/**
 * 地图错误信息
 */
export interface MapError {
  type: MapType;
  message: string;
  error?: Error;
  timestamp: number;
}

/**
 * 地图加载状态
 */
export interface MapLoadingState {
  type: MapType;
  loading: boolean;
  progress?: number;
}

/**
 * Fusion Map 配置选项
 */
export interface FusionMapConfig {
  /**
   * MapLibre 地图选项
   */
  mapOptions?: Partial<import('maplibre-gl').MapOptions>;

  /**
   * 各地图服务商的 API 密钥
   */
  tokens?: {
    /** 高德地图 JS API 密钥 */
    amap?: string;
    /** 百度地图 WebGL API 密钥 */
    baidu?: string;
    /** Cesium Ion Token */
    cesium?: string;
    /** 天地图 Token */
    tianditu?: string;
    /** Google Maps API 密钥 */
    google?: string;
    /** Google Maps Map ID（用于矢量地图） */
    googleMapId?: string;
  };
}

// ============ 配置常量 ============

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: Partial<FusionMapConfig> = {
  mapOptions: {
    center: [116.3974, 39.9093],
    zoom: 12,
    minZoom: 2,
    maxZoom: 22
  }
};

// ============ 工具函数 ============

/**
 * 坐标转换工具
 * @export
 */
export class CoordinateUtils {
  /**
   * WGS84 转 GCJ02（高德、腾讯地图）
   */
  static wgs84ToGcj02(lng: number, lat: number): [number, number] {
    const gcoord = require('gcoord');
    return gcoord.transform([lng, lat], gcoord.WGS84, gcoord.GCJ02);
  }

  /**
   * WGS84 转 BD09（百度地图）
   */
  static wgs84ToBd09(lng: number, lat: number): [number, number] {
    const gcoord = require('gcoord');
    return gcoord.transform([lng, lat], gcoord.WGS84, gcoord.BD09);
  }

  /**
   * GCJ02 转 WGS84
   */
  static gcj02ToWgs84(lng: number, lat: number): [number, number] {
    const gcoord = require('gcoord');
    return gcoord.transform([lng, lat], gcoord.GCJ02, gcoord.WGS84);
  }
}

// ============ 覆盖物API ============

/**
 * 覆盖物工厂
 */
export { overlayFactory, createMarker, createPolyline } from './overlays';

/**
 * 覆盖物管理器
 */
export { OverlayManager } from './overlays';

/**
 * 覆盖物基类
 */
export { BaseOverlay } from './overlays';

/**
 * 标记覆盖物
 */
export { Marker } from './overlays';

/**
 * 折线覆盖物
 */
export { Polyline } from './overlays';

/**
 * 覆盖物扩展
 */
export { extendFusionMapWithOverlays } from './overlays/FusionMapExtensions';

// ============ 覆盖物类型 ============

export type {
  // 基础类型
  Point,
  LngLat,
  Bounds,
  
  // 覆盖物接口
  IOverlay,
  IOverlayManager,
  IOverlayFactory,
  
  // 标记类型
  MarkerOptions,
  IMarker,
  
  // 折线类型
  PolylineOptions,
  IPolyline,
  
  // 多边形类型
  PolygonOptions,
  IPolygon,
  
  // 圆形类型
  CircleOptions,
  ICircle,
  
  // 矩形类型
  RectangleOptions,
  IRectangle,
  
  // 信息窗口类型
  InfoWindowOptions,
  IInfoWindow,
  
  // GeoJSON类型
  GeoJSONOptions,
  IGeoJSON,
  
  // SVG覆盖物类型
  SVGOverlayOptions,
  ISVGOverlay,
  
  // 管理器类型
  OverlayManagerOptions,
  
  // 事件类型
  OverlayEventType,
  OverlayEventData,
  OverlayEventListener,
  
  // 选项类型
  OverlayOptions,
} from './overlays';

// ============ 版本信息 ============

export const VERSION = '1.0.0';
export const SDK_NAME = 'Fusion Map SDK';

// ============ 内部类型（不导出） ============

// 所有内部实现类和装饰器不应该导出
// 如：BaseMapProvider, SyncEngine, Container, MapService, Inject, AutoBind, Watch 等

