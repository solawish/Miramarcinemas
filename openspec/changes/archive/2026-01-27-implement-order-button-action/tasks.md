## 1. 權限設定
- [x] 1.1 在 `manifest.json` 中新增 `cookies` 權限

## 2. Cookie 取得功能
- [x] 2.1 實作 `getCookie` 函數，從瀏覽器取得指定 cookies（ASP.NET_SessionId 和 __RequestVerificationToken）
- [x] 2.2 實作 `getRequestVerificationToken` 函數，從頁面取得 `__RequestVerificationToken` 值（作為備用方案，如果無法從 cookie 取得）

## 3. 票種頁面解析功能
- [x] 3.1 實作 `fetchTicketTypePage` 函數，使用 GET 請求取得票種選擇頁面（帶入 cookies）
- [x] 3.2 實作 `parseTicketTypes` 函數，解析 HTML 中 `id=ticketTypeTable` 的 DOM
- [x] 3.3 從 tbody 中提取每個 tr 的票種資訊（tickettypetitle, tickettypeprice, tickettypecode 等屬性）

## 4. 票種選擇邏輯
- [x] 4.1 實作 `selectTicketType` 函數，根據優先順序選擇票種：
  - 優先選擇名稱含有「單人套票」的票種
  - 如果沒有，選擇名稱含有「全票」的票種
  - 如果都沒有，選擇第一個票種
- [x] 4.2 根據使用者選擇的票數，更新票種的 Qty 數量

## 5. 訂票 API 呼叫
- [x] 5.1 實作 `submitOrder` 函數，POST 請求到 `https://www.miramarcinemas.tw/Booking/TicketType`
- [x] 5.2 使用 `application/x-www-form-urlencoded` 格式
- [x] 5.3 帶入必要的 cookies（ASP.NET_SessionId 和 __RequestVerificationToken，兩者都從瀏覽器 cookie 取得）
- [x] 5.4 構建請求 body，包含：
  - `__RequestVerificationToken`: 從頁面取得
  - `PayMethodFunc`: 1
  - `Session`: 從時間下拉選單的 value URL 參數取得
  - `Cinema`: 1001
  - `Concession`: []
  - `MovieId`: 從時間下拉選單的 value URL 參數取得
  - `MovieOpeningDate`: 從頁面 DOM `ul.movie_info_item` 取得
  - `TicketType`: 序列化的票種資料（JSON 陣列格式）

## 6. 整合訂購流程
- [x] 6.1 修改 `handleOrder` 函數，整合所有步驟：
  1. 驗證必填欄位
  2. 取得 cookies（ASP.NET_SessionId 和 __RequestVerificationToken）
  3. GET 票種頁面
  4. 解析並選擇票種
  5. POST 訂票 API
  6. 處理回應和錯誤

## 7. 錯誤處理與日誌
- [x] 7.1 為每個步驟添加錯誤處理
- [x] 7.2 在 textarea 中記錄每個步驟的執行狀態
- [x] 7.3 處理 API 錯誤回應並顯示給使用者
