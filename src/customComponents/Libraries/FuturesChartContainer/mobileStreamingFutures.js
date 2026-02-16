import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import { parseFuturesSymbol } from './helpersFutures';
const { io } = require('socket.io-client');

const channelToSubscription = new Map();

let socket = null;
let isSocketInitialized = false;
let futuresUpdateHandler = null;
let pendingStreamParams = null;

/**
 * Initialize socket connection for mobile futures chart.
 * Creates its own socket (like mobileStreaming for spot) - used in WebView.
 * Uses market:subscribe / market:update (futures_pairs) for live streaming.
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
    socket.emit('market:subscribe');

    if (pendingStreamParams) {
      setupStreamWithSocket(pendingStreamParams);
      pendingStreamParams = null;
    }
  });

  socket.on('disconnect', () => {});
};

/**
 * Setup market:update listener - uses futures_pairs from market data
 */
function setupMarketUpdateListener() {
  if (!socket) return;
  if (futuresUpdateHandler) {
    socket.off('market:update', futuresUpdateHandler);
  }

  futuresUpdateHandler = (data) => {
    try {
      const pairs = data?.futures_pairs || [];
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

        const changeMiliSecond = currPair?.available === 'LOCAL' ? 1000 : 1;
        const tradeTime =
          currPair?.available === 'LOCAL'
            ? tickerData?.time
            : currPair?.time ?? currPair?.updatedAt ?? Date.now();
        const volume = tickerData?.volume ?? currPair?.volume ?? 0;

        if (!subscriptionItem.lastDailyBar) {
          const barTime =
            typeof tradeTime === 'number' ? tradeTime * changeMiliSecond : Date.now();
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
          typeof tradeTime === 'number' ? tradeTime * changeMiliSecond : Date.now();
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
      // Silent
    }
  };

  socket.on('market:update', futuresUpdateHandler);
}

function setupStreamWithSocket(params) {
  const { symbolInfo, resolution, onRealtimeCallback, subscriberUID, lastDailyBar } = params;

  const channelString = symbolInfo.name;
  const handler = { id: subscriberUID, callback: onRealtimeCallback };

  let subscriptionItem = channelToSubscription.get(channelString);
  if (subscriptionItem) {
    subscriptionItem.handlers.push(handler);
    subscriptionItem.lastDailyBar = lastDailyBar ?? subscriptionItem.lastDailyBar;
  } else {
    subscriptionItem = { subscriberUID, resolution, lastDailyBar, handlers: [handler] };
    channelToSubscription.set(channelString, subscriptionItem);
  }

  if (lastDailyBar) {
    subscriptionItem.lastDailyBar = lastDailyBar;
  }

  if (socket?.connected) {
    socket.emit('market:subscribe');
  }

  setupMarketUpdateListener();
}

function getStartOfMinute(timestamp) {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.getTime();
}

export async function subscribeFuturesOnStream(
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback,
  lastDailyBar
) {
  initializeSocket();

  const params = {
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    lastDailyBar,
  };

  if (socket?.connected) {
    setupStreamWithSocket(params);
  } else {
    pendingStreamParams = params;
  }
}

export function unsubscribeFuturesFromStream(subscriberUID) {
  for (const [channelString, subscriptionItem] of channelToSubscription) {
    const handlerIndex = subscriptionItem.handlers.findIndex((h) => h.id === subscriberUID);

    if (handlerIndex !== -1) {
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers?.length === 0) {
        channelToSubscription.delete(channelString);
        if (socket && futuresUpdateHandler) {
          socket.off('market:update', futuresUpdateHandler);
          futuresUpdateHandler = null;
        }
      }
      break;
    }
  }
}

export function disconnectMobileFuturesChartSocket() {
  if (socket) {
    if (socket.connected) {
      socket.emit('market:unsubscribe');
    }
    if (futuresUpdateHandler) {
      socket.off('market:update', futuresUpdateHandler);
      futuresUpdateHandler = null;
    }
    socket.off('connect');
    socket.off('disconnect');
    socket.disconnect();
    socket = null;
    isSocketInitialized = false;
  }
  pendingStreamParams = null;
  channelToSubscription.clear();
}
