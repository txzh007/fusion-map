export const PROVIDER_CAMERA_POLICIES = {
  amap: {
    zoomOffset: 1,
    pitchRange: [0, 83] as const
  },
  baidu: {
    zoomOffset: 1.75,
    autoNorthAtMaplibreZoom: 5.25
  },
  google: {
    zoomOffset: 1,
    baseTiltRange: [0, 67.5] as const,
    lowZoomTiltCap: 30,
    lowZoomThreshold: 10,
    highZoomThreshold: 15.5,
    highZoomTiltCap: 67.5
  },
  cesium: {
    minInternalPitch: -89.99
  }
} as const;

export function normalizeHeading(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function getGoogleMaxTiltForZoom(zoom: number): number {
  const policy = PROVIDER_CAMERA_POLICIES.google;

  if (zoom < policy.lowZoomThreshold) {
    return policy.lowZoomTiltCap;
  }

  if (zoom > policy.highZoomThreshold) {
    return policy.highZoomTiltCap;
  }

  const ratio = (zoom - policy.lowZoomThreshold) / (policy.highZoomThreshold - policy.lowZoomThreshold);
  return policy.lowZoomTiltCap + (policy.highZoomTiltCap - policy.lowZoomTiltCap) * ratio;
}

export function resolveBaiduHeading(bearing: number, maplibreZoom: number): number {
  const policy = PROVIDER_CAMERA_POLICIES.baidu;
  if (maplibreZoom <= policy.autoNorthAtMaplibreZoom) {
    return 0;
  }
  return normalizeHeading(-bearing);
}
