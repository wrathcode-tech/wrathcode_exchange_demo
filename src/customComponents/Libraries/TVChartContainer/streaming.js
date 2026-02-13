import { makeApiRequest2, parseFullSymbol } from "./helpers";

const channelToSubscription = new Map();

let socket = null;
let pendingStreamParams = null;
let exchangeUpdateHandler = null;
let listenerAttached = false;

/**
 * Set the shared socket from SocketContext
 * This allows the chart to use the same socket connection as the main app
 */
export function setSharedSocket(socketInstance) {
  if (socketInstance) {
    if (socket && socket !== socketInstance && exchangeUpdateHandler) {
      socket.off('exchange:update', exchangeUpdateHandler);
      listenerAttached = false;
      exchangeUpdateHandler = null;
    }
    socket = socketInstance;
    if (pendingStreamParams) {
      setupStreamWithSocket(pendingStreamParams);
      pendingStreamParams = null;
    } else if (channelToSubscription.size > 0) {
      ensureExchangeListener();
    }
  }
}

/**
 * Clear shared socket reference
 */
export function clearSharedSocket() {
  if (socket && exchangeUpdateHandler) {
    socket.off('exchange:update', exchangeUpdateHandler);
    exchangeUpdateHandler = null;
    listenerAttached = false;
  }
}

/**
 * Full disconnect - call when leaving the trade page
 */
export function disconnectChartSocket() {
  if (socket && exchangeUpdateHandler) {
    socket.off('exchange:update', exchangeUpdateHandler);
  }
  exchangeUpdateHandler = null;
  listenerAttached = false;
  pendingStreamParams = null;
  channelToSubscription.clear();
}

export function isSocketReady() {
  return socket !== null && socket.connected;
}

/**
 * Ensure the exchange:update listener is attached. Uses a single persistent listener
 * that dispatches to all active subscriptions - never removed on symbol/resolution change.
 */
function ensureExchangeListener() {
  if (!socket || listenerAttached || exchangeUpdateHandler) return;
  if (channelToSubscription.size === 0) return;

  exchangeUpdateHandler = (data) => {
    try {
      const pairs = data?.pairs;
      const tickerData = data?.ticker;
      if (!pairs?.length || !tickerData) return;

      for (const [channelString, subscriptionItem] of channelToSubscription) {
        const parsed = parseFullSymbol(channelString);
        if (!parsed?.fromSymbol || !parsed?.toSymbol) continue;

        const currPair = pairs.find(
          p => p?.base_currency === parsed.fromSymbol && p?.quote_currency === parsed.toSymbol
        );
        if (!currPair) continue;

        const changeMiliSecond = currPair?.available === "LOCAL" ? 1000 : 1;
        const tradeTime = currPair?.available === "LOCAL" ? tickerData?.time : currPair.time;
        const volume = tickerData?.volume;
        const tradePrice = currPair?.buy_price;

        if (tradePrice == null) continue;

        if (!subscriptionItem.lastDailyBar) {
          const barTime = tradeTime * changeMiliSecond;
          subscriptionItem.lastDailyBar = {
            time: barTime,
            open: tradePrice,
            high: tradePrice,
            low: tradePrice,
            close: tradePrice,
            volume: volume ?? 0,
          };
          subscriptionItem.handlers?.forEach(h => h.callback(subscriptionItem.lastDailyBar));
          continue;
        }

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
            volume: volume ?? subscriptionItem.lastDailyBar.volume,
          };
        } else {
          bar = {
            ...subscriptionItem.lastDailyBar,
            high: Math.max(subscriptionItem.lastDailyBar?.high ?? 0, tradePrice),
            low: Math.min(subscriptionItem.lastDailyBar?.low ?? Infinity, tradePrice),
            close: tradePrice,
            volume: volume ?? subscriptionItem.lastDailyBar?.volume ?? 0,
          };
        }
        subscriptionItem.lastDailyBar = bar;
        subscriptionItem.handlers?.forEach(h => h.callback(bar));
      }
    } catch (err) {
      // Prevent chart crashes
    }
  };

  socket.on('exchange:update', exchangeUpdateHandler);
  listenerAttached = true;
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

  
  try {

    let subscriptionItem = channelToSubscription.get(channelString);
    if (subscriptionItem) {
      subscriptionItem.handlers.push(handler);
      ensureExchangeListener();
      return;
    }

    subscriptionItem = {
      subscriberUID,
      resolution,
      lastDailyBar,
      handlers: [handler],
    };

    channelToSubscription.set(channelString, subscriptionItem);

    ensureExchangeListener();
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
      }
      break;
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
