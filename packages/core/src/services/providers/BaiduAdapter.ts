import gcoord from 'gcoord';
import {
  ThirdPartyMapAdapter,
  type CameraSyncContext,
  type CameraView,
  type ThirdPartyLoadContext
} from './ThirdPartyMapAdapter';
import { PROVIDER_CAMERA_POLICIES, resolveBaiduHeading } from './cameraPolicies';
import { createTokenMissingError } from '../../errors';

export class BaiduAdapter extends ThirdPartyMapAdapter<any> {
  async load(view: CameraView | undefined, context: ThirdPartyLoadContext): Promise<any> {
    const key = context.tokens.baidu;
    if (!key) {
      throw createTokenMissingError('Baidu');
    }

    const url = `https://api.map.baidu.com/api?type=webgl&v=1.0&ak=${key}&callback=bmapInitCallback`;

    if (!(window as any).BMapGL) {
      await new Promise<void>((resolve, reject) => {
        (window as any).bmapInitCallback = () => {
          resolve();
        };
        context.loadScript(url).catch(reject);
      });
    }

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.id = 'bmap-container-inner';
    context.container.appendChild(div);

    const BMapGL = (window as any).BMapGL;
    const map = new BMapGL.Map(div.id);
    map.enableScrollWheelZoom(true);
    map.enableTilt();
    map.enableRotate();

    if (view) {
      const bd = gcoord.transform(view.center, gcoord.WGS84, gcoord.BD09);
      map.centerAndZoom(
        new BMapGL.Point(bd[0], bd[1]),
        view.zoom + PROVIDER_CAMERA_POLICIES.baidu.zoomOffset + context.zoomOffset
      );
      const maxTilt = typeof map.getCurrentMaxTilt === 'function' ? map.getCurrentMaxTilt() : 75;
      map.setTilt(this.clamp(view.pitch, 0, maxTilt));
      map.setHeading(resolveBaiduHeading(view.bearing, view.zoom));
    } else {
      map.centerAndZoom(
        new BMapGL.Point(116.3974, 39.9093),
        12 + PROVIDER_CAMERA_POLICIES.baidu.zoomOffset + context.zoomOffset
      );
    }

    return map;
  }

  applyCamera(instance: any, view: CameraView, context: CameraSyncContext): void {
    console.log('Applying camera for Baidu Map with view:', view, 'and context:', context, instance);
    const BMapGL = (window as any).BMapGL;
    const bd = gcoord.transform(view.center, gcoord.WGS84, gcoord.BD09);
    const point = new BMapGL.Point(bd[0], bd[1]);
    const targetZoom = view.zoom + PROVIDER_CAMERA_POLICIES.baidu.zoomOffset + context.zoomOffset;
    const heading = resolveBaiduHeading(view.bearing, view.zoom);

    instance.setZoom(targetZoom, { noAnimation: true });
    instance.setCenter(point, { noAnimation: true });

    // Known issue (documented in README): Baidu pitch can desync from MapLibre
    // around low-zoom transitions due to provider-side camera constraints.
    // We clamp with provider-reported max tilt before writing pitch.
    const maxTilt = typeof instance.getCurrentMaxTilt === 'function' ? instance.getCurrentMaxTilt() : 75;

    // Keep no-animation writes to reduce visible jitter and transient pitch mismatch.
    instance.setTilt(this.clamp(view.pitch, 0, maxTilt), { noAnimation: true });
    instance.setHeading(heading, { noAnimation: true });

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        instance.setHeading(heading, { noAnimation: true });
      });
    }
  }
}
