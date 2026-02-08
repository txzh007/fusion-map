// 测试环境设置
import 'reflect-metadata';
import { vi } from 'vitest';

// 模拟 DOM 环境
(global as any).document = {
  createElement: () => ({
    style: {},
    appendChild: () => {},
    setAttribute: () => {},
    querySelector: () => null
  }),
  getElementById: () => null,
  head: {
    appendChild: () => {}
  },
  querySelector: () => null
};

(global as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {}
};

// 模拟 MapLibre
class MockMap {
  on = vi.fn();
  getCenter = vi.fn(() => ({ lng: 116.397, lat: 39.918 }));
  getZoom = vi.fn(() => 12);
  getPitch = vi.fn(() => 0);
  getBearing = vi.fn(() => 0);
  setMaxPitch = vi.fn();
  dragRotate = { enable: vi.fn() };
  touchZoomRotate = { enableRotation: vi.fn() };
  addLayer = vi.fn();
  addSource = vi.fn();
  getLayer = vi.fn();
  setLayoutProperty = vi.fn();
  remove = vi.fn();
  flyTo = vi.fn();
  project = vi.fn(() => ({ x: 100, y: 100 }));
  unproject = vi.fn(() => ({ lng: 116.397, lat: 39.918 }));
  setProjection = vi.fn();
  getProjection = vi.fn(() => ({ type: 'mercator' }));
}

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MockMap
  }
}));

// 模拟 gcoord
vi.mock('gcoord', () => ({
  default: {
    WGS84: 'WGS84',
    GCJ02: 'GCJ02',
    BD09: 'BD09',
    transform: vi.fn((coord: any) => coord)
  }
}));

// 模拟 BMapGL 和 Cesium
(global as any).BMapGL = {
  Point: class Point {
    constructor(public x: number, public y: number) {}
  }
};

(global as any).Cesium = {
  Cartesian3: {
    fromDegrees: vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 })
  },
  Math: {
    toRadians: vi.fn((deg: number) => deg * Math.PI / 180)
  },
  HeadingPitchRange: class HeadingPitchRange {
    constructor(public heading: number, public pitch: number, public range: number) {}
  },
  Matrix4: {
    IDENTITY: {}
  }
};

// 确保 window 也能访问到这些全局变量
(global as any).window = {
  ...((global as any).window || {}),
  BMapGL: (global as any).BMapGL,
  Cesium: (global as any).Cesium,
  addEventListener: () => {},
  removeEventListener: () => {}
};

