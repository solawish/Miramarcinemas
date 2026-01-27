# Project Context

## Purpose
這是一個 Chrome Extension，用於協助使用者處理美麗華影城的訂票流程。Extension 提供一個彈出視窗（popup），讓使用者可以快速選擇電影、場次時間、票種和票數，並執行訂票操作。

主要功能：
- 在 popup.html 中提供多個下拉選單：電影選擇、時間選擇、票種選擇、票數選擇
- 在場次旁邊提供重新整理按鈕，用於更新場次資訊
- 最下方提供訂購按鈕，執行訂票流程
- 顯示 API 處理過程的 textarea，用於除錯和追蹤訂票狀態

## Tech Stack
- **Chrome Extension API** - 使用 Manifest V3
- **HTML/CSS/JavaScript** - 前端介面實作
- **Chrome Storage API** - 儲存使用者偏好設定（如需要）
- **Fetch API** - 呼叫美麗華影城的訂票 API

## Project Conventions

### Code Style
- 使用 **camelCase** 命名變數和函數
- 使用 **PascalCase** 命名類別
- 使用 **UPPER_SNAKE_CASE** 命名常數
- HTML 元素 ID 使用 **kebab-case**
- 使用 **2 個空格**進行縮排
- 使用 **單引號** 作為字串引號
- 在函數和類別上方添加 JSDoc 註解
- 使用 `const` 和 `let`，避免使用 `var`

### Architecture Patterns
- **Popup 介面**：使用原生 HTML/CSS/JavaScript，保持輕量級
- **API 呼叫**：封裝在獨立的模組中，便於維護和測試
- **狀態管理**：使用簡單的物件管理 UI 狀態（電影列表、選中的選項等）
- **錯誤處理**：所有 API 呼叫都應包含錯誤處理，並在 textarea 中顯示錯誤訊息
- **非同步處理**：使用 async/await 處理 API 呼叫

### Testing Strategy
- 手動測試：在 Chrome Extension 開發模式下測試各項功能
- API 測試：驗證與美麗華影城 API 的互動是否正常
- UI 測試：確認下拉選單、按鈕等互動元素運作正常
- 錯誤情境測試：測試網路錯誤、API 錯誤等異常情況

### Git Workflow
- **主分支**：`main` 或 `master`
- **功能分支**：`feature/[功能名稱]`（例如：`feature/add-movie-selector`）
- **修復分支**：`fix/[問題描述]`
- **Commit 訊息**：使用繁體中文，格式為 `[類型] 描述`
  - 類型：`新增`、`修改`、`修復`、`重構`、`文件`
  - 範例：`新增 電影下拉選單功能`、`修復 API 呼叫錯誤處理`

## Domain Context

### 美麗華影城訂票流程
1. **選擇電影**：使用者從下拉選單中選擇想要觀看的電影
2. **選擇場次時間**：根據選中的電影，顯示可用的場次時間
3. **選擇票種**：選擇票種（例如：全票、學生票、優待票等）
4. **選擇票數**：選擇要購買的票數
5. **重新整理場次**：點擊重新整理按鈕更新場次資訊
6. **執行訂票**：點擊訂購按鈕，呼叫 API 完成訂票流程

### UI 元件說明
- **電影下拉選單**：顯示所有可選擇的電影
- **時間下拉選單**：根據選中的電影顯示可用場次時間
- **票種下拉選單**：顯示可選擇的票種類型
- **票數下拉選單**：讓使用者選擇購買數量
- **重新整理按鈕**：位於場次旁邊，用於更新場次資訊
- **訂購按鈕**：位於最下方，執行訂票操作
- **API 處理過程 textarea**：顯示 API 呼叫的詳細過程，包括請求、回應、錯誤等資訊

## Important Constraints
- **Chrome Extension 限制**：必須遵守 Chrome Extension Manifest V3 的規範
- **CORS 限制**：可能需要處理跨域請求的問題
- **API 限制**：美麗華影城 API 可能有請求頻率限制
- **使用者體驗**：Extension 應該提供清晰的錯誤訊息和載入狀態提示
- **資料隱私**：不應儲存敏感的使用者資訊（如信用卡號碼）

## External Dependencies
- **美麗華影城訂票 API**：需要文件說明 API 端點、請求格式、回應格式
  - 取得電影列表的 API
  - 取得場次時間的 API
  - 執行訂票的 API
- **Chrome Extension APIs**：
  - `chrome.storage` - 儲存設定（如需要）
  - `chrome.tabs` - 與網頁互動（如需要）
  - `chrome.runtime` - Extension 生命週期管理
