import {
  ThirdPartyMapAdapter,
  type CameraSyncContext,
  type CameraView,
  type ThirdPartyLoadContext
} from './ThirdPartyMapAdapter';
import {
  getGoogleMaxTiltForZoom,
  normalizeHeading,
  PROVIDER_CAMERA_POLICIES
} from './cameraPolicies';

export class GoogleAdapter extends ThirdPartyMapAdapter<any> {
  async load(view: CameraView | undefined, context: ThirdPartyLoadContext): Promise<any> {
    const key = context.tokens.google;
    if (!key) {
      throw new Error('Token is required for Google Maps provider');
    }

    if (!(window as any).google || !(window as any).google.maps) {
      await context.loadScript(`https://maps.googleapis.com/maps/api/js?key=${key}&v=beta&libraries=geometry,places`);
    }

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.id = 'google-container-inner';
    context.container.appendChild(div);

    const google = (window as any).google;
    if (!google?.maps) {
      throw new Error('Google Maps SDK is unavailable after script load');
    }

    let Map = google.maps.Map;
    if (typeof google.maps.importLibrary === 'function') {
      const lib = await google.maps.importLibrary('maps');
      Map = lib?.Map || Map;
    }

    if (typeof Map !== 'function') {
      throw new Error('Google Maps constructor is unavailable');
    }

    let center = { lat: 32.0603, lng: 118.7969 };
    let zoom = 14;
    let tilt = 0;
    let heading = 0;

    if (view) {
      center = { lat: view.center[1], lng: view.center[0] };
      zoom = view.zoom + PROVIDER_CAMERA_POLICIES.google.zoomOffset + context.zoomOffset;
      tilt = view.pitch;
      heading = normalizeHeading(-view.bearing);
    }

    tilt = this.clampPitchForZoom(tilt, zoom);

    const mapOptions: any = {
      center,
      zoom,
      heading,
      tilt,
      disableDefaultUI: true,
      mapTypeId: 'roadmap'
    };

    if (context.tokens.googleMapId) {
      mapOptions.mapId = context.tokens.googleMapId;
    }

    const map = new Map(div, mapOptions);
    map.setMapTypeId('roadmap');
    return map;
  }

  applyCamera(instance: any, view: CameraView, context: CameraSyncContext): void {
    const googleZoom = view.zoom + PROVIDER_CAMERA_POLICIES.google.zoomOffset + context.zoomOffset;
    // Known issue (documented in README): Google vector map tilt is zoom-dependent
    // and provider camera updates may temporarily re-clamp tilt near thresholds.
    // Keep enforcing zoom-based max tilt on every sync.
    const googleTilt = this.clampPitchForZoom(view.pitch, googleZoom);

    if (typeof instance.moveCamera === 'function') {
      instance.moveCamera({
        center: { lat: view.center[1], lng: view.center[0] },
        zoom: googleZoom,
        heading: normalizeHeading(view.bearing),
        tilt: googleTilt
      });
      return;
    }

    instance.setCenter({ lat: view.center[1], lng: view.center[0] });
    instance.setZoom(googleZoom);
    instance.setHeading(normalizeHeading(view.bearing));
    instance.setTilt(googleTilt);
  }

  clampPitchForZoom(pitch: number, zoom: number): number {
    const maxTilt = this.getMaxTiltForZoom(zoom);
    return this.clamp(pitch, 0, maxTilt);
  }

  getMaxTiltForZoom(zoom: number): number {
    return getGoogleMaxTiltForZoom(zoom);
  }
}
