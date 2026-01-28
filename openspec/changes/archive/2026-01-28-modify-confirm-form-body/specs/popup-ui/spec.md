## MODIFIED Requirements

### Requirement: 確認提交功能
Extension SHALL 在座位選擇提交成功後，從確認頁（POST /Booking/SeatPlan 回應的 HTML）上的 form 取得資料，並對 `https://www.miramarcinemas.tw/Booking/Confirm` 發送 POST（x-www-form-urlencoded），帶入 cookies 與 form body，以完成訂票確認步驟。

#### Scenario: 確認頁表單提取
- **WHEN** Extension 取得 POST /Booking/SeatPlan 的回應 HTML（確認頁）
- **THEN** 應從頁面上的 form 取得所有 input 作為 body：以每個 `input` 的 `id` 為 key、`value` 為 value；表單選擇器與座位頁相同（例如：`#booking_data > section.page_title > section.bg > div > form`），或依實際頁面 DOM 調整

#### Scenario: 確認 API 請求格式
- **WHEN** Extension 準備發送確認請求
- **THEN** 應使用 POST 方法、Content-Type 為 `application/x-www-form-urlencoded`，並包含：
  - 請求 URL：`https://www.miramarcinemas.tw/Booking/Confirm`
  - body：從確認頁 form 提取的所有 input 欄位（id 作為 key，value 作為 value），但需進行以下處理：
    - `PayMethod` 欄位必須強制設為 `1`（無論表單中的原始值為何）
    - `AgreeRule` 欄位必須被排除，不應包含在 POST body 中
  - 帶入與前述步驟相同之 cookies（例如透過 `credentials: 'include'` 或等同方式）
