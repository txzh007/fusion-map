# FusionMap 详细修改计划（基于当前代码现状）

## 1) 我对项目功能与意义的理解

### 功能定位
- 这是一个“统一地图交互层”SDK：上层固定使用 MapLibre 接口，下层可切换高德/百度/谷歌/Cesium/天地图。
- 核心能力是“相机状态同步 + 坐标系转换 + 多底图热切换”，让业务层避免被单一地图厂商绑定。

### 业务意义
- **降耦合**：业务代码可以跨底图复用，降低迁移与合规风险。
- **提升上限**：可同时利用 MapLibre 的矢量能力和第三方底图生态。
- **可持续演进**：通过 provider 模式扩展新底图，减少重写成本。

### 当前阶段判断
- 架构基础已具备生产雏形，但“可靠性、类型严谨性、文档一致性、发布门禁”仍需系统补齐。

---

## 2) 计划目标与范围

### 两周目标（明确可验收）
1. 第三方 SDK 加载失败可预期、可重试、可观测。
2. 文档与代码能力边界一致（避免误导）。
3. 核心路径显著减少 `any/ts-ignore`，提升维护安全性。
4. 建立最小发布质量门禁（lint/test/build/coverage）。

### 本次不做（控范围）
- 不新增大型业务功能（如全新渲染模块）。
- 不做跨平台重构（仅修核心稳定性与工程质量）。

---

## 3) 详细执行计划（按优先级与周节奏）

## Week 1（P0：稳定性与一致性）

### 任务 A：重构脚本加载链路（最高优先级）
**目标**
- 让 SDK 注入具备：去重、超时、有限重试、错误码标准化、可观测日志。

**涉及文件**
- `packages/core/src/services/BaseMapProvider.ts`
- `packages/core/src/errors/index.ts`
- `packages/core/src/__tests__/BaseMapProvider.error.test.ts`

**实施步骤**
1. 抽离 `loadScript` 状态机：`idle/loading/success/failed`。
2. 增加超时控制（如 10-15s）并区分 `TIMEOUT` 与 `SCRIPT_LOAD_FAILED`。
3. 修正“伪重试”逻辑为真正重试（指数退避可选，先实现固定间隔即可）。
4. 在错误上报中附带 `src/mapType/retryCount` 上下文。
5. 保持同 URL 并发请求只创建一次 Promise（避免重复注入）。

**验收标准**
- 错误路径测试覆盖：首次失败、重试后成功、超时失败、重复调用去重。
- 在断网或 key 错误时，不出现未捕获 Promise 报错。

---

### 任务 B：Google Provider 稳定性修复（紧随其后）
**目标**
- 避免无效配置导致 SDK 初始化崩溃，明确向用户反馈。

**涉及文件**
- `packages/core/src/services/BaseMapProvider.ts`
- `examples/demo/src/App.tsx`

**实施步骤**
1. 保持 `googleMapId` 可选，但对“需要 vector 特性”的场景进行能力检测后降级。
2. 对 `google.maps` 不可用、`importLibrary` 失败、Key 无效等场景统一报错。
3. demo 中在切换 Google 前做前置校验提示（Key 必填，Map ID 视特性提示）。

**验收标准**
- 无效 Key 时，页面可恢复且错误信息明确。
- 不再出现“读取 undefined.maps”这类二次异常。

---

### 任务 C：文档与真实能力对齐
**目标**
- 让 README、包名、能力清单与实际实现一致，避免使用者误解。

**涉及文件**
- `README.md`
- `README_zh-CN.md`
- `packages/core/src/overlays/README.md`
- `packages/core/src/overlays/OverlayFactory.ts`

**实施步骤**
1. 统一安装与 import 示例中的包名（`fusion-map`）。
2. 对未实现覆盖物（如 polygon/circle）明确标注“计划中”或补最小实现。
3. 增加“生产接入注意事项”：API Key、域名白名单、配额限制、错误排查。

**验收标准**
- README 示例可直接运行，不出现包名冲突。
- 能力说明与当前代码行为一致。

---

## Week 2（P1：类型与发布质量）

### 任务 D：核心路径类型收敛
**目标**
- 降低运行时不确定性，提升 IDE 与重构安全。

**涉及文件**
- `packages/core/src/FusionMap.ts`
- `packages/core/src/services/BaseMapProvider.ts`
- `packages/core/src/types/third-party.ts`
- `packages/core/src/types/index.ts`

**实施步骤**
1. 为 provider 实例定义最小能力接口（Amap/Baidu/Google/Cesium）。
2. 将高频 `any` 替换为联合类型或最小接口。
3. 逐步减少关键路径 `ts-ignore`（先处理初始化、切图、相机同步路径）。
4. 对外类型只暴露 public API，内部类型留在实现层。

**验收标准**
- 关键文件 `any/ts-ignore` 数量下降（建议目标：下降 40%+）。
- `yarn workspace fusion-map build` 与 `test` 全绿。

---

### 任务 E：建立最小 CI 质量门禁
**目标**
- 让每次提交都经过自动校验，降低回归概率。

**涉及文件**
- `.github/workflows/ci.yml`（新增）
- `package.json`
- `packages/core/vitest.config.ts`

**实施步骤**
1. CI 流水线执行：install → lint → test → build。
2. 增加 coverage 报告与最低阈值（先保守阈值，后续提高）。
3. 发布前检查脚本（可先在 root scripts 增加 `check` 聚合命令）。

**验收标准**
- PR 自动跑通质量门禁。
- 覆盖率结果可见且门槛生效。

---

### 任务 F：demo 凭据安全基线优化
**目标**
- 演示可用同时避免误导生产做法。

**涉及文件**
- `examples/demo/src/App.tsx`

**实施步骤**
1. 弱化/移除默认 `localStorage` 持久化，改为显式“记住我”开关。
2. 增加 Key 使用提示与安全说明（仅本地开发，生产走服务端注入）。
3. 切换失败时提供可读提示，不暴露底层异常细节。

**验收标准**
- 首次进入 demo 不会自动持久化敏感凭据。
- 用户能清晰理解失败原因与下一步操作。

---

## 4) 任务分解与人天建议

- 任务 A：2.0 人天
- 任务 B：1.0 人天
- 任务 C：0.5 人天
- 任务 D：2.0 人天
- 任务 E：1.0 人天
- 任务 F：0.5 人天

**总计**：约 7.0 人天（单人两周可落地并留有回归缓冲）

---

## 5) 风险与应对

- **外部 SDK 不可控**：Google/Baidu/Amap 行为可能变更。  
	应对：统一降级分支 + 可观测日志 + 错误码沉淀。

- **类型收敛影响面大**：一次性替换风险高。  
	应对：按“初始化→切图→同步”路径分批提交。

- **测试真实性不足**：大量 mock 难覆盖真实网络问题。  
	应对：保留单测，新增最小 e2e 冒烟脚本（后续可接 Playwright）。

---

## 6) 每周里程碑

### Week 1 结束里程碑
- SDK 加载错误可控且可追踪。
- Google 切换异常可恢复。
- 文档与能力边界对齐。

### Week 2 结束里程碑
- 核心路径类型债显著下降。
- CI 门禁生效并可稳定通过。
- demo 凭据策略达到“安全演示基线”。

---

## 7) 交付物清单

- 代码：脚本加载重构、Google provider 修复、类型收敛、CI 配置。
- 文档：README 对齐、能力边界说明、安全接入建议。
- 测试：错误路径新增用例、回归测试结果、coverage 报告。

