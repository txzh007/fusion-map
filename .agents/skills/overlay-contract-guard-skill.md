# Overlay Contract Guard Skill Template

- Owner: FusionMap Core Team
- Status: Active
- Last Updated: 2026-02-24
- Category: Overlay Governance

## 能力目标

建立覆盖物 API 的“合同一致性守卫”，确保以下四方严格对齐：

1. 类型声明（Type Contract）
2. 工厂实现（Runtime Factory）
3. 对外导出（Public Exports）
4. 文档能力矩阵（README/Overlays README）

## 触发信号

- 新增或删除覆盖物类型。
- 版本发布前进行 API 清点。
- 用户反馈“文档写支持，但代码不可用”。

## 输入上下文

- 类型契约：`packages/core/src/types/overlays.ts`
- 工厂实现：`packages/core/src/overlays/OverlayFactory.ts`
- 导出入口：`packages/core/src/overlays/index.ts`、`packages/core/src/public-api.ts`
- 文档矩阵：`packages/core/src/overlays/README.md`、`README.md`、`README_zh-CN.md`

## 执行步骤

1. 生成能力清单（按覆盖物类型列出声明/实现/导出/文档状态）。
2. 标记差异项（Missing / Planned / Implemented / Exported）。
3. 对每个差异选择动作：
   - 补实现；或
   - 降级为 `planned` 并同步文档；或
   - 从公共导出移除（若尚未准备公开）。
4. 更新文档中的能力矩阵，明确可用性等级。
5. 新增或更新一致性测试（至少覆盖核心类型）。

## 验收标准

- 四方清单无冲突项。
- 对外 API 不暴露“声明存在但运行时报错”的能力。
- 文档中的 `已实现/计划中` 与代码状态一致。

## 风险与边界

- 该技能不要求实现新功能，重点是“对齐与收口”。
- 若存在重大兼容性调整，需要在 PR 中标注 breaking risk。

## 合同检查清单（可复制）

- [ ] `types/overlays.ts` 已声明的能力，在工厂中可创建或明确 `planned`
- [ ] `public-api.ts` 仅导出稳定能力
- [ ] `overlays/index.ts` 与 `public-api.ts` 导出意图一致
- [ ] README 中英文与 `overlays/README.md` 状态一致
- [ ] 不存在未标注的运行时 `not implemented`

## 可复用 Prompt 模板

```text
请执行 Overlay Contract Guard Skill：
1) 盘点 types/overlays.ts、OverlayFactory、overlays/index.ts、public-api.ts、README 中英文；
2) 输出四方能力矩阵并标记冲突项；
3) 以最小改动修复冲突（补实现或降级为 planned）；
4) 更新文档与必要测试；
5) 输出最终矩阵与风险说明。
```
