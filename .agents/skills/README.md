# skills 目录规范

本目录存放项目的 Agent 技能定义文档，面向“可执行能力”而非普通说明文。

## 当前文件

- [fusion-map-agent-skills.md](fusion-map-agent-skills.md)：项目级技能总表（主入口）
- [overlay-completion-skill.md](overlay-completion-skill.md)：覆盖物实现补完模板（Skill G）
- [overlay-contract-guard-skill.md](overlay-contract-guard-skill.md)：覆盖物合同一致性守卫模板（Skill H）

## 1. 放什么

- 项目级技能总表（如：`fusion-map-agent-skills.md`）
- 某个专项技能（如：相机语义、覆盖物抽象、稳定性兜底）
- 可复用 Prompt 模板（建议内嵌在技能文档中）

## 2. 不放什么

- 临时讨论稿（放 `plan/` 或 issue）
- 发布日志（放 CHANGELOG/PR）
- 与 Agent 无关的业务需求文档

## 3. 推荐文档结构

每个技能文档建议包含以下段落：

1. 能力目标
2. 触发信号
3. 执行步骤
4. 验收标准
5. 风险与边界
6. 可复用 Prompt 模板（可选）

## 4. 命名与拆分规则

- 总表文件：`<project>-agent-skills.md`
- 专项文件：`<domain>-<topic>-skill.md`（例如 `camera-sync-skill.md`）
- 当单文件超过约 500 行或跨 3 个以上能力域时，拆分成多个专项文件。

## 5. 维护约定

- 新增技能时，先更新总表中的索引或导航段落。
- 技能有行为变更时，需同步更新示例 Prompt。
- 若技能影响代码策略，README（中英文）需同步更新能力说明/限制。

## 6. 最小模板

```markdown
# <Skill Title>

## 能力目标

## 触发信号

## 执行步骤

## 验收标准

## 风险与边界

## Prompt 模板（可选）
```
