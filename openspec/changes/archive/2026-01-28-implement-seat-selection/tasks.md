## 1. 座位表格解析功能
- [x] 1.1 實作 `parseSeatTable` 函數，從 HTML 回應中解析 `id=seatTable` 的表格
- [x] 1.2 提取所有 `td` 元素，過濾出 `style=background-color:white;` 的可選擇座位
- [x] 1.3 從每個可選擇的 `td` 元素中提取座位屬性：
  - `physicalname`: 座位區域代碼（英文，例如：A, B, C, ..., Z）
  - `seatid`: 座位 ID（數字字串，例如："1", "2", ..., "24"）
  - `areacategorycode`: 區域類別代碼
  - `areanumber`: 區域編號
  - `columnindex`: 欄索引
  - `rowindex`: 列索引

## 2. 座位選擇邏輯
- [x] 2.1 實作 `selectSeats` 函數，根據票數選擇座位：
  - 根據使用者選擇的票數決定要選擇幾個座位
  - 優先順序：
    1. PhysicalName 越大越好（Z > Y > ... > B > A）
    2. 相同 PhysicalName 時，選擇 SeatId 的最大值和最小值的中間值（例如：1~24 選 12 或 13）
- [x] 2.2 實作座位排序邏輯：
  - 先按 PhysicalName 降序排序（Z 最大）
  - 相同 PhysicalName 時，按 SeatId 的數值排序
  - 選擇中間位置的座位（如果票數為 2，選擇最接近中間的兩個座位）

## 3. 表單資料提取功能
- [x] 3.1 實作 `extractFormData` 函數，從座位選擇頁面的 HTML 中提取表單資料
- [x] 3.2 從 `#booking_data > section.page_title > section.bg > div > form` 選擇器中取得所有 `input` 元素
- [x] 3.3 將每個 `input` 的 `id` 作為 key，`value` 作為 value，構建表單資料物件
- [x] 3.4 將選擇的座位序列化為 JSON 陣列格式，作為 `seat` 欄位的值：
  ```json
  [{"AreaCategoryCode":"0000000000","AreaNumber":"1","ColumnIndex":"14","RowIndex":"0","PhysicalName":"O","SeatId":"11"},{"AreaCategoryCode":"0000000000","AreaNumber":"1","ColumnIndex":"13","RowIndex":"0","PhysicalName":"O","SeatId":"12"}]
  ```

## 4. 座位提交 API 呼叫
- [x] 4.1 實作 `submitSeatSelection` 函數，POST 請求到 `https://www.miramarcinemas.tw/Booking/SeatPlan`
- [x] 4.2 使用 `application/x-www-form-urlencoded` 格式
- [x] 4.3 帶入必要的 cookies（使用 `credentials: 'include'`）
- [x] 4.4 構建請求 body，包含：
  - 從表單中提取的所有 input 欄位（id 作為 key，value 作為 value）
  - `seat` 欄位：選擇的座位 JSON 陣列

## 5. 整合座位選擇流程
- [x] 5.1 修改 `handleOrder` 函數，在 `submitOrder` 成功後接續處理：
  1. 解析訂票回應的 HTML，取得座位選擇頁面
  2. 從座位表格中選擇合適的座位
  3. 提取表單資料並構建 POST body
  4. 提交座位選擇到 `/Booking/SeatPlan`
  5. 處理回應和錯誤

## 6. 錯誤處理與日誌
- [x] 6.1 為座位選擇和提交步驟添加錯誤處理
- [x] 6.2 在 textarea 中記錄每個步驟的執行狀態
- [x] 6.3 處理 API 錯誤回應並顯示給使用者
- [x] 6.4 驗證座位選擇邏輯（確保選擇的座位數量符合票數）
