## Context
建立 Chrome Extension 的 popup 介面，提供使用者選擇電影、場次、票種和票數的功能。這是專案的第一個 UI 元件，需要建立良好的基礎架構以便後續擴展。

Extension 需要從美麗華影城網站（`https://www.miramarcinemas.tw/timetable`）獲取場次資訊，並解析 HTML 結構以提取電影和場次資料。

## Goals / Non-Goals
- Goals:
  - 提供清晰直觀的使用者介面
  - 確保所有 UI 元件都能正常運作
  - 建立可維護的程式碼結構
  - 為後續 API 整合預留介面

- Non-Goals:
  - 本階段不實作實際的 API 呼叫（僅建立 UI 和日誌顯示）
  - 不實作資料持久化（不儲存使用者選擇）
  - 不實作複雜的動畫效果

## Decisions
- Decision: 使用原生 HTML/CSS/JavaScript 而非框架
  - Rationale: 根據 project.md 的約定，保持輕量級，避免不必要的複雜度

- Decision: 將 CSS 和 JavaScript 分離到獨立檔案
  - Rationale: 提高可維護性，符合專案約定

- Decision: textarea 設為只讀（readonly）
  - Rationale: 僅用於顯示 API 處理過程，使用者不需要編輯

- Decision: 下拉選單使用語義化的 ID 命名
  - Rationale: 符合 project.md 的命名約定（kebab-case），便於 JavaScript 選取

- Decision: 重新整理按鈕位於時間選擇區域旁邊
  - Rationale: 符合使用者需求，場次資訊是最需要更新的內容

- Decision: 使用 HTML 解析而非 API 呼叫獲取場次資料
  - Rationale: 美麗華影城網站提供場次資訊頁面，透過解析 HTML 可以獲取完整的電影和場次資料
  - 資料來源：`https://www.miramarcinemas.tw/timetable`
  - 解析目標：`div id="timetable"` 內的所有 `section` 元素，包括：
    - `section class="bg"` 元素
    - `section class=""` 元素（class 為空字串的 section）
    - 包括內容為空的 section
  - 處理空 section：解析所有 section，但對於內容為空的 section，應跳過不加入電影選單中

- Decision: 電影選項使用 GUID 作為 value
  - Rationale: GUID 是唯一識別符，可用於後續的 API 呼叫和場次查詢
  - 提取方式：從電影介紹連結的 href 中提取 `id` 參數的值
  - href 格式為 `/Movie/Detail?id={GUID}`（後面可能還有其他參數如 `&type=coming`，但只需要提取 `id` 參數的值）

- Decision: 時間選項組合日期和時間作為顯示文字
  - Rationale: 使用者需要同時看到日期和時間才能做出選擇
  - 格式：「{日期} {時間}」（例如：「1月30日 19:00」）
  - value 使用完整的訂票連結路徑，便於後續處理

## Risks / Trade-offs
- Risk: Popup 尺寸可能不適合所有內容
  - Mitigation: 設定適當的寬度和高度，使用 scrollable 容器

- Risk: 下拉選單選項過多時可能影響使用者體驗
  - Mitigation: 後續可考慮加入搜尋功能或分頁

- Risk: HTML 結構變更會導致解析失敗
  - Mitigation: 實作錯誤處理，當解析失敗時顯示錯誤訊息；考慮加入版本檢查或備用方案

- Risk: CORS 限制可能阻止從 Extension 直接獲取網頁內容
  - Mitigation: 使用 Chrome Extension 的權限設定，或考慮使用 background script 處理請求

- Trade-off: 使用內嵌樣式 vs 外部 CSS 檔案
  - 選擇: 外部 CSS 檔案，提高可維護性

- Trade-off: HTML 解析 vs API 呼叫
  - 選擇: HTML 解析，因為網站可能沒有公開的 API，且 HTML 結構相對穩定
  - 風險: 網站結構變更時需要更新解析邏輯

## Migration Plan
- 這是新功能，無需遷移
- 後續實作 API 整合時，只需在現有的 JavaScript 檔案中新增 API 呼叫邏輯

## Open Questions
- Popup 的建議尺寸？（Chrome Extension popup 預設最大寬度約 600px）
- 是否需要載入動畫或狀態指示器？
- textarea 是否需要自動滾動到最新訊息？
- 是否需要快取解析的資料以避免頻繁請求？
- 如何處理網站 HTML 結構變更的情況？
