import {
  ThirdPartyMapAdapter,
  type CameraSyncContext,
  type CameraView,
  type ThirdPartyLoadContext
} from './ThirdPartyMapAdapter';

export class CesiumAdapter extends ThirdPartyMapAdapter<any> {
  async load(view: CameraView | undefined, context: ThirdPartyLoadContext): Promise<any> {
    context.loadCss('https://unpkg.com/cesium@1.104.0/Build/Cesium/Widgets/widgets.css');
    (window as any).CESIUM_BASE_URL = 'https://unpkg.com/cesium@1.104.0/Build/Cesium/';

    await context.loadScript('https://unpkg.com/cesium@1.104.0/Build/Cesium/Cesium.js');

    const Cesium = (window as any).Cesium;
    if (context.tokens.cesium) {
      Cesium.Ion.defaultAccessToken = context.tokens.cesium;
    }

    const viewer = new Cesium.Viewer(context.container, {
      animation: false,
      baseLayerPicker: false,
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
      creditContainer: document.createElement('div')
    });

    if (view) {
      const heading = Cesium.Math.toRadians(view.bearing);
      const pitch = Cesium.Math.toRadians(view.pitch - 90);
      const roll = 0;
      const height = this.zoomToHeight(view.zoom, view.center[1], context.containerHeight, context.cesiumScaleFactor);

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(view.center[0], view.center[1], height),
        orientation: { heading, pitch, roll }
      });
    }

    return viewer;
  }

  applyCamera(instance: any, view: CameraView, context: CameraSyncContext): void {
    const Cesium = (window as any).Cesium;

    const range = this.zoomToHeight(view.zoom, view.center[1], context.containerHeight, context.cesiumScaleFactor);
    const center = Cesium.Cartesian3.fromDegrees(view.center[0], view.center[1], 0);
    const heading = Cesium.Math.toRadians(view.bearing);
    const clampPitch = Math.max(view.pitch - 90, -89.99);
    const pitch = Cesium.Math.toRadians(clampPitch);

    instance.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));
    instance.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }

  private zoomToHeight(zoom: number, lat: number, containerHeight: number, scaleFactor: number): number {
    const C = 40075016.686;
    const latRad = lat * (Math.PI / 180);
    const resolution = (C * Math.cos(latRad)) / (512 * Math.pow(2, zoom));
    const visibleMapHeight = resolution * containerHeight;
    const tan30 = 0.577350269;

    return (visibleMapHeight / (2 * tan30)) * scaleFactor;
  }
}
