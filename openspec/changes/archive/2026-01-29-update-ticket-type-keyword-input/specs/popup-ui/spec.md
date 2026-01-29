## MODIFIED Requirements

### Requirement: Popup HTML 結構
Extension SHALL 提供一個 popup.html 檔案作為主要使用者介面，包含所有必要的表單元素和按鈕。

#### Scenario: Popup 載入
- **WHEN** 使用者點擊 Extension 圖示
- **THEN** popup.html 應正確顯示，包含所有 UI 元件

#### Scenario: HTML 結構完整性
- **WHEN** 檢視 popup.html 的 HTML 結構
- **THEN** 應包含三個下拉選單、一個票種關鍵詞輸入框、兩個按鈕和一個 textarea 元素

### Requirement: 訂購按鈕
Extension SHALL 在介面最下方提供一個訂購按鈕，並實作完整的訂票流程。

#### Scenario: 訂購按鈕顯示
- **WHEN** popup 載入完成
- **THEN** 訂購按鈕應顯示在介面最下方

#### Scenario: 訂購按鈕點擊 - 完整訂票流程
- **WHEN** 使用者點擊訂購按鈕
- **THEN** Extension 應執行以下步驟：
  1. 驗證所有必填欄位（電影、時間、票數）都已選擇
  2. 從瀏覽器取得 `ASP.NET_SessionId` 和 `__RequestVerificationToken` cookies
  3. 使用 GET 請求取得票種選擇頁面，URL 為時間下拉選單的 value，並帶入 `ASP.NET_SessionId` cookie
  4. 解析 HTML 回應，找到 `id=ticketTypeTable` 的表格元素
  5. 從表格的 tbody 中提取每個 `tr.TicketTypeData` 元素的票種資訊（包含 tickettypetitle, tickettypeprice, tickettypecode, tickettypeseats, onlycashpay 等屬性）
  6. 根據以下邏輯選擇票種（先排除名稱含有「敬老」或「愛心」的票種後）：
     - 若票種關鍵詞輸入框有值（trim 後非空），則從剩餘票種中選擇名稱（tickettypetitle 或 tickettypetitlealt）包含該關鍵詞者，取第一個符合
     - 若欄位無值或無符合者：依序選擇名稱含有「全票」→ 名稱含有「單人套票」→ 剩餘票種中的第一個
  7. 從票種選擇頁面取得 `__RequestVerificationToken`（input name="__RequestVerificationToken" 的值）
  8. 從頁面 DOM 取得 `MovieOpeningDate`（ul.movie_info_item 的值，例如：2026-02-01）
  9. 從時間下拉選單的 value URL 中解析 `Session` 和 `MovieId` 參數
  10. 構建 TicketType 陣列，將選定的票種資訊序列化為 JSON，並將 Qty 設為使用者選擇的票數
  11. POST 請求到 `https://www.miramarcinemas.tw/Booking/TicketType`，使用 `application/x-www-form-urlencoded` 格式，帶入所有必要的 cookies 和 body 參數
  12. 從訂票回應的 HTML 中解析座位選擇頁面，找到 `id=seatTable` 的表格元素
  13. 從座位表格中提取所有可選擇的座位（`td` 元素且 `style=background-color:white;`）
  14. 根據票數和優先順序選擇座位：
     - PhysicalName 越大越好（Z > Y > ... > B > A）
     - 相同 PhysicalName 時，選擇 SeatId 的最大值和最小值的中間值（例如：1~24 選 12 或 13）
  15. 從座位選擇頁面的表單中提取所有 input 欄位（選擇器：`#booking_data > section.page_title > section.bg > div > form`）
  16. 構建 POST body，包含所有表單 input 欄位（id 作為 key，value 作為 value），並將選擇的座位序列化為 JSON 陣列作為 `seat` 欄位的值
  17. POST 請求到 `https://www.miramarcinemas.tw/Booking/SeatPlan`，使用 `application/x-www-form-urlencoded` 格式，帶入所有必要的 cookies 和 body 參數
  18. 從座位提交回應的 HTML 中解析確認頁表單，取得 form 內所有 input 作為 body（表單選擇器與座位頁相同或依實際頁面結構，例如：`#booking_data > section.page_title > section.bg > div > form`）
  19. POST 請求到 `https://www.miramarcinemas.tw/Booking/Confirm`，使用 `application/x-www-form-urlencoded` 格式，帶入 cookies 與上述 form body
  20. 處理 API 回應，在 textarea 中顯示結果或錯誤訊息

#### Scenario: Cookie 取得
- **WHEN** Extension 需要取得瀏覽器的 cookies
- **THEN** 應使用 Chrome Extension `chrome.cookies` API 取得 `https://www.miramarcinemas.tw` 網域的以下 cookies：
  - `ASP.NET_SessionId`: 用於維持 session
  - `__RequestVerificationToken`: 用於 CSRF 保護

#### Scenario: 票種頁面解析
- **WHEN** Extension 取得票種選擇頁面的 HTML
- **THEN** 應解析 HTML，找到 `id=ticketTypeTable` 的表格，並從 tbody 中提取所有 `tr.TicketTypeData` 元素的屬性：
  - `tickettypetitle`: 票種名稱
  - `tickettypetitlealt`: 票種名稱（替代）
  - `tickettypeprice`: 票種價格（以分為單位）
  - `tickettypecode`: 票種代碼
  - `tickettypeseats`: 座位數
  - `onlycashpay`: 是否僅現金付款
  - `ticketpackagedescription`: 套票描述（如果有）

#### Scenario: 票種自動選擇
- **WHEN** Extension 解析出多個可用票種並要選擇一個票種
- **THEN** 應依序執行以下邏輯：
  1. 先從解析出的票種中排除名稱（tickettypetitle 或 tickettypetitlealt）含有「敬老」或「愛心」的票種
  2. 若票種關鍵詞輸入框有值（trim 後非空），則從剩餘票種中選擇名稱包含該關鍵詞者，取第一個符合
  3. 若欄位無值或無符合者：依序選擇名稱含有「全票」→ 名稱含有「單人套票」→ 剩餘票種中的第一個

#### Scenario: 訂票 API 請求格式
- **WHEN** Extension 準備發送訂票請求
- **THEN** 應使用 POST 方法，Content-Type 為 `application/x-www-form-urlencoded`，並包含以下 body 參數：
  - `__RequestVerificationToken`: 從票種選擇頁面取得
  - `PayMethodFunc`: 1
  - `Session`: 從時間下拉選單的 value URL 參數取得
  - `Cinema`: 1001
  - `Concession`: []（空陣列）
  - `MovieId`: 從時間下拉選單的 value URL 參數取得
  - `MovieOpeningDate`: 從頁面 DOM 取得（格式：YYYY-MM-DD）
  - `TicketType`: JSON 序列化的票種陣列，格式為 `[{"Qty":數量,"TicketTypeCode":"票種代碼","PriceInCents":"價格","TicketTypeSeats":"座位數","OnlyCashPay":"是否僅現金"}]`，其中 Qty 應為使用者選擇的票數

#### Scenario: Cookie 帶入請求
- **WHEN** Extension 發送 GET 或 POST 請求到美麗華影城 API
- **THEN** 應在請求中帶入以下 cookies：
  - `ASP.NET_SessionId`: 從瀏覽器 cookie 取得
  - `__RequestVerificationToken`: 優先從瀏覽器 cookie 取得，如果無法取得則從票種選擇頁面的 input 元素取得（僅 POST 請求需要）

#### Scenario: 座位表格解析
- **WHEN** Extension 取得訂票回應的 HTML（包含座位選擇頁面）
- **THEN** 應解析 HTML，找到 `id=seatTable` 的表格，並提取所有可選擇的座位：
  - 從表格中取得所有 `td` 元素
  - 過濾出 `style=background-color:white;` 的 `td` 元素（這些才是可選擇的座位）
  - 從每個可選擇的 `td` 元素中提取以下屬性：
    - `physicalname`: 座位區域代碼（英文，例如：A, B, C, ..., Z）
    - `seatid`: 座位 ID（數字字串，例如："1", "2", ..., "24"）
    - `areacategorycode`: 區域類別代碼
    - `areanumber`: 區域編號
    - `columnindex`: 欄索引
    - `rowindex`: 列索引

#### Scenario: 座位選擇邏輯
- **WHEN** Extension 需要根據票數選擇座位
- **THEN** 應根據以下優先順序選擇座位：
  1. PhysicalName 越大越好（Z > Y > ... > B > A）
  2. 相同 PhysicalName 時，選擇 SeatId 的最大值和最小值的中間值：
     - 如果可選擇的座位 SeatId 範圍為 1~24，則選擇 12 或 13（最接近中間的座位）
     - 如果票數為 2，選擇最接近中間的兩個座位
     - 如果票數為 1，選擇最接近中間的一個座位
  3. 確保選擇的座位數量符合使用者選擇的票數

#### Scenario: 表單資料提取
- **WHEN** Extension 需要提取座位選擇頁面的表單資料
- **THEN** 應從 `#booking_data > section.page_title > section.bg > div > form` 選擇器中取得所有 `input` 元素：
  - 將每個 `input` 的 `id` 作為 key
  - 將每個 `input` 的 `value` 作為 value
  - 構建表單資料物件，用於 POST 請求的 body

#### Scenario: 座位提交 API 請求格式
- **WHEN** Extension 準備發送座位選擇請求
- **THEN** 應使用 POST 方法，Content-Type 為 `application/x-www-form-urlencoded`，並包含以下 body 參數：
  - 從表單中提取的所有 input 欄位（id 作為 key，value 作為 value）
  - `seat`: JSON 序列化的座位陣列，格式為 `[{"AreaCategoryCode":"0000000000","AreaNumber":"1","ColumnIndex":"14","RowIndex":"0","PhysicalName":"O","SeatId":"11"},...]`，其中每個物件包含選擇的座位的所有屬性

#### Scenario: 錯誤處理
- **WHEN** 訂票流程中任何步驟發生錯誤
- **THEN** Extension 應：
  - 在 textarea 中記錄錯誤訊息
  - 顯示使用者友善的錯誤提示
  - 不中斷其他步驟的執行（如果可能）

## REMOVED Requirements

### Requirement: 票種下拉選單
**Reason**: 改為以關鍵詞輸入框取代下拉選單，由新 Requirement「票種關鍵詞輸入」涵蓋。
**Migration**: 實作時以單行輸入框（id 如 `ticket-type-keyword`）取代原 `<select id="ticket-type-select">`，並在選票邏輯中讀取該輸入框的值。

## ADDED Requirements

### Requirement: 票種關鍵詞輸入
Extension SHALL 提供一個輸入框（label「票種」）讓使用者輸入票種關鍵詞（選填），用於訂票時優先從可用票種中匹配名稱包含該關鍵詞的票種。

#### Scenario: 票種輸入顯示
- **WHEN** popup 載入完成
- **THEN** 票種區塊應顯示為一個輸入框（label「票種」），可選填，可提供 placeholder 提示為關鍵詞（例如：「選填，如：全票、學生、套票」）

#### Scenario: 票種關鍵詞參與選票
- **WHEN** 使用者點擊訂購且票種關鍵詞輸入框有值（trim 後非空）
- **THEN** 選票邏輯應在排除敬老/愛心後，優先從剩餘票種中選擇名稱（tickettypetitle 或 tickettypetitlealt）包含該關鍵詞者，取第一個符合；若無符合則依預設順序（全票→單人套票→第一個）選擇

#### Scenario: 票種關鍵詞為空時
- **WHEN** 使用者點擊訂購且票種關鍵詞輸入框為空或僅空白
- **THEN** 選票邏輯應在排除敬老/愛心後，依預設順序選擇：名稱含有「全票」→ 名稱含有「單人套票」→ 剩餘票種中的第一個
