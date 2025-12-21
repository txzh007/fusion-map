import 'reflect-metadata';
import { Container, Constructor } from '../di/Container';

// === 1. @MapService: 标记为单例服务 ===
export function MapService() {
  return function <T extends Constructor>(target: T) {
    // 这里可以做一些注册逻辑，目前主要用于语义标记
    // 实际实例化由 Container.get 懒加载处理
  };
}

// === 2. @Inject: 属性注入 ===
export function Inject(serviceIdentifier?: Constructor | (() => Constructor)) {
  return function (target: any, propertyKey: string) {
    // 此时不立即解析 type，因为如果是 thunk，此时可能还没准备好
    // 我们在 getter 运行时再解析
    
    Object.defineProperty(target, propertyKey, {
      get: () => {
        let type: Constructor | undefined;
        
        if (typeof serviceIdentifier === 'function' && !serviceIdentifier.prototype) {
          // It's a thunk / arrow function () => Class
          try {
            type = (serviceIdentifier as () => Constructor)();
          } catch(e) {
            console.error(`[Inject] Failed to resolve thunk for ${propertyKey}.`, e);
          }
        } else if (serviceIdentifier) {
          type = serviceIdentifier as Constructor;
        } else {
           // Fallback to metadata
           type = Reflect.getMetadata('design:type', target, propertyKey);
        }

        if (!type) {
          console.error(`[Inject] Metadata/Identifier not found for ${propertyKey}.`);
          throw new Error(`Cannot resolve dependency for ${propertyKey}`);
        }
        return Container.get(type);
      },
      enumerable: true,
      configurable: true,
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
        writable: true,
      });
      return boundFn;
    },
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
      methodName: propertyKey,
    });
    Reflect.defineMetadata(WATCH_METADATA_KEY, watchers, target);
  };
}
