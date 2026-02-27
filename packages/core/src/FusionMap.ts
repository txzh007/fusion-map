import maplibregl from 'maplibre-gl';
import { MapService, Inject } from './decorators';
import { SyncEngine } from './services/SyncEngine';
import { BaseMapProvider, type MapType } from './services/BaseMapProvider';
import type { FusionMapConfig, MapLoadingState, GenericEventOn } from './types';
import { createContainerNotFoundError, normalizeError, type MapError } from './errors';
import { Subject } from 'rxjs';

// @ts-ignore - CSS import for maplibre-gl styles
import 'maplibre-gl/dist/maplibre-gl.css';

const REFERENCE_BASE_SOURCE_ID = 'maplibre-reference-base-source';
const REFERENCE_BASE_LAYER_ID = 'maplibre-reference-base-layer';
const REFERENCE_BG_LAYER_ID = 'maplibre-reference-bg-layer';
const REFERENCE_BASE_OPACITY = 0.5;
const DEFAULT_MAX_PITCH = 67.5;
const TOKEN_REQUIRED_MAPS: MapType[] = ['amap', 'baidu', 'google', 'tianditu'];

@MapService()
export class FusionMap {
  private map!: maplibregl.Map;
  private referenceBaseOpacity = REFERENCE_BASE_OPACITY;
  private pendingProjection: 'globe' | 'mercator' | null = null;
  private projectionLoadListenerBound = false;
  private maxPitchLimit = DEFAULT_MAX_PITCH;

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

  constructor(
    private containerId: string,
    options: FusionMapConfig = {}
  ) {
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
    baseContainer.style.pointerEvents = 'none';
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
    this.maxPitchLimit = typeof mapOpts.maxPitch === 'number' ? mapOpts.maxPitch : DEFAULT_MAX_PITCH;
    const tdtToken = options.tokens?.tianditu || '';
    const referenceTiles = this.getReferenceTiles(tdtToken);

    this.map = new maplibregl.Map({
      container: topContainer.id,
      style: {
        version: 8,
        sources: {
          [REFERENCE_BASE_SOURCE_ID]: {
            type: 'raster',
            tiles: referenceTiles,
            tileSize: 256
          }
        },
        layers: [
          {
            id: REFERENCE_BG_LAYER_ID,
            type: 'background',
            paint: {
              'background-color': '#1f2937',
              'background-opacity': Math.max(0.15, this.referenceBaseOpacity * 0.7)
            }
          },
          {
            id: REFERENCE_BASE_LAYER_ID,
            type: 'raster',
            source: REFERENCE_BASE_SOURCE_ID,
            paint: {
              'raster-opacity': this.referenceBaseOpacity
            }
          }
        ],
        // @ts-ignore - MapLibre 类型定义中缺少 projection 属性
        projection: { type: 'globe' }
      },
      center: [116.3974, 39.9093],
      zoom: 2,
      minZoom: 2,
      maxZoom: 22,
      maxPitch: this.maxPitchLimit,
      bearingSnap: 0,
      ...mapOpts
      // @ts-ignore - projection 未在 MapOptions 类型中定义
    } as maplibregl.MapOptions & {
      projection?: { type: 'globe' | 'mercator' };
    });

    this.map.on('load', () => {
      this.projectionLoadListenerBound = false;
      this.map.resize();

      // Tianditu Base Map (Standard Vector)
      // Note: Requires a valid TK (Token).
      // Please replace 'YOUR_TIANDITU_KEY' with your actual key if needed, or use a working one if provided.
      if (!tdtToken) {
        console.warn('[FusionMap] Tianditu Token is missing. Tianditu base map will be skipped.');
        this.applyPendingProjection();
        return;
      }

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
        tiles: this.getTiandituVecTiles(tdtToken),
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
          visibility: 'none'
        }
      });

      // this.map.addLayer({
      //   id: 'tianditu-label',
      //   type: 'raster',
      //   source: 'tianditu-cva',
      //   paint: {}
      // });

      this.applyPendingProjection();
    });

    requestAnimationFrame(() => this.map.resize());

    // 3. 启动同步引擎
    this.syncEngine.bind(this.map);

    // 4. 初始化默认底图（支持配置初始底图）
    const initialBaseMap = this.resolveInitialBaseMap(options);
    if (!initialBaseMap) {
      console.warn('[FusionMap] No provider token configured, skipping initial base map bootstrap.');
      return;
    }

    const initialCenter = this.map.getCenter();
    const initialView = {
      center: [initialCenter.lng, initialCenter.lat] as [number, number],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing()
    };

    this.baseMapProvider
      .switchMap(initialBaseMap, initialView)
      .then(() => {
        this.applyBaseMapPresentation(initialBaseMap);
        this.syncCurrentViewToBaseMap();
        return;
      })
      .catch((error) => {
        const normalizedError = normalizeError(error);
        this.errorSubject.next({
          type: initialBaseMap,
          message: `Failed to initialize ${initialBaseMap}: ${normalizedError.message}`,
          error: normalizedError.code ? normalizedError : undefined,
          timestamp: Date.now()
        });
      });

    console.log('[FusionMap] Ready.');
  }

  private resolveInitialBaseMap(options: FusionMapConfig): MapType | null {
    if (options.initialBaseMap) {
      return options.initialBaseMap;
    }

    const candidates: MapType[] = ['amap', 'baidu', 'google', 'tianditu'];
    const firstConfigured = candidates.find((type) => this.hasRequiredToken(type, options));
    return firstConfigured ?? null;
  }

  private hasRequiredToken(type: MapType, options: FusionMapConfig): boolean {
    if (!TOKEN_REQUIRED_MAPS.includes(type)) {
      return true;
    }

    const tokens = options.tokens;
    if (!tokens) {
      return false;
    }

    if (type === 'google') {
      return Boolean(tokens.google);
    }

    if (type === 'tianditu') {
      return Boolean(tokens.tianditu);
    }

    return Boolean(tokens[type]);
  }

  // 切换投影
  setProjection(type: 'globe' | 'mercator') {
    if (!this.map) {
      return;
    }

    this.pendingProjection = type;

    const isStyleLoaded =
      typeof (this.map as any).isStyleLoaded === 'function' ? (this.map as any).isStyleLoaded() : true;

    if (!isStyleLoaded) {
      this.bindProjectionOnLoad();
      return;
    }

    this.applyPendingProjection();
  }

  private bindProjectionOnLoad() {
    if (!this.map || this.projectionLoadListenerBound) {
      return;
    }

    this.projectionLoadListenerBound = true;
    const mapAny = this.map as any;
    const handler = () => {
      this.projectionLoadListenerBound = false;
      if (typeof mapAny.off === 'function') {
        mapAny.off('load', handler);
      }
      this.applyPendingProjection();
    };

    if (typeof mapAny.once === 'function') {
      mapAny.once('load', handler);
      return;
    }

    if (typeof mapAny.on === 'function') {
      mapAny.on('load', handler);
      return;
    }

    this.projectionLoadListenerBound = false;
  }

  private applyPendingProjection() {
    if (!this.map || !this.pendingProjection) {
      return;
    }

    const type = this.pendingProjection;

    try {
      console.log(`[FusionMap] Setting projection to ${type}`);
      // @ts-ignore - setProjection types might be missing in some versions
      this.map.setProjection({ type });
      this.pendingProjection = null;
      this.updatePitchLimits();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('Style is not done loading')) {
        this.bindProjectionOnLoad();
        return;
      }
      throw e;
    }
  }

  private updatePitchLimits() {
    if (!this.map) {
      return;
    }

    this.map.setMaxPitch(this.maxPitchLimit);
  }

  private applyBaseMapPresentation(type: MapType) {
    if (!this.map) {
      return;
    }

    if (type === 'cesium') {
      this.setProjection('globe');
      if (this.map.getLayer('tianditu-base')) {
        this.map.setLayoutProperty('tianditu-base', 'visibility', 'none');
      }
      this.enableInteractions();
      return;
    }

    this.setProjection('mercator');
    if (this.map.getLayer('tianditu-base')) {
      this.map.setLayoutProperty('tianditu-base', 'visibility', type === 'tianditu' ? 'visible' : 'none');
    }
    this.enableInteractions();
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

  setReferenceOpacity(opacity: number) {
    const normalizedOpacity = Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : REFERENCE_BASE_OPACITY;
    this.referenceBaseOpacity = normalizedOpacity;

    if (!this.map) {
      return;
    }

    if (this.map.getLayer(REFERENCE_BASE_LAYER_ID)) {
      this.map.setPaintProperty(REFERENCE_BASE_LAYER_ID, 'raster-opacity', normalizedOpacity);
      if (this.map.getLayer(REFERENCE_BG_LAYER_ID)) {
        this.map.setPaintProperty(REFERENCE_BG_LAYER_ID, 'background-opacity', Math.max(0.15, normalizedOpacity * 0.7));
      }
      return;
    }

    this.map.once('load', () => {
      if (this.map.getLayer(REFERENCE_BASE_LAYER_ID)) {
        this.map.setPaintProperty(REFERENCE_BASE_LAYER_ID, 'raster-opacity', this.referenceBaseOpacity);
        if (this.map.getLayer(REFERENCE_BG_LAYER_ID)) {
          this.map.setPaintProperty(
            REFERENCE_BG_LAYER_ID,
            'background-opacity',
            Math.max(0.15, this.referenceBaseOpacity * 0.7)
          );
        }
      }
    });
  }

  private getReferenceTiles(tdtToken: string): string[] {
    if (tdtToken) {
      return this.getTiandituVecTiles(tdtToken);
    }

    return ['https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.png'];
  }

  private getTiandituVecTiles(token: string): string[] {
    const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];
    const encodedToken = encodeURIComponent(token);
    return subdomains.map((s) => {
      return (
        `https://t${s}.tianditu.gov.cn/vec_w/wmts` +
        '?SERVICE=WMTS' +
        '&REQUEST=GetTile' +
        '&VERSION=1.0.0' +
        '&LAYER=vec' +
        '&STYLE=default' +
        '&TILEMATRIXSET=w' +
        '&FORMAT=tiles' +
        '&TILEMATRIX={z}' +
        '&TILEROW={y}' +
        '&TILECOL={x}' +
        `&tk=${encodedToken}`
      );
    });
  }

  // 暴露给外部的方法
  addLayer(layer: maplibregl.LayerSpecification) {
    this.map.addLayer(layer);
  }

  switchBaseMap(type: MapType): Promise<void> {
    this.loadingSubject.next({ type, loading: true });

    if (!this.map) {
      return this.baseMapProvider
        .switchMap(type)
        .then(() => {
          this.loadingSubject.next({ type, loading: false });
          return;
        })
        .catch((error) => {
          this.loadingSubject.next({ type, loading: false });
          const normalizedError = normalizeError(error);
          this.errorSubject.next({
            type,
            message: `Failed to switch to ${type}: ${normalizedError.message}`,
            error: normalizedError.code ? normalizedError : undefined,
            timestamp: Date.now()
          });
          throw error;
        });
    }

    const center = this.map.getCenter();
    const state = {
      center: [center.lng, center.lat] as [number, number],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing()
    };

    return this.baseMapProvider
      .switchMap(type, state)
      .then(() => {
        this.loadingSubject.next({ type, loading: false });
        this.applyBaseMapPresentation(type);
        this.syncCurrentViewToBaseMap();
        return;
      })
      .catch((error) => {
        this.loadingSubject.next({ type, loading: false });
        const normalizedError = normalizeError(error);
        this.errorSubject.next({
          type,
          message: `Failed to switch to ${type}: ${normalizedError.message}`,
          error: normalizedError.code ? normalizedError : undefined,
          timestamp: Date.now()
        });
        // Re-throw the error so the caller can handle it
        throw error;
      });
  }

  private enableInteractions() {
    this.map.setMaxPitch(this.maxPitchLimit);
    this.map.dragRotate.enable();
    this.map.touchZoomRotate.enableRotation();
  }

  private syncCurrentViewToBaseMap() {
    if (!this.map) {
      return;
    }

    const center = this.map.getCenter();
    this.baseMapProvider.updateCamera({
      center: [center.lng, center.lat],
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing()
    });
  }

  // 访问底层 MapLibre 实例（只读）
  getMapInstance() {
    return this.map;
  }

  getThirdPartyCameraState(): { type: MapType; pitch: number | null; heading: number | null } | null {
    const type = this.baseMapProvider.getActiveMapType();
    if (type === 'tianditu') {
      return { type, pitch: null, heading: null };
    }

    const instance = this.baseMapProvider.getMapInstance(type);
    if (!instance) {
      return null;
    }

    try {
      if (type === 'amap') {
        const pitch = typeof instance.getPitch === 'function' ? instance.getPitch() : null;
        const heading = typeof instance.getRotation === 'function' ? -instance.getRotation() : null;
        return { type, pitch, heading };
      }

      if (type === 'baidu') {
        const pitch = typeof instance.getTilt === 'function' ? instance.getTilt() : null;
        const heading = typeof instance.getHeading === 'function' ? instance.getHeading() : null;
        return { type, pitch, heading };
      }

      if (type === 'google') {
        const pitch = typeof instance.getTilt === 'function' ? instance.getTilt() : null;
        const heading = typeof instance.getHeading === 'function' ? instance.getHeading() : null;
        return { type, pitch, heading };
      }

      if (type === 'cesium') {
        const Cesium = (window as any).Cesium;
        if (Cesium?.Math?.toDegrees && instance?.camera) {
          const heading = Cesium.Math.toDegrees(instance.camera.heading);
          const pitch = Cesium.Math.toDegrees(instance.camera.pitch) + 90;
          return { type, pitch, heading };
        }
      }
    } catch (e) {
      console.warn('[FusionMap] Failed to read third-party camera state', e);
    }

    return { type, pitch: null, heading: null };
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
        message: 'Failed to destroy map',
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
