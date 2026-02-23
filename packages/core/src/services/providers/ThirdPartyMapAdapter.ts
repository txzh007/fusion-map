export interface CameraView {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface CameraSyncContext {
  zoomOffset: number;
  cesiumScaleFactor: number;
  containerHeight: number;
}

export interface ThirdPartyLoadContext {
  container: HTMLElement;
  tokens: {
    amap?: string;
    baidu?: string;
    cesium?: string;
    google?: string;
    tianditu?: string;
    googleMapId?: string;
  };
  zoomOffset: number;
  cesiumScaleFactor: number;
  loadScript: (src: string) => Promise<void>;
  loadCss: (href: string) => void;
}

export abstract class ThirdPartyMapAdapter<TInstance = any> {
  abstract load(view: CameraView | undefined, context: ThirdPartyLoadContext): Promise<TInstance>;
  abstract applyCamera(instance: TInstance, view: CameraView, context: CameraSyncContext): void;

  dispose(_instance: TInstance): void {}

  protected clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }

  protected lerp(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio;
  }
}
