import maplibregl from 'maplibre-gl';
import { MapService, Inject } from './decorators';
import { SyncEngine } from './services/SyncEngine';
import { BaseMapProvider, MapType } from './services/BaseMapProvider';
import { Container } from './di/Container';

import 'maplibre-gl/dist/maplibre-gl.css';

// 导出接口定义
// 导出接口定义
export interface FusionMapConfig {
  mapOptions?: Partial<maplibregl.MapOptions>;
  tokens?: {
    amap?: string;
    baidu?: string;
    cesium?: string;
    tianditu?: string;
    google?: string;
  };
}

@MapService()
export class FusionMap {
  private map!: maplibregl.Map;

  @Inject(() => SyncEngine)
  private syncEngine!: SyncEngine;

  @Inject(() => BaseMapProvider)
  private baseMapProvider!: BaseMapProvider;

  constructor(private containerId: string, options: FusionMapConfig = {}) {
    this.init(containerId, options);
  }

  private init(containerId: string, options: FusionMapConfig) {
    console.log('[FusionMap] Initializing...');

    // 设置 Token
    if (options.tokens) {
      this.baseMapProvider.setTokens(options.tokens);
    }

    // 1. 创建容器结构：底层放 BaseMap，上层放 MapLibre
    const root = document.getElementById(containerId);
    if (!root) throw new Error(`Container ${containerId} not found`);

    root.style.position = 'relative';

    // 创建底图容器
    const baseContainer = document.createElement('div');
    baseContainer.style.position = 'absolute';
    baseContainer.style.width = '100%';
    baseContainer.style.height = '100%';
    baseContainer.style.zIndex = '0';
    root.appendChild(baseContainer);
    this.baseMapProvider.setContainer(baseContainer);

    // 创建 MapLibre 容器（透明）
    const topContainer = document.createElement('div');
    topContainer.style.position = 'absolute';
    topContainer.style.width = '100%';
    topContainer.style.height = '100%';
    topContainer.style.zIndex = '1';
    topContainer.style.pointerEvents = 'auto'; // Re-enable pointer events for top layer
    topContainer.id = `${containerId}-maplibre`;
    root.appendChild(topContainer);

    // 2. 初始化 MapLibre
    const mapOpts = options.mapOptions || {};
    
    this.map = new maplibregl.Map({
      container: topContainer.id,
      style: {
        version: 8,
        sources: {},
        layers: [],
        projection: { type: 'globe' } as any,
      },
      center: [116.3974, 39.9093],
      zoom: 2,
      minZoom: 2,
      maxZoom: 22,
      ...mapOpts
    } as maplibregl.MapOptions & { projection?: any });

    this.map.on('zoom', () => {
      this.updatePitchLimits();
    });

    this.map.on('load', () => {
      // Tianditu Base Map (Standard Vector)
      // Note: Requires a valid TK (Token). 
      // Please replace 'YOUR_TIANDITU_KEY' with your actual key if needed, or use a working one if provided.
      const tdtToken = options.tokens?.tianditu || 'YOUR_TIANDITU_KEY';
      if (tdtToken === 'YOUR_TIANDITU_KEY') {
        console.warn('[FusionMap] Tianditu Token is missing or default. Map tiles may not load, making the globe invisible.');
      }

      // Generate t0-t7 subdomains
      const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];

      const vecTiles = subdomains.map(s =>
        `https://t${s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tdtToken}`
      );

      const cvaTiles = subdomains.map(s =>
        `https://t${s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tdtToken}`
      );

      this.map.addSource('tianditu-vec', {
        type: 'raster',
        tiles: vecTiles,
        tileSize: 256
      });

      // Tianditu Annotation (Text)
      // this.map.addSource('tianditu-cva', {
      //   type: 'raster',
      //   tiles: cvaTiles,
      //   tileSize: 256
      // });

      this.map.addLayer({
        id: 'tianditu-base',
        type: 'raster',
        source: 'tianditu-vec',
        paint: {},
        layout: {
          // visibility: 'none' // Default hidden for Amap/Cesium modes
        }
      });

      // this.map.addLayer({
      //   id: 'tianditu-label',
      //   type: 'raster',
      //   source: 'tianditu-cva',
      //   paint: {}
      // });



    });

    // 3. 启动同步引擎
    this.syncEngine.bind(this.map);

    // 4. 初始化默认底图
    this.baseMapProvider.switchMap('amap');

    console.log('[FusionMap] Ready.');
  }

  // 切换投影
  setProjection(type: 'globe' | 'mercator') {
    if (this.map) {
      console.log(`[FusionMap] Setting projection to ${type}`);
      // @ts-ignore - setProjection types might be missing in some versions
      this.map.setProjection({
        type: type
      });
      // Update limits immediately after projection change
      this.updatePitchLimits();
    }
  }

  private updatePitchLimits() {
    if (!this.map) return;

    // Check current projection
    // @ts-ignore
    const proj = this.map.getProjection();
    const isGlobe = proj && proj.type === 'globe';

    if (!isGlobe) {
      this.map.setMaxPitch(60); // Default max pitch for mercator
      return;
    }

    const zoom = this.map.getZoom();
    let maxPitch = 60;

    if (zoom < 2) {
      maxPitch = 0;
    } else if (zoom >= 2 && zoom <= 10) {
      // Linear interpolation: (zoom - 2) / (10 - 2) * 60
      maxPitch = ((zoom - 2) / 8) * 60;
    }

    this.map.setMaxPitch(maxPitch);
  }

  // 暴露事件监听
  on(type: string, listener: (ev: any) => void) {
    if (this.map) {
      this.map.on(type, listener);
    }
  }

  setCesiumScaleFactor(factor: number) {
    this.baseMapProvider.setCesiumScaleFactor(factor);
  }

  setZoomOffset(offset: number) {
    this.baseMapProvider.setZoomOffset(offset);
  }

  // 暴露给外部的方法
  addLayer(layer: maplibregl.LayerSpecification) {
    this.map.addLayer(layer);
  }

  switchBaseMap(type: MapType) {
    if (!this.map) {
      this.baseMapProvider.switchMap(type);
      return;
    }

    const center = this.map.getCenter();
    const state = {
      center: [center.lng, center.lat] as [number, number],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing()
    };

    this.baseMapProvider.switchMap(type, state);
    this.setProjection('mercator');

    // Auto-switch projection
    if (type === 'cesium') {
      this.setProjection('globe');
      if (this.map.getLayer('tianditu-base')) {
        this.map.setLayoutProperty('tianditu-base', 'visibility', 'none');
      }
      this.enableInteractions();
    } else if (type === 'tianditu') {
      this.setProjection('mercator');
      if (this.map.getLayer('tianditu-base')) {
        this.map.setLayoutProperty('tianditu-base', 'visibility', 'visible');
      }
      this.enableInteractions();
    } else if (type === 'google') {
      this.setProjection('mercator');
      if (this.map.getLayer('tianditu-base')) {
        this.map.setLayoutProperty('tianditu-base', 'visibility', 'none');
      }
      this.enableInteractions();
    } else {
      this.setProjection('mercator');
      if (this.map.getLayer('tianditu-base')) {
        this.map.setLayoutProperty('tianditu-base', 'visibility', 'none');
      }
      this.enableInteractions();
    }
  }

  private enableInteractions() {
    this.map.setMaxPitch(60); // Restore default max pitch
    this.map.dragRotate.enable();
    this.map.touchZoomRotate.enableRotation();
  }
}

// 导出 create 函数方便非 class 调用
export function createFusionMap(containerId: string, options?: FusionMapConfig) {
  return new FusionMap(containerId, options);
}
