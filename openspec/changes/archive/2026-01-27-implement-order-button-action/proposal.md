# Change: 實作訂購按鈕的票種選擇與訂票流程

## Why
目前訂購按鈕僅收集使用者選擇的資訊，尚未實作實際的訂票 API 呼叫。需要實作完整的訂票流程，包括：
1. 從瀏覽器取得必要的 cookies（ASP.NET_SessionId 和 __RequestVerificationToken）
2. 取得票種資訊（從票種選擇頁面解析 HTML）
3. 自動選擇合適的票種（根據優先順序：單人套票 > 全票 > 第一個）
4. 呼叫訂票 API 完成訂票流程

## What Changes
- **新增**：從瀏覽器取得 ASP.NET_SessionId 和 __RequestVerificationToken cookies 的功能
- **新增**：GET 請求票種選擇頁面並解析 HTML 的功能
- **新增**：票種自動選擇邏輯（優先順序：單人套票 > 全票 > 第一個）
- **新增**：POST 請求訂票 API 的功能
- **修改**：`handleOrder` 函數，實作完整的訂票流程
- **新增**：需要 `cookies` 權限以取得瀏覽器 cookies

## Impact
- **Affected specs**: `popup-ui`
- **Affected code**: 
  - `popup.js` - 實作訂票流程相關函數
  - `manifest.json` - 新增 `cookies` 權限
- **Breaking changes**: 無
- **Dependencies**: 需要 Chrome Extension `cookies` API 權限
