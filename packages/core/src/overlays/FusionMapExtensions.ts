/**
 * Fusion Map 覆盖物扩展
 */

import { FusionMap } from '../FusionMap';
import { OverlayManager } from './OverlayManager';
import { overlayFactory, createMarker, createPolyline } from './OverlayFactory';
import type {
  MarkerOptions,
  PolylineOptions,
  IMarker,
  IPolyline,
  IOverlayManager,
  OverlayManagerOptions
} from '../types/overlays';

/**
 * Fusion Map 覆盖物扩展
 */
export class FusionMapOverlays {
  /** Fusion Map 实例 */
  private fusionMap: FusionMap;
  
  /** 默认覆盖物管理器 */
  private overlayManager: IOverlayManager;
  
  /**
   * 构造函数
   */
  constructor(fusionMap: FusionMap, options?: OverlayManagerOptions) {
    this.fusionMap = fusionMap;
    this.overlayManager = new OverlayManager(options);
    
    // 绑定到地图
    const map = fusionMap.getMapInstance();
    if (this.overlayManager.bindMap) {
      this.overlayManager.bindMap(map);
    }
  }

  /**
   * 获取覆盖物管理器
   */
  getManager(): IOverlayManager {
    return this.overlayManager;
  }

  /**
   * 创建标记
   */
  createMarker(options: MarkerOptions): IMarker {
    const marker = createMarker(options);
    this.overlayManager.add(marker);
    return marker;
  }

  /**
   * 创建折线
   */
  createPolyline(options: PolylineOptions): IPolyline {
    const polyline = createPolyline(options);
    this.overlayManager.add(polyline);
    return polyline;
  }

  /**
   * 添加覆盖物
   */
  addOverlay(overlay: any): void {
    this.overlayManager.add(overlay);
  }

  /**
   * 移除覆盖物
   */
  removeOverlay(overlay: any): boolean {
    return this.overlayManager.remove(overlay);
  }

  /**
   * 根据ID移除覆盖物
   */
  removeOverlayById(id: string): boolean {
    return this.overlayManager.removeById ? this.overlayManager.removeById(id) : false;
  }

  /**
   * 清空所有覆盖物
   */
  clearOverlays(): void {
    this.overlayManager.clear();
  }

  /**
   * 获取覆盖物数量
   */
  getOverlayCount(): number {
    return this.overlayManager.getCount();
  }

  /**
   * 根据ID获取覆盖物
   */
  getOverlayById(id: string): any {
    return this.overlayManager.getById(id);
  }

  /**
   * 根据类型获取覆盖物列表
   */
  getOverlaysByType(type: string): any[] {
    return this.overlayManager.getByType(type);
  }

  /**
   * 获取所有覆盖物
   */
  getAllOverlays(): any[] {
    return this.overlayManager.getAll();
  }

  /**
   * 显示所有覆盖物
   */
  showAllOverlays(): void {
    this.overlayManager.showAll();
  }

  /**
   * 隐藏所有覆盖物
   */
  hideAllOverlays(): void {
    this.overlayManager.hideAll();
  }

  /**
   * 导出覆盖物为GeoJSON
   */
  exportToGeoJSON(): any {
    return this.overlayManager.toGeoJSON ? this.overlayManager.toGeoJSON() : null;
  }

  /**
   * 销毁覆盖物扩展
   */
  destroy(): void {
    if (this.overlayManager.destroy) {
      this.overlayManager.destroy();
    }
  }
}

/**
 * 扩展FusionMap类以支持覆盖物API
 */
declare module '../FusionMap' {
  interface FusionMap {
    /** 覆盖物扩展 */
    overlays?: FusionMapOverlays;
    
    /**
     * 获取覆盖物扩展
     */
    getOverlays(): FusionMapOverlays;
    
    /**
     * 创建标记
     */
    createMarker?(options: MarkerOptions): IMarker;
    
    /**
     * 创建折线
     */
    createPolyline?(options: PolylineOptions): IPolyline;
    
    /**
     * 清空所有覆盖物
     */
    clearOverlays?(): void;
  }
}

/**
 * 为FusionMap添加覆盖物支持
 */
export function extendFusionMapWithOverlays(): void {
  const prototype = FusionMap.prototype as any;
  
  if (!prototype.getOverlays) {
    prototype.getOverlays = function(this: FusionMap): FusionMapOverlays {
      if (!this.overlays) {
        this.overlays = new FusionMapOverlays(this);
      }
      return this.overlays;
    };
  }
  
  if (!prototype.createMarker) {
    prototype.createMarker = function(this: FusionMap, options: MarkerOptions): IMarker {
      return this.getOverlays().createMarker(options);
    };
  }
  
  if (!prototype.createPolyline) {
    prototype.createPolyline = function(this: FusionMap, options: PolylineOptions): IPolyline {
      return this.getOverlays().createPolyline(options);
    };
  }
  
  if (!prototype.clearOverlays) {
    prototype.clearOverlays = function(this: FusionMap): void {
      this.getOverlays().clearOverlays();
    };
  }
}