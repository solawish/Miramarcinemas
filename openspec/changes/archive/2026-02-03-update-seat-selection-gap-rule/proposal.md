# Change: 調整選座位方式（可選／不可選樣式與間隔規則）

## Why
目前座位表僅以 `background-color:white` 視為可選，實務上同一排尚有 `transparent`、`gray` 等不可選座位；且選定座位若與不可選座位（或與已選座位）之間僅空 1 格，會造成單一空位夾在中間的不良體驗。需明確定義可選／不可選樣式，並在保留「先選區域、再取中間」的邏輯下，加入「不得與不可選或已選座位中間只空 1 格」的檢查。

## What Changes
- **座位表格解析**：明確定義可選座位為 `style=background-color:white;`（或等同白色），不可選為 `style=background-color:transparent;` 與 `style=background-color:gray;`；解析時需能取得同一排內可選與不可選座位的相對位置（例如欄位索引），以供間隔檢查使用。
- **選位邏輯**：保留既有優先順序（PhysicalName 越大越好，同區取 SeatId 中間值），新增約束：
  - 選定的座位與同一排內不可選座位之間，不得「僅空 1 格」：須為相鄰（無空格）或至少隔 2 格。
  - 選定 2 個以上座位時，第二個（及之後）選定的座位與前面已選座位之間，亦須遵守相同規則：不得僅空 1 格，須相鄰或至少隔 2 格。

## Impact
- Affected specs: popup-ui
- Affected code: popup.js（`parseSeatTable`、`selectSeats` 及呼叫端）
