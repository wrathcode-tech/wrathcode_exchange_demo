import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { makeApiRequest2, parseFullSymbol } from "./helpers";
const { io } = require("socket.io-client");

const channelToSubscription = new Map();

let socket;
let isSocketInitialized = false;
let pendingSubscription = null;

const initializeSocket = () => {
  if (!socket || !isSocketInitialized) {
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
      console.log("✅ Socket connected");
      if (pendingSubscription) {
        socket.emit('exchange:subscribe', pendingSubscription);
        console.log("🔁 Re-subscribed to exchange after reconnect");
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });
  }
};

let interval;

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

  initializeSocket(); // Initialize or reuse socket

  const channelString = symbolInfo.name;
  const handler = {
    id: subscriberUID,
    callback: onRealtimeCallback,
  };

  const parsedSymbol = parseFullSymbol(symbolInfo?.name);
  const ApiData = await makeApiRequest2(parsedSymbol?.fromSymbol, parsedSymbol?.toSymbol);
  let CoinID = ApiData?.currency_ids;

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

  // Subscribe to exchange data using proper event
  pendingSubscription = {
    base_currency_id: CoinID?.base_currency_id,
    quote_currency_id: CoinID?.quote_currency_id,
  };

  socket.emit('exchange:subscribe', pendingSubscription);

  socket.off('exchange:update'); // Ensure no duplicate listeners

  socket.on('exchange:update', (data) => {
    const currPair = data?.pairs?.find(item => item?.base_currency === parsedSymbol.fromSymbol && item?.quote_currency === parsedSymbol.toSymbol);
    if (!currPair) return;

    let changeMiliSecond = currPair?.available === "LOCAL" ? 1000 : 1;
    const tickerData = data?.ticker;
    if (!tickerData) return;

    const tradeTime = currPair?.available === "LOCAL" ? tickerData?.time : currPair.time;
    const volume = tickerData?.volume;
    const tradePrice = currPair?.buy_price;

    const subscriptionItem = channelToSubscription.get(channelString);
    if (subscriptionItem === undefined || !subscriptionItem?.lastDailyBar) return;

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
  });
}

export function unsubscribeFromStream(subscriberUID) {
  for (const [channelString, subscriptionItem] of channelToSubscription) {
    const handlerIndex = subscriptionItem.handlers.findIndex(handler => handler.id === subscriberUID);

    if (handlerIndex !== -1) {
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers?.length === 0) {
        channelToSubscription.delete(channelString);
        
        // Unsubscribe from socket when no more handlers
        if (socket && pendingSubscription) {
          socket.emit('exchange:unsubscribe', pendingSubscription);
          socket.off('exchange:update');
          console.log("🔌 Unsubscribed from exchange stream");
        }
        break;
      }
    }
  }
}

// Cleanup function to disconnect socket completely (call when leaving trade page)
export function disconnectChartSocket() {
  if (socket) {
    // Unsubscribe from any active subscription
    if (pendingSubscription) {
      socket.emit('exchange:unsubscribe', pendingSubscription);
      pendingSubscription = null;
    }
    
    // Remove all listeners
    socket.off('exchange:update');
    socket.off('connect');
    socket.off('disconnect');
    
    // Disconnect the socket
    socket.disconnect();
    socket = null;
    isSocketInitialized = false;
    
    // Clear all subscriptions
    channelToSubscription.clear();
    
    console.log("🔌 Chart socket disconnected and cleaned up");
  }
}

function getStartOfMinute(timestamp) {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.getTime();
}
