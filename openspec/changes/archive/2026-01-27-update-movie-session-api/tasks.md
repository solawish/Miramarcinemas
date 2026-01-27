## 1. 實作 API 呼叫功能
- [x] 1.1 建立 `fetchAllMovies()` 函數，使用 POST 方法呼叫 `https://www.miramarcinemas.tw/api/Booking/GetMovie/` 取得所有電影列表（API 會回傳全部的資料，包含每個電影的 `mShowTimes` 場次資訊）
- [x] 1.2 實作 API 請求的錯誤處理和日誌記錄
- [x] 1.3 更新快取機制以儲存 JSON 資料（針對電影列表和場次資料）

## 2. 修改電影列表解析
- [x] 2.1 修改 `parseMovies()` 函數，改為從 API 回應的 JSON 結構中提取電影資訊
- [x] 2.2 處理 API 回應格式（單一物件或陣列），提取所有電影的 `ID` 和 `Title`（或 `TitleAlt`）欄位
- [x] 2.3 確保電影選單的格式維持不變（value 為 GUID，text 為電影標題）

## 3. 修改場次時間解析
- [x] 3.1 建立新的 `parseTimeSlotsFromMovie(movieData)` 函數，從已載入的電影物件的 `mShowTimes` 陣列中解析場次
- [x] 3.2 解析 `mShowTimes` 中的日期和 `mCinemas` 中的 `mSessions` 來建立時間選項：
  - 遍歷 `mShowTimes` 陣列
  - 從每個日期物件提取 `Month`, `Day`, `DayOfWeek`
  - 遍歷 `mCinemas` 陣列
  - 從 `mSessions` 陣列提取 `SessionId` 和 `Showtime`
  - 格式化時間顯示為「{Month}月{Day}日 {時間}」（例如：「1月30日 19:00」）
- [x] 3.3 確保時間選單格式維持不變（text 為「日期 時間」，value 為 `SessionId` 或根據需要構建的訂票連結）

## 4. 更新資料載入流程
- [x] 4.1 修改 `loadTimetableData()` 函數，改為呼叫 POST API (`fetchAllMovies`) 獲取所有電影列表（包含場次資料），並將完整的 API 回應資料儲存在記憶體中
- [x] 4.2 移除 HTML 解析相關的函數和程式碼（`fetchTimetable()`, `parseSections()`, `extractMovieInfo()` 等）
- [x] 4.3 修改 `handleMovieChange()` 函數，當選擇電影時，從已載入的資料中找到對應的電影物件，並從其 `mShowTimes` 欄位提取場次資料（不需要再次呼叫 API）
- [x] 4.4 修改 `handleRefresh()` 函數，當點擊重新整理時，重新呼叫 POST API (`fetchAllMovies`) 獲取所有電影的最新資料（包含場次資訊），並更新電影和時間下拉選單

## 5. 測試與驗證
- [ ] 5.1 測試電影下拉選單正確顯示從 API 取得的電影列表
- [ ] 5.2 測試選擇電影後時間下拉選單正確顯示場次
- [ ] 5.3 測試重新整理按鈕正確更新資料
- [ ] 5.4 驗證錯誤處理機制（網路錯誤、API 錯誤等）
- [ ] 5.5 驗證快取機制運作正常
