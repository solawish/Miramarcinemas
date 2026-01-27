// DOM 元素選取器
const movieSelect = document.getElementById('movie-select');
const timeSelect = document.getElementById('time-select');
const ticketTypeSelect = document.getElementById('ticket-type-select');
const ticketCountSelect = document.getElementById('ticket-count-select');
const refreshBtn = document.getElementById('refresh-btn');
const orderBtn = document.getElementById('order-btn');
const apiLog = document.getElementById('api-log');

// 儲存解析後的資料
let timetableData = null;
let movies = [];

// 快取設定
const CACHE_KEY = 'timetable_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 分鐘（毫秒）

/**
 * 記錄日誌到 textarea
 */
function log(message) {
  const timestamp = new Date().toLocaleTimeString('zh-TW');
  apiLog.value += `[${timestamp}] ${message}\n`;
  apiLog.scrollTop = apiLog.scrollHeight;
}

/**
 * 清除日誌
 */
function clearLog() {
  apiLog.value = '';
}

/**
 * 從 URL 中提取 GUID
 */
function extractGuidFromUrl(url) {
  try {
    const match = url.match(/\/Movie\/Detail\?id=([^&]+)/);
    return match ? match[1] : null;
  } catch (error) {
    log(`提取 GUID 錯誤: ${error.message}`);
    return null;
  }
}

/**
 * 從快取中獲取資料
 */
async function getCachedTimetable() {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cached = result[CACHE_KEY];
    
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    
    if (cacheAge > CACHE_EXPIRY) {
      log(`快取已過期（${Math.round(cacheAge / 1000)} 秒前）`);
      return null;
    }
    
    log(`使用快取資料（${Math.round(cacheAge / 1000)} 秒前）`);
    return cached.html;
  } catch (error) {
    log(`讀取快取錯誤: ${error.message}`);
    return null;
  }
}

/**
 * 儲存資料到快取
 */
async function setCachedTimetable(html) {
  try {
    const cacheData = {
      html: html,
      timestamp: Date.now()
    };
    
    await chrome.storage.local.set({ [CACHE_KEY]: cacheData });
    log('資料已儲存到快取');
  } catch (error) {
    log(`儲存快取錯誤: ${error.message}`);
  }
}

/**
 * 清除快取
 */
async function clearCache() {
  try {
    await chrome.storage.local.remove(CACHE_KEY);
    log('快取已清除');
  } catch (error) {
    log(`清除快取錯誤: ${error.message}`);
  }
}

/**
 * 從美麗華影城網站獲取 HTML（帶快取功能）
 */
async function fetchTimetable(forceRefresh = false) {
  try {
    // 如果不是強制重新整理，先檢查快取
    if (!forceRefresh) {
      const cachedHtml = await getCachedTimetable();
      if (cachedHtml) {
        return cachedHtml;
      }
    }
    
    log('開始從網站獲取場次資料...');
    const response = await fetch('https://www.miramarcinemas.tw/timetable');
    
    if (!response.ok) {
      throw new Error(`HTTP 錯誤: ${response.status}`);
    }
    
    const html = await response.text();
    log('成功獲取 HTML 內容');
    
    // 儲存到快取
    await setCachedTimetable(html);
    
    return html;
  } catch (error) {
    log(`獲取場次資料失敗: ${error.message}`);
    
    // 如果網路請求失敗，嘗試使用快取（即使已過期）
    if (!forceRefresh) {
      log('嘗試使用過期的快取資料...');
      const result = await chrome.storage.local.get(CACHE_KEY);
      const cached = result[CACHE_KEY];
      if (cached && cached.html) {
        log('使用過期的快取資料');
        return cached.html;
      }
    }
    
    throw error;
  }
}

/**
 * 解析 HTML 並提取所有 section 元素
 */
function parseSections(html) {
  try {
    log('開始解析 HTML...');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const timetableDiv = doc.getElementById('timetable');
    
    if (!timetableDiv) {
      throw new Error('找不到 timetable div');
    }
    
    // 尋找所有 section 元素（包括 class="bg" 和 class=""）
    const sections = timetableDiv.querySelectorAll('section');
    log(`找到 ${sections.length} 個 section 元素`);
    
    return Array.from(sections);
  } catch (error) {
    log(`解析 HTML 錯誤: ${error.message}`);
    throw error;
  }
}

/**
 * 檢查 section 是否有內容
 */
function hasContent(section) {
  const title = section.querySelector('div.title');
  const btnLink = section.querySelector('a.btn_link');
  return title && btnLink;
}

/**
 * 從 section 中提取電影資訊
 */
function extractMovieInfo(section) {
  try {
    const titleElement = section.querySelector('div.title');
    const btnLink = section.querySelector('a.btn_link');
    
    if (!titleElement || !btnLink) {
      return null;
    }
    
    const title = titleElement.textContent.trim();
    const href = btnLink.getAttribute('href');
    const guid = extractGuidFromUrl(href);
    
    if (!guid) {
      log(`無法從連結提取 GUID: ${href}`);
      return null;
    }
    
    return {
      title: title,
      guid: guid,
      href: href
    };
  } catch (error) {
    log(`提取電影資訊錯誤: ${error.message}`);
    return null;
  }
}

/**
 * 解析所有電影資訊
 */
function parseMovies(sections) {
  const movies = [];
  const seenGuids = new Set(); // 用於追蹤已處理的 GUID，避免重複
  
  for (const section of sections) {
    if (!hasContent(section)) {
      log('跳過空的 section');
      continue;
    }
    
    const movieInfo = extractMovieInfo(section);
    if (movieInfo) {
      // 檢查是否已經處理過這個 GUID
      if (seenGuids.has(movieInfo.guid)) {
        log(`跳過重複的電影: ${movieInfo.title} (GUID: ${movieInfo.guid})`);
        continue;
      }
      
      seenGuids.add(movieInfo.guid);
      movies.push(movieInfo);
      log(`解析電影: ${movieInfo.title} (GUID: ${movieInfo.guid})`);
    }
  }
  
  log(`共解析 ${movies.length} 部電影（已去重複）`);
  return movies;
}

/**
 * 根據電影 GUID 解析對應的場次時間
 */
function parseTimeSlots(sections, movieGuid) {
  const timeSlots = [];
  const seenSlots = new Set(); // 用於追蹤已處理的場次，避免重複
  
  try {
    for (const section of sections) {
      const timeListRight = section.querySelector('div.time_list_right');
      if (!timeListRight) {
        continue;
      }
      
      // 尋找所有日期區塊（class 包含 "block"）
      const allBlocks = timeListRight.querySelectorAll('div.block');
      
      for (const dateBlock of allBlocks) {
        // 檢查這個區塊的 class 是否包含該電影的 GUID
        const classList = dateBlock.className.split(/\s+/).filter(cls => cls.trim());
        
        if (!classList.includes(movieGuid)) {
          continue;
        }
        
        // 從 class 中提取日期（格式：block {GUID} {日期}）
        // 日期通常在 GUID 之後
        const guidIndex = classList.indexOf(movieGuid);
        const date = guidIndex >= 0 && guidIndex < classList.length - 1 
          ? classList[guidIndex + 1] 
          : '';
        
        // 提取時間連結
        const timeArea = dateBlock.querySelector('div.time_area');
        if (!timeArea) {
          continue;
        }
        
        const timeLinks = timeArea.querySelectorAll('a.booking_time');
        for (const link of timeLinks) {
          const time = link.textContent.trim();
          const href = link.getAttribute('href');
          
          if (date && time && href) {
            // 使用 href 作為唯一識別符來去重複
            if (seenSlots.has(href)) {
              log(`跳過重複的場次: ${date} ${time} (${href})`);
              continue;
            }
            
            seenSlots.add(href);
            timeSlots.push({
              text: `${date} ${time}`,
              value: href
            });
          }
        }
      }
    }
    
    log(`為電影 ${movieGuid} 找到 ${timeSlots.length} 個場次（已去重複）`);
    return timeSlots;
  } catch (error) {
    log(`解析場次時間錯誤: ${error.message}`);
    return [];
  }
}

/**
 * 更新電影下拉選單
 */
function updateMovieSelect(movies) {
  // 清除現有選項（保留預設選項）
  while (movieSelect.options.length > 1) {
    movieSelect.remove(1);
  }
  
  // 加入電影選項
  for (const movie of movies) {
    const option = document.createElement('option');
    option.value = movie.guid;
    option.textContent = movie.title;
    movieSelect.appendChild(option);
  }
  
  log(`更新電影選單，共 ${movies.length} 個選項`);
}

/**
 * 更新時間下拉選單
 */
function updateTimeSelect(timeSlots) {
  // 清除現有選項
  timeSelect.innerHTML = '';
  
  if (timeSlots.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '無可用場次';
    timeSelect.appendChild(option);
    timeSelect.disabled = true;
  } else {
    // 加入預設選項
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '請選擇時間';
    timeSelect.appendChild(defaultOption);
    
    // 加入場次選項
    for (const slot of timeSlots) {
      const option = document.createElement('option');
      option.value = slot.value;
      option.textContent = slot.text;
      timeSelect.appendChild(option);
    }
    
    timeSelect.disabled = false;
  }
  
  log(`更新時間選單，共 ${timeSlots.length} 個選項`);
}

/**
 * 載入並解析場次資料
 */
async function loadTimetableData(forceRefresh = false) {
  try {
    clearLog();
    log('開始載入場次資料...');
    
    // 禁用下拉選單
    movieSelect.disabled = true;
    timeSelect.disabled = true;
    
    // 獲取 HTML（使用快取或強制重新整理）
    const html = await fetchTimetable(forceRefresh);
    
    // 解析 sections
    const sections = parseSections(html);
    timetableData = { sections, html };
    
    // 解析電影
    movies = parseMovies(sections);
    
    // 更新電影選單
    updateMovieSelect(movies);
    
    // 啟用電影選單
    movieSelect.disabled = false;
    
    log('場次資料載入完成');
  } catch (error) {
    log(`載入場次資料失敗: ${error.message}`);
    alert('載入場次資料失敗，請稍後再試');
    movieSelect.disabled = false;
  }
}

/**
 * 處理電影選擇變更
 */
function handleMovieChange() {
  const selectedGuid = movieSelect.value;
  
  if (!selectedGuid) {
    timeSelect.innerHTML = '<option value="">請先選擇電影</option>';
    timeSelect.disabled = true;
    return;
  }
  
  log(`選擇電影 GUID: ${selectedGuid}`);
  
  // 解析該電影的場次時間
  const timeSlots = parseTimeSlots(timetableData.sections, selectedGuid);
  
  // 更新時間選單
  updateTimeSelect(timeSlots);
}

/**
 * 處理重新整理按鈕點擊
 */
async function handleRefresh() {
  log('點擊重新整理按鈕');
  
  // 記住當前選擇的電影 GUID
  const previousMovieGuid = movieSelect.value;
  
  // 強制重新整理，不使用快取
  await loadTimetableData(true);
  
  // 如果之前有選擇電影，嘗試恢復選擇
  if (previousMovieGuid) {
    // 檢查該電影是否還在列表中
    const movieExists = Array.from(movieSelect.options).some(
      option => option.value === previousMovieGuid
    );
    
    if (movieExists) {
      // 恢復選擇
      movieSelect.value = previousMovieGuid;
      log(`恢復選擇電影: ${movieSelect.options[movieSelect.selectedIndex].textContent}`);
      // 重新載入該電影的場次
      handleMovieChange();
    } else {
      log(`原先選擇的電影已不存在於列表中`);
      // 清除時間選單
      timeSelect.innerHTML = '<option value="">請先選擇電影</option>';
      timeSelect.disabled = true;
    }
  }
}

/**
 * 處理訂購按鈕點擊
 */
function handleOrder() {
  const movieGuid = movieSelect.value;
  const timeSlot = timeSelect.value;
  const ticketType = ticketTypeSelect.value;
  const ticketCount = ticketCountSelect.value;
  
  log('點擊訂購按鈕');
  log(`電影 GUID: ${movieGuid || '未選擇'}`);
  log(`時間場次: ${timeSlot || '未選擇'}`);
  log(`票種: ${ticketType || '未選擇'}`);
  log(`票數: ${ticketCount || '未選擇'}`);
  
  // 驗證必填欄位
  if (!movieGuid || !timeSlot || !ticketType || !ticketCount) {
    alert('請填寫所有必填欄位');
    return;
  }
  
  // 收集訂購資訊
  const orderInfo = {
    movieGuid: movieGuid,
    movieTitle: movieSelect.options[movieSelect.selectedIndex].textContent,
    timeSlot: timeSlot,
    timeText: timeSelect.options[timeSelect.selectedIndex].textContent,
    ticketType: ticketType,
    ticketCount: ticketCount
  };
  
  log('訂購資訊收集完成');
  log(JSON.stringify(orderInfo, null, 2));
  
  // TODO: 後續實作 API 呼叫
  alert('訂購功能待實作');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  log('Extension 初始化');
  
  // 設定事件監聽器
  movieSelect.addEventListener('change', handleMovieChange);
  refreshBtn.addEventListener('click', handleRefresh);
  orderBtn.addEventListener('click', handleOrder);
  
  // 載入場次資料
  loadTimetableData();
});
