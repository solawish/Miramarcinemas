# Change: 更新場次以及時間的資料來源，改成呼叫 POST API

## Why
目前 Extension 從 HTML 頁面解析場次資料，這種方式容易受到 HTML 結構變更影響，且維護成本較高。改為使用官方 API (`https://www.miramarcinemas.tw/api/Booking/GetMovie/`) 可以獲得更穩定、結構化的資料來源，提升可靠性和維護性。

## What Changes
- **MODIFIED**: 將電影列表、場次和時間資料獲取方式從 HTML 解析改為 POST API 呼叫
- **MODIFIED**: 電影下拉選單的資料來源改為從 POST API (`https://www.miramarcinemas.tw/api/Booking/GetMovie/`) 取得所有電影列表
- **MODIFIED**: API 回應中每個電影物件已包含 `mShowTimes` 欄位，選擇電影時直接從已載入的資料中提取場次，無需再次呼叫 API
- **MODIFIED**: 時間下拉選單的資料來源改為從已載入的 API 回應資料中解析（從選中電影的 `mShowTimes` 陣列）
- **MODIFIED**: 重新整理按鈕的行為改為重新呼叫 POST API 獲取最新資料（包含所有電影和場次資訊）
- 維持現有的下拉選單格式和 UI 結構不變

## Impact
- **Affected specs**: `popup-ui`
- **Affected code**: 
  - `popup.js` - 需要修改 `fetchTimetable()`, `parseMovies()`, `parseTimeSlots()`, `handleMovieChange()`, `handleRefresh()`, `loadTimetableData()` 等函數
  - 移除 HTML 解析相關的函數（`parseSections()`, `extractMovieInfo()` 等）
  - 可能需要調整快取機制以適應 JSON 資料格式
- **Breaking changes**: 無（UI 格式維持不變，僅資料來源改變）
