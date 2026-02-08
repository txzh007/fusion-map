/**
 * 覆盖物工厂实现
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import type {
  MarkerOptions,
  PolylineOptions,
  PolygonOptions,
  CircleOptions,
  RectangleOptions,
  InfoWindowOptions,
  GeoJSONOptions,
  SVGOverlayOptions,
  OverlayManagerOptions,
  IMarker,
  IPolyline,
  IPolygon,
  ICircle,
  IRectangle,
  IInfoWindow,
  IGeoJSON,
  ISVGOverlay,
  IOverlayManager,
  IOverlayFactory
} from '../types/overlays';
import { Marker } from './Marker';
import { Polyline } from './Polyline';
import { OverlayManager } from './OverlayManager';

/**
 * 覆盖物工厂
 */
export class OverlayFactory implements IOverlayFactory {
  /** 默认覆盖物管理器 */
  private defaultManager: IOverlayManager | null = null;
  
  /**
   * 创建标记
   */
  createMarker(options: MarkerOptions): IMarker {
    return new Marker(options);
  }
  
  /**
   * 创建折线
   */
  createPolyline(options: PolylineOptions): IPolyline {
    return new Polyline(options);
  }
  
  /**
   * 创建多边形
   */
  createPolygon(options: PolygonOptions): IPolygon {
    // TODO: 实现Polygon类
    throw new Error('Polygon not implemented yet');
  }
  
  /**
   * 创建圆形
   */
  createCircle(options: CircleOptions): ICircle {
    // TODO: 实现Circle类
    throw new Error('Circle not implemented yet');
  }
  
  /**
   * 创建矩形
   */
  createRectangle(options: RectangleOptions): IRectangle {
    // TODO: 实现Rectangle类
    throw new Error('Rectangle not implemented yet');
  }
  
  /**
   * 创建信息窗口
   */
  createInfoWindow(options: InfoWindowOptions): IInfoWindow {
    // TODO: 实现InfoWindow类
    throw new Error('InfoWindow not implemented yet');
  }
  
  /**
   * 创建自定义GeoJSON覆盖物
   */
  createGeoJSON(options: GeoJSONOptions): IGeoJSON {
    // TODO: 实现GeoJSON类
    throw new Error('GeoJSON not implemented yet');
  }
  
  /**
   * 创建自定义SVG覆盖物
   */
  createSVGOverlay(options: SVGOverlayOptions): ISVGOverlay {
    // TODO: 实现SVGOverlay类
    throw new Error('SVGOverlay not implemented yet');
  }
  
  /**
   * 创建覆盖物管理器
   */
  createManager(options?: OverlayManagerOptions): IOverlayManager {
    return new OverlayManager(options);
  }
  
  /**
   * 获取覆盖物管理器
   */
  getManager(): IOverlayManager | undefined {
    if (!this.defaultManager) {
      this.defaultManager = this.createManager();
    }
    return this.defaultManager;
  }
  
  /**
   * 设置默认覆盖物管理器
   */
  setManager(manager: IOverlayManager): void {
    this.defaultManager = manager;
  }
}

/**
 * 默认覆盖物工厂实例
 */
export const overlayFactory = new OverlayFactory();

/**
 * 创建标记的快捷函数
 */
export function createMarker(options: MarkerOptions): IMarker {
  return overlayFactory.createMarker(options);
}

/**
 * 创建折线的快捷函数
 */
export function createPolyline(options: PolylineOptions): IPolyline {
  return overlayFactory.createPolyline(options);
}