## 1. 座位表解析
- [x] 1.1 擴充座位表解析邏輯：遍歷 `id=seatTable` 內所有 `td`，依 `style=background-color` 區分可選（white）與不可選（transparent、gray），僅將可選座位納入可選清單；並產出同一排（同一 PhysicalName + RowIndex）內不可選座位的欄位位置（ColumnIndex 或 SeatId），供後續間隔檢查使用（例如回傳結構包含 `selectableSeats` 與 `unselectablePositionsByRow`，或等同資訊）。
- [x] 1.2 可選座位物件維持既有屬性（AreaCategoryCode, AreaNumber, ColumnIndex, RowIndex, PhysicalName, SeatId）；不可選僅需記錄足以計算同一排相對位置的欄位（如 ColumnIndex/SeatId）與 RowIndex、PhysicalName。

## 2. 選位間隔規則
- [x] 2.1 實作「同一排內兩座位中間空格數」計算（依 ColumnIndex 或 SeatId 順序），並實作檢查：選定座位與同一排內任一不可選座位之間，中間空格數不得為 1（須為 0 或 ≥ 2）。
- [x] 2.2 實作檢查：第二個（及之後）選定座位與同一排內已選座位之間，中間空格數不得為 1（須為 0 或 ≥ 2）。
- [x] 2.3 在 `selectSeats`（或等效函式）中整合上述檢查：保留「PhysicalName 優先、同區取中間」的候選順序，依序嘗試納入座位時，若違反間隔規則則跳過該候選，改試下一個，直到湊滿票數或候選用盡。

## 3. 整合與日誌
- [x] 3.1 將擴充後的解析結果傳入選位邏輯，確保 `handleOrder` 或等效流程使用新解析與新選位函式。
- [x] 3.2 在無法湊滿票數時（因間隔規則導致可選候選不足），於日誌中記錄說明或警告。

## 4. 驗證
- [ ] 4.1 手動測試：座位表含 transparent／gray 時，可選座位僅為 white，且選定座位與不可選／已選座位不會出現「僅空 1 格」。
- [ ] 4.2 回歸：既有「先區域、再取中間」且無間隔衝突的場次，選位結果與原邏輯一致或仍為合理中間位。
