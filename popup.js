// DOM 元素選取器
const movieSelect = document.getElementById('movie-select');
const timeSelect = document.getElementById('time-select');
const ticketTypeSelect = document.getElementById('ticket-type-select');
const ticketCountSelect = document.getElementById('ticket-count-select');
const refreshBtn = document.getElementById('refresh-btn');
const orderBtn = document.getElementById('order-btn');
const apiLog = document.getElementById('api-log');

// 儲存解析後的資料
let allMoviesData = []; // 儲存所有電影的完整 API 回應資料
let movies = []; // 儲存電影列表（用於下拉選單）

// 快取設定
const CACHE_KEY = 'movies_api_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 分鐘（毫秒）

// API 端點
const API_URL = 'https://www.miramarcinemas.tw/api/Booking/GetMovie/';

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
 * 從快取中獲取資料
 */
async function getCachedMovies() {
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
    return cached.data;
  } catch (error) {
    log(`讀取快取錯誤: ${error.message}`);
    return null;
  }
}

/**
 * 儲存資料到快取
 */
async function setCachedMovies(data) {
  try {
    const cacheData = {
      data: data,
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
 * 從美麗華影城 API 獲取所有電影資料（帶快取功能）
 */
async function fetchAllMovies(forceRefresh = false) {
  try {
    // 如果不是強制重新整理，先檢查快取
    if (!forceRefresh) {
      const cachedData = await getCachedMovies();
      if (cachedData) {
        return cachedData;
      }
    }
    
    log('開始從 API 獲取電影資料...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // 空 body 以取得所有電影
    });
    
    if (!response.ok) {
      throw new Error(`HTTP 錯誤: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log(`成功獲取 API 回應`);
    
    // 處理回應格式：資料在 results.mMovies 陣列中
    let moviesArray = [];
    if (data && data.results && Array.isArray(data.results.mMovies)) {
      moviesArray = data.results.mMovies;
      log(`API 回傳 ${moviesArray.length} 部電影`);
    } else if (data && Array.isArray(data.results)) {
      // 如果 results 本身就是陣列
      moviesArray = data.results;
      log(`API 回傳 ${moviesArray.length} 部電影（results 為陣列）`);
    } else if (Array.isArray(data)) {
      // 如果直接回傳陣列（向後相容）
      moviesArray = data;
      log(`API 回傳 ${moviesArray.length} 部電影（直接陣列格式）`);
    } else {
      log(`API 回應格式: ${JSON.stringify(data).substring(0, 200)}`);
      throw new Error('API 回應格式不正確，找不到 results.mMovies');
    }
    
    if (moviesArray.length === 0) {
      log('警告：API 回傳的電影列表為空');
    }
    
    // 儲存到快取
    await setCachedMovies(moviesArray);
    
    return moviesArray;
  } catch (error) {
    log(`獲取電影資料失敗: ${error.message}`);
    
    // 如果網路請求失敗，嘗試使用快取（即使已過期）
    if (!forceRefresh) {
      log('嘗試使用過期的快取資料...');
      const result = await chrome.storage.local.get(CACHE_KEY);
      const cached = result[CACHE_KEY];
      if (cached && cached.data) {
        log('使用過期的快取資料');
        return cached.data;
      }
    }
    
    throw error;
  }
}


/**
 * 從 API 回應中解析所有電影資訊
 */
function parseMovies(apiData) {
  const movies = [];
  const seenGuids = new Set(); // 用於追蹤已處理的 GUID，避免重複
  
  try {
    // 確保 apiData 是陣列
    const moviesArray = Array.isArray(apiData) ? apiData : [apiData];
    
    for (const movie of moviesArray) {
      if (!movie || !movie.ID) {
        log('跳過無效的電影資料');
        continue;
      }
      
      const guid = movie.ID;
      
      // 檢查是否已經處理過這個 GUID
      if (seenGuids.has(guid)) {
        log(`跳過重複的電影: ${movie.Title || movie.TitleAlt || guid} (GUID: ${guid})`);
        continue;
      }
      
      seenGuids.add(guid);
      
      // 使用 TitleAlt 如果有提供，否則使用 Title
      const title = movie.TitleAlt || movie.Title || guid;
      
      movies.push({
        guid: guid,
        title: title,
        data: movie // 儲存完整的電影資料，包含 mShowTimes
      });
      
      log(`解析電影: ${title} (GUID: ${guid})`);
    }
    
    log(`共解析 ${movies.length} 部電影（已去重複）`);
    return movies;
  } catch (error) {
    log(`解析電影資訊錯誤: ${error.message}`);
    throw error;
  }
}

/**
 * 從電影資料的 mShowTimes 陣列中解析場次時間
 */
function parseTimeSlotsFromMovie(movieData) {
  const timeSlots = [];
  const seenSlots = new Set(); // 用於追蹤已處理的場次，避免重複
  
  try {
    if (!movieData || !movieData.mShowTimes || !Array.isArray(movieData.mShowTimes)) {
      log('電影資料中沒有 mShowTimes 欄位或格式不正確');
      return [];
    }
    
    // 遍歷 mShowTimes 陣列
    for (const showTime of movieData.mShowTimes) {
      if (!showTime || !showTime.mCinemas || !Array.isArray(showTime.mCinemas)) {
        continue;
      }
      
      // 提取日期資訊
      const month = showTime.Month || '';
      const day = showTime.Day || '';
      const dayOfWeek = showTime.DayOfWeek || '';
      
      // 遍歷 mCinemas 陣列
      for (const cinema of showTime.mCinemas) {
        if (!cinema || !cinema.mSessions || !Array.isArray(cinema.mSessions)) {
          continue;
        }
        
        // 遍歷 mSessions 陣列
        for (const session of cinema.mSessions) {
          if (!session || !session.SessionId || !session.Showtime) {
            continue;
          }
          
          const sessionId = session.SessionId;
          const showtime = session.Showtime;
          
          // 使用 SessionId 作為唯一識別符來去重複
          if (seenSlots.has(sessionId)) {
            log(`跳過重複的場次: ${month}月${day}日 ${showtime} (SessionId: ${sessionId})`);
            continue;
          }
          
          seenSlots.add(sessionId);
          
          // 解析時間格式（ISO 8601，例如：2026-01-30T19:00:00）
          let timeStr = '';
          try {
            const dateObj = new Date(showtime);
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            timeStr = `${hours}:${minutes}`;
          } catch (e) {
            // 如果解析失敗，嘗試直接從字串提取時間部分
            const timeMatch = showtime.match(/T(\d{2}):(\d{2})/);
            if (timeMatch) {
              timeStr = `${timeMatch[1]}:${timeMatch[2]}`;
            } else {
              timeStr = showtime;
            }
          }
          
          // 格式化顯示文字：{Month}月{Day}日 {時間}
          const displayText = `${month}月${day}日 ${timeStr}`;
          
          // value 使用 SessionId，或根據需要構建訂票連結
          // 根據現有格式，可能需要構建類似 /Booking/TicketType?id={movieId}&session={sessionId} 的連結
          const movieId = movieData.ID;
          const bookingUrl = `/Booking/TicketType?id=${movieId}&session=${sessionId}`;
          
          timeSlots.push({
            text: displayText,
            value: bookingUrl // 維持與原本格式一致
          });
        }
      }
    }
    
    log(`為電影 ${movieData.Title || movieData.ID} 找到 ${timeSlots.length} 個場次（已去重複）`);
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
    
    // 從 API 獲取所有電影資料（使用快取或強制重新整理）
    const apiData = await fetchAllMovies(forceRefresh);
    
    // 儲存完整的 API 回應資料
    allMoviesData = apiData;
    
    // 解析電影列表
    movies = parseMovies(apiData);
    
    // 更新電影選單
    updateMovieSelect(movies);
    
    // 啟用電影選單
    movieSelect.disabled = false;
    
    log('場次資料載入完成');
  } catch (error) {
    log(`載入場次資料失敗: ${error.message}`);
    log('錯誤：載入場次資料失敗，請稍後再試');
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
  
  // 從已載入的資料中找到對應的電影物件
  const selectedMovie = allMoviesData.find(movie => movie.ID === selectedGuid);
  
  if (!selectedMovie) {
    log(`找不到 GUID 為 ${selectedGuid} 的電影資料`);
    timeSelect.innerHTML = '<option value="">找不到電影資料</option>';
    timeSelect.disabled = true;
    return;
  }
  
  // 從電影物件的 mShowTimes 欄位提取場次資料
  const timeSlots = parseTimeSlotsFromMovie(selectedMovie);
  
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
      // 重新載入該電影的場次（從已更新的資料中提取）
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
 * 從瀏覽器取得指定 cookie
 * @param {string} cookieName - Cookie 名稱
 * @returns {Promise<string|null>} Cookie 值，如果不存在則返回 null
 */
async function getCookie(cookieName) {
  try {
    log(`嘗試取得 cookie: ${cookieName}...`);
    log(`注意：Chrome Extension cookies API 可以讀取 HttpOnly cookies`);
    
    // 方式 1: 使用 domain 參數（推薦方式，與其他 Extension 實作一致）
    // Chrome Extension 的 cookies API 可以讀取 HttpOnly cookies，因為它在瀏覽器層級運作
    log(`方式 1: 使用 domain 參數查詢所有 cookies...`);
    const allCookies = await chrome.cookies.getAll({
      domain: 'www.miramarcinemas.tw'
    });
    
    if (allCookies && allCookies.length > 0) {
      log(`找到 ${allCookies.length} 個 cookies`);
      log(`可用的 cookies:`);
      allCookies.forEach(cookie => {
        const httpOnlyInfo = cookie.httpOnly ? ' [HttpOnly]' : '';
        log(`  - ${cookie.name}${httpOnlyInfo} (domain: ${cookie.domain}, path: ${cookie.path})`);
      });
      
      const foundCookie = allCookies.find(cookie => cookie.name === cookieName);
      if (foundCookie) {
        const httpOnlyInfo = foundCookie.httpOnly ? ' (HttpOnly)' : '';
        log(`✓ 取得 cookie: ${cookieName}${httpOnlyInfo} (方式: domain)`);
        log(`Cookie 資訊: domain=${foundCookie.domain}, path=${foundCookie.path}, secure=${foundCookie.secure}, httpOnly=${foundCookie.httpOnly}`);
        return foundCookie.value;
      }
    } else {
      log(`警告：使用 domain='www.miramarcinemas.tw' 找不到任何 cookies`);
    }
    
    // 方式 2: 嘗試使用 .miramarcinemas.tw（包含子網域）
    log(`方式 2: 嘗試使用 .miramarcinemas.tw（包含子網域）...`);
    const allCookiesWithDot = await chrome.cookies.getAll({
      domain: '.miramarcinemas.tw'
    });
    
    if (allCookiesWithDot && allCookiesWithDot.length > 0) {
      log(`找到 ${allCookiesWithDot.length} 個 cookies（使用 .miramarcinemas.tw）`);
      const foundCookie = allCookiesWithDot.find(cookie => cookie.name === cookieName);
      if (foundCookie) {
        const httpOnlyInfo = foundCookie.httpOnly ? ' (HttpOnly)' : '';
        log(`✓ 取得 cookie: ${cookieName}${httpOnlyInfo} (方式: domain with dot)`);
        log(`Cookie 資訊: domain=${foundCookie.domain}, path=${foundCookie.path}, secure=${foundCookie.secure}, httpOnly=${foundCookie.httpOnly}`);
        return foundCookie.value;
      }
    }
    
    // 方式 3: 使用 URL 參數作為備用
    log(`方式 3: 嘗試使用 URL 參數...`);
    const cookiesByUrl = await chrome.cookies.getAll({
      url: 'https://www.miramarcinemas.tw'
    });
    
    if (cookiesByUrl && cookiesByUrl.length > 0) {
      log(`找到 ${cookiesByUrl.length} 個 cookies（使用 URL）`);
      const foundCookie = cookiesByUrl.find(cookie => cookie.name === cookieName);
      if (foundCookie) {
        const httpOnlyInfo = foundCookie.httpOnly ? ' (HttpOnly)' : '';
        log(`✓ 取得 cookie: ${cookieName}${httpOnlyInfo} (方式: URL)`);
        return foundCookie.value;
      }
    }
    
    // 如果還是找不到，記錄詳細資訊
    log(`✗ 找不到 cookie: ${cookieName}`);
    log(`已嘗試的方式：`);
    log(`1. domain='www.miramarcinemas.tw'`);
    log(`2. domain='.miramarcinemas.tw'`);
    log(`3. url='https://www.miramarcinemas.tw'`);
    log(`可能的原因：`);
    log(`1. 使用者尚未登入美麗華影城網站`);
    log(`2. Cookie 已被清除或過期`);
    log(`3. Extension 沒有 cookies 權限或 host_permissions`);
    log(`4. Cookie 的 domain 設定不同`);
    log(`5. Cookie 的 path 設定限制`);
    log(`請確認：`);
    log(`1. 已在瀏覽器中開啟 https://www.miramarcinemas.tw`);
    log(`2. 已登入帳號`);
    log(`3. Extension 有 cookies 權限和 host_permissions`);
    log(`4. 已重新載入 Extension`);
    
    return null;
  } catch (error) {
    log(`取得 cookie ${cookieName} 錯誤: ${error.message}`);
    if (error.message.includes('permission')) {
      log(`權限錯誤：請確認 manifest.json 中已設定 cookies 權限和 host_permissions`);
    }
    log(`錯誤堆疊: ${error.stack || '無'}`);
    return null;
  }
}

/**
 * 從 HTML 頁面取得 __RequestVerificationToken（備用方案）
 * @param {string} html - HTML 內容
 * @returns {string|null} Token 值，如果找不到則返回 null
 */
function getRequestVerificationTokenFromHTML(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tokenInput = doc.querySelector('input[name="__RequestVerificationToken"]');
    
    if (tokenInput && tokenInput.value) {
      log('從 HTML 取得 __RequestVerificationToken');
      return tokenInput.value;
    } else {
      log('無法從 HTML 取得 __RequestVerificationToken');
      return null;
    }
  } catch (error) {
    log(`從 HTML 解析 __RequestVerificationToken 錯誤: ${error.message}`);
    return null;
  }
}

/**
 * 從 HTML 頁面取得 MovieOpeningDate
 * @param {string} html - HTML 內容
 * @returns {string|null} 日期值（格式：YYYY-MM-DD），如果找不到則返回 null
 */
function getMovieOpeningDateFromHTML(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 直接從 input id=MovieOpeningDate 取得 value
    const movieOpeningDateInput = doc.getElementById('MovieOpeningDate');
    
    if (movieOpeningDateInput && movieOpeningDateInput.value) {
      const dateValue = movieOpeningDateInput.value.trim();
      log(`✓ 從 input#MovieOpeningDate 取得日期: ${dateValue}`);
      return dateValue;
    } else {
      log('無法找到 input#MovieOpeningDate 元素，嘗試備用方案');
      
      // 備用方案：嘗試使用 ul.movie_info_item
      const movieInfoItem = doc.querySelector('ul.movie_info_item');
      if (movieInfoItem) {
        const dateText = movieInfoItem.textContent.trim();
        log(`使用備用方案取得 MovieOpeningDate: ${dateText}`);
        // 嘗試從文字中提取日期（格式：YYYY-MM-DD）
        const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          log(`提取日期: ${dateMatch[1]}`);
          return dateMatch[1];
        }
        return dateText;
      }
      
      log('無法找到任何日期資訊');
      return null;
    }
  } catch (error) {
    log(`從 HTML 解析 MovieOpeningDate 錯誤: ${error.message}`);
    return null;
  }
}

/**
 * 使用 GET 請求取得票種選擇頁面
 * @param {string} url - 票種選擇頁面 URL
 * @param {string} sessionIdCookie - ASP.NET_SessionId cookie 值（用於驗證，實際 cookies 由瀏覽器自動帶入）
 * @returns {Promise<string>} HTML 內容
 */
async function fetchTicketTypePage(url, sessionIdCookie) {
  try {
    log(`開始取得票種頁面: ${url}`);
    
    const fullUrl = url.startsWith('http') ? url : `https://www.miramarcinemas.tw${url}`;
    log(`完整 URL: ${fullUrl}`);
    
    // Chrome Extension 的 fetch 會自動帶入該網域的 cookies（因為我們有 host_permissions）
    // 使用 credentials: 'include' 確保 cookies 被帶入
    // 即使 cookies API 無法讀取到 cookie，fetch 也會自動帶入瀏覽器中存在的 cookies
    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include'
    });
    
    log(`回應狀態: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`錯誤回應內容: ${errorText.substring(0, 500)}`);
      throw new Error(`HTTP 錯誤: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    log(`成功取得票種頁面 HTML (長度: ${html.length} 字元)`);
    
    // 檢查回應中是否包含 ticketTypeTable
    if (html.includes('ticketTypeTable')) {
      log('✓ HTML 中包含 ticketTypeTable');
    } else {
      log('警告：HTML 中找不到 ticketTypeTable，可能頁面結構不同或需要登入');
    }
    
    return html;
  } catch (error) {
    log(`取得票種頁面失敗: ${error.message}`);
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      log('網路錯誤：請確認網路連線正常，或檢查是否有 CORS 限制');
    }
    throw error;
  }
}

/**
 * 解析 HTML 中的票種資訊
 * @param {string} html - HTML 內容
 * @returns {Array<Object>} 票種陣列
 */
function parseTicketTypes(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const ticketTypeTable = doc.getElementById('ticketTypeTable');
    
    if (!ticketTypeTable) {
      throw new Error('找不到 id=ticketTypeTable 的表格元素');
    }
    
    const tbody = ticketTypeTable.querySelector('tbody');
    if (!tbody) {
      throw new Error('找不到 tbody 元素');
    }
    
    const ticketTypes = [];
    const rows = tbody.querySelectorAll('tr.TicketTypeData');
    
    log(`找到 ${rows.length} 個票種`);
    
    for (const row of rows) {
      const ticketType = {
        tickettypetitle: row.getAttribute('tickettypetitle') || '',
        tickettypetitlealt: row.getAttribute('tickettypetitlealt') || '',
        tickettypeprice: row.getAttribute('tickettypeprice') || '',
        tickettypecode: row.getAttribute('tickettypecode') || '',
        tickettypeseats: row.getAttribute('tickettypeseats') || '',
        onlycashpay: row.getAttribute('onlycashpay') || '0',
        ticketpackagedescription: row.getAttribute('ticketpackagedescription') || ''
      };
      
      ticketTypes.push(ticketType);
      log(`解析票種: ${ticketType.tickettypetitle} (代碼: ${ticketType.tickettypecode}, 價格: ${ticketType.tickettypeprice})`);
    }
    
    return ticketTypes;
  } catch (error) {
    log(`解析票種資訊錯誤: ${error.message}`);
    throw error;
  }
}

/**
 * 根據優先順序選擇票種
 * @param {Array<Object>} ticketTypes - 票種陣列
 * @returns {Object|null} 選定的票種，如果沒有則返回 null
 */
function selectTicketType(ticketTypes) {
  if (!ticketTypes || ticketTypes.length === 0) {
    log('沒有可用的票種');
    return null;
  }
  
  // 優先選擇名稱含有「單人套票」的票種
  for (const ticketType of ticketTypes) {
    const title = ticketType.tickettypetitle || ticketType.tickettypetitlealt || '';
    if (title.includes('單人套票')) {
      log(`選擇票種: ${title} (單人套票)`);
      return ticketType;
    }
  }
  
  // 如果沒有，選擇名稱含有「全票」的票種
  for (const ticketType of ticketTypes) {
    const title = ticketType.tickettypetitle || ticketType.tickettypetitlealt || '';
    if (title.includes('全票')) {
      log(`選擇票種: ${title} (全票)`);
      return ticketType;
    }
  }
  
  // 如果都沒有，選擇第一個票種
  const firstTicket = ticketTypes[0];
  log(`選擇第一個票種: ${firstTicket.tickettypetitle || firstTicket.tickettypetitlealt || '未知'}`);
  return firstTicket;
}

/**
 * 從 URL 解析參數
 * @param {string} url - URL 字串
 * @param {string} paramName - 參數名稱
 * @returns {string|null} 參數值，如果找不到則返回 null
 */
function getUrlParameter(url, paramName) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://www.miramarcinemas.tw${url}`);
    return urlObj.searchParams.get(paramName);
  } catch (error) {
    log(`解析 URL 參數 ${paramName} 錯誤: ${error.message}`);
    return null;
  }
}

/**
 * 提交訂票請求
 * @param {Object} orderData - 訂票資料
 * @returns {Promise<Object>} API 回應
 */
async function submitOrder(orderData) {
  try {
    const {
      sessionIdCookie,
      requestVerificationToken,
      session,
      movieId,
      movieOpeningDate,
      ticketType,
      ticketCount
    } = orderData;
    
    log('開始提交訂票請求...');
    
    // 構建 TicketType 陣列
    const ticketTypeArray = [{
      Qty: parseInt(ticketCount, 10),
      TicketTypeCode: ticketType.tickettypecode,
      PriceInCents: ticketType.tickettypeprice,
      TicketTypeSeats: ticketType.tickettypeseats,
      OnlyCashPay: ticketType.onlycashpay
    }];
    
    // 構建請求 body
    const bodyParams = new URLSearchParams();
    bodyParams.append('__RequestVerificationToken', requestVerificationToken);
    bodyParams.append('PayMethodFunc', '1');
    bodyParams.append('Session', session);
    bodyParams.append('Cinema', '1001');
    bodyParams.append('Concession', '[]');
    bodyParams.append('MovieId', movieId);
    bodyParams.append('MovieOpeningDate', movieOpeningDate);
    bodyParams.append('TicketType', JSON.stringify(ticketTypeArray));
    
    log(`POST 請求到: https://www.miramarcinemas.tw/Booking/TicketType`);
    log(`Body: ${bodyParams.toString()}`);
    log(`使用 cookies: ASP.NET_SessionId=${sessionIdCookie ? '已取得' : '未取得'}, __RequestVerificationToken=${requestVerificationToken ? '已取得' : '未取得'}`);
    
    // Chrome Extension 的 fetch 會自動帶入該網域的 cookies（因為我們有 host_permissions）
    // 使用 credentials: 'include' 確保 cookies 被帶入
    const response = await fetch('https://www.miramarcinemas.tw/Booking/TicketType', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      credentials: 'include',
      body: bodyParams.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP 錯誤: ${response.status} ${response.statusText}\n回應內容: ${errorText.substring(0, 500)}`);
    }
    
    const responseText = await response.text();
    log('訂票請求成功');
    log(`回應內容: ${responseText.substring(0, 500)}`);
    
    return {
      success: true,
      response: responseText
    };
  } catch (error) {
    log(`提交訂票請求失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 從座位選擇頁面 HTML 解析可選擇的座位
 * @param {string} html - 座位選擇頁面 HTML（訂票回應的 response）
 * @returns {Array<Object>} 可選擇的座位陣列，每項含 AreaCategoryCode, AreaNumber, ColumnIndex, RowIndex, PhysicalName, SeatId
 */
function parseSeatTable(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const seatTable = doc.getElementById('seatTable');

    if (!seatTable) {
      log('找不到 id=seatTable 的表格元素');
      return [];
    }

    const allTds = seatTable.querySelectorAll('td');
    const seats = [];

    for (const td of allTds) {
      const style = (td.getAttribute('style') || '').toLowerCase();
      const bgMatch = style.match(/background-color\s*:\s*([^;]+)/);
      const bgValue = (bgMatch ? bgMatch[1].trim() : '').toLowerCase();
      const isWhite = bgValue === 'white' || /rgb\s*\(\s*255\s*,\s*255\s*,\s*255\s*\)/.test(bgValue);
      if (!isWhite) {
        continue;
      }

      const getAttr = (name) => (td.getAttribute(name) || '').trim();
      const seat = {
        AreaCategoryCode: getAttr('areacategorycode') || getAttr('AreaCategoryCode'),
        AreaNumber: getAttr('areanumber') || getAttr('AreaNumber'),
        ColumnIndex: getAttr('columnindex') || getAttr('ColumnIndex'),
        RowIndex: getAttr('rowindex') || getAttr('RowIndex'),
        PhysicalName: getAttr('physicalname') || getAttr('PhysicalName'),
        SeatId: getAttr('seatid') || getAttr('SeatId')
      };
      if (seat.PhysicalName && seat.SeatId) {
        seats.push(seat);
      }
    }

    log(`從座位表解析出 ${seats.length} 個可選擇座位`);
    return seats;
  } catch (error) {
    log(`解析座位表錯誤: ${error.message}`);
    return [];
  }
}

/**
 * 根據票數與優先順序選擇座位（PhysicalName 越大越好，同區取 SeatId 中間值）
 * @param {Array<Object>} seats - parseSeatTable 回傳的座位陣列
 * @param {number} count - 要選擇的座位數
 * @returns {Array<Object>} 選中的座位陣列
 */
function selectSeats(seats, count) {
  if (!seats || seats.length === 0 || count < 1) {
    return [];
  }
  const n = Math.min(count, seats.length);

  const byPhysical = {};
  for (const s of seats) {
    const key = (s.PhysicalName || '').toUpperCase();
    if (!byPhysical[key]) byPhysical[key] = [];
    byPhysical[key].push(s);
  }

  const physicalNames = Object.keys(byPhysical).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  const picked = [];

  for (const p of physicalNames) {
    const group = byPhysical[p];
    group.sort((a, b) => parseInt(a.SeatId, 10) - parseInt(b.SeatId, 10));
    const len = group.length;
    const mid = Math.floor((len - 1) / 2);
    const indices = [];
    const need = Math.min(n - picked.length, len);
    for (let i = 0; i < need; i++) {
      const offset = (i % 2 === 0) ? -Math.floor(i / 2) : Math.ceil(i / 2);
      const idx = mid + offset;
      if (idx >= 0 && idx < len && !indices.includes(idx)) {
        indices.push(idx);
        picked.push(group[idx]);
      }
    }
    if (picked.length >= n) break;
  }

  const result = picked.slice(0, n);
  log(`已選擇 ${result.length} 個座位（PhysicalName 優先，同區取中間）`);
  return result;
}

/**
 * 從座位選擇頁面 HTML 提取表單資料（#booking_data > section.page_title > section.bg > div > form 內所有 input）
 * @param {string} html - 座位選擇頁面 HTML
 * @returns {Object} 以 input.id 為 key、input.value 為 value 的物件
 */
function extractFormData(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const form = doc.querySelector('#booking_data > section.page_title > section.bg > div > form');
    if (!form) {
      log('找不到座位頁表單 (#booking_data > section.page_title > section.bg > div > form)');
      return {};
    }
    const data = {};
    const inputs = form.querySelectorAll('input');
    for (const input of inputs) {
      const id = input.getAttribute('id');
      const name = input.getAttribute('name');
      const value = input.getAttribute('value') || input.value || '';
      
      // 優先使用 id，如果沒有 id 則使用 name（例如 __RequestVerificationToken）
      const key = id || name;
      if (key) {
        data[key] = value;
      }
    }
    log(`從表單提取 ${Object.keys(data).length} 個欄位`);
    if (data['__RequestVerificationToken']) {
      log('✓ 找到 __RequestVerificationToken');
    } else {
      log('警告：表單中沒有找到 __RequestVerificationToken');
    }
    return data;
  } catch (error) {
    log(`提取表單資料錯誤: ${error.message}`);
    return {};
  }
}

/**
 * 將選中座位轉成 API 需要的 JSON 陣列格式（與 DOM 屬性對應的 PascalCase 鍵）
 * @param {Array<Object>} selectedSeats - selectSeats 回傳的座位陣列
 * @returns {string} JSON 字串
 */
function serializeSeatsForApi(selectedSeats) {
  return JSON.stringify(selectedSeats);
}

/**
 * 提交座位選擇到 /Booking/SeatPlan
 * @param {Object} formData - extractFormData 回傳的欄位（input id 為 key）
 * @param {Array<Object>} selectedSeats - selectSeats 回傳的座位陣列
 * @param {Object} [overrides] - 覆寫欄位值，與上一步訂票 API 相同：MovieId, MovieOpeningDate, Cinema, Session, TicketType, Concession
 * @returns {Promise<Object>} { success, response }
 */
async function submitSeatSelection(formData, selectedSeats, overrides = {}) {
  try {
    const body = { ...formData };
    // 移除表單中可能存在的 seat 或 Seat 欄位（如果有的話），我們會用自己選擇的座位
    delete body.seat;
    delete body.Seat;
    
    const overrideKeys = ['MovieId', 'MovieOpeningDate', 'Cinema', 'Session', 'TicketType', 'Concession'];
    for (const k of overrideKeys) {
      if (overrides[k] !== undefined) {
        body[k] = String(overrides[k]);
      }
    }
    const seatJson = serializeSeatsForApi(selectedSeats);
    log(`選擇的座位數量: ${selectedSeats.length}`);
    if (selectedSeats.length > 0) {
      log(`座位資料範例: ${JSON.stringify(selectedSeats[0])}`);
    }
    log(`座位 JSON: ${seatJson}`);

    const bodyParams = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      bodyParams.append(key, value);
    }
    // 最後加入我們選擇的座位資料
    bodyParams.append('Seat', seatJson);

    log('開始提交座位選擇...');
    log(`POST 請求到: https://www.miramarcinemas.tw/Booking/SeatPlan`);
    log(`POST Body (前 500 字元): ${bodyParams.toString().substring(0, 500)}`);

    const response = await fetch('https://www.miramarcinemas.tw/Booking/SeatPlan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: bodyParams.toString()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status} ${response.statusText}\n${errText.substring(0, 500)}`);
    }

    const responseText = await response.text();
    log('座位選擇提交成功');
    log(`回應長度: ${responseText.length} 字元`);
    return { success: true, response: responseText };
  } catch (error) {
    log(`提交座位選擇失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 處理訂購按鈕點擊
 */
async function handleOrder() {
  try {
    const movieGuid = movieSelect.value;
    const timeSlot = timeSelect.value;
    const ticketCount = ticketCountSelect.value;
    
    log('點擊訂購按鈕');
    log(`電影 GUID: ${movieGuid || '未選擇'}`);
    log(`時間場次: ${timeSlot || '未選擇'}`);
    log(`票數: ${ticketCount || '未選擇'}`);
    
    // 驗證必填欄位
    if (!movieGuid || !timeSlot || !ticketCount) {
      log('錯誤：請填寫所有必填欄位（電影、時間、票數）');
      return;
    }
    
    // 步驟 1: 取得 cookies（嘗試取得，但即使沒有也能繼續）
    log('步驟 1: 取得 cookies...');
    log('提示：請確保您已經在瀏覽器中開啟並登入美麗華影城網站 (https://www.miramarcinemas.tw)');
    
    const sessionIdCookie = await getCookie('ASP.NET_SessionId');
    let requestVerificationTokenCookie = await getCookie('__RequestVerificationToken');
    
    if (!sessionIdCookie) {
      log('警告：無法從 cookies API 取得 ASP.NET_SessionId');
      log('這可能是因為：');
      log('1. 尚未登入網站');
      log('2. Session 尚未建立（需要先訪問訂票頁面）');
      log('3. Cookie 的 domain/path 設定不同');
      log('');
      log('將繼續執行，fetch 請求會自動帶入瀏覽器的 cookies');
      log('如果後續請求失敗，請：');
      log('1. 在瀏覽器中開啟 https://www.miramarcinemas.tw');
      log('2. 登入您的帳號');
      log('3. 訪問訂票頁面建立 session');
      log('4. 重新嘗試訂票');
    } else {
      log(`✓ 成功取得 ASP.NET_SessionId cookie (長度: ${sessionIdCookie.length})`);
    }
    
    if (requestVerificationTokenCookie) {
      log(`✓ 成功取得 __RequestVerificationToken cookie (長度: ${requestVerificationTokenCookie.length})`);
    } else {
      log('無法從 cookie 取得 __RequestVerificationToken，將嘗試從頁面取得');
    }
    
    // 步驟 2: GET 票種頁面
    log('步驟 2: 取得票種頁面...');
    log('注意：fetch 請求會自動帶入瀏覽器的 cookies（包括 ASP.NET_SessionId）');
    
    // 即使沒有從 cookies API 取得 sessionIdCookie，fetch 也會自動帶入瀏覽器的 cookies
    const ticketTypePageHtml = await fetchTicketTypePage(timeSlot, sessionIdCookie);
    
    // 如果無法從 cookie 取得 __RequestVerificationToken，從頁面取得
    if (!requestVerificationTokenCookie) {
      log('無法從 cookie 取得 __RequestVerificationToken，嘗試從頁面取得...');
      requestVerificationTokenCookie = getRequestVerificationTokenFromHTML(ticketTypePageHtml);
    }
    
    if (!requestVerificationTokenCookie) {
      log('錯誤：無法取得 __RequestVerificationToken');
      log('請確認：');
      log('1. 已在瀏覽器中登入美麗華影城網站');
      log('2. 已訪問訂票頁面建立 session');
      log('3. 頁面已正確載入');
      throw new Error('無法取得 __RequestVerificationToken。\n\n請確保：\n1. 已在瀏覽器中登入並訪問訂票頁面\n2. 頁面已正確載入\n3. 重新嘗試訂票');
    }
    
    log(`✓ 成功取得 __RequestVerificationToken (長度: ${requestVerificationTokenCookie.length})`);
    
    // 步驟 3: 解析票種
    log('步驟 3: 解析票種...');
    const ticketTypes = parseTicketTypes(ticketTypePageHtml);
    
    if (ticketTypes.length === 0) {
      throw new Error('找不到可用的票種');
    }
    
    // 步驟 4: 選擇票種
    log('步驟 4: 選擇票種...');
    const selectedTicketType = selectTicketType(ticketTypes);
    
    if (!selectedTicketType) {
      throw new Error('無法選擇票種');
    }
    
    // 步驟 5: 取得其他必要資訊
    log('步驟 5: 取得其他必要資訊...');
    const movieOpeningDate = getMovieOpeningDateFromHTML(ticketTypePageHtml);
    const session = getUrlParameter(timeSlot, 'session');
    const movieId = getUrlParameter(timeSlot, 'id');
    
    if (!movieOpeningDate) {
      throw new Error('無法取得 MovieOpeningDate');
    }
    
    if (!session) {
      throw new Error('無法從 URL 取得 Session 參數');
    }
    
    if (!movieId) {
      throw new Error('無法從 URL 取得 MovieId 參數');
    }
    
    // 步驟 6: 提交訂票請求
    log('步驟 6: 提交訂票請求...');
    log('注意：即使 cookies API 無法讀取到 cookie，fetch 也會自動帶入瀏覽器的 cookies');
    
    const orderResult = await submitOrder({
      sessionIdCookie, // 可能為 null，但 fetch 會自動帶入瀏覽器的 cookies
      requestVerificationToken: requestVerificationTokenCookie,
      session,
      movieId,
      movieOpeningDate,
      ticketType: selectedTicketType,
      ticketCount
    });

    if (!orderResult.success) {
      throw new Error('訂票失敗');
    }

    log('步驟 7: 解析座位選擇頁面...');
    const seatPlanHtml = orderResult.response;
    const availableSeats = parseSeatTable(seatPlanHtml);

    if (availableSeats.length === 0) {
      log('訂票請求成功，但無法解析座位表（可能頁面結構不同或無空位）');
      log('請查看上方的處理過程以了解詳細資訊');
      return;
    }

    const ticketCountNum = parseInt(ticketCount, 10);
    if (ticketCountNum < 1) {
      log('錯誤：票數無效');
      return;
    }

    log('步驟 8: 根據票數與優先順序選擇座位...');
    const selectedSeats = selectSeats(availableSeats, ticketCountNum);

    if (selectedSeats.length === 0) {
      log('錯誤：無法選擇任何座位');
      return;
    }

    log(`已選擇 ${selectedSeats.length} 個座位`);
    if (selectedSeats.length > 0) {
      log(`選中的座位: ${JSON.stringify(selectedSeats)}`);
    }

    if (selectedSeats.length < ticketCountNum) {
      log(`警告：僅能選擇 ${selectedSeats.length} 個座位（需要 ${ticketCountNum} 個），將繼續提交`);
    }

    log('步驟 9: 提取座位頁表單資料...');
    const formData = extractFormData(seatPlanHtml);
    if (Object.keys(formData).length === 0) {
      log('錯誤：無法從座位頁取得表單欄位，無法提交座位選擇');
      return;
    }

    // 如果表單中沒有 __RequestVerificationToken，使用上一步取得的 token
    if (!formData['__RequestVerificationToken'] && requestVerificationTokenCookie) {
      log('表單中沒有 __RequestVerificationToken，使用上一步取得的 token');
      formData['__RequestVerificationToken'] = requestVerificationTokenCookie;
    }

    const ticketTypeArray = [{
      Qty: parseInt(ticketCount, 10),
      TicketTypeCode: selectedTicketType.tickettypecode,
      PriceInCents: selectedTicketType.tickettypeprice,
      TicketTypeSeats: selectedTicketType.tickettypeseats,
      OnlyCashPay: selectedTicketType.onlycashpay
    }];
    const seatOverrides = {
      MovieId: movieId,
      MovieOpeningDate: movieOpeningDate,
      Cinema: '1001',
      Session: session,
      TicketType: JSON.stringify(ticketTypeArray),
      Concession: '[]'
    };

    log('步驟 10: 提交座位選擇（MovieId/MovieOpeningDate/Cinema/Session/TicketType/Concession 使用上一步訂票 API 參數）...');
    const seatResult = await submitSeatSelection(formData, selectedSeats, seatOverrides);

    if (seatResult.success) {
      log('✓✓✓ 訂票含座位選擇完成！✓✓✓');
      log('請查看上方的處理過程以了解詳細資訊');
    } else {
      throw new Error('座位選擇提交失敗');
    }
  } catch (error) {
    log(`✗✗✗ 訂票流程錯誤 ✗✗✗`);
    log(`錯誤訊息: ${error.message}`);
    log('請查看上方的處理過程以了解詳細資訊');
  }
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
