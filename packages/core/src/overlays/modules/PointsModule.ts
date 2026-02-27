import type { IOverlayManager, IMarker, PointAddOptions, PointUpdateOptions } from '../../types/overlays';
import { createMarker } from '../manager/OverlayFactory';

export class PointsModule {
  private manager: IOverlayManager;

  constructor(manager: IOverlayManager) {
    this.manager = manager;
  }

  add(options: PointAddOptions): IMarker {
    const marker = createMarker(options);
    this.manager.add(marker);
    return marker;
  }

  update(id: string, options: PointUpdateOptions): IMarker | null {
    const overlay = this.manager.getById(id) as IMarker | null;
    if (!overlay || overlay.getType() !== 'marker') {
      return null;
    }

    if (options.position) {
      overlay.setPosition(options.position);
    }

    if (options.icon) {
      overlay.setIcon(options.icon);
    }

    if (typeof options.rotation === 'number') {
      overlay.setRotation(options.rotation);
    }

    overlay.setOptions(options);
    return overlay;
  }

  remove(id: string): boolean {
    const overlay = this.manager.getById(id) as IMarker | null;
    if (!overlay || overlay.getType() !== 'marker') {
      return false;
    }

    return this.manager.remove(overlay);
  }

  list(): IMarker[] {
    return this.manager.getByType('marker') as IMarker[];
  }

  get(id: string): IMarker | null {
    const overlay = this.manager.getById(id) as IMarker | null;
    if (!overlay || overlay.getType() !== 'marker') {
      return null;
    }
    return overlay;
  }
}
