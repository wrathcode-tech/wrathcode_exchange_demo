import { parseFuturesSymbol } from "./helpersFutures";

const channelToSubscription = new Map();

let socket = null;
let futuresUpdateHandler = null;
let listenerAttached = false;

/**
 * Set the shared socket from SocketContext.
 * UsdMFutures already subscribes to futures - chart just listens to futures:update.
 */
export function setSharedSocket(socketInstance) {
  if (socketInstance && socket !== socketInstance) {
    if (socket && futuresUpdateHandler) {
      socket.off('futures:update', futuresUpdateHandler);
      listenerAttached = false;
    }
    socket = socketInstance;
    if (channelToSubscription.size > 0) {
      ensureFuturesUpdateListener();
    }
  }
}

function ensureFuturesUpdateListener() {
  if (!socket || listenerAttached || futuresUpdateHandler) return;
  if (channelToSubscription.size === 0) return;

  futuresUpdateHandler = (data) => {
    try {
      const pairs = data?.pairs;
      if (!pairs?.length) return;

      const tickerData = data?.ticker;

      for (const [channelString, subscriptionItem] of channelToSubscription) {
        const parsed = parseFuturesSymbol(channelString);
        if (!parsed?.base || !parsed?.quote) continue;

        const currPair = pairs.find(
          (p) =>
            (String(p?.short_name).toUpperCase() === parsed.base &&
              String(p?.margin_asset).toUpperCase() === parsed.quote) ||
            (String(p?.base).toUpperCase() === parsed.base &&
              String(p?.quote).toUpperCase() === parsed.quote)
        );
        const tradePrice =
          currPair?.buy_price ??
          currPair?.sell_price ??
          tickerData?.buy_price ??
          tickerData?.sell_price;
        if (currPair == null || tradePrice == null) continue;

        const changeMiliSecond = currPair?.available === "LOCAL" ? 1000 : 1;
        const tradeTime =
          currPair?.available === "LOCAL"
            ? tickerData?.time
            : currPair?.time ?? currPair?.updatedAt ?? Date.now();
        const volume = tickerData?.volume ?? currPair?.volume ?? 0;

        if (!subscriptionItem.lastDailyBar) {
          const barTime =
            typeof tradeTime === "number" ? tradeTime * changeMiliSecond : Date.now();
          subscriptionItem.lastDailyBar = {
            time: barTime,
            open: tradePrice,
            high: tradePrice,
            low: tradePrice,
            close: tradePrice,
            volume: volume ?? 0,
          };
          subscriptionItem.handlers?.forEach((h) => h.callback(subscriptionItem.lastDailyBar));
          continue;
        }

        const timeMs =
          typeof tradeTime === "number" ? tradeTime * changeMiliSecond : Date.now();
        const lastBarTime = getStartOfMinute(subscriptionItem.lastDailyBar.time);
        const currentTradeMinute = getStartOfMinute(timeMs);

        let bar;
        if (currentTradeMinute > lastBarTime) {
          bar = {
            time: timeMs,
            open: subscriptionItem.lastDailyBar.close,
            high: tradePrice,
            low: tradePrice,
            close: tradePrice,
            volume: volume ?? subscriptionItem.lastDailyBar.volume ?? 0,
          };
        } else {
          bar = {
            ...subscriptionItem.lastDailyBar,
            high: Math.max(
              subscriptionItem.lastDailyBar?.high ?? 0,
              tradePrice
            ),
            low: Math.min(
              subscriptionItem.lastDailyBar?.low ?? Infinity,
              tradePrice
            ),
            close: tradePrice,
            volume: volume ?? subscriptionItem.lastDailyBar?.volume ?? 0,
          };
        }
        subscriptionItem.lastDailyBar = bar;
        subscriptionItem.handlers?.forEach((h) => h.callback(bar));
      }
    } catch (err) {
      // Prevent chart crashes
    }
  };

  socket.on("futures:update", futuresUpdateHandler);
  listenerAttached = true;
}

export async function subscribeFuturesOnStream(
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback,
  lastDailyBar
) {
  const channelString = symbolInfo.name;
  const handler = {
    id: subscriberUID,
    callback: onRealtimeCallback,
  };

  let subscriptionItem = channelToSubscription.get(channelString);
  if (subscriptionItem) {
    subscriptionItem.handlers.push(handler);
    ensureFuturesUpdateListener();
    return;
  }

  subscriptionItem = {
    subscriberUID,
    resolution,
    lastDailyBar,
    handlers: [handler],
  };

  channelToSubscription.set(channelString, subscriptionItem);
  ensureFuturesUpdateListener();
}

export function unsubscribeFuturesFromStream(subscriberUID) {
  for (const [channelString, subscriptionItem] of channelToSubscription) {
    const handlerIndex = subscriptionItem.handlers.findIndex(
      (h) => h.id === subscriberUID
    );

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
 * Cleanup when leaving futures page - remove listener only.
 * Do NOT disconnect socket; UsdMFutures and SocketContext own it.
 */
export function disconnectFuturesChartSocket() {
  if (socket && futuresUpdateHandler) {
    socket.off("futures:update", futuresUpdateHandler);
    futuresUpdateHandler = null;
    listenerAttached = false;
  }
  channelToSubscription.clear();
}

function getStartOfMinute(timestamp) {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.getTime();
}
