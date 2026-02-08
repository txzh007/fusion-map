/**
 * 折线覆盖物实现
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import { BaseOverlay } from './BaseOverlay';
import type { 
  PolylineOptions, 
  IPolyline, 
  LngLat,
  Bounds
} from '../types/overlays';

/**
 * 折线覆盖物
 */
export class Polyline extends BaseOverlay implements IPolyline {
  /** 路径点数组 */
  private path: LngLat[];
  
  /** 线条颜色 */
  private color: string = '#3388ff';
  
  /** 线条宽度 */
  private width: number = 2;
  
  /** 线条透明度 */
  private opacity: number = 1;
  
  /** 线条样式 */
  private lineStyle: 'solid' | 'dashed' | 'dotted' = 'solid';
  
  /** 虚线模式 */
  private dashPattern?: [number, number];
  
  /** 图层ID */
  private layerId: string = '';
  
  /** 数据源ID */
  private sourceId: string = '';

  /**
   * 构造函数
   */
  constructor(options: PolylineOptions) {
    super(options);
    
    this.path = options.path;
    this.color = options.color || '#3388ff';
    this.width = options.width || 2;
    this.opacity = options.opacity || 1;
    this.lineStyle = options.lineStyle || 'solid';
    this.dashPattern = options.dashPattern;
    
    this.layerId = `polyline_${this.id}`;
    this.sourceId = `source_${this.layerId}`;
  }

  /**
   * 添加到地图
   */
  addTo(map: MapLibreMap): void {
    if (this.destroyed) {
      throw new Error('Cannot add destroyed polyline to map');
    }
    
    this.map = map;
    
    // 创建GeoJSON数据
    const geojson = this.createGeoJSON();
    
    // 添加数据源
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
    
    map.addSource(this.sourceId, {
      type: 'geojson',
      data: geojson,
    });
    
    // 添加图层
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    
    const paint: any = {
      'line-color': this.color,
      'line-width': this.width,
      'line-opacity': this.opacity,
    };
    
    // 设置线条样式
    if (this.lineStyle === 'dashed' && this.dashPattern) {
      paint['line-dasharray'] = this.dashPattern;
    } else if (this.lineStyle === 'dotted') {
      paint['line-dasharray'] = [1, 2];
    }
    
    map.addLayer({
      id: this.layerId,
      type: 'line',
      source: this.sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint,
    });
    
    // 绑定交互事件
    this.bindInteractionEvents();
    
    // 设置可见性
    this.updateVisibility();
    
    // 设置图层顺序
    this.updateZIndex();
    
    this.emit('add');
  }

  /**
   * 从地图移除
   */
  remove(): void {
    if (!this.map) {
      return;
    }
    
    try {
      if (this.map.getLayer(this.layerId)) {
        this.map.removeLayer(this.layerId);
      }
      
      if (this.map.getSource(this.sourceId)) {
        this.map.removeSource(this.sourceId);
      }
    } catch (error) {
      // 忽略移除错误
    }
    
    this.map = null;
    
    if (!this.destroyed) {
      this.emit('remove');
    }
  }

  /**
   * 获取路径
   */
  getPath(): LngLat[] {
    return [...this.path];
  }

  /**
   * 设置路径
   */
  setPath(path: LngLat[]): void {
    if (this.destroyed) {
      throw new Error('Cannot set path on destroyed polyline');
    }
    
    this.path = [...path];
    
    if (this.map && this.map.getSource(this.sourceId)) {
      const source = this.map.getSource(this.sourceId) as any;
      if (source && source.setData) {
        source.setData(this.createGeoJSON());
      }
    }
    
    this.emit('propertychange', { changedProps: ['path'] });
  }

  /**
   * 添加点
   */
  addPoint(point: LngLat, index?: number): void {
    if (this.destroyed) {
      throw new Error('Cannot add point to destroyed polyline');
    }
    
    if (index === undefined || index >= this.path.length) {
      this.path.push(point);
    } else if (index <= 0) {
      this.path.unshift(point);
    } else {
      this.path.splice(index, 0, point);
    }
    
    this.updateGeoJSON();
  }

  /**
   * 删除点
   */
  removePoint(index: number): void {
    if (this.destroyed) {
      throw new Error('Cannot remove point from destroyed polyline');
    }
    
    if (index >= 0 && index < this.path.length) {
      this.path.splice(index, 1);
      this.updateGeoJSON();
    }
  }

  /**
   * 获取线条颜色
   */
  getColor(): string {
    return this.color;
  }

  /**
   * 设置线条颜色
   */
  setColor(color: string): void {
    if (this.destroyed) {
      throw new Error('Cannot set color on destroyed polyline');
    }
    
    this.color = color;
    
    if (this.map && this.map.getLayer(this.layerId)) {
      this.map.setPaintProperty(this.layerId, 'line-color', color);
    }
    
    this.emit('propertychange', { changedProps: ['color'] });
  }

  /**
   * 获取线条宽度
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * 设置线条宽度
   */
  setWidth(width: number): void {
    if (this.destroyed) {
      throw new Error('Cannot set width on destroyed polyline');
    }
    
    this.width = width;
    
    if (this.map && this.map.getLayer(this.layerId)) {
      this.map.setPaintProperty(this.layerId, 'line-width', width);
    }
    
    this.emit('propertychange', { changedProps: ['width'] });
  }

  /**
   * 获取线条透明度
   */
  getOpacity(): number {
    return this.opacity;
  }

  /**
   * 设置线条透明度
   */
  setOpacity(opacity: number): void {
    if (this.destroyed) {
      throw new Error('Cannot set opacity on destroyed polyline');
    }
    
    this.opacity = opacity;
    
    if (this.map && this.map.getLayer(this.layerId)) {
      this.map.setPaintProperty(this.layerId, 'line-opacity', opacity);
    }
    
    this.emit('propertychange', { changedProps: ['opacity'] });
  }

  /**
   * 计算折线长度（米）
   */
  getLength(): number {
    if (this.path.length < 2) {
      return 0;
    }
    
    let length = 0;
    for (let i = 0; i < this.path.length - 1; i++) {
      const [lng1, lat1] = this.path[i];
      const [lng2, lat2] = this.path[i + 1];
      
      // 使用Haversine公式计算距离
      const R = 6371000; // 地球半径（米）
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lng2 - lng1) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      length += R * c;
    }
    
    return length;
  }

  /**
   * 绑定交互事件
   */
  private bindInteractionEvents(): void {
    if (!this.map || !this.isInteractive()) {
      return;
    }
    
    const map = this.map;
    const layerId = this.layerId;
    
    // 鼠标进入
    map.on('mouseenter', layerId, (event) => {
      map.getCanvas().style.cursor = 'pointer';
      this.emit('mouseenter', {
        originalEvent: event,
        lnglat: [event.lngLat.lng, event.lngLat.lat],
        screenPoint: [event.point.x, event.point.y],
      });
    });
    
    // 鼠标离开
    map.on('mouseleave', layerId, (event) => {
      map.getCanvas().style.cursor = '';
      this.emit('mouseleave', {
        originalEvent: event,
        lnglat: [event.lngLat.lng, event.lngLat.lat],
        screenPoint: [event.point.x, event.point.y],
      });
    });
    
    // 点击事件
    map.on('click', layerId, (event) => {
      this.emit('click', {
        originalEvent: event,
        lnglat: [event.lngLat.lng, event.lngLat.lat],
        screenPoint: [event.point.x, event.point.y],
      });
    });
  }

  /**
   * 更新可见性
   */
  protected updateVisibility(): void {
    if (!this.map || !this.map.getLayer(this.layerId)) {
      return;
    }
    
    const visibility = this.isVisible() ? 'visible' : 'none';
    this.map.setLayoutProperty(this.layerId, 'visibility', visibility);
  }

  /**
   * 选项变化处理
   */
  protected onOptionsChanged(changedProps: string[]): void {
    if (!this.map || !this.map.getLayer(this.layerId)) {
      return;
    }
    
    changedProps.forEach(prop => {
      switch (prop) {
        case 'visible':
          this.updateVisibility();
          break;
          
        case 'zIndex':
          this.updateZIndex();
          break;
          
        case 'color':
          this.map.setPaintProperty(this.layerId, 'line-color', this.color);
          break;
          
        case 'width':
          this.map.setPaintProperty(this.layerId, 'line-width', this.width);
          break;
          
        case 'opacity':
          this.map.setPaintProperty(this.layerId, 'line-opacity', this.opacity);
          break;
          
        case 'lineStyle':
        case 'dashPattern':
          this.updateLineStyle();
          break;
      }
    });
  }

  /**
   * 更新线条样式
   */
  private updateLineStyle(): void {
    if (!this.map || !this.map.getLayer(this.layerId)) {
      return;
    }
    
    if (this.lineStyle === 'dashed' && this.dashPattern) {
      this.map.setPaintProperty(this.layerId, 'line-dasharray', this.dashPattern);
    } else if (this.lineStyle === 'dotted') {
      this.map.setPaintProperty(this.layerId, 'line-dasharray', [1, 2]);
    } else {
      this.map.setPaintProperty(this.layerId, 'line-dasharray', null);
    }
  }

  /**
   * 更新Z-Index
   */
  protected updateZIndex(): void {
    // MapLibre图层顺序由添加顺序决定，这里暂时不实现
  }

  /**
   * 创建GeoJSON
   */
  private createGeoJSON(): any {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: this.path,
      },
      properties: {
        id: this.id,
        ...this.options.properties,
        color: this.color,
        width: this.width,
        opacity: this.opacity,
        lineStyle: this.lineStyle,
      },
    };
  }

  /**
   * 更新GeoJSON数据
   */
  private updateGeoJSON(): void {
    if (!this.map || !this.map.getSource(this.sourceId)) {
      return;
    }
    
    const source = this.map.getSource(this.sourceId) as any;
    if (source && source.setData) {
      source.setData(this.createGeoJSON());
    }
  }

  /**
   * 计算边界框
   */
  protected calculateBounds(): Bounds {
    if (this.path.length === 0) {
      return {
        sw: [0, 0] as LngLat,
        ne: [0, 0] as LngLat,
      };
    }
    
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    for (const [lng, lat] of this.path) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    
    return {
      sw: [minLng, minLat] as LngLat,
      ne: [maxLng, maxLat] as LngLat,
    };
  }

  /**
   * 转换为GeoJSON
   */
  toGeoJSON(): any {
    return this.createGeoJSON();
  }

  /**
   * 获取覆盖物类型
   */
  getType(): string {
    return 'polyline';
  }

  /**
   * 克隆折线
   */
  clone(): Polyline {
    const options = {
      ...this.options,
      path: [...this.path],
      id: undefined,
    };
    
    return new Polyline(options as PolylineOptions);
  }

  /**
   * 绑定点击事件
   */
  onClick(listener: (event: any) => void): void {
    this.on('click', listener);
  }

  onMouseEnter(listener: (event: any) => void): void {
    this.on('mouseenter', listener);
  }

  onMouseLeave(listener: (event: any) => void): void {
    this.on('mouseleave', listener);
  }

  /**
   * 静态方法：从GeoJSON创建
   */
  static fromGeoJSON(geojson: any, options?: PolylineOptions): Polyline {
    if (geojson.geometry.type !== 'LineString') {
      throw new Error('GeoJSON must be a LineString feature');
    }
    
    const path = geojson.geometry.coordinates as LngLat[];
    const properties = geojson.properties || {};
    
    const polylineOptions: PolylineOptions = {
      path,
      ...options,
      properties: {
        ...properties,
        ...options?.properties,
      },
      id: properties.id || options?.id,
      color: properties.color || options?.color,
      width: properties.width || options?.width,
      opacity: properties.opacity || options?.opacity,
      lineStyle: properties.lineStyle || options?.lineStyle,
      dashPattern: properties.dashPattern || options?.dashPattern,
    };
    
    return new Polyline(polylineOptions);
  }
}