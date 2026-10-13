# 数据说明

所有 JSON 均为对象数组；对应 CSV 使用同名列与 UTF-8 BOM 编码，便于表格软件打开。`manifest.json` 记录版本、行数与日期。

## 字段与关联

| 数据表 | 主键 | 主要字段 |
|---|---|---|
| techniques | technique_id | label、group、description、limitation、source_id、source_url、evidence_level、source_locator、display_parameters |
| evidence | evidence_id | branch、structure、limitation、source_locator、source_id、source_url、evidence_level |
| references | source_id | label、title、doi、pmid、publication_year、url、evidence_level |
| cohorts | cohort_id | centre、enrolment_start、enrolment_end、population、reported_repair_n、analysis_n、denominator_definition、follow_up、overlap、limitation |
| observations | observation_id | cohort_id、endpoint、numerator、denominator、time_window、denominator_population、source_id、source_url、source_locator、limitation |

`source_id` 指向 references，`cohort_id` 指向 cohorts。所有记录保留 `evidence_snapshot_date`。空字符串表示该字段未在本数据包中补齐；不表示原论文没有该信息。没有列出的术式或研究也不表示不存在。

## 图形参数

`display_parameters` 保存当前三维程序显式使用的参数；CSV 中该单元格为 JSON。`ring`、`graft` 指显示的支持结构；`angle` 是图形角度；`optionalStj`、`stj`、`sinus`、`hitch`、`patch`、`plication` 是显示开关。未写出的参数由渲染程序使用默认值，不能解释为临床未实施某一步骤。`unrepaired` / `unknown` 只描述教学底图状态。

这些参数不含影像测量单位，不用于临床测量、器械制造或个体化手术规划。16 个分支包括解剖底图、基本操作及结构类别，不是 16 种独立手术。

## 文献层级

- `full_text_methods`：该展示分支依据既有全文方法核对。
- `full_text_and_figures`：该展示分支依据既有全文及原图核对。
- `abstract`：相关结构或计数来自摘要，细节未获得充分全文核验。
- `insufficient_to_specify_intervention`：不足以指定具体干预，只展示解剖底图。

层级描述本数据包对来源的使用范围，不是证据质量评分，也不表示该论文所有结论已逐项复核。论文题名仅在已有明确 DOI 记录时提供；缺失时仍保留公开来源入口。

## 分母与观察窗口

`reported_repair_n` 是文献报告的来源修复队列规模，`analysis_n` 是此条记录选定的分析规模，均不能自动当作意向修复分母。实际每项计数以 observations 的 `denominator` 和 `denominator_population` 为准。

上海胸科多个操作可用于同一患者；15 例 STJ 干预不能推出其与 15 例缝线成形完全重合。中山末次反流的分母为 112，不是已联系随访的 130；至少中度为 4 例中度 + 1 例重度，不是再手术率。UKE 70 例未在摘要中按瓣型分层，不是 BAV 专属结局。Cleveland 367 例属于 1,112 例父队列。Frankfurt David 组补片计数为 34/48，属于历史时期。

不直接合并重叠队列、不把这些计数转换成治疗优劣排名。此选择性摘录未提供可用于荟萃分析的完整结局集合。

## 版本与维护

来源范围截至 2026-09-12，数据包整理于 2026-10-13。techniques 从展示程序的分支定义提取，evidence 从展示稿的结构依据表提取；cohorts 与 observations 为相应公开论文的研究级摘录。更新计数时，同时更新来源定位、分母、观察窗口和限制，保留队列之间的关系。
