# Change: 修改確認請求的 form post body 處理邏輯

## Why
目前確認請求（POST /Booking/Confirm）會將從確認頁表單提取的所有欄位都直接傳送，但需要：
1. 強制將 `PayMethod` 設為 `1`（無論表單中的值為何）
2. 移除 `AgreeRule` 欄位（不傳送此欄位）

## What Changes
- **修改**：`submitConfirm` 函數在構建 POST body 時，強制將 `PayMethod` 設為 `1`，並排除 `AgreeRule` 欄位
- **修改**：確認 API 請求格式規格，明確說明 PayMethod 必須為 1，且不應包含 AgreeRule

## Impact
- **Affected specs**: `popup-ui`
- **Affected code**: `popup.js`（修改 `submitConfirm` 函數的 body 構建邏輯）
- **Breaking changes**: 無（僅改變請求 body 的內容，不影響 API 介面）
- **Dependencies**: 無新增依賴
