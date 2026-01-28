## 1. Implementation
- [x] 1.1 修改 `submitConfirm` 函數，在構建 bodyParams 時：
  - 強制將 `PayMethod` 設為 `1`（覆蓋表單中的值，如果存在）
  - 排除 `AgreeRule` 欄位（不加入到 bodyParams 中）
- [x] 1.2 更新日誌訊息，記錄 PayMethod 被強制設為 1 和 AgreeRule 被排除的資訊

## 2. Validation
- [ ] 2.1 手動測試：執行完整訂票流程，確認 confirm 請求的 body 中 PayMethod 為 1 且不包含 AgreeRule
- [ ] 2.2 檢查日誌輸出，確認修改邏輯正確執行
