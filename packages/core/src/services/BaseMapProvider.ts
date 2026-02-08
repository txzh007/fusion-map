import gcoord from 'gcoord';
import { MapService } from '../decorators';
import { Subject } from 'rxjs';
import type { MapInstances } from '../types';
import {
  ErrorCode,
  createTokenMissingError,
  createScriptLoadError,
  createMapLoadError,
  normalizeError,
  type MapError as ExternalMapError
} from '../errors';

export type MapType = 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';

/**
 * 地图错误信息（内部使用）
 */
export interface MapError {
  type: MapType;
  message: string;
  error?: Error;
  timestamp: number;
}

export interface MapLoadingState {
  type: MapType;
  loading: boolean;
  progress?: number;
}

@MapService()
export class BaseMapProvider {
  private activeMapType: MapType = 'amap';
  private container: HTMLElement | null = null;
  private viewer: unknown = null; // Cesium Viewer
  private tokens: { amap?: string; baidu?: string; cesium?: string; google?: string; tianditu?: string; googleMapId?: string; } = {};
  private cesiumCalibrationFactor: number = 1.9;
  private genericZoomOffset: number = 0; // Dynamic offset for calibration

  // Store instances internally instead of on window
  private instances: Partial<MapInstances> = {
    amap: null,
    baidu: null,
    cesium: null,
    google: null
  };

  // Error and loading state subjects
  private errorSubject = new Subject<MapError>();
  private loadingSubject = new Subject<MapLoadingState>();

  // Public observables
  public errors$ = this.errorSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Track loading scripts to prevent duplicates
  private loadingScripts = new Map<string, Promise<void>>();

  // Track retry attempts
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  setContainer(element: HTMLElement) {
    this.container = element;
  }

  setCesiumScaleFactor(factor: number) {
    this.cesiumCalibrationFactor = factor;
    // Trigger immediate update if Cesium is active
    if (this.activeMapType === 'cesium' && this.lastView) {
      this.updateCamera(this.lastView);
    }
  }

  setZoomOffset(offset: number) {
    this.genericZoomOffset = offset;
    if (this.lastView) {
      this.updateCamera(this.lastView);
    }
  }

  private lastView: { center: [number, number]; zoom: number; pitch: number; bearing: number } | null = null;

  setTokens(tokens: { amap?: string; baidu?: string; cesium?: string; google?: string; tianditu?: string; googleMapId?: string; }) {
    this.tokens = tokens;
  }

  // === Camera Sync Logic ===

  updateCamera(view: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      this.errorSubject.next({
        type: this.activeMapType,
        message: '容器未设置',
        timestamp: Date.now()
      });
      return;
    }
    this.lastView = view;

    if (this.activeMapType === 'amap') {
      const amap = this.instances.amap;
      if (amap) {
        // Transform WGS84 -> GCJ02
        const gcj = gcoord.transform(view.center, gcoord.WGS84, gcoord.GCJ02);
        // MapLibre (512px tiles) is typically 1 level lower than Amap (256px tiles) for same scale
        // Previously +1. Now +1 + genericOffset
        amap.setZoomAndCenter(view.zoom + 1 + this.genericZoomOffset, gcj, true);
        amap.setPitch(view.pitch, true);
        amap.setRotation(-view.bearing, true);
      }
    } else if (this.activeMapType === 'baidu') {
      const bmap = this.instances.baidu;
      if (bmap) {
        const BMapGL = (window as any).BMapGL;
        // Transform WGS84 -> BD09
        const bd = gcoord.transform(view.center, gcoord.WGS84, gcoord.BD09);
        const point = new BMapGL.Point(bd[0], bd[1]);

        bmap.setHeading(-view.bearing, { noAnimation: true });
        bmap.setTilt(view.pitch, { noAnimation: true });
        // Previously +1.75. Now +1.75 + genericOffset
        bmap.setZoom(view.zoom + 1.75 + this.genericZoomOffset, { noAnimation: true });
        bmap.setCenter(point, { noAnimation: true });
      }
    } else if (this.activeMapType === 'cesium') {
      const viewer = this.instances.cesium;
      if (viewer) {
        const Cesium = (window as any).Cesium;

        // Use lookAt to pivot around the center point
        // Range = Distance from center. equivalent to altitude when pitch is -90.
        const range = this.zoomToHeight(view.zoom, view.center[1]);
        const center = Cesium.Cartesian3.fromDegrees(view.center[0], view.center[1], 0);

        const heading = Cesium.Math.toRadians(view.bearing);
        // Clamp pitch to avoid -90 degree singularity (Gimbal Lock) which resets heading
        const clampPitch = Math.max(view.pitch - 90, -89.99);
        const pitch = Cesium.Math.toRadians(clampPitch);

        viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));

        // Unlock camera reference frame so it's not permanently locked to that point
        // But keep the position we just set
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      }
    } else if (this.activeMapType === 'google') {
      const map = this.instances.google;
      if (map) {
        // Sync Google Maps
        // MapLibre vs Google scale.
        // Applying genericZoomOffset
        // Check if moveCamera exists (Vector Map feature)
        if (typeof map.moveCamera === 'function') {
          console.log('[BaseMapProvider] Google Sync:', { z: view.zoom, h: view.bearing, p: view.pitch, map });
          map.moveCamera({
            center: { lat: view.center[1], lng: view.center[0] },
            zoom: view.zoom + 1 + this.genericZoomOffset,
            heading: view.bearing,
            tilt: view.pitch
          });
        } else {
          console.warn('[BaseMapProvider] Google Map is not Vector! moveCamera missing. Fallback to setters.');
          map.setCenter({ lat: view.center[1], lng: view.center[0] });
          map.setZoom(view.zoom + 1 + this.genericZoomOffset);
          map.setHeading(view.bearing);
          map.setTilt(view.pitch);
        }
      }
    }
    // tianditu: no sync needed, handled by FusionMap native
  }

  // Helper to convert Web Mercator Zoom to Altitude
  // Precise formula matching MapLibre's scale to Cesium's Perspective Camera
  private zoomToHeight(zoom: number, lat: number) {
    // 1. Earth Circumference (Meters)
    const C = 40075016.686;
    const latRad = lat * (Math.PI / 180);

    // 2. Get Canvas Height (or default to 800 if not attached)
    const height = this.container ? this.container.clientHeight : 800;

    // 3. Calculate MapLibre Ground Resolution at Center (Meters/Pixel)
    // Res = (C * cos(lat)) / (512 * 2^zoom)
    const resolution = (C * Math.cos(latRad)) / (512 * Math.pow(2, zoom));

    // 4. Calculate Visible Map Width (Meters) presented in the viewport
    // Note: This logic assumes we match the VERTICAL coverage.
    // If MapLibre fills height H with N meters, Cesium should too.
    const visibleMapHeight = resolution * height;

    // 5. Calculate Cesium Altitude required to see that height
    // Cesium Default FOV is 60 degrees (Vertical) -> PI/3
    // visibleHeight = 2 * altitude * tan(FOV/2)
    // altitude = visibleHeight / (2 * tan(FOV/2))

    // tan(60/2) = tan(30) = 0.577350269
    const tan30 = 0.577350269;

    // Apply user-defined calibration factor
    return (visibleMapHeight / (2 * tan30)) * this.cesiumCalibrationFactor;
  }

  async switchMap(type: MapType, initialView?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    console.log(`[BaseMapProvider] Switching to ${type}`);
    this.activeMapType = type;

    // 清空容器
    if (this.container) {
      this.container.innerHTML = '';
      // 如果有之前的实例需要销毁
      if (this.instances.amap) {
        this.instances.amap.destroy();
        this.instances.amap = null;
      }
      // Baidu logic usually just needs DOM clear, but good to nullify
      if (this.instances.baidu) {
        this.instances.baidu = null;
      }
      // Cesium cleanup
      if (this.instances.cesium) {
        this.instances.cesium = null;
      }
      // Google cleanup
      if (this.instances.google) {
        this.instances.google = null;
      }
    }

    if (type === 'cesium') {
      await this.loadCesium(initialView);
    } else if (type === 'amap') {
      await this.loadAmap(initialView);
    } else if (type === 'baidu') {
      await this.loadBaidu(initialView);
    } else if (type === 'google') {
      await this.loadGoogle(initialView);
    }
    // tianditu: do nothing, container stays empty
  }

  // 动态加载脚本助手
  private loadScript(src: string): Promise<void> {
    // 检查是否已经在加载中
    if (this.loadingScripts.has(src)) {
      return this.loadingScripts.get(src)!;
    }

    // 检查是否已经加载过
    if (document.querySelector(`script[src="${src}"]`)) {
      return Promise.resolve();
    }

    const promise = new Promise<void>((resolve, reject) => {
      const attemptLoad = (retryCount: number = 0) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          this.loadingScripts.delete(src);
          this.retryAttempts.delete(src);
          resolve();
        };
        script.onerror = (error) => {
          this.loadingScripts.delete(src);

          // 重试逻辑
          if (retryCount < this.maxRetries) {
            console.warn(`[BaseMapProvider] 脚本加载失败，重试 ${retryCount + 1}/${this.maxRetries}: ${src}`);
            setTimeout(() => attemptLoad(retryCount + 1), 1000 * (retryCount + 1));
          } else {
            const errorMsg = `脚本加载失败: ${src}`;
            this.errorSubject.next({
              type: this.activeMapType,
              message: errorMsg,
              error: error instanceof Error ? error : new Error(String(error)),
              timestamp: Date.now()
            });
            reject(new Error(errorMsg));
          }
        };
        document.head.appendChild(script);
      };

      attemptLoad();
    });

    this.loadingScripts.set(src, promise);
    return promise;
  }

  private async loadAmap(view?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      const error = normalizeError('Container not set');
      this.errorSubject.next({
        type: 'amap',
        message: '容器未设置',
        error: error.code ? error : undefined,
        timestamp: Date.now()
      });
      return;
    }

    const key = this.tokens.amap;
    if (!key) {
      const error = createTokenMissingError('Amap');
      this.errorSubject.next({
        type: 'amap',
        message: error.message,
        error: error.code ? error : undefined,
        timestamp: Date.now()
      });
      this.renderError('Please provide Amap Key (JS API)', 'amap');
      return;
    }

    this.loadingSubject.next({ type: 'amap', loading: true });

    try {
      // 1. 加载 JSAPI Loader (或者直接加载 API)
      const callbackName = 'amapInitCallback';
      const url = `https://webapi.amap.com/maps?v=2.0&key=${key}&callback=${callbackName}`;

      if (!(window as any).AMap) {
        await new Promise<void>((resolve, reject) => {
          (window as any)[callbackName] = () => {
            delete (window as any)[callbackName];
            resolve();
          };
          this.loadScript(url).catch(reject);
        });
      }

      // 2. 初始化地图
      const div = document.createElement('div');
      div.style.width = '100%';
      div.style.height = '100%';
      div.id = 'amap-container-inner';
      this.container.appendChild(div);

      const AMap = (window as any).AMap;

      // Determine initial state
      let center = [116.3974, 39.9093];
      let zoom = 12; // Base logic
      let pitch = 0;
      let rotation = 0;

      if (view) {
        // Transform WGS84 -> GCJ02
        center = gcoord.transform(view.center, gcoord.WGS84, gcoord.GCJ02);
        zoom = view.zoom + 1; // MapLibre -> Amap Offset
        pitch = view.pitch;
        rotation = -view.bearing;
      }

      const map = new AMap.Map(div.id, {
        viewMode: '3D', // Enable 3D mode
        resizeEnable: true,
        zoom: zoom,
        center: center,
        pitch: pitch,
        rotation: rotation
      });
      this.instances.amap = map;
      console.log('[BaseMapProvider] Amap loaded.');
      this.loadingSubject.next({ type: 'amap', loading: false });

    } catch (e) {
      console.error('Failed to load Amap', e);
      this.loadingSubject.next({ type: 'amap', loading: false });
      const error = e instanceof Error ? e : new Error(String(e));
      this.errorSubject.next({
        type: 'amap',
        message: '高德地图加载失败',
        error,
        timestamp: Date.now()
      });
      this.renderError('Failed to load Amap SDK');
    }
  }

  private async loadBaidu(view?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      this.errorSubject.next({
        type: 'baidu',
        message: '容器未设置',
        timestamp: Date.now()
      });
      return;
    }

    const key = this.tokens.baidu;
    if (!key) {
      this.errorSubject.next({
        type: 'baidu',
        message: '请提供百度地图 AK (WebGL)',
        timestamp: Date.now()
      });
      this.renderError('Please provide Baidu AK (WebGL)', 'baidu');
      return;
    }

    this.loadingSubject.next({ type: 'baidu', loading: true });

    // 百度 GL 版
    const url = `https://api.map.baidu.com/api?type=webgl&v=1.0&ak=${key}&callback=bmapInitCallback`;

    try {
      if (!(window as any).BMapGL) {
        await new Promise<void>((resolve, reject) => {
          (window as any).bmapInitCallback = () => {
            resolve();
          };
          this.loadScript(url).catch(reject);
        });
      }

      const div = document.createElement('div');
      div.style.width = '100%';
      div.style.height = '100%';
      div.id = 'bmap-container-inner';
      this.container.appendChild(div);

      const BMapGL = (window as any).BMapGL;
      const map = new BMapGL.Map(div.id);
      map.enableScrollWheelZoom(true);
      map.enableTilt();
      map.enableRotate();

      // Determine initial state
      if (view) {
        const bd = gcoord.transform(view.center, gcoord.WGS84, gcoord.BD09);
        // Baidu allows float zoom? Yes.
        // Baidu is approx +1.75 offset from MapLibre as per calibration
        map.centerAndZoom(new BMapGL.Point(bd[0], bd[1]), view.zoom + 1.75);
        map.setTilt(view.pitch);
        map.setHeading(-view.bearing);
      } else {
        map.centerAndZoom(new BMapGL.Point(116.3974, 39.9093), 12 + 1.75);
      }

      this.instances.baidu = map; // Save instance for sync
      console.log('[BaseMapProvider] Baidu GL loaded.');
      this.loadingSubject.next({ type: 'baidu', loading: false });

    } catch (e) {
      console.error('Failed to load Baidu', e);
      this.loadingSubject.next({ type: 'baidu', loading: false });
      const error = e instanceof Error ? e : new Error(String(e));
      this.errorSubject.next({
        type: 'baidu',
        message: '百度地图加载失败',
        error,
        timestamp: Date.now()
      });
      this.renderError('Failed to load Baidu SDK');
    }
  }

  private async loadGoogle(view?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      this.errorSubject.next({
        type: 'google',
        message: '容器未设置',
        timestamp: Date.now()
      });
      return;
    }

    const key = this.tokens.google;
    if (!key) {
      this.errorSubject.next({
        type: 'google',
        message: '请提供 Google Maps API Key',
        timestamp: Date.now()
      });
      this.renderError('Please provide Google Maps API Key', 'google');
      return;
    }

    this.loadingSubject.next({ type: 'google', loading: true });

    try {
      // Load Google Maps script
      // v=beta is needed for WebGL/Tilt features sometimes, or just use 'weekly'
      // We need to load main script then importing libraries
      // Legacy loading usually: https://maps.googleapis.com/maps/api/js?key=...

      if (!(window as any).google || !(window as any).google.maps) {
        await this.loadScript(`https://maps.googleapis.com/maps/api/js?key=${key}&v=beta&libraries=geometry,places`);
      }

      const div = document.createElement('div');
      div.style.width = '100%';
      div.style.height = '100%';
      div.id = 'google-container-inner';
      this.container.appendChild(div);

      const google = (window as any).google;
      const { Map } = await google.maps.importLibrary('maps');

      // Initial state
      let center = { lat: 32.0603, lng: 118.7969 };
      let zoom = 14;
      let tilt = 0;
      let heading = 0;

      if (view) {
        center = { lat: view.center[1], lng: view.center[0] };
        zoom = view.zoom;
        tilt = view.pitch;
        heading = -view.bearing;
      }

      const map = new Map(div, {
        center,
        zoom,
        heading,
        tilt,
        mapId: this.tokens.googleMapId || 'DEMO_MAP_ID', // Required for Vector Maps
        // renderingType: 'VECTOR', // Explicitly request vector (if types allow, or just rely on mapId)
        disableDefaultUI: true, // Hide UI controls
        mapTypeId: 'roadmap' // Vector features are best in roadmap
        // mapTypeId: 'satellite' // Satellite also supports tilt in 3D mode
      });

      // Force roadmap
      map.setMapTypeId('roadmap');

      this.instances.google = map;
      console.log('[BaseMapProvider] Google Maps loaded.');
      this.loadingSubject.next({ type: 'google', loading: false });

    } catch (e) {
      console.error('Failed to load Google Maps', e);
      this.loadingSubject.next({ type: 'google', loading: false });
      const error = e instanceof Error ? e : new Error(String(e));
      this.errorSubject.next({
        type: 'google',
        message: 'Google Maps 加载失败',
        error,
        timestamp: Date.now()
      });
      this.renderError('Failed to load Google Maps SDK', 'google');
    }
  }

  private loadCss(href: string) {
    if (document.querySelector(`link[href="${href}"]`)) {return;}
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  private async loadCesium(view?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      this.errorSubject.next({
        type: 'cesium',
        message: '容器未设置',
        timestamp: Date.now()
      });
      return;
    }

    this.loadingSubject.next({ type: 'cesium', loading: true });

    // 1. Inject Style
    this.loadCss('https://unpkg.com/cesium@1.104.0/Build/Cesium/Widgets/widgets.css');

    // 2. Set Base URL
    (window as any).CESIUM_BASE_URL = 'https://unpkg.com/cesium@1.104.0/Build/Cesium/';

    const token = this.tokens.cesium;

    try {
      this.container.innerHTML = '<div style="color:white;padding:20px;">Loading Cesium (CDN)...</div>';

      // 3. Load Script
      await this.loadScript('https://unpkg.com/cesium@1.104.0/Build/Cesium/Cesium.js');

      if (!this.container) {
        this.loadingSubject.next({ type: 'cesium', loading: false });
        return;
      }
      this.container.innerHTML = ''; // Clear loading text

      const Cesium = (window as any).Cesium;
      if (token) {
        Cesium.Ion.defaultAccessToken = token;
      }

      const viewer = new Cesium.Viewer(this.container, {
        animation: false,
        baseLayerPicker: false, // We control base layer via FusionMap mechanisms strictly, or allow Cesium's?
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        scene3DOnly: true,
        creditContainer: document.createElement('div') // Hide credits for demo cleanup
      });

      this.instances.cesium = viewer;

      // Initial View
      if (view) {
        const heading = Cesium.Math.toRadians(view.bearing);
        const pitch = Cesium.Math.toRadians(view.pitch - 90);
        const roll = 0;
        const height = this.zoomToHeight(view.zoom, view.center[1]);

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(view.center[0], view.center[1], height),
          orientation: { heading, pitch, roll }
        });
      }

      console.log('[BaseMapProvider] Cesium loaded via CDN.');
      this.loadingSubject.next({ type: 'cesium', loading: false });

    } catch (e) {
      console.error('Failed to load Cesium', e);
      this.loadingSubject.next({ type: 'cesium', loading: false });
      const error = e instanceof Error ? e : new Error(String(e));
      this.errorSubject.next({
        type: 'cesium',
        message: 'Cesium 加载失败 (网络/CDN 错误)',
        error,
        timestamp: Date.now()
      });
      this.renderError('Failed to load Cesium (Network/CDN error?)', 'cesium');
    }
  }

  private renderError(msg: string, type: string = 'error') {
    if (!this.container) {return;}
    this.container.innerHTML = `<div style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100%;color:#666;background:#f8f8f8;text-align:center;padding:20px;
      ">
      <h3>${type.toUpperCase()}</h3>
      <p>${msg}</p>
      <small style="color:#999">See console for details</small>
    </div>`;
  }

  /**
   * 获取当前地图实例
   */
  getMapInstance(type: MapType): any {
    if (type === 'tianditu') {return null;}
    return this.instances[type as keyof typeof this.instances];
  }

  /**
   * 清理错误
   */
  clearError(type: MapType): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * 获取当前激活的地图类型
   */
  getActiveMapType(): MapType {
    return this.activeMapType;
  }

  /**
   * 重置所有状态
   */
  reset(): void {
    // 清理所有实例
    if (this.instances.amap) {
      this.instances.amap.destroy?.();
    }
    this.instances.amap = null;
    this.instances.baidu = null;
    this.instances.cesium = null;
    this.instances.google = null;

    // 清理容器
    if (this.container) {
      this.container.innerHTML = '';
    }

    // 重置状态
    this.activeMapType = 'amap';
    this.lastView = null;
    this.viewer = null;

    // 清理缓存
    this.loadingScripts.clear();
    this.retryAttempts.clear();
  }
}
