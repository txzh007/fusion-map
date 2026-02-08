/**
 * Fusion Map 错误处理系统
 * 提供统一的错误类型、错误码和错误处理机制
 */

// ============ 错误码枚举 ============

/**
 * 错误码枚举
 * 用于标识不同类型的错误
 */
export enum ErrorCode {
  // ============ 初始化错误 ============
  /** 容器未找到 */
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  /** 容器初始化失败 */
  CONTAINER_INIT_FAILED = 'CONTAINER_INIT_FAILED',
  /** 容器类型错误 */
  CONTAINER_TYPE_ERROR = 'CONTAINER_TYPE_ERROR',

  // ============ 令牌错误 ============
  /** Token 缺失 */
  TOKEN_MISSING = 'TOKEN_MISSING',
  /** Token 无效 */
  TOKEN_INVALID = 'TOKEN_INVALID',
  /** Token 过期 */
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // ============ 地图加载错误 ============
  /** 地图加载失败 */
  MAP_LOAD_FAILED = 'MAP_LOAD_FAILED',
  /** 地图切换失败 */
  MAP_SWITCH_FAILED = 'MAP_SWITCH_FAILED',
  /** 地图同步失败 */
  MAP_SYNC_FAILED = 'MAP_SYNC_FAILED',
  /** 地图实例化失败 */
  MAP_INSTANTIATION_FAILED = 'MAP_INSTANTIATION_FAILED',

  // ============ 网络错误 ============
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 脚本加载失败 */
  SCRIPT_LOAD_FAILED = 'SCRIPT_LOAD_FAILED',
  /** 超时 */
  TIMEOUT = 'TIMEOUT',

  // ============ 资源错误 ============
  /** 瓦片加载失败 */
  TILE_LOAD_FAILED = 'TILE_LOAD_FAILED',
  /** 样式加载失败 */
  STYLE_LOAD_FAILED = 'STYLE_LOAD_FAILED',
  /** 资源不存在 */
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // ============ 状态错误 ============
  /** 无效状态 */
  INVALID_STATE = 'INVALID_STATE',
  /** 地图未初始化 */
  MAP_NOT_INITIALIZED = 'MAP_NOT_INITIALIZED',
  /** 操作正在执行 */
  OPERATION_IN_PROGRESS = 'OPERATION_IN_PROGRESS',

  // ============ 参数错误 ============
  /** 无效参数 */
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  /** 缺少必需参数 */
  MISSING_REQUIRED_PARAMETER = 'MISSING_REQUIRED_PARAMETER',
  /** 参数超出范围 */
  PARAMETER_OUT_OF_RANGE = 'PARAMETER_OUT_OF_RANGE',

  // ============ 兼容性错误 ============
  /** 浏览器不支持 */
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  /** WebGL 不支持 */
  WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED',
  /** 特性不支持 */
  FEATURE_NOT_SUPPORTED = 'FEATURE_NOT_SUPPORTED',

  // ============ 权限错误 ============
  /** 权限拒绝 */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** 地理位置不可用 */
  GEOLOCATION_NOT_AVAILABLE = 'GEOLOCATION_NOT_AVAILABLE',

  // ============ 依赖错误 ============
  /** 缺少依赖 */
  DEPENDENCY_MISSING = 'DEPENDENCY_MISSING',
  /** 依赖版本不兼容 */
  DEPENDENCY_VERSION_INCOMPATIBLE = 'DEPENDENCY_VERSION_INCOMPATIBLE',

  // ============ 未知错误 ============
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ============ 错误级别枚举 ============

/**
 * 错误级别
 */
export enum ErrorLevel {
  /** 信息级别 */
  INFO = 'info',
  /** 警告级别 */
  WARN = 'warn',
  /** 错误级别 */
  ERROR = 'error',
  /** 致命错误 */
  FATAL = 'fatal'
}

// ============ 错误接口 ============

/**
 * 错误详情接口
 */
export interface ErrorDetails {
  /** 错误码 */
  code?: ErrorCode;
  /** 错误消息 */
  message: string;
  /** 错误原因 */
  cause?: Error;
  /** 时间戳 */
  timestamp: number;
  /** 错误级别 */
  level?: ErrorLevel;
  /** 上下文信息 */
  context?: Record<string, unknown>;
  /** 堆栈跟踪 */
  stack?: string;
}

// ============ FusionMap 错误类 ============

/**
 * Fusion Map 统一错误类
 * 扩展原生 Error 类，提供更丰富的错误信息
 */
export class FusionMapError extends Error {
  /**
   * 错误码
   */
  public readonly code: ErrorCode;

  /**
   * 错误级别
   */
  public readonly level: ErrorLevel;

  /**
   * 错误上下文
   */
  public readonly context?: Record<string, unknown>;

  /**
   * 时间戳
   */
  public readonly timestamp: number;

  /**
   * 错误原因
   */
  public readonly cause?: Error;

  /**
   * 构造函数
   * @param code - 错误码
   * @param message - 错误消息
   * @param options - 错误选项
   */
  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      level?: ErrorLevel;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);

    // 错误名称使用错误码
    this.name = `FusionMapError[${code}]`;

    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FusionMapError);
    }

    this.code = code;
    this.level = options?.level || ErrorLevel.ERROR;
    this.context = options?.context;
    this.cause = options?.cause;
    this.timestamp = Date.now();

    // 确保 message 是公共属性
    Object.defineProperty(this, 'message', {
      value: message,
      enumerable: true,
      writable: true,
      configurable: true
    });
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      level: this.level,
      context: this.context,
      stack: this.stack,
      cause: this.cause
    };
  }

  /**
   * 获取详细的错误信息字符串
   */
  getDetailedMessage(): string {
    let msg = `[${this.code}] ${this.message}`;

    if (this.context && Object.keys(this.context).length > 0) {
      const contextStr = Object.entries(this.context)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(', ');
      msg += `\nContext: { ${contextStr} }`;
    }

    if (this.cause) {
      msg += `\nCaused by: ${this.cause.message}`;
    }

    return msg;
  }

  /**
   * 是否可以重试
   */
  isRetryable(): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT,
      ErrorCode.SCRIPT_LOAD_FAILED,
      ErrorCode.MAP_LOAD_FAILED
    ];
    return retryableCodes.includes(this.code);
  }
}

// ============ MapError 类（用于向后兼容） ============

/**
 * MapError 类
 * 用于向后兼容，与 BaseMapProvider 中的 MapError 接口保持一致
 */
export class MapError {
  /** 错误相关的地图类型 */
  type: 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';

  /** 错误消息 */
  message: string;

  /** 原始错误对象 */
  error?: Error;

  /** 时间戳 */
  timestamp: number;

  /** 错误码 */
  code?: ErrorCode;

  /**
   * 构造函数
   */
  constructor(
    type: MapError['type'],
    message: string,
    error?: Error,
    code?: ErrorCode
  ) {
    this.type = type;
    this.message = message;
    this.error = error;
    this.timestamp = Date.now();
    this.code = code;
  }

  /**
   * 从 FusionMapError 创建 MapError
   */
  static fromFusionMapError(
    type: MapError['type'],
    fusionError: FusionMapError
  ): MapError {
    return new MapError(
      type,
      fusionError.message,
      fusionError.cause,
      fusionError.code
    );
  }
}

// ============ 错误辅助函数 ============

/**
 * 创建容器未找到错误
 */
export function createContainerNotFoundError(containerId: string): FusionMapError {
  return new FusionMapError(
    ErrorCode.CONTAINER_NOT_FOUND,
    `Container element with ID "${containerId}" not found`,
    {
      context: { containerId },
      level: ErrorLevel.FATAL
    }
  );
}

/**
 * 创建 Token 缺失错误
 */
export function createTokenMissingError(mapType: string): FusionMapError {
  return new FusionMapError(
    ErrorCode.TOKEN_MISSING,
    `Token is required for ${mapType} map provider`,
    {
      context: { mapType },
      level: ErrorLevel.ERROR
    }
  );
}

/**
 * 创建地图加载失败错误
 */
export function createMapLoadError(
  mapType: string,
  cause?: Error
): FusionMapError {
  return new FusionMapError(
    ErrorCode.MAP_LOAD_FAILED,
    `Failed to load ${mapType} map`,
    {
      context: { mapType },
      cause,
      level: ErrorLevel.ERROR
    }
  );
}

/**
 * 创建网络错误
 */
export function createNetworkError(
  resource: string,
  cause?: Error
): FusionMapError {
  return new FusionMapError(
    ErrorCode.NETWORK_ERROR,
    `Network error while loading ${resource}`,
    {
      context: { resource },
      cause,
      level: ErrorLevel.WARN
    }
  );
}

/**
 * 创建脚本加载失败错误
 */
export function createScriptLoadError(
  url: string,
  cause?: Error
): FusionMapError {
  return new FusionMapError(
    ErrorCode.SCRIPT_LOAD_FAILED,
    `Failed to load script: ${url}`,
    {
      context: { url },
      cause,
      level: ErrorLevel.WARN
    }
  );
}

/**
 * 创建浏览器不支持错误
 */
export function createBrowserNotSupportedError(feature: string): FusionMapError {
  return new FusionMapError(
    ErrorCode.BROWSER_NOT_SUPPORTED,
    `Browser does not support ${feature}`,
    {
      context: { feature },
      level: ErrorLevel.FATAL
    }
  );
}

/**
 * 创建无效参数错误
 */
export function createInvalidParameterError(
  param: string,
  value?: unknown,
  reason?: string
): FusionMapError {
  const message = `Invalid parameter "${param}"`;
  const context: Record<string, unknown> = { param };

  if (value !== undefined) {
    context.value = value;
  }

  if (reason) {
    context.reason = reason;
  }

  return new FusionMapError(
    ErrorCode.INVALID_PARAMETER,
    message,
    {
      context,
      level: ErrorLevel.ERROR
    }
  );
}

// ============ 错误处理工具函数 ============

/**
 * 判断是否为 FusionMapError
 */
export function isFusionMapError(error: unknown): error is FusionMapError {
  return error instanceof FusionMapError;
}

/**
 * 判断错误是否可重试
 */
export function isRetryable(error: unknown): boolean {
  if (isFusionMapError(error)) {
    return error.isRetryable();
  }
  return false;
}

/**
 * 将未知错误转换为 FusionMapError
 */
export function normalizeError(error: unknown): FusionMapError {
  if (isFusionMapError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new FusionMapError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      { cause: error }
    );
  }

  if (typeof error === 'string') {
    return new FusionMapError(ErrorCode.UNKNOWN_ERROR, error);
  }

  return new FusionMapError(
    ErrorCode.UNKNOWN_ERROR,
    'Unknown error occurred',
    {
      context: { originalError: error }
    }
  );
}

/**
 * 格式化错误消息用于显示
 */
export function formatError(error: unknown): string {
  const normalized = normalizeError(error);
  return normalized.getDetailedMessage();
}

// ============ 默认导出 ============

export default {
  ErrorCode,
  ErrorLevel,
  FusionMapError,
  MapError,
  createContainerNotFoundError,
  createTokenMissingError,
  createMapLoadError,
  createNetworkError,
  createScriptLoadError,
  createBrowserNotSupportedError,
  createInvalidParameterError,
  isFusionMapError,
  isRetryable,
  normalizeError,
  formatError
};
