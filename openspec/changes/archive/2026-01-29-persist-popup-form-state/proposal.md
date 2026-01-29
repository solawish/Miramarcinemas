# Change: Popup 下拉選單與輸入框關閉重開後保留

## Why
使用者關閉 popup 再重新開啟時，電影、時間、票數下拉選單與票種關鍵詞輸入框會恢復為預設或空白，需重新選擇與輸入。若能保留上次選擇與輸入內容，可減少重複操作並提升使用體驗。

## What Changes
- 使用 Chrome Storage API（`chrome.storage.local`）儲存 popup 表單狀態：電影、時間、票數、票種關鍵詞
- popup 載入完成並取得電影/場次資料後，從儲存中還原上述欄位值（若該值在目前選項中存在則還原，否則不強制）
- 使用者變更電影、時間、票數或票種關鍵詞時，將新值寫入儲存

## Impact
- Affected specs: popup-ui
- Affected code: popup.js（新增讀寫表單狀態的邏輯、在載入與變更時掛鉤）、必要時 manifest 確認已有 `storage` 權限
