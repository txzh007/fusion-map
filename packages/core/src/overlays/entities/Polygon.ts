/**
 * 多边形覆盖物实现
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import { BaseOverlay } from './BaseOverlay';
import type {
  PolygonOptions,
  IPolygon,
  LngLat,
  Bounds
} from '../../types/overlays';

/**
 * 多边形覆盖物
 */
export class Polygon extends BaseOverlay implements IPolygon {
  /** 顶点路径 */
  private path: LngLat[];

  /** 填充颜色 */
  private fillColor: string = '#3388ff';

  /** 填充透明度 */
  private fillOpacity: number = 0.4;

  /** 边框颜色 */
  private strokeColor: string = '#3388ff';

  /** 边框宽度 */
  private strokeWidth: number = 2;

  /** 边框透明度 */
  private strokeOpacity: number = 1;

  /** 边框样式 */
  private strokeStyle: 'solid' | 'dashed' | 'dotted' = 'solid';

  /** 描边虚线模式 */
  private strokeDashPattern?: [number, number];

  /** 填充图层ID */
  private fillLayerId: string = '';

  /** 描边图层ID */
  private strokeLayerId: string = '';

  /** 数据源ID */
  private sourceId: string = '';

  /**
   * 构造函数
   */
  constructor(options: PolygonOptions) {
    super(options);

    this.path = options.path;
    this.fillColor = options.fillColor || '#3388ff';
    this.fillOpacity = options.fillOpacity ?? 0.4;
    this.strokeColor = options.strokeColor || '#3388ff';
    this.strokeWidth = options.strokeWidth ?? 2;
    this.strokeOpacity = options.strokeOpacity ?? 1;
    this.strokeStyle = options.strokeStyle || 'solid';
    this.strokeDashPattern = options.strokeDashPattern;

    this.fillLayerId = `polygon_fill_${this.id}`;
    this.strokeLayerId = `polygon_stroke_${this.id}`;
    this.sourceId = `source_polygon_${this.id}`;
  }

  /**
   * 添加到地图
   */
  addTo(map: MapLibreMap): void {
    if (this.destroyed) {
      throw new Error('Cannot add destroyed polygon to map');
    }

    this.map = map;

    const geojson = this.createGeoJSON();

    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }

    map.addSource(this.sourceId, {
      type: 'geojson',
      data: geojson,
    });

    if (map.getLayer(this.fillLayerId)) {
      map.removeLayer(this.fillLayerId);
    }

    const zoomOptions = this.options as PolygonOptions;

    map.addLayer({
      id: this.fillLayerId,
      type: 'fill',
      source: this.sourceId,
      minzoom: zoomOptions.minZoom,
      maxzoom: zoomOptions.maxZoom,
      paint: {
        'fill-color': this.fillColor,
        'fill-opacity': this.fillOpacity,
      },
    });

    if (map.getLayer(this.strokeLayerId)) {
      map.removeLayer(this.strokeLayerId);
    }

    map.addLayer({
      id: this.strokeLayerId,
      type: 'line',
      source: this.sourceId,
      minzoom: zoomOptions.minZoom,
      maxzoom: zoomOptions.maxZoom,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': this.strokeColor,
        'line-width': this.strokeWidth,
        'line-opacity': this.strokeOpacity,
      },
    });

    this.updateLineStyle();
    this.bindInteractionEvents();
    this.updateVisibility();
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
      if (this.map.getLayer(this.strokeLayerId)) {
        this.map.removeLayer(this.strokeLayerId);
      }

      if (this.map.getLayer(this.fillLayerId)) {
        this.map.removeLayer(this.fillLayerId);
      }

      if (this.map.getSource(this.sourceId)) {
        this.map.removeSource(this.sourceId);
      }
    } catch {
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
      throw new Error('Cannot set path on destroyed polygon');
    }

    this.path = [...path];
    this.updateGeoJSON();
    this.emit('propertychange', { changedProps: ['path'] });
  }

  /**
   * 添加点
   */
  addPoint(point: LngLat, index?: number): void {
    if (this.destroyed) {
      throw new Error('Cannot add point to destroyed polygon');
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
      throw new Error('Cannot remove point from destroyed polygon');
    }

    if (index >= 0 && index < this.path.length) {
      this.path.splice(index, 1);
      this.updateGeoJSON();
    }
  }

  /**
   * 获取填充颜色
   */
  getFillColor(): string {
    return this.fillColor;
  }

  /**
   * 设置填充颜色
   */
  setFillColor(color: string): void {
    if (this.destroyed) {
      throw new Error('Cannot set fill color on destroyed polygon');
    }

    this.fillColor = color;
    if (this.map && this.map.getLayer(this.fillLayerId)) {
      this.map.setPaintProperty(this.fillLayerId, 'fill-color', color);
    }

    this.emit('propertychange', { changedProps: ['fillColor'] });
  }

  /**
   * 获取填充透明度
   */
  getFillOpacity(): number {
    return this.fillOpacity;
  }

  /**
   * 设置填充透明度
   */
  setFillOpacity(opacity: number): void {
    if (this.destroyed) {
      throw new Error('Cannot set fill opacity on destroyed polygon');
    }

    this.fillOpacity = opacity;
    if (this.map && this.map.getLayer(this.fillLayerId)) {
      this.map.setPaintProperty(this.fillLayerId, 'fill-opacity', opacity);
    }

    this.emit('propertychange', { changedProps: ['fillOpacity'] });
  }

  /**
   * 计算多边形面积（平方米）
   */
  getArea(): number {
    return this.calculateAreaMeters(this.path);
  }

  /**
   * 获取多边形中心点
   */
  getCenter(): LngLat {
    if (this.path.length === 0) {
      return [0, 0] as LngLat;
    }

    const ring = this.getClosedRing(this.path);
    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      const cross = x1 * y2 - x2 * y1;
      area += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    }

    if (area === 0) {
      return ring[0];
    }

    const factor = 1 / (3 * area);
    return [cx * factor, cy * factor] as LngLat;
  }

  /**
   * 绑定交互事件
   */
  private bindInteractionEvents(): void {
    if (!this.map || !this.isInteractive()) {
      return;
    }

    const map = this.map;
    const layerId = this.fillLayerId;

    map.on('mouseenter', layerId, (event) => {
      map.getCanvas().style.cursor = 'pointer';
      this.emit('mouseenter', {
        originalEvent: event,
        lnglat: [event.lngLat.lng, event.lngLat.lat],
        screenPoint: [event.point.x, event.point.y],
      });
    });

    map.on('mouseleave', layerId, (event) => {
      map.getCanvas().style.cursor = '';
      this.emit('mouseleave', {
        originalEvent: event,
        lnglat: [event.lngLat.lng, event.lngLat.lat],
        screenPoint: [event.point.x, event.point.y],
      });
    });

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
    if (!this.map) {
      return;
    }

    const visibility = this.isVisible() ? 'visible' : 'none';
    if (this.map.getLayer(this.fillLayerId)) {
      this.map.setLayoutProperty(this.fillLayerId, 'visibility', visibility);
    }
    if (this.map.getLayer(this.strokeLayerId)) {
      this.map.setLayoutProperty(this.strokeLayerId, 'visibility', visibility);
    }
  }

  /**
   * 选项变化处理
   */
  protected onOptionsChanged(changedProps: string[]): void {
    const map = this.map;
    if (!map) {
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
        case 'fillColor':
          this.fillColor = (this.options as PolygonOptions).fillColor || this.fillColor;
          if (map.getLayer(this.fillLayerId)) {
            map.setPaintProperty(this.fillLayerId, 'fill-color', this.fillColor);
          }
          break;
        case 'fillOpacity':
          this.fillOpacity = (this.options as PolygonOptions).fillOpacity ?? this.fillOpacity;
          if (map.getLayer(this.fillLayerId)) {
            map.setPaintProperty(this.fillLayerId, 'fill-opacity', this.fillOpacity);
          }
          break;
        case 'strokeColor':
          this.strokeColor = (this.options as PolygonOptions).strokeColor || this.strokeColor;
          if (map.getLayer(this.strokeLayerId)) {
            map.setPaintProperty(this.strokeLayerId, 'line-color', this.strokeColor);
          }
          break;
        case 'strokeWidth':
          this.strokeWidth = (this.options as PolygonOptions).strokeWidth ?? this.strokeWidth;
          if (map.getLayer(this.strokeLayerId)) {
            map.setPaintProperty(this.strokeLayerId, 'line-width', this.strokeWidth);
          }
          break;
        case 'strokeOpacity':
          this.strokeOpacity = (this.options as PolygonOptions).strokeOpacity ?? this.strokeOpacity;
          if (map.getLayer(this.strokeLayerId)) {
            map.setPaintProperty(this.strokeLayerId, 'line-opacity', this.strokeOpacity);
          }
          break;
        case 'strokeStyle':
        case 'strokeDashPattern':
          this.strokeStyle = (this.options as PolygonOptions).strokeStyle || this.strokeStyle;
          this.strokeDashPattern = (this.options as PolygonOptions).strokeDashPattern || this.strokeDashPattern;
          this.updateLineStyle();
          break;
        case 'path':
          this.path = (this.options as PolygonOptions).path || this.path;
          this.updateGeoJSON();
          break;
      }
    });
  }

  /**
   * 更新线条样式
   */
  private updateLineStyle(): void {
    if (!this.map || !this.map.getLayer(this.strokeLayerId)) {
      return;
    }

    if (this.strokeStyle === 'dashed' && this.strokeDashPattern) {
      this.map.setPaintProperty(this.strokeLayerId, 'line-dasharray', this.strokeDashPattern);
    } else if (this.strokeStyle === 'dotted') {
      this.map.setPaintProperty(this.strokeLayerId, 'line-dasharray', [1, 2]);
    } else {
      this.map.setPaintProperty(this.strokeLayerId, 'line-dasharray', null);
    }
  }

  /**
   * 更新Z-Index
   */
  protected updateZIndex(): void {
    // MapLibre图层顺序由添加顺序决定，这里暂时不实现
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
    return 'polygon';
  }

  /**
   * 克隆多边形
   */
  clone(): Polygon {
    const options = {
      ...this.options,
      path: [...this.path],
      id: undefined,
    };

    return new Polygon(options as PolygonOptions);
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
  static fromGeoJSON(geojson: any, options?: PolygonOptions): Polygon {
    if (geojson.geometry.type !== 'Polygon') {
      throw new Error('GeoJSON must be a Polygon feature');
    }

    const path = geojson.geometry.coordinates?.[0] as LngLat[];
    const properties = geojson.properties || {};

    const polygonOptions: PolygonOptions = {
      path,
      ...options,
      properties: {
        ...properties,
        ...options?.properties,
      },
      id: properties.id || options?.id,
      fillColor: properties.fillColor || options?.fillColor,
      fillOpacity: properties.fillOpacity ?? options?.fillOpacity,
      strokeColor: properties.strokeColor || options?.strokeColor,
      strokeWidth: properties.strokeWidth ?? options?.strokeWidth,
      strokeOpacity: properties.strokeOpacity ?? options?.strokeOpacity,
      strokeStyle: properties.strokeStyle || options?.strokeStyle,
      strokeDashPattern: properties.strokeDashPattern || options?.strokeDashPattern,
    };

    return new Polygon(polygonOptions);
  }

  /**
   * 创建GeoJSON
   */
  private createGeoJSON(): any {
    const ring = this.getClosedRing(this.path);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
      properties: {
        id: this.id,
        ...this.options.properties,
        fillColor: this.fillColor,
        fillOpacity: this.fillOpacity,
        strokeColor: this.strokeColor,
        strokeWidth: this.strokeWidth,
        strokeOpacity: this.strokeOpacity,
        strokeStyle: this.strokeStyle,
        strokeDashPattern: this.strokeDashPattern,
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
   * 获取闭合环
   */
  private getClosedRing(path: LngLat[]): LngLat[] {
    if (path.length === 0) {
      return [];
    }

    const ring = [...path];
    const first = ring[0];
    const last = ring[ring.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }

    return ring;
  }

  /**
   * 计算球面面积（米）
   */
  private calculateAreaMeters(path: LngLat[]): number {
    if (path.length < 3) {
      return 0;
    }

    const ring = this.getClosedRing(path);
    const radius = 6378137;
    let sum = 0;

    for (let i = 0; i < ring.length - 1; i++) {
      const [lng1, lat1] = ring[i];
      const [lng2, lat2] = ring[i + 1];

      const lon1 = lng1 * Math.PI / 180;
      const lon2 = lng2 * Math.PI / 180;
      const lat1Rad = lat1 * Math.PI / 180;
      const lat2Rad = lat2 * Math.PI / 180;

      sum += (lon2 - lon1) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
    }

    const area = Math.abs(sum) * radius * radius / 2;
    return area;
  }
}
