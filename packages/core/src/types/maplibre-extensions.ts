/**
 * MapLibre GL JS 类型扩展
 * 用于补充官方类型定义中缺失的类型
 */

import type { Map } from 'maplibre-gl';

// ============ 投影类型 ============

/**
 * 地图投影配置
 */
export interface Projection {
  /** 投影类型 */
  type: 'globe' | 'mercator';
}

// ============ MapOptions 扩展 ============

/**
 * 扩展的 MapOptions 类型
 * 添加官方类型定义中缺失的 projection 属性
 */
export interface MapOptionsWithProjection {
  /** 地图投影配置 */
  projection?: Projection;
}

// ============ 事件类型 ============

/**
 * MapLibre 事件数据类型
 * 基础接口，所有事件都继承此接口
 */
export interface MapEvent {
  /** 事件类型 */
  type: string;
  /** 事件目标 */
  target: Map;
}

/**
 * 相机移动事件
 */
export interface MoveEvent extends MapEvent {
  type: 'move' | 'moveend' | 'movestart';
}

/**
 * 缩放事件
 */
export interface ZoomEvent extends MapEvent {
  type: 'zoom' | 'zoomend' | 'zoomstart';
}

/**
 * 旋转事件
 */
export interface RotateEvent extends MapEvent {
  type: 'rotate' | 'rotateend' | 'rotatestart';
}

/**
 * 加载事件
 */
export interface LoadEvent extends MapEvent {
  type: 'load';
}

/**
 * 错误事件
 */
export interface ErrorEvent extends MapEvent {
  type: 'error';
  /** 错误对象 */
  error: {
    message: string;
    [key: string]: any;
  };
}

/**
 * 所有支持的事件类型
 */
export type MapLibreEvent =
  | MoveEvent
  | ZoomEvent
  | RotateEvent
  | LoadEvent
  | ErrorEvent
  | MapEvent;

/**
 * 事件监听器类型
 */
export type MapLibreEventHandler<E extends MapLibreEvent = MapLibreEvent> = (
  event: E
) => void;

/**
 * 事件类型映射
 */
export interface EventTypeMap {
  'move': MoveEvent;
  'moveend': MoveEvent;
  'movestart': MoveEvent;
  'zoom': ZoomEvent;
  'zoomend': ZoomEvent;
  'zoomstart': ZoomEvent;
  'rotate': RotateEvent;
  'rotateend': RotateEvent;
  'rotatestart': RotateEvent;
  'load': LoadEvent;
  'error': ErrorEvent;
  [key: string]: MapEvent;
}

/**
 * 获取事件类型的工具类型
 */
export type EventTypeToMapEvent<T extends string> = T extends keyof EventTypeMap
  ? EventTypeMap[T]
  : MapEvent;
