# Overlay Completion Skill Template

- Owner: FusionMap Core Team
- Status: Active
- Last Updated: 2026-02-24
- Category: Overlay

## 能力目标

系统化补齐覆盖物实现缺口，确保“类型声明、工厂实现、导出能力、示例与测试”保持一致，避免 API 承诺与运行时行为不一致。

## 触发信号

- `OverlayFactory` 中出现 `TODO` 或 `not implemented`。
- README/类型定义已声明某类覆盖物，但实际构造时报错。
- 新增覆盖物类型（如 `Polygon/Circle`）进入排期。

## 输入上下文

- 覆盖物类型与接口：`packages/core/src/types/overlays.ts`
- 覆盖物工厂：`packages/core/src/overlays/OverlayFactory.ts`
- API 出口：`packages/core/src/overlays/index.ts`、`packages/core/src/public-api.ts`
- 覆盖物文档：`packages/core/src/overlays/README.md`、`README.md`、`README_zh-CN.md`
- 覆盖物测试：`packages/core/src/__tests__/overlays/`

## 执行步骤

1. 选择本轮补齐范围（建议一次 1-2 类）。
2. 在 `types/overlays.ts` 确认构造参数、方法和事件契约。
3. 在 `overlays/` 新增实现类并接入 `OverlayFactory`。
4. 在 `overlays/index.ts` 与 `public-api.ts` 补齐导出（若对外可用）。
5. 在 `overlays/README.md` 与主 README 中更新“已实现/计划中”状态。
6. 增加最小可用测试：创建、更新、销毁、事件、序列化（按类型选择）。

## 验收标准

- 新增覆盖物类型可被工厂成功创建，不再抛 `not implemented`。
- 对外导出与 README 描述一致。
- 对应测试通过，且不会破坏已有 `Marker/Polyline` 行为。

## 风险与边界

- 不支持能力必须显式降级（错误码或告警），不得静默失败。
- 不在本技能中扩展跨 provider 渲染特性，先保证 MapLibre-first 可用。

## 最小测试命令

```bash
yarn workspace fusion-map test packages/core/src/__tests__/overlays/example.test.ts
```

## 可复用 Prompt 模板

```text
请执行 Overlay Completion Skill：
1) 基于 types/overlays.ts 确认 [目标覆盖物类型] 契约；
2) 在 overlays 模块实现并接入 OverlayFactory；
3) 同步 overlays/index.ts 与 public-api.ts 导出；
4) 更新 overlays/README.md 与 README 中英文的实现状态；
5) 增加最小测试并报告结果与兼容性差异。
输出：修改文件清单、测试结果、降级策略说明。
```
