import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { parseFullSymbol } from "./helpers";
const { io } = require("socket.io-client");

const channelToSubscription = new Map();

let socket = null;
let isSocketInitialized = false;
let marketUpdateHandler = null;
let pendingStreamParams = null;

/**
 * Initialize socket connection for mobile chart
 * Creates its own socket since mobile chart runs in a separate WebView
 */
const initializeSocket = () => {
  if (socket && isSocketInitialized) {
    return;
  }

  socket = io(ApiConfig?.webSocketUrl, {
    transports: ['websocket'],
    upgrade: false,
    rejectUnauthorized: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  isSocketInitialized = true;

  socket.on('connect', () => {
    // Subscribe to market data
    socket.emit('market:subscribe');
    
    // If there's a pending stream subscription, set it up now
    if (pendingStreamParams) {
      setupStreamWithSocket(pendingStreamParams);
      pendingStreamParams = null;
    }
  });

  socket.on('disconnect', () => {
    // Socket will auto-reconnect based on config
  });
};

/**
 * Setup the market:update listener
 */
function setupMarketListener(channelString, parsedSymbol, onRealtimeCallback) {
  if (!socket) {
    return;
  }
  
  // Remove any existing listener first
  if (marketUpdateHandler) {
    socket.off('market:update', marketUpdateHandler);
  }
  
  marketUpdateHandler = (data) => {
    try {
      const currPair = data?.pairs?.find(
        item => item?.base_currency === parsedSymbol.fromSymbol && 
                item?.quote_currency === parsedSymbol.toSymbol
      );
      if (!currPair) return;

      const changeMiliSecond = currPair?.available === "LOCAL" ? 1000 : 1;
      const tradeTime = currPair.time;
      const volume = 0;
      const tradePrice = currPair?.buy_price;

      const subscriptionItem = channelToSubscription.get(channelString);
      if (!subscriptionItem?.lastDailyBar) return;

      const lastBarTime = getStartOfMinute(subscriptionItem.lastDailyBar.time);
      const currentTradeMinute = getStartOfMinute(tradeTime * changeMiliSecond);

      let bar;

      if (currentTradeMinute > lastBarTime) {
        bar = {
          time: tradeTime * changeMiliSecond,
          open: subscriptionItem.lastDailyBar.close,
          high: tradePrice,
          low: tradePrice,
          close: tradePrice,
          volume: volume,
        };
      } else {
        bar = {
          ...subscriptionItem.lastDailyBar,
          high: Math.max(subscriptionItem.lastDailyBar?.high, tradePrice),
          low: Math.min(subscriptionItem.lastDailyBar?.low, tradePrice),
          close: tradePrice,
          volume: volume,
        };
      }

      subscriptionItem.lastDailyBar = bar;
      onRealtimeCallback(bar);
    } catch (error) {
      // Silently handle errors
    }
  };

  socket.on('market:update', marketUpdateHandler);
}

/**
 * Setup stream with socket
 */
function setupStreamWithSocket(params) {
  const { symbolInfo, resolution, onRealtimeCallback, subscriberUID, lastDailyBar } = params;
  
  const channelString = symbolInfo.name;
  const handler = {
    id: subscriberUID,
    callback: onRealtimeCallback,
  };

  const parsedSymbol = parseFullSymbol(symbolInfo?.name);

  let subscriptionItem = channelToSubscription.get(channelString);
  if (subscriptionItem) {
    subscriptionItem.handlers.push(handler);
    return;
  }

  subscriptionItem = {
    subscriberUID,
    resolution,
    lastDailyBar,
    handlers: [handler],
  };

  channelToSubscription.set(channelString, subscriptionItem);

  // Subscribe to market data
  if (socket?.connected) {
    socket.emit('market:subscribe');
  }

  setupMarketListener(channelString, parsedSymbol, onRealtimeCallback);
}

let interval;

/**
 * Subscribe to real-time stream for mobile chart updates
 */
export async function subscribeOnStream(
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback,
  lastDailyBar
) {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  // Initialize socket if not already
  initializeSocket();

  const params = {
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    lastDailyBar
  };

  // If socket is connected, setup immediately
  if (socket?.connected) {
    setupStreamWithSocket(params);
  } else {
    // Store params and wait for socket to connect
    pendingStreamParams = params;
  }
}

/**
 * Unsubscribe from real-time stream
 */
export function unsubscribeFromStream(subscriberUID) {
  for (const [channelString, subscriptionItem] of channelToSubscription) {
    const handlerIndex = subscriptionItem.handlers.findIndex(handler => handler.id === subscriberUID);

    if (handlerIndex !== -1) {
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers?.length === 0) {
        channelToSubscription.delete(channelString);
        
        if (socket && marketUpdateHandler) {
          socket.off('market:update', marketUpdateHandler);
          marketUpdateHandler = null;
        }
        break;
      }
    }
  }
}

/**
 * Cleanup - call when leaving the mobile chart page
 */
export function disconnectMobileChartSocket() {
  if (socket) {
    // Unsubscribe from market
    if (socket.connected) {
      socket.emit('market:unsubscribe');
    }
    
    // Remove listener
    if (marketUpdateHandler) {
      socket.off('market:update', marketUpdateHandler);
      marketUpdateHandler = null;
    }
    
    // Remove connection listeners
    socket.off('connect');
    socket.off('disconnect');
    
    // Disconnect
    socket.disconnect();
    socket = null;
    isSocketInitialized = false;
  }
  
  pendingStreamParams = null;
  channelToSubscription.clear();
}

function getStartOfMinute(timestamp) {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.getTime();
}
