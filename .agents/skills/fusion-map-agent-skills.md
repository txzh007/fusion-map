# FusionMap Agent Skills（高阶版）

- Owner: FusionMap Core Team
- Last Updated: 2026-02-24
- Status: Active
- Directory Standard: [../README.md](../README.md)
- Skills Standard: [README.md](README.md)

本文件定义这个项目的“强力智能代理能力”，目标是让 agent 不只是回答问题，而是能稳定完成 **诊断 → 修改 → 验证 → 文档同步** 的闭环。

## Skill A：跨底图相机语义诊断（Camera Semantics Auditor）

**能力目标**
- 自动识别 MapLibre 与第三方底图在 `zoom/pitch/bearing` 语义差异。
- 输出“根因级”结论（SDK 限制、坐标系差异、顺序问题、阈值策略问题）。

**触发信号**
- 用户描述“回弹、抖动、不同步、低层级异常”。
- 测试中出现与 `updateCamera`、`switchMap` 相关失败。

**执行步骤**
1. 读取 `SyncEngine` + 当前 provider adapter + `cameraPolicies`。
2. 对比“输入语义（MapLibre）→ 输出语义（Provider）”映射链。
3. 检查写入顺序（先 zoom 后 pitch/bearing）与帧级二次回写。
4. 给出可执行修复（最小改动优先）。

**验收标准**
- 能明确回答“是 SDK 行为还是代码缺陷”。
- 修复后有至少一轮聚焦测试通过。

---

## Skill B：策略双向同步守卫（Policy Bidirectional Guard）

**能力目标**
- 任何 provider 策略不仅作用于第三方地图，也能同步回 MapLibre（若业务要求）。

**触发信号**
- 用户提出“策略影响 maplibre”。
- 出现“第三方已变但 MapLibre UI 仍旧值”的反馈。

**执行步骤**
1. 在 `cameraPolicies` 固化阈值/规则。
2. 在 provider adapter 应用策略。
3. 在 `SyncEngine.pushCameraState` 同步应用对应策略。
4. 增加最小回归测试或更新现有断言。

**验收标准**
- MapLibre 与目标 provider 在策略触发区间一致。
- 不引入额外循环同步或明显卡顿。

---

## Skill C：外部 SDK 不确定性兜底（Provider Resilience）

**能力目标**
- 对外部 SDK 的不可控行为提供稳定兜底（不崩溃、可恢复、可观测）。

**触发信号**
- 初始化偶发失败、超时、Key 无效、SDK 回写覆盖。

**执行步骤**
1. 对脚本加载实施：超时、重试、去重。
2. 对相机写入实施：clamp、无动画写入、必要帧级回写。
3. 明确区分“可修复 bug”与“第三方限制”。

**验收标准**
- 失败路径不抛未捕获异常。
- 用户可看到明确错误信息与下一步建议。

---

## Skill D：测试门禁驱动修复（Test-First Patching）

**能力目标**
- agent 每次改动后优先跑“最小必要测试”，避免大回归。

**触发信号**
- 修改 `BaseMapProvider` / `SyncEngine` / 任一 provider adapter。

**默认测试顺序**
1. `yarn workspace fusion-map test BaseMapProvider.test.ts`
2. `yarn workspace fusion-map test SyncEngine.test.ts`
3. 涉及构造流程时再跑 `FusionMap.test.ts`

**验收标准**
- 相关测试全绿后再继续扩展修改。
- 失败时优先修根因，不做旁路绕过。

---

## Skill E：文档一致性自动维护（Docs Parity Enforcer）

**能力目标**
- 代码行为变化后，自动同步 README（中英文）与关键说明文档。

**触发信号**
- 新增/调整策略、已知问题、能力边界。

**执行步骤**
1. 更新 `README.md` 与 `README_zh-CN.md` 同步段落。
2. 重要限制在代码关键位置补注释。
3. 如影响发布，补 `SDK_IMPROVEMENTS.md` 条目。

**验收标准**
- 文档描述与当前实现一致，不出现“代码有、文档无”或反之。

---

## Skill F：覆盖物跨底图抽象（Overlay Abstraction Architect）

**能力目标**
- 基于 MapLibre 语义层封装覆盖物能力（Marker/Polyline/Polygon/Circle），实现“**一次编写，到处运行**”。

**触发信号**
- 用户提出“覆盖物统一 API”“跨底图复用覆盖物”“不想写 provider-specific 代码”。
- 代码中出现多 provider 重复覆盖物逻辑。

**执行步骤**
1. 先定义统一 Overlay 接口（构造参数、样式、事件、生命周期）。
2. 在 `overlays/` 实现 MapLibre-first 基础类与抽象工厂。
3. 在 provider adapter 中补能力映射和降级策略（不支持时给出显式 fallback）。
4. 为每类覆盖物补最小可用示例与测试。
5. 更新 README/README_zh-CN 的能力矩阵与限制说明。

**验收标准**
- 业务代码不依赖具体 provider，即可运行主流覆盖物场景。
- 同一覆盖物定义在至少 2 个 provider 上行为一致（允许受限差异需文档化）。

**专项模板**
- [overlay-completion-skill.md](overlay-completion-skill.md)
- [overlay-contract-guard-skill.md](overlay-contract-guard-skill.md)

---

## Agent 运行规则（建议作为系统提示词）

1. **根因优先**：先定位语义链路问题，再改代码。
2. **最小改动**：只改必要文件，不重构无关模块。
3. **先测后扩**：每次改动后跑聚焦测试。
4. **双端一致**：涉及策略时，同时考虑 provider 与 maplibre。
5. **可解释性**：输出“现象-原因-修复-验证”四段式结果。
6. **覆盖物优先 MapLibre 语义**：新增覆盖物能力时，先统一抽象，再做 provider 映射。

---

## 可复用 Prompt 模板（给 Agent 用）

### 模板 1：相机不同步问题

```text
你是 fusion-map 维护代理。请按以下步骤执行：
1) 读取 SyncEngine、对应 provider adapter、cameraPolicies。
2) 找出 MapLibre -> Provider 的 zoom/pitch/bearing 映射与写入顺序问题。
3) 以最小改动修复，并确保策略可选地同步回 MapLibre。
4) 运行 BaseMapProvider.test.ts 与 SyncEngine.test.ts。
5) 输出：根因、修改文件、验证结果、风险说明。
```

### 模板 2：新增 provider 策略

```text
请为 [provider] 新增相机策略：
- 在 cameraPolicies 增加阈值常量与解析函数；
- 在 adapter 应用策略；
- 如需求要求，SyncEngine 也同步应用；
- 更新 README 中英文“已知问题/行为说明”；
- 跑对应测试并报告结果。
```

### 模板 3：稳定性专项

```text
请对外部 SDK 稳定性做专项改进：
- 保证脚本加载可重试、可超时、可观测；
- 失败时错误信息面向用户可理解；
- 不引入全局副作用与重复注入；
- 提供测试与文档同步结果。
```

### 模板 4：覆盖物封装专项（一次编写到处运行）

```text
请实现/扩展 Fusion Map 覆盖物统一封装（MapLibre First）：
1) 先定义统一 Overlay API（参数、样式、事件、生命周期）。
2) 在 overlays 模块实现基础抽象与工厂。
3) 在 provider adapter 中完成能力映射，并为不支持能力提供降级策略。
4) 增加最小测试与 demo 示例。
5) 更新 README 中英文的能力矩阵、限制与路线图。
输出：设计说明、修改文件、测试结果、兼容性差异清单。
```

---

## Agent Skills 成熟度分级

- **L1（可用）**：能完成单点修复 + 基本测试。
- **L2（可靠）**：能处理跨 provider 策略、双向同步、文档同步。
- **L3（优秀）**：能在复杂回归场景下快速定位根因并最小化改动。
- **L4（强力）**：能批量处理“策略、测试、文档、发布门禁”全链路。

> 当前项目目标：在两周内达到 **L3**，并为 **L4** 预留 CI 与模板化能力。
