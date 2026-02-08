# 错误处理机制实现总结

## ✅ **已完成的功能**

### 1. **完整的错误类型系统**

#### **错误码枚举 (ErrorCode)**
```typescript
export enum ErrorCode {
  // 初始化错误
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  CONTAINER_INIT_FAILED = 'CONTAINER_INIT_FAILED',

  // 令牌错误
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // 地图加载错误
  MAP_LOAD_FAILED = 'MAP_LOAD_FAILED',
  MAP_SWITCH_FAILED = 'MAP_SWITCH_FAILED',
  MAP_SYNC_FAILED = 'MAP_SYNC_FAILED',

  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  SCRIPT_LOAD_FAILED = 'SCRIPT_LOAD_FAILED',
  TIMEOUT = 'TIMEOUT',

  // ... 更多错误码
}
```

**特点**:
- ✅ 30+ 个预定义错误码
- ✅ 覆盖所有可能的错误场景
- ✅ 语义化的错误码命名

#### **错误级别枚举 (ErrorLevel)**
```typescript
export enum ErrorLevel {
  INFO = 'info',   // 信息级别
  WARN = 'warn',   // 警告级别
  ERROR = 'error', // 错误级别
  FATAL = 'fatal'  // 致命错误
}
```

### 2. **FusionMapError 类**

#### **核心特性**
```typescript
export class FusionMapError extends Error {
  public readonly code: ErrorCode;
  public readonly level: ErrorLevel;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly cause?: Error;

  // 提供详细信息
  getDetailedMessage(): string;

  // 判断是否可重试
  isRetryable(): boolean;

  // 转换为 JSON
  toJSON(): ErrorDetails;
}
```

**使用示例**:
```typescript
throw new FusionMapError(
  ErrorCode.TOKEN_MISSING,
  'Token is required for Amap map provider',
  {
    context: { mapType: 'amap' },
    level: ErrorLevel.ERROR
  }
);
```

### 3. **错误创建辅助函数**

#### **预定义的错误创建函数**
```typescript
createContainerNotFoundError(containerId: string)
createTokenMissingError(mapType: string)
createMapLoadError(mapType: string, cause?: Error)
createNetworkError(resource: string, cause?: Error)
createScriptLoadError(url: string, cause?: Error)
createBrowserNotSupportedError(feature: string)
createInvalidParameterError(param: string, value?: unknown, reason?: string)
```

**使用示例**:
```typescript
// 容器未找到
throw createContainerNotFoundError('map-container');

// Token 缺失
throw createTokenMissingError('amap');

// 网络错误
throw createNetworkError('https://api.example.com');
```

### 4. **错误处理工具函数**

#### **类型卫兵**
```typescript
isFusionMapError(error: unknown): error is FusionMapError
```

#### **错误标准化**
```typescript
normalizeError(error: unknown): FusionMapError
// 将任何类型的错误转换为 FusionMapError
```

#### **可重试判断**
```typescript
isRetryable(error: unknown): boolean
// 判断错误是否可以重试
```

#### **错误格式化**
```typescript
formatError(error: unknown): string
// 格式化错误消息用于显示
```

### 5. **MapError 类（向后兼容）**

```typescript
export class MapError {
  type: 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';
  message: string;
  error?: Error;
  timestamp: number;
  code?: ErrorCode;

  static fromFusionMapError(
    type: MapType,
    fusionError: FusionMapError
  ): MapError
}
```

### 6. **在代码中的使用**

#### **FusionMap.ts**
```typescript
// 导入错误处理
import {
  ErrorCode,
  createContainerNotFoundError,
  normalizeError,
  type MapError
} from './errors';

// 使用容器未找到错误
if (!root) {
  const error = createContainerNotFoundError(containerId);
  this.errorSubject.next({
    type: 'amap',
    message: error.message,
    error,
    timestamp: Date.now()
  });
  throw error;
}

// 标准化错误
.catch((error) => {
  const normalizedError = normalizeError(error);
  this.errorSubject.next({
    type,
    message: `切换到 ${type} 失败: ${normalizedError.message}`,
    error: normalizedError.code ? normalizedError : undefined,
    timestamp: Date.now()
  });
});
```

#### **BaseMapProvider.ts**
```typescript
// 使用 Token 缺失错误
if (!key) {
  const error = createTokenMissingError('Amap');
  this.errorSubject.next({
    type: 'amap',
    message: error.message,
    error: error.code ? error : undefined,
    timestamp: Date.now()
  });
  this.renderError('Please provide Amap Key (JS API)', 'amap');
  return;
}
```

## 📊 **改进对比**

### **之前**
```typescript
// ❌ 没有错误码
throw new Error('Container not found');

// ❌ 没有上下文信息
console.error('Failed to load map', e);

// ❌ 错误类型不统一
error: e as any

// ❌ 没有错误级别
```

### **之后**
```typescript
// ✅ 有明确的错误码
throw createContainerNotFoundError(containerId);

// ✅ 完整的上下文信息
const error = createMapLoadError('amap', cause);
console.error(error.getDetailedMessage());

// ✅ 类型安全
error: FusionMapError

// ✅ 有错误级别
new FusionMapError(ErrorCode.TOKEN_MISSING, '...', { level: ErrorLevel.ERROR })
```

## 🎯 **核心优势**

### 1. **类型安全**
- ✅ 错误有明确的类型定义
- ✅ 支持类型卫兵（isFusionMapError）
- ✅ TypeScript 类型推断支持

### 2. **信息丰富**
- ✅ 错误码（便于识别和日志查询）
- ✅ 错误级别（便于分级处理）
- ✅ 上下文信息（便于问题定位）
- ✅ 堆栈跟踪（便于调试）
- ✅ 错误原因链（便于追踪）

### 3. **易于使用**
- ✅ 预定义的错误创建函数
- ✅ 标准化错误处理
- ✅ 简洁的错误信息格式化

### 4. **可扩展性**
- ✅ 易于添加新的错误码
- ✅ 支持自定义错误上下文
- ✅ 支持错误嵌套

### 5. **生产就绪**
- ✅ 错误可重试判断
- ✅ 错误详细信息获取
- ✅ JSON 序列化支持
- ✅ 向后兼容

## 📈 **使用示例**

### **基本使用**
```typescript
try {
  await map.switchBaseMap('amap');
} catch (error) {
  if (isFusionMapError(error)) {
    console.error(`[${error.code}] ${error.message}`);
    if (error.isRetryable()) {
      // 重试逻辑
    }
  }
}
```

### **错误监听**
```typescript
map.errors$.subscribe((mapError) => {
  console.error('Map Error:', mapError.message);
  if (mapError.error?.code) {
    // 可以根据错误码进行特殊处理
  }
});
```

### **自定义错误**
```typescript
const error = new FusionMapError(
  ErrorCode.INVALID_PARAMETER,
  'Invalid zoom level',
  {
    context: {
      param: 'zoom',
      value: 25,
      reason: 'Must be between 0 and 22'
    },
    level: ErrorLevel.WARN
  }
);
throw error;
```

## 🎉 **成果**

- ✅ **完整的错误处理系统**已实现
- ✅ **类型安全**得到保证
- ✅ **代码可维护性**显著提升
- ✅ **错误调试体验**大幅改善
- ✅ **TypeScript 类型检查**通过
- ✅ **构建**成功

错误处理机制已全部完成！🚀
