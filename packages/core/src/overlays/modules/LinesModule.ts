import type { IOverlayManager, IPolyline, LineAddOptions, LineUpdateOptions } from '../../types/overlays';
import { createPolyline } from '../manager/OverlayFactory';

export class LinesModule {
  private manager: IOverlayManager;

  constructor(manager: IOverlayManager) {
    this.manager = manager;
  }

  add(options: LineAddOptions): IPolyline {
    const polyline = createPolyline(options);
    this.manager.add(polyline);
    return polyline;
  }

  update(id: string, options: LineUpdateOptions): IPolyline | null {
    const overlay = this.manager.getById(id) as IPolyline | null;
    if (!overlay || overlay.getType() !== 'polyline') {
      return null;
    }

    if (options.path) {
      overlay.setPath(options.path);
    }

    if (options.color) {
      overlay.setColor(options.color);
    }

    if (typeof options.width === 'number') {
      overlay.setWidth(options.width);
    }

    if (typeof options.opacity === 'number') {
      overlay.setOpacity(options.opacity);
    }

    overlay.setOptions(options);
    return overlay;
  }

  remove(id: string): boolean {
    const overlay = this.manager.getById(id) as IPolyline | null;
    if (!overlay || overlay.getType() !== 'polyline') {
      return false;
    }

    return this.manager.remove(overlay);
  }

  list(): IPolyline[] {
    return this.manager.getByType('polyline') as IPolyline[];
  }

  get(id: string): IPolyline | null {
    const overlay = this.manager.getById(id) as IPolyline | null;
    if (!overlay || overlay.getType() !== 'polyline') {
      return null;
    }
    return overlay;
  }
}
