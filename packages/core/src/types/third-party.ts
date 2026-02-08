/**
 * 第三方地图服务库类型定义
 * 用于 Cesium、高德、百度等动态加载的全局对象
 */

// ============ Cesium 类型定义 ============

/**
 * Cesium 基础类型（懒加载）
 */
export interface Cesium {
  Viewer: new (container: string | Element, options?: CesiumViewerOptions) => CesiumViewer;
  Cartographic: any;
  Cartesian3: any;
  Ellipsoid: any;
  Matrix4: any;
  Math: CesiumMath;
  Ion: {
    defaultAccessToken?: string;
  };
}

/**
 * Cesium Viewer 类型
 */
export interface CesiumViewer {
  camera: {
    setView(options: { destination?: any; orientation?: any }): void;
    lookAt(target: any, offset: any): void;
    lookAtTransform(transform: any): void;
  };
}

/**
 * Cesium Math 类型
 */
export interface CesiumMath {
  toRadians(degrees: number): number;
  toAngle(radians: number): number;
}

/**
 * Cesium Viewer 配置项
 */
export interface CesiumViewerOptions {
  animation?: boolean;
  baseLayerPicker?: boolean;
  timeline?: boolean;
  fullscreenButton?: boolean;
  homeButton?: boolean;
  geocoder?: boolean;
  scene3DOnly?: boolean;
  creditContainer?: HTMLElement;
  [key: string]: any;
}

// ============ 高德地图类型定义 ============

/**
 * 高德地图类型（懒加载）
 */
export interface AMap {
  Map: new (element: string | HTMLElement, options?: any) => AMapInstance;
}

/**
 * 高德地图实例类型
 */
export interface AMapInstance {
  setZoomAndCenter(zoom: number, center: [number, number], noAnimation?: boolean): void;
  setPitch(pitch: number, noAnimation?: boolean): void;
  setRotation(rotation: number, noAnimation?: boolean): void;
  destroy(): void;
}

// ============ 百度地图类型定义 ============

/**
 * 百度地图类型（懒加载）
 */
export interface BMapGL {
  Map: new (element: string | HTMLElement) => BMapInstance;
  Point: new (lng: number, lat: number) => BMapPoint;
}

/**
 * 百度地图实例类型
 */
export interface BMapInstance {
  setCenter(point: BMapPoint, options?: { noAnimation?: boolean }): void;
  setZoom(zoom: number, options?: { noAnimation?: boolean }): void;
  setTilt(tilt: number, options?: { noAnimation?: boolean }): void;
  setHeading(heading: number, options?: { noAnimation?: boolean }): void;
  setCenterAndZoom(point: BMapPoint, zoom: number, options?: { noAnimation?: boolean }): void;
  enableScrollWheelZoom(): void;
  enableTilt(): void;
  enableRotate(): void;
}

/**
 * 百度地图点类型
 */
export interface BMapPoint {
  lng: number;
  lat: number;
}

// ============ Google Maps 类型定义 ============

/**
 * Google Maps 类型（懒加载）
 */
export interface GoogleMaps {
  maps: {
    Map: new (element: HTMLElement, options?: GoogleMapOptions) => GoogleMapInstance;
  };
}

/**
 * Google Maps 地图实例类型
 */
export interface GoogleMapInstance {
  setCenter(latLngOrLiteral: GoogleLatLngLiteral): void;
  setZoom(zoom: number): void;
  setHeading(heading: number): void;
  setTilt(tilt: number): void;
  moveCamera(cameraOptions: any): void;
}

/**
 * Google Maps LatLngLiteral
 */
export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

/**
 * Google Maps 地图配置项
 */
export interface GoogleMapOptions {
  center: GoogleLatLngLiteral;
  zoom?: number;
  heading?: number;
  tilt?: number;
  mapId?: string;
  disableDefaultUI?: boolean;
  mapTypeId?: string;
}

// ============ 扩展 Window 接口 ============

/**
 * 扩展全局 Window 接口，包含动态加载的地图服务
 */
declare global {
  interface Window {
    AMap?: AMap;
    BMapGL?: BMapGL;
    Cesium?: Cesium;
    google?: {
      maps?: GoogleMaps['maps'];
    };
  }
}

// ============ 泛型实例类型 ============

/**
 * 地图实例类型字典
 */
export interface MapInstances {
  amap: AMapInstance | null;
  baidu: BMapInstance | null;
  cesium: CesiumViewer | null;
  google: GoogleMapInstance | null;
}
