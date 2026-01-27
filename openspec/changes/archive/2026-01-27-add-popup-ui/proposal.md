# Change: 建立 Popup UI 並實作下拉選單

## Why
使用者需要一個直觀的介面來選擇電影、場次、票種和票數，並執行訂票操作。目前專案還沒有任何 UI 元件，需要建立 popup.html 作為 Chrome Extension 的主要使用者介面。

## What Changes
- 建立 `popup.html` 作為 Chrome Extension 的彈出視窗介面
- 實作四個下拉選單：電影選擇、時間選擇、票種選擇、票數選擇
- 實作從 `https://www.miramarcinemas.tw/timetable` 獲取場次資料的功能
- 實作 HTML 解析邏輯：
  - 解析 `div id="timetable"` 內的所有 `section` 元素，包括：
    - `section class="bg"` 元素
    - `section class=""` 元素（class 為空字串的 section）
  - 從每個 section 中提取電影標題和 GUID（從電影介紹連結中提取）
  - 根據選中的電影 GUID 解析對應的場次時間（日期和時間）
- 在場次選擇區域旁邊新增重新整理按鈕（重新獲取並解析場次資料）
- 在介面最下方新增訂購按鈕
- 新增 textarea 用於顯示 API 處理過程和狀態訊息（包括 HTML 解析過程）
- 建立對應的 CSS 樣式檔案以美化介面
- 建立 JavaScript 檔案處理 UI 互動邏輯和 HTML 解析

## Impact
- Affected specs: 新增 `popup-ui` capability
- Affected code: 
  - 新增 `popup.html`
  - 新增 `popup.css`（或內嵌樣式）
  - 新增 `popup.js`
  - 可能需要更新 `manifest.json` 以註冊 popup
