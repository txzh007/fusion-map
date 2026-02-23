import gcoord from 'gcoord';
import {
  ThirdPartyMapAdapter,
  type CameraSyncContext,
  type CameraView,
  type ThirdPartyLoadContext
} from './ThirdPartyMapAdapter';
import { normalizeHeading, PROVIDER_CAMERA_POLICIES } from './cameraPolicies';

export class AmapAdapter extends ThirdPartyMapAdapter<any> {
  async load(view: CameraView | undefined, context: ThirdPartyLoadContext): Promise<any> {
    const key = context.tokens.amap;
    if (!key) {
      throw new Error('Token is required for Amap map provider');
    }

    const callbackName = 'amapInitCallback';
    const url = `https://webapi.amap.com/maps?v=2.0&key=${key}&callback=${callbackName}`;

    if (!(window as any).AMap) {
      await new Promise<void>((resolve, reject) => {
        (window as any)[callbackName] = () => {
          delete (window as any)[callbackName];
          resolve();
        };
        context.loadScript(url).catch(reject);
      });
    }

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.id = 'amap-container-inner';
    context.container.appendChild(div);

    if (!context.container.isConnected || !div.isConnected) {
      throw new Error('Amap container is detached');
    }

    const AMap = (window as any).AMap;

    let center = [116.3974, 39.9093];
    let zoom = 12;
    let pitch = 0;
    let rotation = 0;

    if (view) {
      center = gcoord.transform(view.center, gcoord.WGS84, gcoord.GCJ02);
      zoom = view.zoom + PROVIDER_CAMERA_POLICIES.amap.zoomOffset + context.zoomOffset;
      pitch = this.clamp(
        view.pitch,
        PROVIDER_CAMERA_POLICIES.amap.pitchRange[0],
        PROVIDER_CAMERA_POLICIES.amap.pitchRange[1]
      );
      rotation = normalizeHeading(-view.bearing);
    }

    return new AMap.Map(div, {
      viewMode: '3D',
      resizeEnable: true,
      zoom,
      center,
      pitch,
      rotation
    });
  }

  applyCamera(instance: any, view: CameraView, context: CameraSyncContext): void {
    const gcj = gcoord.transform(view.center, gcoord.WGS84, gcoord.GCJ02);
    const rotation = normalizeHeading(-view.bearing);

    // Known issue (documented in README): AMap may temporarily desync pitch from
    // MapLibre near zoom-threshold transitions due to provider-side camera limits.
    // We keep pitch clamped to provider policy on every camera apply.
    instance.setZoomAndCenter(view.zoom + PROVIDER_CAMERA_POLICIES.amap.zoomOffset + context.zoomOffset, gcj, true);
    instance.setPitch(
      this.clamp(
        view.pitch,
        PROVIDER_CAMERA_POLICIES.amap.pitchRange[0],
        PROVIDER_CAMERA_POLICIES.amap.pitchRange[1]
      ),
      true
    );
    instance.setRotation(rotation, true);

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        instance.setRotation(rotation, true);
      });
    }
  }

  override dispose(instance: any): void {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
  }
}
