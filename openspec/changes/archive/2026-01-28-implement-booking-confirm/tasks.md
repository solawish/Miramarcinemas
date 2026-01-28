## 1. 實作確認步驟

- [x] 1.1 從 POST /Booking/SeatPlan 回應的 HTML 中解析確認頁表單（form 選擇器與座位頁相同或依實際 DOM：如 `#booking_data > section.page_title > section.bg > div > form`），實作或複用「從 HTML 提取 form 內所有 input（id→value）」的邏輯
- [x] 1.2 新增 `submitConfirm(formData)`（或等同職責的函數），對 `https://www.miramarcinemas.tw/Booking/Confirm` 發送 POST、Content-Type `application/x-www-form-urlencoded`、body 為 formData、並帶入 cookies（`credentials: 'include'` 或同等方式）
- [x] 1.3 在 `handleOrder` 中，於 `submitSeatSelection` 成功後，以座位提交回應的 HTML 提取確認頁 form，呼叫確認 API，並在 textarea 記錄結果或錯誤

## 2. 驗證

- [ ] 2.1 手動測試：在 Extension 中走完選座流程，確認會自動 POST Confirm 且日誌顯示正確
- [ ] 2.2 確認錯誤情境（表單為空、Confirm 失敗）有適當日誌與不崩潰
