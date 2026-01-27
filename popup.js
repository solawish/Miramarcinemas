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
