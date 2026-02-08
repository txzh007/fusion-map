/**
 * Fusion Map SDK 公共类型定义
 */

import type { Map as MapLibreMap, LayerSpecification, MapOptions } from 'maplibre-gl';
import type { Observable } from 'rxjs';
import type {
  Projection,
  EventTypeToMapEvent,
  EventTypeMap,
  MapEvent as MapLibreEvent
} from './maplibre-extensions';
import type {
  Cesium,
  AMap,
  BMapGL,
  GoogleMaps,
  MapInstances
} from './third-party';

// ============ 导出扩展类型 ============

export type { Projection, EventTypeToMapEvent, EventTypeMap, MapLibreEvent };
export type { MapOptionsWithProjection } from './maplibre-extensions';
export type {
  Cesium,
  AMap,
  BMapGL,
  GoogleMaps,
  MapInstances
} from './third-party';

// ============ 地图类型 ============

/**
 * 支持的地图类型
 */
export type MapType = 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';

// ============ 配置类型 ============

/**
 * 地图 API 令牌配置
 */
export interface MapTokens {
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
}

/**
 * Fusion Map 配置选项
 */
export interface FusionMapConfig {
  /**
   * MapLibre 地图选项
   */
  mapOptions?: Partial<MapOptions>;

  /**
   * 各地图服务商的 API 密钥
   */
  tokens?: MapTokens;
}

// ============ 相机状态 ============

/**
 * 相机状态
 */
export interface CameraState {
  /** 中心点坐标 [经度, 纬度] */
  center: [number, number];
  /** 缩放级别 */
  zoom: number;
  /** 俯仰角（0-60度） */
  pitch: number;
  /** 旋转角（0-360度） */
  bearing: number;
}

// ============ 错误和状态 ============

/**
 * 地图错误信息
 */
export interface MapError {
  /** 错误关联的地图类型 */
  type: MapType;
  /** 错误消息 */
  message: string;
  /** 原始错误对象 */
  error?: Error;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 地图加载状态
 */
export interface MapLoadingState {
  /** 关联的地图类型 */
  type: MapType;
  /** 是否正在加载 */
  loading: boolean;
  /** 加载进度 (0-100) */
  progress?: number;
}

// ============ 事件类型 ============

/**
 * 普通事件监听器类型（用于未类型化的事件）
 */
export type GenericEventOn = (
  type: string,
  listener: (ev: unknown) => void
) => void;

/**
 * 地图事件类型
 */
export type MapEventType =
  /** 地图准备就绪 */
  | 'ready'
  /** 地图切换 */
  | 'map:switch'
  /** 地图加载完成 */
  | 'map:load'
  /** 地图错误 */
  | 'map:error'
  /** 相机变化 */
  | 'camera:change'
  /** 切换开始 */
  | 'switch:start'
  /** 切换完成 */
  | 'switch:complete'
  /** 切换失败 */
  | 'switch:failed';

/**
 * 地图事件数据
 */
export interface MapEventData<T = any> {
  /** 事件类型 */
  type: MapEventType;
  /** 事件数据 */
  data: T;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 地图事件监听器
 */
export type MapEventListener<T = any> = (event: MapEventData<T>) => void;

// ============ 投影类型 ============

/**
 * 地图投影类型
 */
export type MapProjection = 'globe' | 'mercator';

// ============ API 类型 ============

/**
 * MapLibre 地图实例类型
 */
export type MapLibreMapInstance = MapLibreMap;

/**
 * 图层规范类型
 */
export type LayerSpec = LayerSpecification;
