import { MapService } from '../decorators';
import { Subject } from 'rxjs';
import type { MapInstances } from '../types';
import {
  ErrorCode,
  FusionMapError,
  createScriptLoadError,
  normalizeError
} from '../errors';
import {
  AmapAdapter,
  BaiduAdapter,
  CesiumAdapter,
  GoogleAdapter,
  type CameraView,
  type ThirdPartyMapAdapter
} from './providers';

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
  private tokens: {
    amap?: string;
    baidu?: string;
    cesium?: string;
    google?: string;
    tianditu?: string;
    googleMapId?: string;
  } = {};
  private cesiumCalibrationFactor: number = 1.9;
  private genericZoomOffset: number = 0; // Dynamic offset for calibration
  private amapAdapter = new AmapAdapter();
  private baiduAdapter = new BaiduAdapter();
  private cesiumAdapter = new CesiumAdapter();
  private googleAdapter = new GoogleAdapter();
  private providerRoutes: Record<
    Exclude<MapType, 'tianditu'>,
    {
      instanceKey: keyof Pick<MapInstances, 'amap' | 'baidu' | 'cesium' | 'google'>;
      adapter: ThirdPartyMapAdapter;
      loadMethod: 'loadAmap' | 'loadBaidu' | 'loadCesium' | 'loadGoogle';
    }
  > = {
    amap: {
      instanceKey: 'amap',
      adapter: this.amapAdapter,
      loadMethod: 'loadAmap'
    },
    baidu: {
      instanceKey: 'baidu',
      adapter: this.baiduAdapter,
      loadMethod: 'loadBaidu'
    },
    cesium: {
      instanceKey: 'cesium',
      adapter: this.cesiumAdapter,
      loadMethod: 'loadCesium'
    },
    google: {
      instanceKey: 'google',
      adapter: this.googleAdapter,
      loadMethod: 'loadGoogle'
    }
  };

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
  private scriptTimeoutMs = 12000;
  private scriptRetryDelayMs = 500;

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

  setTokens(tokens: {
    amap?: string;
    baidu?: string;
    cesium?: string;
    google?: string;
    tianditu?: string;
    googleMapId?: string;
  }) {
    this.tokens = tokens;
  }

  // === Camera Sync Logic ===

  updateCamera(view: CameraView) {
    if (!this.container) {
      this.errorSubject.next({
        type: this.activeMapType,
        message: 'Container is not set',
        timestamp: Date.now()
      });
      return;
    }
    this.lastView = view;

    const context = {
      zoomOffset: this.genericZoomOffset,
      cesiumScaleFactor: this.cesiumCalibrationFactor,
      containerHeight: this.container.clientHeight || 800
    };

    if (this.activeMapType === 'tianditu') {
      return;
    }

    const route = this.providerRoutes[this.activeMapType];
    const instance = this.instances[route.instanceKey];
    if (!instance) {
      return;
    }

    route.adapter.applyCamera(instance as any, view, context);
  }

  // Kept for backward compatibility with existing tests and internal callers
  private zoomToHeight(zoom: number, lat: number) {
    const C = 40075016.686;
    const latRad = lat * (Math.PI / 180);
    const height = this.container ? this.container.clientHeight : 800;
    const resolution = (C * Math.cos(latRad)) / (512 * Math.pow(2, zoom));
    const visibleMapHeight = resolution * height;
    const tan30 = 0.577350269;
    return (visibleMapHeight / (2 * tan30)) * this.cesiumCalibrationFactor;
  }

  async switchMap(
    type: MapType,
    initialView?: { center: [number, number]; zoom: number; pitch: number; bearing: number }
  ) {
    console.log(`[BaseMapProvider] Switching to ${type}`);
    this.activeMapType = type;

    // 清空容器
    if (this.container) {
      this.container.innerHTML = '';
      // 如果有之前的实例需要销毁
      for (const route of Object.values(this.providerRoutes)) {
        const instance = this.instances[route.instanceKey];
        if (!instance) {
          continue;
        }
        route.adapter.dispose(instance as any);
        this.instances[route.instanceKey] = null;
      }
    }

    if (type === 'tianditu') {
      return;
    }

    const route = this.providerRoutes[type];
    await this[route.loadMethod](initialView);
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

    const promise = this.loadScriptWithRetry(src).finally(() => {
      this.loadingScripts.delete(src);
    });

    this.loadingScripts.set(src, promise);
    return promise;
  }

  private async loadScriptWithRetry(src: string): Promise<void> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      this.retryAttempts.set(src, attempt);

      try {
        await this.loadScriptOnce(src, this.scriptTimeoutMs);
        this.retryAttempts.delete(src);
        return;
      } catch (e) {
        const normalized = normalizeError(e);
        const isLastAttempt = attempt === this.maxRetries;

        if (isLastAttempt) {
          const finalError = normalized.code ? normalized : createScriptLoadError(src, normalized);

          this.errorSubject.next({
            type: this.activeMapType,
            message: finalError.message,
            error: finalError,
            timestamp: Date.now()
          });

          throw finalError;
        }

        console.warn(`[BaseMapProvider] Script load failed, retry ${attempt + 1}/${this.maxRetries}: ${src}`);

        await this.delay(this.scriptRetryDelayMs * (attempt + 1));
      }
    }
  }

  private loadScriptOnce(src: string, timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;

      let settled = false;
      const onDone = (handler: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        script.onload = null;
        script.onerror = null;
        handler();
      };

      const timer = globalThis.setTimeout(() => {
        onDone(() => {
          script.remove?.();
          reject(
            new FusionMapError(ErrorCode.TIMEOUT, `Script load timeout: ${src}`, {
              context: { src, timeoutMs, mapType: this.activeMapType }
            })
          );
        });
      }, timeoutMs);

      script.onload = () => {
        onDone(() => {
          globalThis.clearTimeout(timer);
          resolve();
        });
      };

      script.onerror = (event) => {
        onDone(() => {
          globalThis.clearTimeout(timer);
          script.remove?.();
          const cause = event instanceof Error ? event : new Error('Unknown script load error');
          reject(createScriptLoadError(src, cause));
        });
      };

      document.head.appendChild(script);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      globalThis.setTimeout(resolve, ms);
    });
  }

  private async loadAmap(view?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      this.errorSubject.next({
        type: 'amap',
        message: 'Container is not set',
        timestamp: Date.now()
      });
      return;
    }

    this.loadingSubject.next({ type: 'amap', loading: true });

    try {
      if (this.activeMapType !== 'amap' || !this.container) {
        this.loadingSubject.next({ type: 'amap', loading: false });
        return;
      }
      this.instances.amap = await this.amapAdapter.load(view, this.createAdapterLoadContext());
      console.log('[BaseMapProvider] Amap loaded.');
      this.loadingSubject.next({ type: 'amap', loading: false });
    } catch (e) {
      console.error('Failed to load Amap', e);
      this.loadingSubject.next({ type: 'amap', loading: false });
      const error = e instanceof Error ? e : new Error(String(e));
      this.errorSubject.next({
        type: 'amap',
        message: 'Failed to load Amap',
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
        message: 'Container is not set',
        timestamp: Date.now()
      });
      return;
    }

    this.loadingSubject.next({ type: 'baidu', loading: true });

    try {
      this.instances.baidu = await this.baiduAdapter.load(view, this.createAdapterLoadContext());
      console.log('[BaseMapProvider] Baidu GL loaded.');
      this.loadingSubject.next({ type: 'baidu', loading: false });
    } catch (e) {
      console.error('Failed to load Baidu', e);
      this.loadingSubject.next({ type: 'baidu', loading: false });
      const error = e instanceof Error ? e : new Error(String(e));
      this.errorSubject.next({
        type: 'baidu',
        message: 'Failed to load Baidu',
        error,
        timestamp: Date.now()
      });
      this.renderError('Failed to load Baidu');
    }
  }

  private async loadGoogle(view?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      this.errorSubject.next({
        type: 'google',
        message: 'Container is not set',
        timestamp: Date.now()
      });
      return;
    }

    this.loadingSubject.next({ type: 'google', loading: true });

    try {
      this.instances.google = await this.googleAdapter.load(view, this.createAdapterLoadContext());
      console.log('[BaseMapProvider] Google Maps loaded.');
      this.loadingSubject.next({ type: 'google', loading: false });
    } catch (e) {
      console.error('Failed to load Google Maps', e);
      this.loadingSubject.next({ type: 'google', loading: false });
      const normalizedError = normalizeError(e);
      this.errorSubject.next({
        type: 'google',
        message: normalizedError.message,
        error: normalizedError.code ? normalizedError : undefined,
        timestamp: Date.now()
      });
      this.renderError(normalizedError.message, 'google');
    }
  }

  private loadCss(href: string) {
    if (document.querySelector(`link[href="${href}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  private async loadCesium(view?: { center: [number, number]; zoom: number; pitch: number; bearing: number }) {
    if (!this.container) {
      this.errorSubject.next({
        type: 'cesium',
        message: 'Container is not set',
        timestamp: Date.now()
      });
      return;
    }

    this.loadingSubject.next({ type: 'cesium', loading: true });

    try {
      this.container.innerHTML = '<div style="color:white;padding:20px;">Loading Cesium (CDN)...</div>';
      if (!this.container) {
        this.loadingSubject.next({ type: 'cesium', loading: false });
        return;
      }
      this.container.innerHTML = ''; // Clear loading text

      this.instances.cesium = await this.cesiumAdapter.load(view, this.createAdapterLoadContext());

      console.log('[BaseMapProvider] Cesium loaded via CDN.');
      this.loadingSubject.next({ type: 'cesium', loading: false });
    } catch (e) {
      console.error('Failed to load Cesium', e);
      this.loadingSubject.next({ type: 'cesium', loading: false });
      const error = e instanceof Error ? e : new Error(String(e));
      this.errorSubject.next({
        type: 'cesium',
        message: 'Failed to load Cesium (Network/CDN error)',
        error,
        timestamp: Date.now()
      });
      this.renderError('Failed to load Cesium (Network/CDN error)', 'cesium');
    }
  }

  private createAdapterLoadContext() {
    if (!this.container) {
      throw new Error('Container is not set');
    }

    return {
      container: this.container,
      tokens: this.tokens,
      zoomOffset: this.genericZoomOffset,
      cesiumScaleFactor: this.cesiumCalibrationFactor,
      loadScript: this.loadScript.bind(this),
      loadCss: this.loadCss.bind(this)
    };
  }

  private renderError(msg: string, type: string = 'error') {
    if (!this.container) {
      return;
    }
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
    if (type === 'tianditu') {
      return null;
    }
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
