## 1. 建立基礎檔案結構
- [x] 1.1 建立 `popup.html` 檔案
- [x] 1.2 建立 `popup.css` 樣式檔案（或決定使用內嵌樣式）
- [x] 1.3 建立 `popup.js` JavaScript 檔案
- [x] 1.4 確認 `manifest.json` 已正確設定 popup 路徑

## 2. 實作 HTML 結構
- [x] 2.1 建立基本的 HTML 結構和 head 區塊
- [x] 2.2 新增電影下拉選單（`<select id="movie-select">`）
- [x] 2.3 新增時間下拉選單（`<select id="time-select">`）
- [x] 2.4 新增票種下拉選單（`<select id="ticket-type-select">`）
- [x] 2.5 新增票數下拉選單（`<select id="ticket-count-select">`）
- [x] 2.6 在時間選擇區域旁邊新增重新整理按鈕（`<button id="refresh-btn">`）
- [x] 2.7 在介面最下方新增訂購按鈕（`<button id="order-btn">`）
- [x] 2.8 新增顯示 API 處理過程的 textarea（`<textarea id="api-log">`）

## 3. 實作 CSS 樣式
- [x] 3.1 設定 popup 容器的基本樣式（寬度、高度、padding）
- [x] 3.2 設定下拉選單的樣式（寬度、高度、邊距、字體）
- [x] 3.3 設定按鈕的樣式（顏色、大小、hover 效果）
- [x] 3.4 設定 textarea 的樣式（寬度、高度、字體、只讀狀態）
- [x] 3.5 確保介面在不同螢幕尺寸下都能正常顯示

## 4. 實作資料獲取和 HTML 解析
- [x] 4.1 實作從 `https://www.miramarcinemas.tw/timetable` 獲取 HTML 的函數
- [x] 4.2 實作解析 HTML 的函數：尋找 `div id="timetable"` 內的所有 `section` 元素，包括：
  - `section class="bg"` 元素
  - `section class=""` 元素（class 為空字串的 section）
  - 包括內容為空的 section
- [x] 4.3 實作處理空 section 的邏輯：檢查 section 是否有內容，如果為空則跳過該 section，不加入電影選單
- [x] 4.4 實作解析電影資訊的函數：從有內容的 section 中提取電影標題和 GUID
  - 檢查 section 是否有 `div class="title"` 元素
  - 從 `div class="title"` 取得電影標題
  - 從 `a class="btn_link"` 的 href 中提取 GUID：
    - href 格式為 `/Movie/Detail?id={GUID}`（後面可能還有其他參數，但不需要處理）
    - 提取 `id` 參數的值作為 GUID（例如：從 `/Movie/Detail?id=f190e12a-a402-4002-9d4e-a686b7717502&type=coming` 提取 `f190e12a-a402-4002-9d4e-a686b7717502`）
  - 如果 section 為空或缺少必要元素，則跳過該 section
- [x] 4.5 實作解析時間場次的函數：根據選中的電影 GUID 解析對應的場次
  - 尋找 `div class="time_list_right"` 中包含該 GUID 的區塊
  - 尋找 class 包含該 GUID 的日期區塊（格式：`block {GUID} {日期}`）
  - 從每個日期區塊的 `div class="time_area"` 中提取所有 `a class="booking_time"` 連結
  - 組合日期和時間作為選項 text（格式：「{日期} {時間}」）
  - 使用連結的 href 作為選項 value

## 5. 實作 JavaScript 互動邏輯
- [x] 5.1 建立 DOM 元素選取器
- [x] 5.2 實作下拉選單的初始化邏輯（預設選項、禁用狀態）
- [x] 5.3 實作 popup 載入時自動獲取並解析場次資料
- [x] 5.4 實作將解析的電影資料填入電影下拉選單
- [x] 5.5 實作電影選擇變更時的處理邏輯（根據選中的 GUID 更新時間選單）
- [x] 5.6 實作重新整理按鈕的點擊處理（重新獲取並解析場次資訊，更新所有下拉選單）
- [x] 5.7 實作訂購按鈕的點擊處理（收集選項、準備 API 呼叫）
- [x] 5.8 實作 textarea 的日誌記錄功能（顯示 API 處理過程和解析狀態）
- [x] 5.9 實作錯誤處理和使用者提示（網路錯誤、解析錯誤等）

## 6. 驗證和測試
- [ ] 6.1 在 Chrome Extension 開發模式下載入並測試 popup
- [ ] 6.2 驗證能成功從 `https://www.miramarcinemas.tw/timetable` 獲取 HTML
- [ ] 6.3 驗證 HTML 解析邏輯能正確處理所有 section（包括空的 section），並正確提取電影資訊和 GUID
- [ ] 6.4 驗證 HTML 解析邏輯能正確提取時間場次資訊
- [ ] 6.5 驗證電影下拉選單能正確顯示所有解析的電影選項
- [ ] 6.6 驗證選擇電影後，時間下拉選單能正確更新為該電影的場次
- [ ] 6.7 驗證重新整理按鈕能正確重新獲取並更新資料
- [ ] 6.8 驗證所有下拉選單都能正常顯示和操作
- [ ] 6.9 驗證按鈕點擊事件正常觸發
- [ ] 6.10 驗證 textarea 能正確顯示訊息（包括解析過程和錯誤訊息）
- [ ] 6.11 檢查 UI 在不同狀態下的顯示（載入中、錯誤、成功）
