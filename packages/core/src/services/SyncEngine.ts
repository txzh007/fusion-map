import maplibregl from 'maplibre-gl';
import { MapService, Watch, AutoBind, Inject, WATCH_METADATA_KEY, WatchMetadata } from '../decorators';
import { BaseMapProvider } from './BaseMapProvider';
import { debounce } from 'lodash-es';

@MapService()
export class SyncEngine {
  private map: maplibregl.Map | null = null;
  private isSyncing = false;

  @Inject(() => BaseMapProvider)
  private baseMapProvider!: BaseMapProvider;

  // 防抖的相机更新函数
  private debouncedUpdateCamera = debounce(() => {
    if (!this.map || this.isSyncing) {return;}

    this.isSyncing = true;
    try {
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();
      const bearing = this.map.getBearing();
      const pitch = this.map.getPitch();

      this.baseMapProvider.updateCamera({
        center: [center.lng, center.lat],
        zoom,
        pitch,
        bearing
      });
    } finally {
      this.isSyncing = false;
    }
  }, 100); // 100ms 防抖

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
    this.debouncedUpdateCamera();
  }

  @Watch('zoom')
  @AutoBind
  onZoomChange() {
    console.log('[SyncEngine] Zoom changed, adjusting LOD...');
  }
}
