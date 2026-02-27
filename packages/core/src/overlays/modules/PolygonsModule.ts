import type { IOverlayManager, IPolygon, PolygonAddOptions, PolygonUpdateOptions } from '../../types/overlays';
import { createPolygon } from '../manager/OverlayFactory';

export class PolygonsModule {
  private manager: IOverlayManager;

  constructor(manager: IOverlayManager) {
    this.manager = manager;
  }

  add(options: PolygonAddOptions): IPolygon {
    const polygon = createPolygon(options);
    this.manager.add(polygon);
    return polygon;
  }

  update(id: string, options: PolygonUpdateOptions): IPolygon | null {
    const overlay = this.manager.getById(id) as IPolygon | null;
    if (!overlay || overlay.getType() !== 'polygon') {
      return null;
    }

    if (options.path) {
      overlay.setPath(options.path);
    }

    if (options.fillColor) {
      overlay.setFillColor(options.fillColor);
    }

    if (typeof options.fillOpacity === 'number') {
      overlay.setFillOpacity(options.fillOpacity);
    }

    overlay.setOptions(options);
    return overlay;
  }

  remove(id: string): boolean {
    const overlay = this.manager.getById(id) as IPolygon | null;
    if (!overlay || overlay.getType() !== 'polygon') {
      return false;
    }

    return this.manager.remove(overlay);
  }

  list(): IPolygon[] {
    return this.manager.getByType('polygon') as IPolygon[];
  }

  get(id: string): IPolygon | null {
    const overlay = this.manager.getById(id) as IPolygon | null;
    if (!overlay || overlay.getType() !== 'polygon') {
      return null;
    }
    return overlay;
  }
}
