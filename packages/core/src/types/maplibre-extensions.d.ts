import 'maplibre-gl';

declare module 'maplibre-gl' {
  // Allow specifying projection in MapOptions to support globe/mercator switching
  interface MapOptions {
    projection?: { type: 'globe' | 'mercator' };
  }

  // Add optional methods that exist on runtime but may be missing from types
  interface Map {
    setProjection?(proj: { type: 'globe' | 'mercator' }): void;
    getProjection?(): { type?: string } | undefined;
    // setMaxPitch exists on runtime maps
    setMaxPitch?(pitch: number): void;
  }
}
