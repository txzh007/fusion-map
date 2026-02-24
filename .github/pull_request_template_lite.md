## PR Checklist (Lite)

### 1) 为什么改
- 现象：
- 根因：

### 2) 改了什么
- [ ] 最小改动（无无关重构）
- 核心改动：
  1.
  2.

### 3) 验证
- [ ] `yarn workspace fusion-map test BaseMapProvider.test.ts`
- [ ] `yarn workspace fusion-map test SyncEngine.test.ts`
- [ ] （如涉及构造）`yarn workspace fusion-map test FusionMap.test.ts`
- 结果：

### 4) 一致性
- [ ] Provider 与 MapLibre 策略表现一致（如适用）
- [ ] 失败路径可恢复、错误可读（如适用）

### 5) 文档
- [ ] 不涉及文档
- [ ] 已同步 `README.md` / `README_zh-CN.md` / `SDK_IMPROVEMENTS.md`（按需）
