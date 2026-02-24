## PR Checklist (FusionMap)

### 0) 变更类型
- [ ] Bugfix
- [ ] Feature
- [ ] Refactor
- [ ] Docs
- [ ] Test/CI
- [ ] Chore

### 1) 现象与根因（必填）
- **现象**：
- **根因分类**（可多选）：
  - [ ] SDK 限制/外部行为
  - [ ] 相机语义映射（zoom/pitch/bearing）
  - [ ] 写入顺序/时序问题
  - [ ] 坐标系/投影差异
  - [ ] 容错/稳定性不足
  - [ ] 其他：
- **根因说明**（1-3 句）：

### 2) 修复方案（最小改动）
- [ ] 仅修改必要文件，无无关重构
- [ ] 改动范围已控制在最小可行集
- **核心改动点**（1-5 条）：
  1.
  2.
  3.

### 3) 策略一致性检查（涉及相机/策略时必填）
- [ ] 已检查 Provider 侧策略是否生效
- [ ] 已检查 MapLibre 侧表现是否一致（如需）
- [ ] 无新增循环同步/抖动风险
- **涉及文件**：
  - `packages/core/src/services/SyncEngine.ts`
  - `packages/core/src/services/providers/*`
  - `packages/core/src/services/providers/cameraPolicies.ts`

### 4) 稳定性与兜底（涉及外部 SDK 时必填）
- [ ] 脚本加载具备超时/重试/去重（如适用）
- [ ] 失败路径无未捕获异常
- [ ] 错误信息对用户可理解（含下一步建议）
- [ ] 无全局副作用或重复注入
- **风险说明**（可空）：

### 5) 测试与验证（必填）
- [ ] 已运行最小必要测试并通过
  - [ ] `yarn workspace fusion-map test BaseMapProvider.test.ts`
  - [ ] `yarn workspace fusion-map test SyncEngine.test.ts`
  - [ ] （涉及构造流程）`yarn workspace fusion-map test FusionMap.test.ts`
- [ ] 补充或更新了相关测试断言
- **测试结果摘要**（通过/失败及原因）：

### 6) 文档一致性（行为变化时必填）
- [ ] 已同步 `README.md`
- [ ] 已同步 `README_zh-CN.md`
- [ ] （如影响发布）已更新 `SDK_IMPROVEMENTS.md`
- **文档变更说明**：

### 7) 兼容性与发布影响
- [ ] 无 Breaking Change
- [ ] 有 Breaking Change（请在下方说明）
- [ ] 仅内部行为调整，对外 API 不变
- [ ] 需要发布说明/迁移指南
- **影响范围**（provider/模块/平台）：

### 8) 回滚与应急
- [ ] 已评估回滚方案（可快速恢复）
- [ ] 已识别高风险点并给出监控项
- **回滚方案简述**：

---

## 变更摘要（给 Reviewer）
- **Why（为什么改）**：
- **What（改了什么）**：
- **How to verify（如何验证）**：

## 关联信息
- Issue/Task:
- 相关 PR:
