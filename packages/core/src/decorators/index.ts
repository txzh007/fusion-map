import 'reflect-metadata';
import { Container, Constructor, Lifetime } from '../di/Container';

// === 1. @MapService: 标记并注册为服务 ===
export interface MapServiceOptions {
  lifetime?: Lifetime;
  factory?: (...args: any[]) => any;
  dependencies?: any[];
}

export function MapService(options?: MapServiceOptions) {
  return function <T extends Constructor>(target: T) {
    // 自动注册到容器
    Container.register(target, {
      lifetime: options?.lifetime || Lifetime.Singleton,
      factory: options?.factory,
      dependencies: options?.dependencies
    });
    
    // 添加元数据标记
    Reflect.defineMetadata('isMapService', true, target);
  };
}

// === 2. @Inject: 属性注入 ===
export interface InjectOptions {
  optional?: boolean;
  defaultValue?: any;
}

export function Inject(
  serviceIdentifier?: Constructor | (() => Constructor),
  options?: InjectOptions
) {
  return function (target: any, propertyKey: string) {
    const injectMetadata = {
      serviceIdentifier,
      options,
      propertyKey,
      targetConstructor: target.constructor
    };

    // 保存注入元数据
    const existingInjections = Reflect.getMetadata('injections', target) || [];
    existingInjections.push(injectMetadata);
    Reflect.defineMetadata('injections', existingInjections, target);

    // 创建 getter
    Object.defineProperty(target, propertyKey, {
      get: () => {
        let type: Constructor | undefined;

        try {
          if (typeof serviceIdentifier === 'function' && !serviceIdentifier.prototype) {
            // 处理 thunk: () => Class
            type = (serviceIdentifier as () => Constructor)();
          } else if (serviceIdentifier) {
            type = serviceIdentifier as Constructor;
          } else {
            // 回退到元数据
            type = Reflect.getMetadata('design:type', target, propertyKey);
          }

          if (!type) {
            if (options?.optional) {
              return options.defaultValue;
            }
            console.error(`[Inject] Cannot resolve type for ${propertyKey} in ${target.constructor.name}`);
            throw new Error(`Cannot resolve dependency for ${propertyKey}`);
          }

          return Container.get(type);
        } catch (error) {
          if (options?.optional) {
            return options.defaultValue;
          }
          console.error(`[Inject] Failed to inject ${propertyKey} in ${target.constructor.name}:`, error);
          throw error;
        }
      },
      set: (value: any) => {
        // 允许手动设置值
        Object.defineProperty(target, propertyKey, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      },
      enumerable: true,
      configurable: true
    });
  };
}

// === 3. @AutoBind: 自动绑定 this ===
export function AutoBind(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  return {
    configurable: true,
    enumerable: false,
    get() {
      const boundFn = originalMethod.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: boundFn,
        configurable: true,
        writable: true
      });
      return boundFn;
    }
  };
}

// === 4. @Watch: 事件监听 ===
// 我们将事件元数据存储在原型上，SyncEngine 可以在初始化时读取并绑定
export const WATCH_METADATA_KEY = Symbol('WatchMetadata');

export interface WatchMetadata {
  eventName: string;
  methodName: string;
}

export function Watch(event: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const watchers: WatchMetadata[] = Reflect.getMetadata(WATCH_METADATA_KEY, target) || [];
    watchers.push({
      eventName: event,
      methodName: propertyKey
    });
    Reflect.defineMetadata(WATCH_METADATA_KEY, watchers, target);
  };
}
