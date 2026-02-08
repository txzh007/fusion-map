export * from './di/Container';
export * from './decorators';
export * from './services/SyncEngine';
export * from './FusionMap';

// 导出覆盖物API
export * from './overlays';

// 导出类型（排除可能冲突的）
export type {
  // 基础类型
  MapType,
  FusionMapConfig,
  CameraState,
  MapError,
  MapLoadingState,
  MapEventType,
  MapEventData,
  MapEventListener,
  MapProjection,
  MapLibreMapInstance,
  LayerSpec,
  
  // 扩展类型
  Projection,
  EventTypeToMapEvent,
  EventTypeMap,
  MapLibreEvent,
  MapOptionsWithProjection,
  
  // 第三方类型
  Cesium,
  AMap,
  BMapGL,
  GoogleMaps,
  MapInstances,
} from './types';

// 导出错误处理
export * from './errors';
