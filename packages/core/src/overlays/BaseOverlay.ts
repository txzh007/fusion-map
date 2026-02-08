/**
 * 覆盖物基类实现
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { 
  IOverlay, 
  OverlayOptions, 
  OverlayEventType, 
  OverlayEventData,
  LngLat,
  Bounds
} from '../types/overlays';

/**
 * 覆盖物基类
 */
export abstract class BaseOverlay implements IOverlay {
  /** 覆盖物ID */
  protected id: string;
  
  /** 覆盖物选项 */
  protected options: OverlayOptions;
  
  /** MapLibre 地图实例 */
  protected map: MapLibreMap | null = null;
  
  /** 事件监听器映射 */
  protected eventListeners: Map<string, Set<(event: any) => void>> = new Map();
  
  /** 是否已销毁 */
  protected destroyed: boolean = false;

  /**
   * 构造函数
   * @param options 覆盖物选项
   */
  constructor(options: OverlayOptions) {
    this.id = options.id || this.generateId();
    this.options = {
      visible: true,
      interactive: true,
      zIndex: 0,
      properties: {},
      ...options,
    };
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取覆盖物ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * 设置覆盖物ID
   */
  setId(id: string): void {
    if (this.destroyed) {
      throw new Error('Cannot set ID on destroyed overlay');
    }
    this.id = id;
  }

  /**
   * 添加到地图
   */
  abstract addTo(map: MapLibreMap): void;

  /**
   * 从地图移除
   */
  abstract remove(): void;

  /**
   * 是否可见
   */
  isVisible(): boolean {
    return !!this.options.visible;
  }

  /**
   * 设置可见性
   */
  setVisible(visible: boolean): void {
    if (this.destroyed) {
      throw new Error('Cannot set visibility on destroyed overlay');
    }
    this.options.visible = visible;
    this.updateVisibility();
    this.emit('visibilitychange', { visible });
  }

  /**
   * 更新可见性（由子类实现）
   */
  protected abstract updateVisibility(): void;

  /**
   * 获取选项
   */
  getOptions(): OverlayOptions {
    return { ...this.options };
  }

  /**
   * 设置选项
   */
  setOptions(options: Partial<OverlayOptions>): void {
    if (this.destroyed) {
      throw new Error('Cannot set options on destroyed overlay');
    }
    
    const oldOptions = { ...this.options };
    this.options = { ...this.options, ...options };
    
    // 检查选项变化
    const changedProps: string[] = [];
    Object.keys(options).forEach(key => {
      if (oldOptions[key as keyof OverlayOptions] !== this.options[key as keyof OverlayOptions]) {
        changedProps.push(key);
      }
    });
    
    if (changedProps.length > 0) {
      this.onOptionsChanged(changedProps);
      this.emit('propertychange', { changedProps });
    }
  }

  /**
   * 选项变化处理（由子类实现）
   */
  protected abstract onOptionsChanged(changedProps: string[]): void;

  /**
   * 销毁覆盖物
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    
    this.remove();
    this.eventListeners.clear();
    this.map = null;
    this.destroyed = true;
  }

  /**
   * 绑定事件监听器
   */
  on(type: string, listener: (event: any) => void): void {
    if (this.destroyed) {
      throw new Error('Cannot add listener to destroyed overlay');
    }
    
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  /**
   * 解绑事件监听器
   */
  off(type: string, listener: (event: any) => void): void {
    if (this.destroyed) {
      return;
    }
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(type: string, data?: any): void {
    if (this.destroyed) {
      return;
    }
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: OverlayEventData = {
        type: type as OverlayEventType,
        overlay: this,
        originalEvent: data?.originalEvent,
        lnglat: data?.lnglat,
        screenPoint: data?.screenPoint,
        timestamp: Date.now(),
      };
      
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in overlay event listener for type "${type}":`, error);
        }
      });
    }
  }

  /**
   * 获取地图实例
   */
  protected getMap(): MapLibreMap {
    if (!this.map) {
      throw new Error('Overlay is not attached to a map');
    }
    return this.map;
  }

  /**
   * 检查是否已添加到地图
   */
  protected isAttached(): boolean {
    return this.map !== null;
  }

  /**
   * 检查是否可交互
   */
  protected isInteractive(): boolean {
    return !!this.options.interactive;
  }

  /**
   * 计算边界框（由子类实现）
   */
  protected abstract calculateBounds(): Bounds;

  /**
   * 获取边界框
   */
  getBounds(): Bounds {
    if (this.destroyed) {
      throw new Error('Cannot get bounds from destroyed overlay');
    }
    return this.calculateBounds();
  }

  /**
   * 获取Z-Index
   */
  protected getZIndex(): number {
    return this.options.zIndex || 0;
  }

  /**
   * 设置Z-Index
   */
  protected setZIndex(zIndex: number): void {
    if (this.destroyed) {
      throw new Error('Cannot set z-index on destroyed overlay');
    }
    this.options.zIndex = zIndex;
    this.updateZIndex();
  }

  /**
   * 更新Z-Index（由子类实现）
   */
  protected abstract updateZIndex(): void;

  /**
   * 获取自定义属性
   */
  getProperty(key: string): any {
    return this.options.properties?.[key];
  }

  /**
   * 设置自定义属性
   */
  setProperty(key: string, value: any): void {
    if (this.destroyed) {
      throw new Error('Cannot set property on destroyed overlay');
    }
    
    if (!this.options.properties) {
      this.options.properties = {};
    }
    this.options.properties[key] = value;
    this.emit('propertychange', { changedProps: [`properties.${key}`] });
  }

  /**
   * 删除自定义属性
   */
  removeProperty(key: string): void {
    if (this.destroyed) {
      throw new Error('Cannot remove property from destroyed overlay');
    }
    
    if (this.options.properties && key in this.options.properties) {
      delete this.options.properties[key];
      this.emit('propertychange', { changedProps: [`properties.${key}`] });
    }
  }

  /**
   * 检查是否在指定边界框内
   */
  isInBounds(bounds: Bounds): boolean {
    if (this.destroyed) {
      return false;
    }
    
    const overlayBounds = this.getBounds();
    
    // 检查边界框是否相交
    return !(
      overlayBounds.ne[0] < bounds.sw[0] ||
      overlayBounds.sw[0] > bounds.ne[0] ||
      overlayBounds.ne[1] < bounds.sw[1] ||
      overlayBounds.sw[1] > bounds.ne[1]
    );
  }

  /**
   * 转换为GeoJSON
   */
  abstract toGeoJSON(): any;

  /**
   * 从GeoJSON创建（静态方法）
   */
  static fromGeoJSON?(geojson: any, options?: OverlayOptions): BaseOverlay;

  /**
   * 获取覆盖物类型
   */
  abstract getType(): string;

  /**
   * 序列化为JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      type: this.getType(),
      options: this.options,
      bounds: this.getBounds(),
      geoJSON: this.toGeoJSON(),
    };
  }

  /**
   * 克隆覆盖物
   */
  abstract clone(): BaseOverlay;

  /**
   * 检查是否相等
   */
  equals(other: BaseOverlay): boolean {
    if (this.destroyed || other.destroyed) {
      return false;
    }
    
    if (this.id !== other.id) {
      return false;
    }
    
    // 比较类型和选项
    if (this.getType() !== other.getType()) {
      return false;
    }
    
    // 比较序列化后的数据
    return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
  }
}