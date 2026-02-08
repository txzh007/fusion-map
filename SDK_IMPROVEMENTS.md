# Fusion Map SDK 改进清单

## 🎯 核心目标：打造生产级通用地图SDK

---

## 🔴 P0 - 紧急修复（本周完成）

### 1. API 导出清理 ✅ 正在进行
**目标**: 只导出用户需要的API，隐藏内部实现

**现状**:
- 当前导出 228 行类型定义
- 暴露了内部实现类（BaseMapProvider, SyncEngine 等）
- 私有属性出现在类型定义中

**改进**:
- ✅ 创建 `public-api.ts` 作为对外入口
- ✅ 只导出：FusionMap, createFusionMap, 类型定义, 工具函数
- ✅ 更新 vite.config.ts 使用新入口
- 🚧 运行构建验证导出结果

**预期结果**:
- 类型定义减少到 < 80 行
- 用户只能访问合法的 API
- 内部实现完全隐藏

---

### 2. 修复 TypeScript 类型问题
**目标**: 消除所有 `any` 类型，提供完整类型定义

**现状**:
```typescript
// FusionMap.ts
projection?: any           // ❌
(ev: any) => void          // ❌
private map!: maplibregl.Map  // ← OK

// BaseMapProvider.ts
private viewer: any = null  // ❌
private tokens: { ... } = {}  // ← OK
```

**改进**:
```typescript
// 定义接口
interface MapProjection {
  type: 'globe' | 'mercator';
}

interface MapEventHandler {
  (ev: MapEvent): void;
}

// 使用接口
projection?: MapProjection
ev: MapEvent => void

// 特殊类型
interface CesiumViewer {
  // Cesium 懒加载类型
  [key: string]: any;
}
private viewer: CesiumViewer = null
```

**优先级**:
1. FusionMap.ts: 104, 111, 218 行
2. BaseMapProvider.ts: 24, 25, 34 行

---

### 3. 统一错误处理机制
**目标**: 提供清晰的错误类型和错误处理

**现状**:
- 错误信息混合中文和英文
- 没有统一的错误码
- 错误信息不够详细

**改进**:

```typescript
// src/errors/index.ts
export enum ErrorCode {
  // 容器错误
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  CONTAINER_INIT_FAILED = 'CONTAINER_INIT_FAILED',

  // 令牌错误
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // 地图错误
  MAP_LOAD_FAILED = 'MAP_LOAD_FAILED',
  MAP_SWITCH_FAILED = 'MAP_SWITCH_FAILED',
  MAP_SYNC_FAILED = 'MAP_SYNC_FAILED',

  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  SCRIPT_LOAD_FAILED = 'SCRIPT_LOAD_FAILED',

  // 兼容性错误
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED'
}

export class FusionMapError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'FusionMapError';
  }
}

// 使用示例
throw new FusionMapError(
  ErrorCode.TOKEN_MISSING,
  'Token is required for this map provider',
  { provider: 'amap' }
);
```

---

### 4. 添加配置验证
**目标**: 在运行时验证配置，提供友好的错误提示

```typescript
// src/validators/config.ts
class ConfigValidator {
  static validate(config: FusionMapConfig): void {
    if (config.tokens) {
      this.validateTokens(config.tokens);
    }
    if (config.mapOptions) {
      this.validateMapOptions(config.mapOptions);
    }
  }

  private static validateTokens(tokens: FusionMapConfig['tokens']): void {
    // 检查是否使用了某个地图但没提供 token
    const usedProviders = this.detectUsedProviders();
    const missingTokens = usedProviders.filter(p => !tokens[p]);

    if (missingTokens.length > 0) {
      throw new FusionMapError(
        ErrorCode.TOKEN_MISSING,
        `Missing tokens for: ${missingTokens.join(', ')}`,
        { missingProviders: missingTokens }
      );
    }
  }

  private static validateMapOptions(options: any): void {
    if (options.zoom !== undefined) {
      if (options.zoom < 0 || options.zoom > 22) {
        throw new Error('Zoom must be between 0 and 22');
      }
    }
  }
}
```

---

## 🟡 P1 - 重要改进（本月完成）

### 5. 完善 JSDoc 文档
**目标**: 为所有公共 API 添加完整的 JSDoc

**示例**:
```typescript
/**
 * 创建 Fusion Map 实例
 *
 * @example
 * ```typescript
 * const map = createFusionMap('map-container', {
 *   tokens: {
 *     amap: 'YOUR_AMAP_KEY',
 *     google: 'YOUR_GOOGLE_KEY'
 *   }
 * });
 * ```
 *
 * @param containerId - HTML 容器的 ID
 * @param options - 配置选项
 * @returns FusionMap 实例
 *
 * @throws {FusionMapError} 当容器不存在时抛出
 * @throws {FusionMapError} 当必需的 token 缺失时抛出
 */
export function createFusionMap(
  containerId: string,
  options?: FusionMapConfig
): FusionMap;
```

---

### 6. 添加事件系统
**目标**: 统一的事件系统，支持事件监听和取消

```typescript
// FusionMap 类中添加
class FusionMap {
  private eventBus = new EventEmitter();

  /**
   * 监听事件
   * @param event - 事件名称
   * @param listener - 事件处理器
   * @returns 取消监听的函数
   */
  on(event: MapEventType, listener: MapEventListener): () => void {
    this.eventBus.on(event, listener);
    return () => this.eventBus.off(event, listener);
  }

  /**
   * 监听一次事件
   */
  once(event: MapEventType, listener: MapEventListener): void {
    this.eventBus.once(event, listener);
  }

  /**
   * 取消监听事件
   */
  off(event: MapEventType, listener: MapEventListener): void {
    this.eventBus.off(event, listener);
  }

  /**
   * 触发事件
   */
  private emit(event: MapEventType, data?: any): void {
    this.eventBus.emit(event, data);
  }
}

// 定义事件类型
export type MapEventType =
  | 'ready'
  | 'map:switch'
  | 'map:load'
  | 'map:error'
  | 'camera:change';

export interface MapEventData<T = any> {
  type: MapEventType;
  data: T;
  timestamp: number;
}

export type MapEventListener<T = any> = (event: MapEventData<T>) => void;
```

---

### 7. 统一日志系统
**目标**: 提供可配置的日志系统

```typescript
// src/utils/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

export enum LogCategory {
  INIT = 'INIT',
  MAP = 'MAP',
  SYNC = 'SYNC',
  ERROR = 'ERROR',
  PERF = 'PERF'
}

class Logger {
  private static level = LogLevel.WARN;
  private static customLogger?: (level: LogLevel, category: LogCategory, message: string, ...args: any[]) => void;

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  static setCustomLogger(logger: typeof Logger.customLogger): void {
    this.customLogger = logger;
  }

  static debug(category: LogCategory, message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, category, message, ...args);
  }

  static info(category: LogCategory, message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, category, message, ...args);
  }

  static warn(category: LogCategory, message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, category, message, ...args);
  }

  static error(category: LogCategory, message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, category, message, ...args);
  }

  private static log(level: LogLevel, category: LogCategory, message: string, ...args: any[]): void {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category}] ${message}`;

    if (this.customLogger) {
      this.customLogger(level, category, message, ...args);
    } else {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, ...args);
          break;
        case LogLevel.INFO:
          console.info(prefix, ...args);
          break;
        case LogLevel.WARN:
          console.warn(prefix, ...args);
          break;
        case LogLevel.ERROR:
          console.error(prefix, ...args);
          break;
      }
    }
  }
}

export default Logger;
```

---

### 8. 添加性能监控 API
**目标**: 提供性能监控和调试工具

```typescript
// PerformanceMonitor 类
export class PerformanceMonitor {
  private static marks = new Map<string, number>();
  private static measures = new Array<{ name: string; duration: number }>();

  static start(label: string): void {
    this.marks.set(label, performance.now());
  }

  static end(label: string): number {
    const start = this.marks.get(label);
    if (!start) return 0;

    const duration = performance.now() - start;
    this.marks.delete(label);
    this.measures.push({ name: label, duration });

    return duration;
  }

  static getMeasures(): Array<{ name: string; duration: number }> {
    return [...this.measures];
  }

  static clear(): void {
    this.marks.clear();
    this.measures.length = 0;
  }

  static report(): void {
    console.table(this.measures);
  }
}

// 在 FusionMap 中使用
class FusionMap {
  constructor(containerId: string, options?: FusionMapConfig) {
    PerformanceMonitor.start('init');
    // ... 初始化逻辑
    PerformanceMonitor.end('init');
  }
}
```

---

### 9. 添加开发模式检测
**目标**: 在开发模式下提供更多调试信息

```typescript
// src/utils/env.ts
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// 使用
if (isDevelopment) {
  Logger.debug(LogCategory.INIT, 'Debug mode enabled');
}
```

---

### 10. 添加断言检查
**目标**: 在开发时快速发现错误

```typescript
// src/utils/assert.ts
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// 使用
assert(container !== null, 'Container element not found');
```

---

## 🟢 P2 - 长期优化（下个版本）

### 11. 添加插件系统
**目标**: 支持扩展功能

```typescript
export interface Plugin {
  name: string;
  version: string;
  install(map: FusionMap): void;
  uninstall?(map: FusionMap): void;
}

class PluginManager {
  private plugins = new Map<string, Plugin>();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    plugin.install(this.map);
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.uninstall?.(this.map);
      this.plugins.delete(name);
    }
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}
```

---

### 12. 添加状态管理
**目标**: 统一管理地图状态

```typescript
interface MapState {
  camera: CameraState;
  activeMapType: MapType;
  loading boolean;
  error: Error | null;
}

class StateManager extends Observable<MapState> {
  private state: Readonly<MapState>;

  constructor(initialState: MapState) {
    super();
    this.state = Object.freeze(initialState);
  }

  setState(partialState: Partial<MapState>): void {
    this.state = Object.freeze({
      ...this.state,
      ...partialState
    });
    this.next(this.state);
  }

  getState(): Readonly<MapState> {
    return this.state;
  }
}
```

---

### 13. 添加热更新支持（开发模式）
**目标**: 开发时支持热重载

```typescript
if (isDevelopment && module.hot) {
  module.hot.accept();
  // 热重载逻辑
}
```

---

### 14. 添加兼容性检查
**目标**: 检测浏览器兼容性

```typescript
// src/utils/browser.ts
export class BrowserCompatibility {
  static check(): {
    supported: boolean;
    missing: string[];
    warnings: string[];
  } {
    const missing: string[] = [];
    const warnings: string[] = [];

    // 检查 WebGL
    if (!window.WebGLRenderingContext) {
      missing.push('WebGL');
    }

    // 检查 ES6
    try {
      eval('const test = () => {}');
    } catch (e) {
      missing.push('ES6');
    }

    // 检查 Worker 支持
    if (!window.Worker) {
      warnings.push('Web Workers - may affect performance');
    }

    return {
      supported: missing.length === 0,
      missing,
      warnings
    };
  }
}
```

---

### 15. 添加内存泄漏防护
**目标**: 防止内存泄漏

```typescript
class FusionMap {
  private cleanupFunctions: Array<() => void> = [];

  private addCleanup(fn: () => void): void {
    this.cleanupFunctions.push(fn);
  }

  destroy(): void {
    // 执行所有清理函数
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];

    // 清理事件监听
    this.eventBus.removeAllListeners();

    // 清理容器
    Container.clear();
  }
}
```

---

## 📋 改进建议总结

### 立即执行（本周）
1. ✅ 重构 API 导出（public-api.ts 已创建）
2. ⏳ 更新构建配置
3. ⏳ 验证打包结果
4. ⏳ 修复 TypeScript 类型问题

### 本月完成
5. 统一错误处理
6. 配置验证
7. JSDoc 文档
8. 事件系统
9. 日志系统
10. 性能监控

### 下个版本
11. 插件系统
12. 状态管理
13. 开发工具
14. 兼容性检查
15. 内存管理

---

## 🎯 预期收益

完成 P0 和 P1 后：
- **API 清晰度**: ✅ 提升 90%（只暴露必要 API）
- **类型安全**: ✅ 提升 100%（消除所有 any）
- **开发体验**: ✅ 提升 80%（完整文档 + 类型提示）
- **错误调试**: ✅ 提升 70%（统一错误处理）
- **性能监控**: ✅ 新增 100%（性能追踪能力）
