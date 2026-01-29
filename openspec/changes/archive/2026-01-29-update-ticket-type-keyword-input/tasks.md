## 1. Implementation
- [x] 1.1 修改 popup.html：將票種區塊由 `<select id="ticket-type-select">` 改為 `<input>`（例如 `id="ticket-type-keyword"`），label 維持「票種」，可加 placeholder 提示為選填關鍵詞
- [x] 1.2 修改 popup.js：將 `ticketTypeSelect` 改為對應的 input 元素選取（如 `ticketTypeKeyword`），並在 `handleOrder` 中讀取該 input 的 value（trim）作為關鍵詞
- [x] 1.3 實作新選票邏輯：先過濾掉名稱（tickettypetitle / tickettypetitlealt）含有「敬老」或「愛心」的票種；若關鍵詞有值則從剩餘票種中選名稱包含該關鍵詞的第一個；否則依序選「全票」→「單人套票」→ 第一個
- [x] 1.4 更新日誌：選票時記錄是否使用關鍵詞、排除敬老/愛心、以及最終選中的票種名稱

## 2. Validation
- [ ] 2.1 手動測試：不填關鍵詞時，行為為排除敬老/愛心後依全票→單人套票→第一個選擇
- [ ] 2.2 手動測試：輸入關鍵詞（如「學生」「套票」）時，優先選出名稱包含該關鍵詞的票種（且仍排除敬老/愛心）
- [ ] 2.3 確認 popup 載入時票種區塊顯示為輸入框且不影響其他欄位
