/**
 * 标记覆盖物实现
 */

import type { Map as MapLibreMap, Popup, Marker as MapLibreMarker } from 'maplibre-gl';
import { BaseOverlay } from './BaseOverlay';
import type { 
  MarkerOptions, 
  IMarker, 
  LngLat,
  Bounds
} from '../types/overlays';

/**
 * 标记覆盖物
 */
export class Marker extends BaseOverlay implements IMarker {
  /** MapLibre 标记实例 */
  private marker: MapLibreMarker | null = null;
  
  /** MapLibre 弹出窗口实例 */
  private popup: Popup | null = null;
  
  /** 标记位置 */
  private position: LngLat;
  
  /** 标记图标 */
  private icon: string | HTMLElement | undefined;
  
  /** 旋转角度 */
  private rotation: number = 0;
  
  /** 是否可拖动 */
  private draggable: boolean = false;
  
  /** 弹出内容 */
  private popupContent: string | HTMLElement | undefined;
  
  /** 弹出窗口是否打开 */
  private popupOpen: boolean = false;

  /**
   * 构造函数
   */
  constructor(options: MarkerOptions) {
    super(options);
    
    this.position = options.position;
    this.icon = options.icon;
    this.rotation = options.rotation || 0;
    this.draggable = options.draggable || false;
    this.popupContent = options.popup;
  }

  /**
   * 添加到地图
   */
  addTo(map: MapLibreMap): void {
    if (this.destroyed) {
      throw new Error('Cannot add destroyed marker to map');
    }
    
    this.map = map;
    
    // 创建MapLibre标记
    this.marker = new (window as any).maplibregl.Marker({
      element: this.createMarkerElement(),
      draggable: this.draggable,
      offset: this.options.offset as [number, number] || [0, 0],
      anchor: this.options.anchor as [number, number] || [0.5, 1],
    });
    
    // 设置位置
    this.marker.setLngLat(this.position);
    
    // 添加到地图
    this.marker.addTo(map);
    
    // 绑定事件
    this.bindMarkerEvents();
    
    // 创建弹出窗口
    if (this.popupContent) {
      this.createPopup();
    }
    
    // 设置可见性
    this.updateVisibility();
    
    this.emit('add');
  }

  /**
   * 从地图移除
   */
  remove(): void {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
    
    this.map = null;
    this.popupOpen = false;
    
    if (!this.destroyed) {
      this.emit('remove');
    }
  }

  /**
   * 获取标记位置
   */
  getPosition(): LngLat {
    if (this.marker) {
      const lngLat = this.marker.getLngLat();
      return [lngLat.lng, lngLat.lat];
    }
    return this.position;
  }

  /**
   * 设置标记位置
   */
  setPosition(position: LngLat): void {
    if (this.destroyed) {
      throw new Error('Cannot set position on destroyed marker');
    }
    
    this.position = position;
    
    if (this.marker) {
      this.marker.setLngLat(position);
      
      if (this.popup && this.popupOpen) {
        this.popup.setLngLat(position);
      }
    }
    
    this.emit('propertychange', { changedProps: ['position'] });
  }

  /**
   * 获取标记图标
   */
  getIcon(): string | HTMLElement | undefined {
    return this.icon;
  }

  /**
   * 设置标记图标
   */
  setIcon(icon: string | HTMLElement): void {
    if (this.destroyed) {
      throw new Error('Cannot set icon on destroyed marker');
    }
    
    this.icon = icon;
    
    if (this.marker) {
      // 移除旧标记，创建新标记
      const wasPopupOpen = this.popupOpen;
      const oldPosition = this.getPosition();
      
      this.remove();
      this.position = oldPosition;
      this.addTo(this.getMap());
      
      if (wasPopupOpen && this.popup) {
        this.openPopup();
      }
    }
    
    this.emit('propertychange', { changedProps: ['icon'] });
  }

  /**
   * 获取旋转角度
   */
  getRotation(): number {
    return this.rotation;
  }

  /**
   * 设置旋转角度
   */
  setRotation(rotation: number): void {
    if (this.destroyed) {
      throw new Error('Cannot set rotation on destroyed marker');
    }
    
    this.rotation = rotation;
    
    if (this.marker && this.marker.getElement()) {
      const element = this.marker.getElement();
      if (element) {
        element.style.transform = `rotate(${rotation}deg)`;
        if (this.options.rotationOrigin) {
          element.style.transformOrigin = this.options.rotationOrigin;
        }
      }
    }
    
    this.emit('propertychange', { changedProps: ['rotation'] });
  }

  /**
   * 打开弹出窗口
   */
  openPopup(): void {
    if (this.destroyed || !this.popup) {
      return;
    }
    
    if (!this.popupOpen) {
      if (this.marker) {
        this.popup.setLngLat(this.marker.getLngLat());
      }
      this.popup.addTo(this.getMap());
      this.popupOpen = true;
    }
  }

  /**
   * 关闭弹出窗口
   */
  closePopup(): void {
    if (this.destroyed || !this.popup) {
      return;
    }
    
    if (this.popupOpen) {
      this.popup.remove();
      this.popupOpen = false;
    }
  }

  /**
   * 切换弹出窗口
   */
  togglePopup(): void {
    if (this.popupOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  /**
   * 获取弹出内容
   */
  getPopupContent(): string | HTMLElement | undefined {
    return this.popupContent;
  }

  /**
   * 设置弹出内容
   */
  setPopupContent(content: string | HTMLElement): void {
    if (this.destroyed) {
      throw new Error('Cannot set popup content on destroyed marker');
    }
    
    this.popupContent = content;
    
    if (this.popup) {
      // 更新弹出窗口内容
      const wasOpen = this.popupOpen;
      this.closePopup();
      
      this.createPopup();
      
      if (wasOpen) {
        this.openPopup();
      }
    } else if (content) {
      // 创建新的弹出窗口
      this.createPopup();
    }
    
    this.emit('propertychange', { changedProps: ['popup'] });
  }

  /**
   * 创建标记元素
   */
  private createMarkerElement(): HTMLElement {
    let element: HTMLElement;
    
    if (typeof this.icon === 'string') {
      // 图标URL
      element = document.createElement('div');
      element.style.width = this.options.iconSize?.[0] ? `${this.options.iconSize[0]}px` : '30px';
      element.style.height = this.options.iconSize?.[1] ? `${this.options.iconSize[1]}px` : '30px';
      element.style.backgroundImage = `url(${this.icon})`;
      element.style.backgroundSize = 'contain';
      element.style.backgroundRepeat = 'no-repeat';
      element.style.backgroundPosition = 'center';
    } else if (this.icon instanceof HTMLElement) {
      // HTML元素
      element = this.icon.cloneNode(true) as HTMLElement;
    } else {
      // 默认标记
      element = document.createElement('div');
      element.style.width = '30px';
      element.style.height = '30px';
      element.style.backgroundColor = '#3388ff';
      element.style.borderRadius = '50%';
      element.style.border = '3px solid white';
      element.style.boxShadow = '0 2px助开点觉得挺长挺长的，其实可以用CSS写得更简洁些，但是这里只是示意';
    }
    
    // 应用旋转
    if (this.rotation !== 0) {
      element.style.transform = `rotate(${this.rotation}deg)`;
      if (this.options.rotationOrigin) {
        element.style.transformOrigin = this.options.rotationOrigin;
      }
    }
    
    // 设置指针样式
    if (this.isInteractive()) {
      element.style.cursor = 'pointer';
    }
    
    // 添加标题
    if (this.options.title) {
      element.title = this.options.title;
    }
    
    return element;
  }

  /**
   * 创建弹出窗口
   */
  private createPopup(): void {
    if (!this.popupContent || !this.marker) {
      return;
    }
    
    const popupOptions: any = {
      closeButton: this.options.closable !== false,
      closeOnClick: this.options.autoClose !== false,
      offset: this.options.popupOffset as [number, number] || [0, 0],
    };
    
    if (this.options.maxWidth) {
      popupOptions.maxWidth = this.options.maxWidth;
    }
    
    if (this.options.maxHeight) {
      popupOptions.maxHeight = this.options.maxHeight;
    }
    
    this.popup = new (window as any).maplibregl.Popup(popupOptions);
    
    // 设置内容
    if (typeof this.popupContent === 'string') {
      this.popup.setHTML(this.popupContent);
    } else {
      this.popup.setDOMContent(this.popupContent);
    }
    
    // 绑定关闭事件
    this.popup.on('close', () => {
      this.popupOpen = false;
      this.emit('close');
    });
    
    // 自动关闭
    if (this.options.autoCloseTime && this.options.autoCloseTime > 0) {
      setTimeout(() => {
        if (this.popupOpen) {
          this.closePopup();
        }
      }, this.options.autoCloseTime);
    }
  }

  /**
   * 绑定标记事件
   */
  private bindMarkerEvents(): void {
    if (!this.marker || !this.isInteractive()) {
      return;
    }
    
    const element = this.marker.getElement();
    if (!element) {
      return;
    }
    
    // 点击事件
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      this.emit('click', { originalEvent: event });
      
      if (this.popupContent) {
        this.togglePopup();
      }
    });
    
    // 双击事件
    element.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      this.emit('dblclick', { originalEvent: event });
    });
    
    // 右键菜单
    element.addEventListener('contextmenu', (event) => {
      event.stopPropagation();
      this.emit('contextmenu', { originalEvent: event });
    });
    
    // 鼠标进入
    element.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
      this.emit('mouseenter', { originalEvent: event });
    });
    
    // 鼠标离开
    element.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      this.emit('mouseleave', { originalEvent: event });
    });
    
    // 拖拽事件
    if (this.draggable && this.marker) {
      this.marker.on('dragstart', (event) => {
        this.emit('dragstart', { originalEvent: event });
      });
      
      this.marker.on('drag', (event) => {
        const lngLat = this.marker!.getLngLat();
        this.position = [lngLat.lng, lngLat.lat];
        this.emit('drag', { originalEvent: event, lnglat: this.position });
      });
      
      this.marker.on('dragend', (event) => {
        const lngLat = this.marker!.getLngLat();
        this.position = [lngLat.lng, lngLat.lat];
        this.emit('dragend', { originalEvent: event, lnglat: this.position });
      });
    }
  }

  /**
   * 更新可见性
   */
  protected updateVisibility(): void {
    if (!this.marker || !this.marker.getElement()) {
      return;
    }
    
    const element = this.marker.getElement();
    if (element) {
      element.style.display = this.isVisible() ? 'block' : 'none';
    }
    
    if (this.popup && this.popupOpen && !this.isVisible()) {
      this.closePopup();
    }
  }

  /**
   * 选项变化处理
   */
  protected onOptionsChanged(changedProps: string[]): void {
    if (!this.marker) {
      return;
    }
    
    changedProps.forEach(prop => {
      switch (prop) {
        case 'visible':
          this.updateVisibility();
          break;
          
        case 'draggable':
          this.draggable = !!this.options.draggable;
          if (this.marker) {
            this.marker.setDraggable(this.draggable);
          }
          break;
          
        case 'offset':
          if (this.marker) {
            this.marker.setOffset(this.options.offset as [number, number] || [0, 0]);
          }
          break;
          
        case 'zIndex':
          this.updateZIndex();
          break;
          
        case 'title':
          if (this.marker && this.marker.getElement()) {
            const element = this.marker.getElement();
            if (element) {
              element.title = this.options.title || '';
            }
          }
          break;
      }
    });
  }

  /**
   * 更新Z-Index
   */
  protected updateZIndex(): void {
    if (!this.marker || !this.marker.getElement()) {
      return;
    }
    
    const element = this.marker.getElement();
    if (element) {
      element.style.zIndex = this.getZIndex().toString();
    }
  }

  /**
   * 计算边界框
   */
  protected calculateBounds(): Bounds {
    const [lng, lat] = this.getPosition();
    const offset = 0.0001; // 很小的偏移量，标记实际上是一个点
    
    return {
      sw: [lng - offset, lat - offset] as LngLat,
      ne: [lng + offset, lat + offset] as LngLat,
    };
  }

  /**
   * 转换为GeoJSON
   */
  toGeoJSON(): any {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: this.getPosition(),
      },
      properties: {
        id: this.id,
        ...this.options.properties,
        icon: this.icon,
        rotation: this.rotation,
        draggable: this.draggable,
        title: this.options.title,
      },
    };
  }

  /**
   * 获取覆盖物类型
   */
  getType(): string {
    return 'marker';
  }

  /**
   * 克隆标记
   */
  clone(): Marker {
    const options = {
      ...this.options,
      id: undefined, // 生成新的ID
    };
    
    return new Marker(options as MarkerOptions);
  }

  /**
   * 绑定拖拽事件
   */
  onDragStart(listener: (event: any) => void): void {
    this.on('dragstart', listener);
  }

  onDrag(listener: (event: any) => void): void {
    this.on('drag', listener);
  }

  onDragEnd(listener: (event: any) => void): void {
    this.on('dragend', listener);
  }

  onClick(listener: (event: any) => void): void {
    this.on('click', listener);
  }

  /**
   * 静态方法：从GeoJSON创建
   */
  static fromGeoJSON(geojson: any, options?: MarkerOptions): Marker {
    if (geojson.geometry.type !== 'Point') {
      throw new Error('GeoJSON must be a Point feature');
    }
    
    const position = geojson.geometry.coordinates as LngLat;
    const properties = geojson.properties || {};
    
    const markerOptions: MarkerOptions = {
      position,
      ...options,
      properties: {
        ...properties,
        ...options?.properties,
      },
      id: properties.id || options?.id,
      icon: properties.icon || options?.icon,
      rotation: properties.rotation || options?.rotation,
      draggable: properties.draggable || options?.draggable,
      title: properties.title || options?.title,
    };
    
    return new Marker(markerOptions);
  }
}