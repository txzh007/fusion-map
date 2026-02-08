import 'reflect-metadata';

export type Constructor<T = any> = new (...args: any[]) => T;
export type FactoryFunction<T = any> = (...args: any[]) => T;

export enum Lifetime {
  Singleton = 'singleton',
  Transient = 'transient'
}

export interface Registration<T = any> {
  target: Constructor<T>;
  factory?: FactoryFunction<T>;
  lifetime: Lifetime;
  dependencies?: any[];
}

export class Container {
  private static instances = new Map<Constructor, any>();
  private static registrations = new Map<Constructor, Registration>();
  private static dependencyGraph = new Map<Constructor, Constructor[]>();

  /**
   * 注册服务
   */
  static register<T>(
    target: Constructor<T>,
    config?: {
      factory?: FactoryFunction<T>;
      lifetime?: Lifetime;
      dependencies?: any[];
    }
  ): void {
    const registration: Registration<T> = {
      target,
      factory: config?.factory,
      lifetime: config?.lifetime || Lifetime.Singleton,
      dependencies: config?.dependencies || []
    };
    
    this.registrations.set(target, registration);
    
    // 记录依赖关系
    if (config?.dependencies && config.dependencies.length > 0) {
      this.dependencyGraph.set(target, config.dependencies);
    }
  }

  /**
   * 获取服务实例
   */
  static get<T>(target: Constructor<T>, ...args: any[]): T {
    const registration = this.registrations.get(target);
    
    // 如果没有注册，自动注册为单例
    if (!registration) {
      this.register(target, { lifetime: Lifetime.Singleton });
      return this.get(target, ...args);
    }

    // 检查循环依赖
    this.checkCircularDependency(target, new Set());

    // 瞬态服务每次都创建新实例
    if (registration.lifetime === Lifetime.Transient) {
      return this.createInstance(registration, args);
    }

    // 单例服务缓存实例
    if (!this.instances.has(target)) {
      const instance = this.createInstance(registration, args);
      this.instances.set(target, instance);
    }

    return this.instances.get(target);
  }

  /**
   * 创建实例
   */
  private static createInstance<T>(registration: Registration<T>, args: any[]): T {
    try {
      if (registration.factory) {
        return registration.factory(...args);
      }

      // 解析构造函数参数
      const paramTypes = Reflect.getMetadata('design:paramtypes', registration.target) || [];
      const dependencies = this.resolveDependencies(paramTypes, registration.dependencies || []);
      
      // 合并传入的参数和依赖注入的参数
      const constructorArgs = [...dependencies, ...args];
      
      return new registration.target(...constructorArgs);
    } catch (e) {
      console.error(`[Container] Failed to instantiate ${registration.target.name}`, e);
      throw e;
    }
  }

  /**
   * 解析依赖
   */
  private static resolveDependencies(paramTypes: any[], explicitDeps: any[]): any[] {
    return paramTypes.map((paramType, index) => {
      // 如果有显式提供的依赖，使用它们
      if (explicitDeps[index] !== undefined) {
        return explicitDeps[index];
      }

      // 如果没有参数类型信息，返回 undefined
      if (!paramType || paramType === Object || paramType === Array) {
        return undefined;
      }

      try {
        // 尝试递归解析依赖
        return this.get(paramType);
      } catch (error) {
        // 如果无法解析依赖，返回 undefined
        console.warn(`[Container] Failed to resolve dependency ${paramType.name} at index ${index}`);
        return undefined;
      }
    });
  }

  /**
   * 检查循环依赖
   */
  private static checkCircularDependency(
    target: Constructor,
    visited: Set<Constructor>,
    path: Constructor[] = []
  ): void {
    if (visited.has(target)) {
      const cycle = [...path, target].map(c => c.name).join(' -> ');
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    visited.add(target);
    path.push(target);

    const dependencies = this.dependencyGraph.get(target) || [];
    for (const dep of dependencies) {
      this.checkCircularDependency(dep, new Set(visited), [...path]);
    }

    visited.delete(target);
    path.pop();
  }

  /**
   * 设置自定义实例（主要用于测试）
   */
  static setInstance<T>(target: Constructor<T>, instance: T): void {
    this.instances.set(target, instance);
    
    // 确保服务已注册
    if (!this.registrations.has(target)) {
      this.register(target, { lifetime: Lifetime.Singleton });
    }
  }

  /**
   * 清除所有实例和注册
   */
  static clear(): void {
    this.instances.clear();
    this.registrations.clear();
    this.dependencyGraph.clear();
  }

  /**
   * 重置单个服务
   */
  static reset(target: Constructor): void {
    this.instances.delete(target);
    this.registrations.delete(target);
    this.dependencyGraph.delete(target);
  }

  /**
   * 检查是否已注册
   */
  static isRegistered(target: Constructor): boolean {
    return this.registrations.has(target);
  }

  /**
   * 获取所有已注册的服务
   */
  static getRegisteredServices(): Constructor[] {
    return Array.from(this.registrations.keys());
  }
}
