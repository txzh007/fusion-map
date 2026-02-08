import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container, Lifetime } from '../di/Container';
import { MapService, Inject, AutoBind, Watch, WATCH_METADATA_KEY } from '../decorators';

describe('decorators', () => {
  beforeEach(() => {
    Container.clear();
  });

  afterEach(() => {
    Container.clear();
  });

  describe('@MapService', () => {
    it('应该标记类为服务', () => {
      @MapService()
      class TestService {}

      expect(Container.isRegistered(TestService)).toBe(true);
      
      const instance = Container.get(TestService);
      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(TestService);
    });

    it('应该支持生命周期配置', () => {
      @MapService({ lifetime: Lifetime.Transient })
      class TestService {}

      const instance1 = Container.get(TestService);
      const instance2 = Container.get(TestService);
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('@Inject', () => {
    it('应该注入依赖', () => {
      class DependencyService {
        name = 'dependency';
      }

      @MapService()
      class TestService {
        @Inject(() => DependencyService)
          dep!: DependencyService;
      }

      const instance = Container.get(TestService);
      expect(instance.dep).toBeDefined();
      expect(instance.dep.name).toBe('dependency');
    });

    it('应该返回相同的依赖实例', () => {
      class DependencyService {
        name = 'dependency';
      }

      @MapService()
      class TestService {
        @Inject(() => DependencyService)
          dep!: DependencyService;
      }

      const instance1 = Container.get(TestService);
      const instance2 = Container.get(TestService);

      expect(instance1.dep).toBe(instance2.dep);
    });

    it('应该支持直接传入类', () => {
      class DependencyService {
        name = 'dependency';
      }

      @MapService()
      class TestService {
        @Inject(DependencyService)
          dep!: DependencyService;
      }

      const instance = Container.get(TestService);
      expect(instance.dep).toBeDefined();
    });
  });

  describe('@AutoBind', () => {
    it('应该自动绑定 this', () => {
      class TestClass {
        value = 'test';

        @AutoBind
        getValue() {
          return this.value;
        }
      }

      const instance = new TestClass();
      const method = instance.getValue;

      // 没有绑定时会丢失 this
      expect(method()).toBe('test');
    });

    it('应该保持方法功能', () => {
      class TestClass {
        value = 'test';

        @AutoBind
        getValue() {
          return this.value;
        }
      }

      const instance = new TestClass();
      expect(instance.getValue()).toBe('test');
    });
  });

  describe('@Watch', () => {
    it('应该存储事件元数据', () => {
      class TestClass {
        @Watch('move')
        onMove() {}
      }

      const metadata = Reflect.getMetadata(WATCH_METADATA_KEY, TestClass.prototype);
      expect(metadata).toBeDefined();
      expect(metadata).toHaveLength(1);
      expect(metadata[0].eventName).toBe('move');
      expect(metadata[0].methodName).toBe('onMove');
    });

    it('应该支持多个 @Watch 装饰器', () => {
      class TestClass {
        @Watch('move')
        onMove() {}

        @Watch('zoom')
        onZoom() {}
      }

      const metadata = Reflect.getMetadata(WATCH_METADATA_KEY, TestClass.prototype);
      expect(metadata).toHaveLength(2);
      expect(metadata[0].eventName).toBe('move');
      expect(metadata[1].eventName).toBe('zoom');
    });
  });
});
