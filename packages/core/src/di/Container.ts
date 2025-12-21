import 'reflect-metadata';

export type Constructor<T = any> = new (...args: any[]) => T;

export class Container {
  private static instances = new Map<Constructor, any>();

  static get<T>(target: Constructor<T>): T {
    if (!this.instances.has(target)) {
      try {
        const instance = new target();
        this.instances.set(target, instance);
      } catch (e) {
        console.error(`[Container] Failed to instantiate ${target.name}`, e);
        throw e;
      }
    }
    return this.instances.get(target);
  }

  static set(target: Constructor, instance: any) {
    this.instances.set(target, instance);
  }
}
