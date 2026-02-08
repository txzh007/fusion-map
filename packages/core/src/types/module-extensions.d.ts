/**
 * Fusion Map 模块扩展声明
 */

import type { IMarker, IPolyline, IOverlayManager, MarkerOptions, PolylineOptions } from './overlays';
import type { FusionMapOverlays } from '../overlays/FusionMapExtensions';

declare module '../FusionMap' {
  interface FusionMap {
    /** 覆盖物管理器 */
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