import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container, Lifetime } from '../di/Container';

class TestService {
  name = 'test';
}

class AnotherService {
  constructor(public test: TestService) {}
}

class ServiceWithDependency {
  constructor(public dep: TestService) {}
}

class ServiceWithParam {
  constructor(public value: string) {}
}

class CircularDepA {
  constructor(public b?: CircularDepB) {}
}

class CircularDepB {
  constructor(public a?: CircularDepA) {}
}

describe('Container', () => {
  beforeEach(() => {
    // 清理容器
    Container.clear();
  });

  afterEach(() => {
    Container.clear();
  });

  describe('register', () => {
    it('应该注册服务', () => {
      Container.register(TestService);
      expect(Container.isRegistered(TestService)).toBe(true);
    });

    it('应该支持工厂函数', () => {
      const factory = () => ({ name: 'factory-created' } as TestService);
      Container.register(TestService, { factory });
      
      const instance = Container.get(TestService);
      expect(instance).toEqual({ name: 'factory-created' });
    });

    it('应该支持依赖注入', () => {
      const mockDep = new TestService();
      mockDep.name = 'injected';
      
      Container.register(TestService);
      Container.register(AnotherService, { dependencies: [mockDep] });
      
      const instance = Container.get(AnotherService);
      expect(instance.test).toBe(mockDep);
      expect(instance.test.name).toBe('injected');
    });

    it('应该支持显式依赖', () => {
      const mockDep = { name: 'mock' };
      Container.register(ServiceWithDependency, { dependencies: [mockDep] });
      
      const instance = Container.get(ServiceWithDependency);
      expect(instance.dep).toBe(mockDep);
      expect(instance.dep.name).toBe('mock');
    });

    it('应该检测循环依赖', () => {
      Container.register(CircularDepA, { dependencies: [CircularDepB] });
      Container.register(CircularDepB, { dependencies: [CircularDepA] });
      
      expect(() => Container.get(CircularDepA)).toThrow('Circular dependency detected');
    });
  });

  describe('get', () => {
    it('应该创建单例实例', () => {
      Container.register(TestService);
      const instance1 = Container.get(TestService);
      const instance2 = Container.get(TestService);

      expect(instance1).toBe(instance2);
      expect(instance1.name).toBe('test');
    });

    it('应该支持瞬态服务', () => {
      Container.register(TestService, { lifetime: Lifetime.Transient });
      const instance1 = Container.get(TestService);
      const instance2 = Container.get(TestService);

      expect(instance1).not.toBe(instance2);
      expect(instance1.name).toBe('test');
      expect(instance2.name).toBe('test');
    });

    it('应该自动注册未注册的服务', () => {
      const instance = Container.get(TestService);
      expect(instance).toBeInstanceOf(TestService);
      expect(Container.isRegistered(TestService)).toBe(true);
    });

    it('应该支持构造函数参数', () => {
      Container.register(ServiceWithParam);
      const instance = Container.get(ServiceWithParam, 'custom-value');
      
      expect(instance.value).toBe('custom-value');
    });

    it('应该处理构造函数错误', () => {
      class ErrorService {
        constructor() {
          throw new Error('构造失败');
        }
      }

      expect(() => Container.get(ErrorService)).toThrow('构造失败');
    });
  });

  describe('setInstance', () => {
    it('应该支持手动设置实例', () => {
      const customInstance = new TestService();
      customInstance.name = 'custom';

      Container.setInstance(TestService, customInstance);

      const retrieved = Container.get(TestService);
      expect(retrieved).toBe(customInstance);
      expect(retrieved.name).toBe('custom');
    });

    it('应该覆盖现有实例', () => {
      Container.register(TestService);
      const instance1 = Container.get(TestService);
      expect(instance1.name).toBe('test');

      const customInstance = new TestService();
      customInstance.name = 'custom';

      Container.setInstance(TestService, customInstance);

      const instance2 = Container.get(TestService);
      expect(instance2).toBe(customInstance);
      expect(instance2.name).toBe('custom');
    });
  });

  describe('生命周期管理', () => {
    it('应该清除所有实例', () => {
      Container.register(TestService);
      Container.get(TestService);
      
      expect(Container.getRegisteredServices()).toHaveLength(1);
      
      Container.clear();
      expect(Container.getRegisteredServices()).toHaveLength(0);
    });

    it('应该重置单个服务', () => {
      Container.register(TestService);
      const instance1 = Container.get(TestService);
      
      Container.reset(TestService);
      
      const instance2 = Container.get(TestService);
      expect(instance2).not.toBe(instance1);
    });
  });
});

