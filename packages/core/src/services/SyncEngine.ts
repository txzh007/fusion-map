import maplibregl from 'maplibre-gl';
import { MapService, Watch, AutoBind, Inject, WATCH_METADATA_KEY, WatchMetadata } from '../decorators';
import { BaseMapProvider } from './BaseMapProvider';
import { PROVIDER_CAMERA_POLICIES } from './providers/cameraPolicies';

@MapService()
export class SyncEngine {
  private map: maplibregl.Map | null = null;
  private isSyncing = false;
  private framePending = false;
  private static readonly IMMEDIATE_SYNC_INTERVAL_MS = 8;
  private lastImmediateSyncAt = 0;
  private static readonly BEARING_EPSILON = 0.01;

  @Inject(() => BaseMapProvider)
  private baseMapProvider!: BaseMapProvider;

  private pushCameraState() {
    if (!this.map || this.isSyncing) {return;}

    this.isSyncing = true;
    try {
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();
      let bearing = this.map.getBearing();
      const pitch = this.map.getPitch();
      const activeMapType =
        typeof (this.baseMapProvider as any).getActiveMapType === 'function'
          ? (this.baseMapProvider as any).getActiveMapType()
          : 'amap';

      if (
        activeMapType === 'baidu' &&
        zoom <= PROVIDER_CAMERA_POLICIES.baidu.autoNorthAtMaplibreZoom &&
        Math.abs(bearing) > SyncEngine.BEARING_EPSILON
      ) {
        this.map.setBearing(0);
        bearing = 0;
      }

      this.baseMapProvider.updateCamera({
        center: [center.lng, center.lat],
        zoom,
        pitch,
        bearing
      });
    } finally {
      this.isSyncing = false;
    }
  }

  private scheduleCameraSync(immediate: boolean = false) {
    if (immediate) {
      const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
      if (now - this.lastImmediateSyncAt >= SyncEngine.IMMEDIATE_SYNC_INTERVAL_MS) {
        this.lastImmediateSyncAt = now;
        this.pushCameraState();
      }
    }

    if (this.framePending) {return;}
    this.framePending = true;

    const requestFrame =
      typeof globalThis.requestAnimationFrame === 'function'
        ? globalThis.requestAnimationFrame.bind(globalThis)
        : (cb: FrameRequestCallback) => globalThis.setTimeout(() => cb(Date.now()), 16);

    requestFrame(() => {
      this.framePending = false;
      this.pushCameraState();
    });
  }

  // 绑定 MapLibre 实例并自动挂载 @Watch 事件
  bind(map: maplibregl.Map) {
    if (this.map === map) {return;} // 已经绑定
    this.map = map;
    this.attachListeners();
  }

  private attachListeners() {
    if (!this.map) {return;}

    // 读取元数据，自动绑定事件
    const watchers: WatchMetadata[] = Reflect.getMetadata(WATCH_METADATA_KEY, this) || [];
    watchers.forEach(({ eventName, methodName }) => {
      console.log(`[SyncEngine] Auto-binding event '${eventName}' to method '${methodName}'`);
      // 下面这行很重要：this[methodName] 必须是已经 bind 过的，或者方法本身用了箭头函数
      // 我们这里使用 @AutoBind 装饰器来保证
      this.map!.on(eventName, (this as any)[methodName]);
    });
  }

  @Watch('move')
  @AutoBind
  onCameraMove() {
    if (!this.map) {return;}
    this.scheduleCameraSync(true);
  }

  @Watch('zoom')
  @AutoBind
  onZoomChange() {
    console.log('[SyncEngine] Zoom changed, adjusting LOD...');
    this.scheduleCameraSync(true);
  }

  @Watch('pitch')
  @AutoBind
  onPitchChange() {
    this.scheduleCameraSync(true);
  }

  @Watch('rotate')
  @AutoBind
  onRotateChange() {
    this.scheduleCameraSync(true);
  }
}
