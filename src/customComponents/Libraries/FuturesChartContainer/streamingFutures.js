import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { makeApiRequest2 } from "../TVChartContainer/helpers";
import { parseFuturesSymbol } from "./helpersFutures";
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
      console.log("✅ Futures chart socket connected");
      if (pendingSubscription) {
        socket.emit('futures:subscribe', pendingSubscription);
        console.log("🔁 Re-subscribed to futures after reconnect");
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });
  }
};

let interval;

export async function subscribeFuturesOnStream(
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback,
  lastDailyBar
) {
  console.log("🚀 ~ subscribeFuturesOnStream ~ symbolInfo:", symbolInfo)
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

  const parsedSymbol = parseFuturesSymbol(symbolInfo?.name);
  const ApiData = await makeApiRequest2(parsedSymbol?.base, parsedSymbol?.quote);
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

  // Subscribe to futures data using proper event
  pendingSubscription = {
    base_currency_id: CoinID?.base_currency_id,
    quote_currency_id: CoinID?.quote_currency_id,
  };

  socket.emit('futures:subscribe', pendingSubscription);

  socket.off('futures:update'); // Ensure no duplicate listeners

  socket.on('futures:update', (data) => {
    const currPair = data?.pairs?.find(item => item?.short_name === parsedSymbol.base && item?.margin_asset === parsedSymbol.quote);
    if (!currPair) return;

    let changeMiliSecond = currPair?.available === "LOCAL" ? 1000 : 1;
    const tickerData = data?.ticker;

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

export function unsubscribeFuturesFromStream(subscriberUID) {
  for (const [channelString, subscriptionItem] of channelToSubscription) {
    const handlerIndex = subscriptionItem.handlers.findIndex(handler => handler.id === subscriberUID);

    if (handlerIndex !== -1) {
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers?.length === 0) {
        channelToSubscription.delete(channelString);
        
        // Unsubscribe from socket when no more handlers
        if (socket && pendingSubscription) {
          socket.emit('futures:unsubscribe', pendingSubscription);
          socket.off('futures:update');
          console.log("🔌 Unsubscribed from futures stream");
        }
        break;
      }
    }
  }
}

// Cleanup function to disconnect socket completely (call when leaving futures page)
export function disconnectFuturesChartSocket() {
  if (socket) {
    // Unsubscribe from any active subscription
    if (pendingSubscription) {
      socket.emit('futures:unsubscribe', pendingSubscription);
      pendingSubscription = null;
    }
    
    // Remove all listeners
    socket.off('futures:update');
    socket.off('connect');
    socket.off('disconnect');
    
    // Disconnect the socket
    socket.disconnect();
    socket = null;
    isSocketInitialized = false;
    
    // Clear all subscriptions
    channelToSubscription.clear();
    
    console.log("🔌 Futures chart socket disconnected and cleaned up");
  }
}

function getStartOfMinute(timestamp) {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.getTime();
}
