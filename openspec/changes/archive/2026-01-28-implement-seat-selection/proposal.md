# Change: 實作座位選擇與提交功能

## Why
目前訂票流程在提交訂票請求（POST /Booking/TicketType）後即完成，但實際上訂票流程還需要：
1. 從訂票回應的 HTML 中解析座位選擇頁面
2. 根據票數自動選擇合適的座位（根據優先順序：PhysicalName 越大越好，相同 PhysicalName 時選擇 SeatId 中間值）
3. 提交座位選擇到 `/Booking/SeatPlan` API 完成訂票流程

## What Changes
- **新增**：從訂票回應 HTML 中解析座位表格（id=seatTable）的功能
- **新增**：座位選擇邏輯（根據 PhysicalName 和 SeatId 的優先順序）
- **新增**：從座位選擇頁面提取表單資料的功能
- **新增**：POST 請求到 `/Booking/SeatPlan` 的功能
- **修改**：`handleOrder` 函數，在訂票請求成功後接續處理座位選擇流程

## Impact
- **Affected specs**: `popup-ui`
- **Affected code**: 
  - `popup.js` - 實作座位選擇與提交相關函數
- **Breaking changes**: 無
- **Dependencies**: 無新增依賴
