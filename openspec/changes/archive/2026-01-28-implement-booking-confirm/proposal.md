# Change: 實作選座後的確認步驟（POST /Booking/Confirm）

## Why
目前訂票流程在提交座位選擇（POST /Booking/SeatPlan）後即結束，但實際訂票流程還需一步「確認」：選完座位後要對 `https://www.miramarcinemas.tw/Booking/Confirm` 發送 POST（x-www-form-urlencoded），帶入 cookies，並從確認頁面上的 form 取資料作為 body，才能完成訂票。

## What Changes
- **新增**：在 POST /Booking/SeatPlan 成功後，從其回應 HTML 解析確認頁面上的 form，取得所有 input 作為 body
- **新增**：POST 請求到 `https://www.miramarcinemas.tw/Booking/Confirm`，Content-Type 為 `application/x-www-form-urlencoded`，帶入 cookies 與上述 form body
- **修改**：`handleOrder` 與「訂購按鈕 - 完整訂票流程」規格，在座位提交成功後接續執行確認步驟

## Impact
- **Affected specs**: `popup-ui`
- **Affected code**: `popup.js`（新增確認頁表單解析與 `submitConfirm` / 呼叫確認 API，並在 handleOrder 中接續呼叫）
- **Breaking changes**: 無
- **Dependencies**: 無新增依賴
