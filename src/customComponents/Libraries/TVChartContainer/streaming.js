import { makeApiRequest2, parseFullSymbol } from "./helpers";

const channelToSubscription = new Map();

let socket = null;
let pendingSubscription = null;
let exchangeUpdateHandler = null;
let pendingStreamParams = null;

/**
 * Set the shared socket from SocketContext
 * This allows the chart to use the same socket connection as the main app
 */
export function setSharedSocket(socketInstance) {
  if (socketInstance) {
    socket = socketInstance;
    
    // If there's a pending stream subscription waiting for socket, set it up now
    if (pendingStreamParams) {
      setupStreamWithSocket(pendingStreamParams);
      pendingStreamParams = null;
    }
  }
}

/**
 * Clear shared socket reference
 * Only removes the listener, doesn't null out socket (managed by SocketContext)
 */
export function clearSharedSocket() {
  if (socket && exchangeUpdateHandler) {
    socket.off('exchange:update', exchangeUpdateHandler);
    exchangeUpdateHandler = null;
  }
}

/**
 * Full disconnect - call when leaving the trade page
 * Cleans up listeners and local state
 */
export function disconnectChartSocket() {
  if (socket && exchangeUpdateHandler) {
    socket.off('exchange:update', exchangeUpdateHandler);
  }
  
  exchangeUpdateHandler = null;
  pendingSubscription = null;
  channelToSubscription.clear();
}

/**
 * Check if socket is ready for use
 */
export function isSocketReady() {
  return socket !== null && socket.connected;
}

/**
 * Setup the exchange:update listener on the socket
 */
function setupExchangeListener(channelString, parsedSymbol, onRealtimeCallback) {
  if (!socket) {
    return;
  }
  
  // Remove any existing listener first to prevent duplicates
  if (exchangeUpdateHandler) {
    socket.off('exchange:update', exchangeUpdateHandler);
  }
  
  // Create the exchange update handler
  exchangeUpdateHandler = (data) => {
    try {
      const currPair = data?.pairs?.find(
        item => item?.base_currency === parsedSymbol.fromSymbol && 
                item?.quote_currency === parsedSymbol.toSymbol
      );
      if (!currPair) return;

      const changeMiliSecond = currPair?.available === "LOCAL" ? 1000 : 1;
      const tickerData = data?.ticker;
      if (!tickerData) return;

      const tradeTime = currPair?.available === "LOCAL" ? tickerData?.time : currPair.time;
      const volume = tickerData?.volume;
      const tradePrice = currPair?.buy_price;

      const subscriptionItem = channelToSubscription.get(channelString);
      if (!subscriptionItem?.lastDailyBar) return;

      const lastBarTime = getStartOfMinute(subscriptionItem.lastDailyBar.time);
      const currentTradeMinute = getStartOfMinute(tradeTime * changeMiliSecond);

      let bar;

      if (currentTradeMinute > lastBarTime) {
        // New bar
        bar = {
          time: tradeTime * changeMiliSecond,
          open: subscriptionItem.lastDailyBar.close,
          high: tradePrice,
          low: tradePrice,
          close: tradePrice,
          volume: volume,
        };
      } else {
        // Update existing bar
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
      // Silently handle errors to prevent chart crashes
    }
  };

  // Add the handler
  socket.on('exchange:update', exchangeUpdateHandler);
}

/**
 * Setup stream with the available socket
 */
async function setupStreamWithSocket(params) {
  const { symbolInfo, resolution, onRealtimeCallback, subscriberUID, lastDailyBar } = params;
  
  const channelString = symbolInfo.name;
  const handler = {
    id: subscriberUID,
    callback: onRealtimeCallback,
  };

  const parsedSymbol = parseFullSymbol(symbolInfo?.name);
  
  try {
    const ApiData = await makeApiRequest2(parsedSymbol?.fromSymbol, parsedSymbol?.toSymbol);
    const CoinID = ApiData?.currency_ids;

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

    pendingSubscription = {
      base_currency_id: CoinID?.base_currency_id,
      quote_currency_id: CoinID?.quote_currency_id,
    };

    // Setup the listener on the shared socket
    // NOTE: We don't emit 'exchange:subscribe' here because TradePage already handles that
    setupExchangeListener(channelString, parsedSymbol, onRealtimeCallback);
  } catch (error) {
    // Handle API errors gracefully
  }
}

let interval;

/**
 * Subscribe to real-time stream for chart updates
 * Called by TradingView datafeed
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

  const params = {
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    lastDailyBar
  };

  // If socket is available, setup immediately
  if (socket) {
    await setupStreamWithSocket(params);
  } else {
    // Store params and wait for socket to be set via setSharedSocket
    pendingStreamParams = params;
  }
}

/**
 * Unsubscribe from real-time stream
 * Called by TradingView datafeed
 */
export function unsubscribeFromStream(subscriberUID) {
  for (const [channelString, subscriptionItem] of channelToSubscription) {
    const handlerIndex = subscriptionItem.handlers.findIndex(handler => handler.id === subscriberUID);

    if (handlerIndex !== -1) {
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers?.length === 0) {
        channelToSubscription.delete(channelString);
        
        // Remove the listener (TradePage manages the actual subscription)
        if (socket && exchangeUpdateHandler) {
          socket.off('exchange:update', exchangeUpdateHandler);
          exchangeUpdateHandler = null;
        }
        pendingSubscription = null;
        break;
      }
    }
  }
}

/**
 * Get the start of a minute for bar time comparison
 */
function getStartOfMinute(timestamp) {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.getTime();
}
