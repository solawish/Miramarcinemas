## MODIFIED Requirements

### Requirement: 從美麗華影城網站獲取場次資料
Extension SHALL 從 `https://www.miramarcinemas.tw/api/Booking/GetMovie/` API 獲取電影列表和場次資訊並解析 JSON 回應。

#### Scenario: 獲取所有電影列表
- **WHEN** Extension 需要載入電影列表
- **THEN** 應發送 POST 請求到 `https://www.miramarcinemas.tw/api/Booking/GetMovie/`，API 會回傳所有電影的資料

#### Scenario: 解析 JSON 回應結構
- **WHEN** 收到 API 的 JSON 回應
- **THEN** 應解析回應中的以下欄位：
  - `ID`: 電影的 GUID
  - `Title`: 電影標題（或 `TitleAlt` 如果有提供）
  - `mShowTimes`: 場次時間陣列，包含日期和場次資訊（每個電影物件都包含此欄位）

### Requirement: 電影下拉選單
Extension SHALL 提供一個下拉選單讓使用者選擇電影，選項從 API 回應中取得。

#### Scenario: 電影選單顯示
- **WHEN** popup 載入完成並成功從 API 取得電影列表
- **THEN** 電影下拉選單應顯示所有可用的電影選項（從 API 回應取得）

#### Scenario: 電影選項解析
- **WHEN** 從 API 取得所有電影的資料（API 會回傳全部的資料）
- **THEN** 應從 API 回應中提取電影資訊：
  - 如果 API 回傳單一電影物件，應處理為陣列格式
  - 如果 API 回傳電影陣列，應遍歷每個電影物件
  - 電影選項的 `value` 應為 `ID` 欄位的值（GUID，例如：`f190e12a-a402-4002-9d4e-a686b7717502`）
  - 電影選項的 `text` 應為 `Title` 欄位的值（例如：「PRINCESS MONONOKE_4K_SPECIAL2」）或 `TitleAlt` 欄位（如果有提供，例如：「魔法公主4K修復版_特別場2」）

#### Scenario: 電影選擇變更
- **WHEN** 使用者從電影下拉選單中選擇一部電影
- **THEN** 選擇的 GUID 值應被記錄，並從已載入的 API 回應資料中找到對應的電影物件，提取其 `mShowTimes` 欄位來更新時間下拉選單

### Requirement: 時間下拉選單
Extension SHALL 提供一個下拉選單讓使用者選擇場次時間，選項從已選擇的電影的 API 回應中解析而來。

#### Scenario: 時間選單顯示
- **WHEN** popup 載入完成但尚未選擇電影
- **THEN** 時間下拉選單應顯示為空選單或「請先選擇電影」提示

#### Scenario: 時間選單更新
- **WHEN** 使用者選擇電影後
- **THEN** 應從已載入的 API 回應資料中找到該電影的 `mShowTimes` 欄位，並更新時間下拉選單為該電影的可用場次

#### Scenario: 時間選項解析
- **WHEN** 使用者選擇電影後，需要從已載入的資料中解析該電影的場次資訊
- **THEN** 應從已載入的電影物件的 `mShowTimes` 陣列中解析場次資料：
  - 遍歷 `mShowTimes` 陣列中的每個日期物件
  - 從日期物件中提取日期資訊（`Month`, `Day`, `DayOfWeek` 欄位）
  - 遍歷每個日期物件中的 `mCinemas` 陣列
  - 從每個 `mCinemas` 物件中的 `mSessions` 陣列提取場次資訊
  - 每個時間選項的 `text` 應為「{日期} {時間}」格式（例如：「1月30日 19:00」），日期格式應使用 `Month` 和 `Day` 欄位，時間格式應從 `Showtime` 欄位解析（ISO 8601 格式，例如：`2026-01-30T19:00:00`）
  - 每個時間選項的 `value` 應為對應的 `SessionId` 或根據需要構建的訂票連結

### Requirement: 重新整理按鈕
Extension SHALL 在場次選擇區域旁邊提供一個重新整理按鈕。

#### Scenario: 重新整理按鈕顯示
- **WHEN** popup 載入完成
- **THEN** 重新整理按鈕應顯示在時間下拉選單附近

#### Scenario: 重新整理按鈕點擊
- **WHEN** 使用者點擊重新整理按鈕
- **THEN** 應重新呼叫 POST API 獲取所有電影的最新資料（包含場次資訊），並更新電影和時間下拉選單的內容
