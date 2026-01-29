# Change: 將票種改為關鍵詞輸入並更新選票邏輯

## Why
目前票種以固定下拉選單（僅「全票」）呈現，且訂票時由程式依「單人套票 → 全票 → 第一個」自動選票，使用者無法指定偏好。改為關鍵詞輸入可讓使用者輸入關鍵詞（如「學生」「套票」）優先匹配票種；同時需排除敬老/愛心票種，並調整預設優先順序為全票、單人套票、再第一個。

## What Changes
- **修改**：popup.html 將票種由下拉選單（`<select id="ticket-type-select">`）改為單行輸入框（關鍵詞，可選填）
- **修改**：選票邏輯（`selectTicketType` 或等同邏輯）：
  1. 先從解析出的票種中排除名稱含有「敬老」或「愛心」的票種
  2. 若票種關鍵詞欄位有值（trim 後非空），則從剩餘票種中選擇名稱（tickettypetitle 或 tickettypetitlealt）包含該關鍵詞者，取第一個符合
  3. 若欄位無值或無符合者：依序選擇名稱含有「全票」→ 名稱含有「單人套票」→ 剩餘票種中的第一個
- **修改**：訂購流程在選擇票種時讀取上述關鍵詞欄位並套用新邏輯

## Impact
- **Affected specs**: `popup-ui`
- **Affected code**: `popup.html`（票種區塊改為 input）、`popup.js`（DOM 選取、`selectTicketType` 邏輯、`handleOrder` 傳入關鍵詞）
- **Breaking changes**: 無（僅 UI 與選票邏輯變更，API 與後續流程不變）
- **Dependencies**: 無
