# Fusion Map (fusion-map)

[English](./README.md) | [简体中文](./README_zh-CN.md) | [Live Demo](https://fusion-map.tanxin.link/index.html)

**Fusion Map** is a powerful unified mapping library that seamlessly bridges **MapLibre GL JS** with major global map providers, including **Google Maps**, **Cesium (3D Globe)**, **Amap (Gaode)**, **Baidu Map**, and **Tianditu**.

It allows you to overlay MapLibre's high-performance vector rendering and styling capabilities on top of third-party base maps, maintaining perfect synchronization of camera state (Zoom, Pitch, Bearing, Center).

## 💡 Core Philosophy: Write Once, Run Everywhere

**Fusion Map** employs a decoupled architecture where MapLibre acts as a **transparent interaction layer** over the native base map. 

```mermaid
graph TD
    User["Your Application Code"] --> MapLibre["Fusion Map (MapLibre Interface)"]
    MapLibre --> SyncEngine["Sync Engine"]
    
    subgraph "Provider Adapters"
        SyncEngine --> |"Syncs Camera & Events"| Google["Google Maps"]
        SyncEngine --> |"Syncs Camera & Events"| Cesium["CesiumJS (3D)"]
        SyncEngine --> |"Syncs Camera & Events"| Amap["Amap (GCJ02)"]
    end
    
    style MapLibre fill:#42b983,stroke:#333,stroke-width:2px,color:#fff
```

This means you can write your visualization code **solely using the standard MapLibre GL JS API**.

## 🌟 Visual Capabilities

- **Infinite Layer Stacking**: Stack WebGL-powered Deck.gl, Three.js, or Mapbox layers.
- **Seamless 2D/3D Transition**: Smoothly switch from a flat street view to a global 3D terrain view.
- **High-Performance**: Leveraging GPU acceleration for both the top overlay and the bottom base map.

## 🌟 Key Features

- **Unified Interface**: Use standard MapLibre GL JS commands (`addLayer`, `addSource`, `flyTo`) while the underlying base map handles the rendering of satellite/roadmap tiles.
- **Multi-Provider Support**: 
  - **Google Maps**: Supports Vector (Roadmap) and Satellite modes.
  - **CesiumJS**: Full 3D Globe integration with vertical FOV matching.
  - **Amap (Gaode)**: GCJ02 offset correction included.
  - **Baidu Map (BMapGL)**: BD09 transformation and tilt support.
  - **Tianditu**: Native WMTS support.
- **Automatic Projection Switching**: Automatically toggles between `Globe` (3D) and `Mercator` (2D) projections based on the active provider.
- **Smart Synchronization**:
  - Auto-calibrates Zoom levels (e.g., matching MapLibre's 512px tiles to Google's 256px grid).
  - Synchronizes Pitch and Bearing (Rotation) where supported.
  - Prevents Gimbal Lock in Cesium.
- **Coordinate Transformation**: Built-in support for WGS84, GCJ02, and BD09 conversions using `gcoord`.
- **Unified Overlay Abstraction (Partial)**: MapLibre-first wrappers for Marker/Polyline/Polygon are available; Circle is next in plan for true “**write once, run everywhere**” overlays across providers.

## 📦 Installation

```bash
npm install fusion-map maplibre-gl
# Optional: Install Cesium if you need 3D Globe support
npm install cesium
```

## 🚀 Usage

### 1. Basic Initialization

```typescript
import { FusionMap } from 'fusion-map';
import 'maplibre-gl/dist/maplibre-gl.css';

const map = new FusionMap({
  container: 'map-container', // HTML Element ID
  initialBaseMap: 'google', // Optional: start directly with Google
  mapOptions: {
    style: 'https://demotiles.maplibre.org/style.json', // Your MapLibre Style
    center: [116.397, 39.918],
    zoom: 12
  },
  // Provide API Keys for the providers you want to use
  tokens: {
    amap: 'YOUR_AMAP_JS_API_KEY',
    baidu: 'YOUR_BAIDU_AK',
    google: 'YOUR_GOOGLE_MAPS_API_KEY',
    googleMapId: 'YOUR_GOOGLE_MAP_ID', // Required for Vector/3D mode
    cesium: 'YOUR_CESIUM_TOKEN',
    tianditu: 'YOUR_TIANDITU_TOKEN'
  }
});
```

### 2. Switching Base Maps

Switching providers is instant and maintains your current camera view.

`switchBaseMap` returns a Promise; if you need strict sync timing, use `await`.

```typescript
// Switch to Amap (Auto-converts WGS84 -> GCJ02)
await map.switchBaseMap('amap');

// Switch to Cesium 3D Globe
await map.switchBaseMap('cesium');

// Switch to Google Maps
await map.switchBaseMap('google');
```

### 3. Adding Layers

You interact with the `map` instance just like a standard MapLibre instance.

```typescript
map.map.addLayer({
  'id': 'points',
  'type': 'circle',
  'source': {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': [
        { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [116.397, 39.918] } }
      ]
    }
  },
  'paint': {
    'circle-radius': 10,
    'circle-color': '#007cbf'
  }
});
```

## ⚠️ Requirements

- **Cesium**: Peer dependency. Required only if using 'cesium' mode.
- **Google Maps**: Requires a valid API Key with **Maps JavaScript API** enabled. For tilt/heading support, vector maps (v=beta) are recommended.

## 🛡️ Production Notes

- Keep provider keys out of source code and avoid plain `localStorage` persistence in production.
- Restrict Google/Amap/Baidu keys by domain and API scope.
- Treat `googleMapId` as optional for basic mode; provide it when vector/3D capabilities are required.

## 🐞 Known Issues

- **Third-party pitch can be temporarily out of sync with MapLibre at some zoom levels (Baidu / Amap / Google)**:
  - Symptom: around low-zoom or threshold transitions, provider SDKs may apply internal camera constraints (for example max-tilt clamping or animated interpolation) and briefly override pitch.
  - Current mitigation: Fusion Map applies provider-side `maxTilt` clamping, no-animation writes, and frame-level reapplication where needed to reduce desync frequency.
  - Note: this is a third-party SDK behavior difference, so strict 100% pitch consistency is not guaranteed under all devices/zoom states.

## 🗺️ Overlay Roadmap (MapLibre First)

- **Goal**: use MapLibre as the canonical overlay semantics layer and adapt provider differences behind Fusion Map.
- **Phase 1 scope**: `Marker`, `Polyline`, `Polygon`, `Circle` with unified events, styling model, and lifecycle.
- **Design principle**: application code targets Fusion Map overlay APIs only; provider adapters handle capability mapping and graceful fallback.
- **Outcome**: less duplicated implementation and vendor lock-in, with practical “write once, run everywhere” for overlays.

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT
