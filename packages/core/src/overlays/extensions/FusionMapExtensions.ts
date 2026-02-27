/**
 * Fusion Map 覆盖物扩展
 */

import { FusionMap } from '../../FusionMap';
import { OverlayManager } from '../manager/OverlayManager';
import { PointsModule } from '../modules/PointsModule';
import { LinesModule } from '../modules/LinesModule';
import { PolygonsModule } from '../modules/PolygonsModule';
import { overlayFactory, createMarker, createPolyline, createPolygon } from '../manager/OverlayFactory';
import type {
  MarkerOptions,
  PolylineOptions,
  PolygonOptions,
  IMarker,
  IPolyline,
  IPolygon,
  IOverlayManager,
  OverlayManagerOptions,
  IPointsModule,
  ILinesModule,
  IPolygonsModule
} from '../../types/overlays';

/**
 * Fusion Map 覆盖物扩展
 */
export class FusionMapOverlays {
  /** Fusion Map 实例 */
  private fusionMap: FusionMap;
  
  /** 默认覆盖物管理器 */
  private overlayManager: IOverlayManager;

  /** 点覆盖物模块 */
  private pointsModule?: PointsModule;
  /** 线覆盖物模块 */
  private linesModule?: LinesModule;
  /** 面覆盖物模块 */
  private polygonsModule?: PolygonsModule;
  
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

  points(): PointsModule {
    if (!this.pointsModule) {
      this.pointsModule = new PointsModule(this.overlayManager);
    }
    return this.pointsModule;
  }

  lines(): LinesModule {
    if (!this.linesModule) {
      this.linesModule = new LinesModule(this.overlayManager);
    }
    return this.linesModule;
  }

  polygons(): PolygonsModule {
    if (!this.polygonsModule) {
      this.polygonsModule = new PolygonsModule(this.overlayManager);
    }
    return this.polygonsModule;
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
   * 创建多边形
   */
  createPolygon(options: PolygonOptions): IPolygon {
    const polygon = createPolygon(options);
    this.overlayManager.add(polygon);
    return polygon;
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
declare module '../../FusionMap' {
  interface FusionMap {
    /** 覆盖物扩展 */
    overlays?: FusionMapOverlays;
    
    /**
     * 获取覆盖物扩展
     */
    getOverlays(): FusionMapOverlays;

    /**
     * 点覆盖物模块
     */
    points?(): IPointsModule;
    lines?(): ILinesModule;
    polygons?(): IPolygonsModule;
    
    /**
     * 创建标记
     */
    createMarker?(options: MarkerOptions): IMarker;
    
    /**
     * 创建折线
     */
    createPolyline?(options: PolylineOptions): IPolyline;

    /**
     * 创建多边形
     */
    createPolygon?(options: PolygonOptions): IPolygon;
    
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

  const attachModules = (overlays: any) => {
    if (!overlays || typeof overlays.getManager !== 'function') {
      return;
    }

    if (!overlays.points) {
      overlays.points = function(this: any): PointsModule {
        if (!this.__pointsModule) {
          this.__pointsModule = new PointsModule(this.getManager());
        }
        return this.__pointsModule;
      };
    }

    if (!overlays.lines) {
      overlays.lines = function(this: any): LinesModule {
        if (!this.__linesModule) {
          this.__linesModule = new LinesModule(this.getManager());
        }
        return this.__linesModule;
      };
    }

    if (!overlays.polygons) {
      overlays.polygons = function(this: any): PolygonsModule {
        if (!this.__polygonsModule) {
          this.__polygonsModule = new PolygonsModule(this.getManager());
        }
        return this.__polygonsModule;
      };
    }
  };
  
  if (!prototype.getOverlays) {
    prototype.getOverlays = function(this: FusionMap): FusionMapOverlays {
      if (!this.overlays) {
        this.overlays = new FusionMapOverlays(this);
      }
      attachModules(this.overlays);
      return this.overlays;
    };
  }
  
  if (!prototype.createMarker) {
    prototype.createMarker = function(this: FusionMap, options: MarkerOptions): IMarker {
      return this.getOverlays().createMarker(options);
    };
  }

  if (!prototype.points) {
    prototype.points = function(this: FusionMap): IPointsModule {
      const overlays = this.getOverlays();
      attachModules(overlays);
      return overlays.points();
    };
  }

  if (!prototype.lines) {
    prototype.lines = function(this: FusionMap): ILinesModule {
      const overlays = this.getOverlays();
      attachModules(overlays);
      return overlays.lines();
    };
  }

  if (!prototype.polygons) {
    prototype.polygons = function(this: FusionMap): IPolygonsModule {
      const overlays = this.getOverlays();
      attachModules(overlays);
      return overlays.polygons();
    };
  }
  
  if (!prototype.createPolyline) {
    prototype.createPolyline = function(this: FusionMap, options: PolylineOptions): IPolyline {
      return this.getOverlays().createPolyline(options);
    };
  }

  if (!prototype.createPolygon) {
    prototype.createPolygon = function(this: FusionMap, options: PolygonOptions): IPolygon {
      return this.getOverlays().createPolygon(options);
    };
  }
  
  if (!prototype.clearOverlays) {
    prototype.clearOverlays = function(this: FusionMap): void {
      this.getOverlays().clearOverlays();
    };
  }
}
