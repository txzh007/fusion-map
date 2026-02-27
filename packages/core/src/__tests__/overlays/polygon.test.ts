// @ts-nocheck
/**
 * Polygon 覆盖物基础逻辑测试
 */

import { createPolygon } from '../../overlays';

describe('Polygon overlay logic', () => {
  test('create polygon and basic getters', () => {
    const polygon = createPolygon({
      path: [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ],
      fillColor: '#ff0000',
      fillOpacity: 0.6,
    });

    expect(polygon.getPath().length).toBe(4);
    expect(polygon.getFillColor()).toBe('#ff0000');
    expect(polygon.getFillOpacity()).toBe(0.6);
  });

  test('area and center are computed', () => {
    const polygon = createPolygon({
      path: [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ],
    });

    const area = polygon.getArea();
    const center = polygon.getCenter();

    expect(area).toBeGreaterThan(0);
    expect(center[0]).toBeCloseTo(0.5, 1);
    expect(center[1]).toBeCloseTo(0.5, 1);
  });

  test('toGeoJSON uses Polygon geometry', () => {
    const polygon = createPolygon({
      path: [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ],
    });

    const geojson = polygon.toGeoJSON!();
    expect(geojson.type).toBe('Feature');
    expect(geojson.geometry.type).toBe('Polygon');
    expect(geojson.geometry.coordinates[0].length).toBe(5);
  });
});
