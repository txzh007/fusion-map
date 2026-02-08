import maplibregl from 'maplibre-gl';
import { MapService, Inject } from './decorators';
import { SyncEngine } from './services/SyncEngine';
import { BaseMapProvider, type MapType } from './services/BaseMapProvider';
import type { FusionMapConfig, MapLoadingState, GenericEventOn } from './types';
import {
  ErrorCode,
  createContainerNotFoundError,
  normalizeError,
  type MapError
} from './errors';
import { Subject } from 'rxjs';

import 'maplibre-gl/dist/maplibre-gl.css';

@MapService()
export class FusionMap {
  private map!: maplibregl.Map;

  @Inject(() => SyncEngine)
  private syncEngine!: SyncEngine;

  @Inject(() => BaseMapProvider)
  private baseMapProvider!: BaseMapProvider;

  // Error and loading state subjects
  private errorSubject = new Subject<MapError>();
  private loadingSubject = new Subject<MapLoadingState>();

  // Public observables
  public errors$ = this.errorSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private containerId: string, options: FusionMapConfig = {}) {
    // Subscribe to BaseMapProvider errors and loading states
    this.baseMapProvider.errors$.subscribe((error) => {
      this.errorSubject.next(error);
    });

    this.baseMapProvider.loading$.subscribe((state) => {
      this.loadingSubject.next(state);
    });

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
    if (!root) {
      const error = createContainerNotFoundError(containerId);
      this.errorSubject.next({
        type: 'amap',
        message: error.message,
        error,
        timestamp: Date.now()
      });
      throw error;
    }

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
        // @ts-ignore - MapLibre 类型定义中缺少 projection 属性
        projection: { type: 'globe' }
      },
      center: [116.3974, 39.9093],
      zoom: 2,
      minZoom: 2,
      maxZoom: 22,
      ...mapOpts
    // @ts-ignore - projection 未在 MapOptions 类型中定义
    } as maplibregl.MapOptions & { projection?: { type: 'globe' | 'mercator' } });

    this.map.on('zoom', () => {
      this.updatePitchLimits();
    });

    this.map.on('load', () => {
      // Tianditu Base Map (Standard Vector)
      // Note: Requires a valid TK (Token).
      // Please replace 'YOUR_TIANDITU_KEY' with your actual key if needed, or use a working one if provided.
      const tdtToken = options.tokens?.tianditu || 'YOUR_TIANDITU_KEY';
      if (tdtToken === 'YOUR_TIANDITU_KEY') {
        console.warn(
          '[FusionMap] Tianditu Token is missing or default. ' +
          'Map tiles may not load, making the globe invisible.'
        );
      }

      // Generate t0-t7 subdomains
      const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];

      const vecTiles = subdomains.map((s) => {
        const baseUrl = `https://t${s}.tianditu.gov.cn/vec_w/wmts`;
        const params = new URLSearchParams({
          SERVICE: 'WMTS',
          REQUEST: 'GetTile',
          VERSION: '1.0.0',
          LAYER: 'vec',
          STYLE: 'default',
          TILEMATRIXSET: 'w',
          FORMAT: 'tiles',
          TILEMATRIX: '{z}',
          TILEROW: '{y}',
          TILECOL: '{x}',
          tk: tdtToken
        });
        return `${baseUrl}?${params.toString()}`;
      });

      // cvaTiles 未使用，已被注释
      // const cvaTiles = subdomains.map((s) => {
      //   const baseUrl = `https://t${s}.tianditu.gov.cn/cva_w/wmts`;
      //   const params = new URLSearchParams({
      //     SERVICE: 'WMTS',
      //     REQUEST: 'GetTile',
      //     VERSION: '1.0.0',
      //     LAYER: 'cva',
      //     STYLE: 'default',
      //     TILEMATRIXSET: 'w',
      //     FORMAT: 'tiles',
      //     TILEMATRIX: '{z}',
      //     TILEROW: '{y}',
      //     TILECOL: '{x}',
      //     tk: tdtToken
      //   });
      //   return `${baseUrl}?${params.toString()}`;
      // });

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
    if (!this.map) {return;}

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

  /**
   * 暴露事件监听
   * @param type - 事件类型
   * @param listener - 事件监听器
   */
  on: GenericEventOn = (type, listener) => {
    if (this.map) {
      // @ts-ignore - MapLibre 的类型定义不够灵活，允许任意事件监听器
      this.map.on(type, listener);
    }
  };

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
    this.loadingSubject.next({ type, loading: true });

    if (!this.map) {
      this.baseMapProvider.switchMap(type)
        .then(() => {
          this.loadingSubject.next({ type, loading: false });
          return void 0; // 满足 ESLint promise/always-return 规则
        })
        .catch((error) => {
          this.loadingSubject.next({ type, loading: false });
          const normalizedError = normalizeError(error);
          this.errorSubject.next({
            type,
            message: `切换到 ${type} 失败: ${normalizedError.message}`,
            error: normalizedError.code ? normalizedError : undefined,
            timestamp: Date.now()
          });
        });
      return;
    }

    const center = this.map.getCenter();
    const state = {
      center: [center.lng, center.lat] as [number, number],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing()
    };

    this.baseMapProvider.switchMap(type, state).then(() => {
      this.loadingSubject.next({ type, loading: false });
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
      return void 0; // 满足 ESLint promise/always-return 规则
    }).catch((error) => {
      this.loadingSubject.next({ type, loading: false });
      const normalizedError = normalizeError(error);
      this.errorSubject.next({
        type,
        message: `切换到 ${type} 失败: ${normalizedError.message}`,
        error: normalizedError.code ? normalizedError : undefined,
        timestamp: Date.now()
      });
      // Re-throw the error so the caller can handle it
      throw error;
    });
  }

  private enableInteractions() {
    this.map.setMaxPitch(60); // Restore default max pitch
    this.map.dragRotate.enable();
    this.map.touchZoomRotate.enableRotation();
  }

  // 访问底层 MapLibre 实例（只读）
  getMapInstance() {
    return this.map;
  }

  /**
   * 销毁地图实例并清理容器
   */
  destroy() {
    try {
      this.map?.remove();
      this.baseMapProvider.reset();
      this.errorSubject.complete();
      this.loadingSubject.complete();
    } catch (e) {
      const error = normalizeError(e);
      console.warn('[FusionMap] destroy failed:', error.getDetailedMessage());
      this.errorSubject.next({
        type: 'amap',
        message: '销毁地图失败',
        error: error.code ? error : undefined,
        timestamp: Date.now()
      });
    }
  }
}

// 导出 create 函数方便非 class 调用
export function createFusionMap(containerId: string, options?: FusionMapConfig) {
  return new FusionMap(containerId, options);
}
