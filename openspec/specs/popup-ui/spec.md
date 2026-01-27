# popup-ui Specification

## Purpose
TBD - created by archiving change add-popup-ui. Update Purpose after archive.
## Requirements
### Requirement: Popup HTML 結構
Extension SHALL 提供一個 popup.html 檔案作為主要使用者介面，包含所有必要的表單元素和按鈕。

#### Scenario: Popup 載入
- **WHEN** 使用者點擊 Extension 圖示
- **THEN** popup.html 應正確顯示，包含所有 UI 元件

#### Scenario: HTML 結構完整性
- **WHEN** 檢視 popup.html 的 HTML 結構
- **THEN** 應包含四個下拉選單、兩個按鈕和一個 textarea 元素

### Requirement: 從美麗華影城網站獲取場次資料
Extension SHALL 從 `https://www.miramarcinemas.tw/timetable` 獲取場次資訊並解析 HTML。

#### Scenario: 獲取場次資料
- **WHEN** Extension 需要載入電影和場次資訊
- **THEN** 應發送 GET 請求到 `https://www.miramarcinemas.tw/timetable`

#### Scenario: 解析 HTML 結構
- **WHEN** 收到場次頁面的 HTML 回應
- **THEN** 應解析 `div id="timetable"` 內的所有 `section` 元素，包括：
  - `section class="bg"` 元素
  - `section class=""` 元素（class 為空字串的 section）

### Requirement: 電影下拉選單
Extension SHALL 提供一個下拉選單讓使用者選擇電影，選項從美麗華影城網站解析而來。

#### Scenario: 電影選單顯示
- **WHEN** popup 載入完成並成功解析場次資料
- **THEN** 電影下拉選單應顯示所有可用的電影選項

#### Scenario: 電影選項解析
- **WHEN** 解析 HTML 中的 `section` 元素（包括 `section class="bg"` 和 `section class=""`）
- **THEN** 應從每個 section 中提取電影資訊（包括內容為空的 section）：
  - 對於有內容的 section：從 `div class="title"` 取得電影標題作為選項的 text（例如：「魔法公主4K修復版_特別場2」）
  - 對於有內容的 section：從 `a class="btn_link"` 的 href 屬性中提取 GUID 作為選項的 value
  - href 格式為 `/Movie/Detail?id={GUID}`（後面可能還有其他參數如 `&type=coming`，但不需要處理）
  - 應提取 `id` 參數的值作為 GUID（例如：從 `/Movie/Detail?id=f190e12a-a402-4002-9d4e-a686b7717502&type=coming` 提取 `f190e12a-a402-4002-9d4e-a686b7717502`）
  - 對於內容為空的 section：應跳過該 section，不加入電影選單中

#### Scenario: 電影選擇變更
- **WHEN** 使用者從電影下拉選單中選擇一部電影
- **THEN** 選擇的 GUID 值應被記錄，並用於更新時間下拉選單的內容

### Requirement: 時間下拉選單
Extension SHALL 提供一個下拉選單讓使用者選擇場次時間，選項從已選擇的電影場次中解析而來。

#### Scenario: 時間選單顯示
- **WHEN** popup 載入完成但尚未選擇電影
- **THEN** 時間下拉選單應顯示為空選單或「請先選擇電影」提示

#### Scenario: 時間選單更新
- **WHEN** 使用者選擇電影後
- **THEN** 時間下拉選單應更新為該電影的可用場次

#### Scenario: 時間選項解析
- **WHEN** 使用者選擇電影後，需要解析該電影的場次資訊
- **THEN** 應從 HTML 中尋找對應的場次資料：
  - 在 `section class="bg"` 中找到包含該電影 GUID 的 `div class="time_list_right"` 元素
  - 在該元素中尋找所有 class 包含該電影 GUID 的 `div` 元素（格式：`block {GUID} {日期}`，例如：`block f190e12a-a402-4002-9d4e-a686b7717502   1月30日`）
  - 對於每個日期區塊，從其子元素 `div class="time_area"` 中提取所有 `a class="booking_time"` 連結
  - 每個時間選項的 text 應為「{日期} {時間}」（例如：「1月30日 19:00」）
  - 每個時間選項的 value 應為對應 `a` 標籤的 href 屬性（例如：`/Booking/TicketType?id=f190e12a-a402-4002-9d4e-a686b7717502&session=412386`）

### Requirement: 票種下拉選單
Extension SHALL 提供一個下拉選單讓使用者選擇票種。

#### Scenario: 票種選單顯示
- **WHEN** popup 載入完成
- **THEN** 票種下拉選單應顯示，包含可用的票種選項（例如：全票、學生票、優待票）

#### Scenario: 票種選擇
- **WHEN** 使用者從票種下拉選單中選擇一個票種
- **THEN** 選擇的值應被記錄，並可用於後續的 API 呼叫

### Requirement: 票數下拉選單
Extension SHALL 提供一個下拉選單讓使用者選擇購買票數。

#### Scenario: 票數選單顯示
- **WHEN** popup 載入完成
- **THEN** 票數下拉選單應顯示，包含數字選項（例如：1-10 張）

#### Scenario: 票數選擇
- **WHEN** 使用者從票數下拉選單中選擇票數
- **THEN** 選擇的值應被記錄，並可用於後續的 API 呼叫

### Requirement: 重新整理按鈕
Extension SHALL 在場次選擇區域旁邊提供一個重新整理按鈕。

#### Scenario: 重新整理按鈕顯示
- **WHEN** popup 載入完成
- **THEN** 重新整理按鈕應顯示在時間下拉選單附近

#### Scenario: 重新整理按鈕點擊
- **WHEN** 使用者點擊重新整理按鈕
- **THEN** 應重新發送 GET 請求到 `https://www.miramarcinemas.tw/timetable`，重新解析 HTML，並更新電影和時間下拉選單的內容

### Requirement: 訂購按鈕
Extension SHALL 在介面最下方提供一個訂購按鈕。

#### Scenario: 訂購按鈕顯示
- **WHEN** popup 載入完成
- **THEN** 訂購按鈕應顯示在介面最下方

#### Scenario: 訂購按鈕點擊
- **WHEN** 使用者點擊訂購按鈕
- **THEN** 應收集所有下拉選單的選擇值，並準備執行訂票流程（目前可在 textarea 顯示收集的資訊，待 API 整合）

### Requirement: API 處理過程顯示
Extension SHALL 提供一個 textarea 用於顯示 API 處理過程和狀態訊息。

#### Scenario: Textarea 顯示
- **WHEN** popup 載入完成
- **THEN** textarea 應顯示在介面下方，設為只讀模式

#### Scenario: 日誌記錄
- **WHEN** 執行任何操作（選擇變更、按鈕點擊）
- **THEN** textarea 應顯示對應的操作訊息和時間戳記

#### Scenario: 錯誤訊息顯示
- **WHEN** 發生錯誤或異常情況
- **THEN** textarea 應顯示錯誤訊息，幫助使用者了解問題

### Requirement: CSS 樣式
Extension SHALL 提供 CSS 樣式以美化 popup 介面。

#### Scenario: 樣式檔案載入
- **WHEN** popup.html 載入
- **THEN** CSS 樣式應正確套用，介面應有適當的間距、顏色和字體

#### Scenario: 響應式設計
- **WHEN** popup 在不同尺寸下顯示
- **THEN** 所有 UI 元件應保持可讀性和可用性

### Requirement: JavaScript 互動邏輯
Extension SHALL 提供 JavaScript 程式碼處理所有 UI 元件的互動。

#### Scenario: DOM 元素選取
- **WHEN** JavaScript 檔案載入
- **THEN** 應能正確選取所有 UI 元素（下拉選單、按鈕、textarea）

#### Scenario: 事件監聽
- **WHEN** 使用者與 UI 元件互動
- **THEN** 對應的事件處理函數應被正確觸發

#### Scenario: 狀態管理
- **WHEN** 使用者進行選擇或操作
- **THEN** 應正確記錄和更新 UI 狀態

