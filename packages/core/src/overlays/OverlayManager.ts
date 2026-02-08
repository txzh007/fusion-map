/**
 * 覆盖物管理器实现
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import type {
  IOverlay,
  IOverlayManager,
  OverlayManagerOptions,
  Bounds
} from '../types/overlays';

/**
 * 覆盖物管理器
 */
export class OverlayManager implements IOverlayManager {
  /** 覆盖物映射表 */
  private overlays: Map<string, IOverlay> = new Map();
  
  /** 覆盖物类型映射表 */
  private overlaysByType: Map<string, Set<string>> = new Map();
  
  /** 地图实例 */
  private map: MapLibreMap | null = null;
  
  /** 管理器选项 */
  private options: OverlayManagerOptions;
  
  /** 事件监听器 */
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();
  
  /**
   * 构造函数
   */
  constructor(options?: OverlayManagerOptions) {
    this.options = {
      clustering: false,
      clusterRadius: 50,
      clusterMaxZoom: 14,
      cacheEnabled: true,
      cacheSize: 1000,
      ...options,
    };
  }

  /**
   * 绑定地图实例
   */
  bindMap(map: MapLibreMap): void {
    this.map = map;
    
    // 将所有覆盖物添加到地图
    this.overlays.forEach(overlay => {
      if (typeof overlay.addTo === 'function') {
        overlay.addTo(map);
      }
    });
  }

  /**
   * 解绑地图实例
   */
  unbindMap(): void {
    this.map = null;
  }

  /**
   * 添加覆盖物
   */
  add(overlay: IOverlay): void {
    const id = overlay.getId();
    
    if (this.overlays.has(id)) {
      throw new Error(`Overlay with id "${id}" already exists`);
    }
    
    // 添加到映射表
    this.overlays.set(id, overlay);
    
    // 添加到类型映射表
    const type = overlay.getType();
    if (!this.overlaysByType.has(type)) {
      this.overlaysByType.set(type, new Set());
    }
    this.overlaysByType.get(type)!.add(id);
    
    // 如果地图已绑定，则添加到地图
    if (this.map && typeof overlay.addTo === 'function') {
      overlay.addTo(this.map);
    }
    
    // 绑定覆盖物事件
    overlay.on('remove', () => {
      this.remove(overlay);
    });
    
    this.emit('add', { overlay });
  }

  /**
   * 移除覆盖物
   */
  remove(overlay: IOverlay): boolean {
    const id = overlay.getId();
    
    if (!this.overlays.has(id)) {
      return false;
    }
    
    // 从映射表移除
    this.overlays.delete(id);
    
    // 从类型映射表移除
    const type = overlay.getType();
    const typeSet = this.overlaysByType.get(type);
    if (typeSet) {
      typeSet.delete(id);
      if (typeSet.size === 0) {
        this.overlaysByType.delete(type);
      }
    }
    
    // 从地图移除
    if (typeof overlay.remove === 'function') {
      overlay.remove();
    }
    
    this.emit('remove', { overlay });
    return true;
  }

  /**
   * 根据ID移除覆盖物
   */
  removeById(id: string): boolean {
    const overlay = this.overlays.get(id);
    if (overlay) {
      return this.remove(overlay);
    }
    return false;
  }

  /**
   * 移除所有覆盖物
   */
  clear(): void {
    const overlayList = Array.from(this.overlays.values());
    
    // 从地图移除所有覆盖物
    overlayList.forEach(overlay => {
      if (typeof overlay.remove === 'function') {
        overlay.remove();
      }
    });
    
    // 清空映射表
    this.overlays.clear();
    this.overlaysByType.clear();
    
    this.emit('clear', { count: overlayList.length });
  }

  /**
   * 获取覆盖物数量
   */
  getCount(): number {
    return this.overlays.size;
  }

  /**
   * 根据ID获取覆盖物
   */
  getById(id: string): IOverlay | undefined {
    return this.overlays.get(id);
  }

  /**
   * 根据类型获取覆盖物列表
   */
  getByType(type: string): IOverlay[] {
    const ids = this.overlaysByType.get(type);
    if (!ids) {
      return [];
    }
    
    return Array.from(ids)
      .map(id => this.overlays.get(id))
      .filter((overlay): overlay is IOverlay => overlay !== undefined);
  }

  /**
   * 获取所有覆盖物
   */
  getAll(): IOverlay[] {
    return Array.from(this.overlays.values());
  }

  /**
   * 显示所有覆盖物
   */
  showAll(): void {
    this.overlays.forEach(overlay => {
      if (typeof overlay.setVisible === 'function') {
        overlay.setVisible(true);
      }
    });
    
    this.emit('showAll');
  }

  /**
   * 隐藏所有覆盖物
   */
  hideAll(): void {
    this.overlays.forEach(overlay => {
      if (typeof overlay.setVisible === 'function') {
        overlay.setVisible(false);
      }
    });
    
    this.emit('hideAll');
  }

  /**
   * 根据边界框获取覆盖物
   */
  getInBounds(bounds: Bounds): IOverlay[] {
    const result: IOverlay[] = [];
    
    this.overlays.forEach(overlay => {
      if (typeof overlay.isInBounds === 'function' && 
          overlay.isInBounds(bounds)) {
        result.push(overlay);
      }
    });
    
    return result;
  }

  /**
   * 遍历所有覆盖物
   */
  forEach(callback: (overlay: IOverlay) => void): void {
    this.overlays.forEach(callback);
  }

  /**
   * 过滤覆盖物
   */
  filter(predicate: (overlay: IOverlay) => boolean): IOverlay[] {
    const result: IOverlay[] = [];
    
    this.overlays.forEach(overlay => {
      if (predicate(overlay)) {
        result.push(overlay);
      }
    });
    
    return result;
  }

  /**
   * 查找覆盖物
   */
  find(predicate: (overlay: IOverlay) => boolean): IOverlay | undefined {
    for (const overlay of this.overlays.values()) {
      if (predicate(overlay)) {
        return overlay;
      }
    }
    return undefined;
  }

  /**
   * 批量添加覆盖物
   */
  addAll(overlays: IOverlay[]): void {
    overlays.forEach(overlay => {
      try {
        this.add(overlay);
      } catch (error) {
        console.warn('Failed to add overlay:', error);
      }
    });
  }

  /**
   * 批量移除覆盖物
   */
  removeAll(overlays: IOverlay[]): void {
    overlays.forEach(overlay => {
      this.remove(overlay);
    });
  }

  /**
   * 序列化为JSON
   */
  toJSON(): any {
    return {
      count: this.getCount(),
      overlays: Array.from(this.overlays.values()).map(overlay => {
        if (typeof overlay.toJSON === 'function') {
          return overlay.toJSON();
        }
        return {
          id: overlay.getId(),
          type: overlay.getType(),
        };
      }),
      options: this.options,
    };
  }

  /**
   * 绑定管理器事件
   */
  on(event: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 解绑管理器事件
   */
  off(event: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const eventData = {
        type: event,
        manager: this,
        ...data,
        timestamp: Date.now(),
      };
      
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          console.error(`Error in manager event listener for type "${event}":`, error);
        }
      });
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.clear();
    this.eventListeners.clear();
    this.unbindMap();
  }

  /**
   * 获取管理器选项
   */
  getOptions(): OverlayManagerOptions {
    return { ...this.options };
  }

  /**
   * 设置管理器选项
   */
  setOptions(options: Partial<OverlayManagerOptions>): void {
    this.options = { ...this.options, ...options };
    this.emit('optionsChanged', { options: this.options });
  }

  /**
   * 检查是否启用集群
   */
  isClusteringEnabled(): boolean {
    return !!this.options.clustering;
  }

  /**
   * 启用/禁用集群
   */
  setClustering(enabled: boolean): void {
    this.options.clustering = enabled;
    this.emit('clusteringChanged', { enabled });
  }

  /**
   * 统计各类型覆盖物数量
   */
  getTypeStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.overlaysByType.forEach((ids, type) => {
      stats[type] = ids.size;
    });
    
    return stats;
  }

  /**
   * 获取可见覆盖物数量
   */
  getVisibleCount(): number {
    let count = 0;
    
    this.overlays.forEach(overlay => {
      if (typeof overlay.isVisible === 'function' && overlay.isVisible()) {
        count++;
      }
    });
    
    return count;
  }

  /**
   * 获取隐藏覆盖物数量
   */
  getHiddenCount(): number {
    return this.getCount() - this.getVisibleCount();
  }

  /**
   * 导出为GeoJSON
   */
  toGeoJSON(): any {
    const features = Array.from(this.overlays.values())
      .filter(overlay => typeof overlay.toGeoJSON === 'function')
      .map(overlay => overlay.toGeoJSON());
    
    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * 从GeoJSON导入覆盖物
   */
  fromGeoJSON(geojson: any, factory?: any): void {
    if (geojson.type !== 'FeatureCollection') {
      throw new Error('GeoJSON must be a FeatureCollection');
    }
    
    if (!factory) {
      throw new Error('Overlay factory is required to create overlays from GeoJSON');
    }
    
    geojson.features.forEach((feature: any) => {
      try {
        let overlay: IOverlay | undefined;
        
        switch (feature.geometry.type) {
          case 'Point':
            if (factory.createMarker) {
              overlay = factory.createMarker(feature);
            }
            break;
          case 'LineString':
            if (factory.createPolyline) {
              overlay = factory.createPolyline(feature);
            }
            break;
          // 其他几何类型...
        }
        
        if (overlay) {
          this.add(overlay);
        }
      } catch (error) {
        console.warn('Failed to create overlay from GeoJSON feature:', error);
      }
    });
  }
}