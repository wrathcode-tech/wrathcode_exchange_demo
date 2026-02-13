import { parseFuturesSymbol, intervalToBinance, getPriceScaleFromTickSize, fetchExchangeInfo } from './helpersFutures';
import { subscribeFuturesOnStream, unsubscribeFuturesFromStream } from './streamingFutures';

const lastBarsCache = new Map();

// TradingView requires this object shape/methods
const configurationData = {
  supported_resolutions: ['1', '5', '15', '30', '60', 'D', 'W', 'M'],
};

export default {
  onReady: (cb) => setTimeout(() => cb(configurationData)),

  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
    // keep simple (you can wire real search later)
    onResultReadyCallback([]);
  },

  resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
    try {
      // Expected format: "BTCUSDT_PERP" (USDT-M Perpetual)
      const raw = symbolName.replace('/', '').trim();
      const parsed = parseFuturesSymbol(raw); // { base:'BTC', quote:'USDT', raw:'BTCUSDT', isPerp:true }

      // Pull tickSize/stepSize from Binance Futures exchangeInfo
      const meta = await fetchExchangeInfo(parsed.raw); // { priceScale, minQty, tickSizeDecimalPlaces }
      const pricescale = meta.priceScale || 100; // fallback

      const symbolInfo = {
        ticker: symbolName,
        name: symbolName,
        description: `${parsed.raw} Perpetual (Binance Futures)`,
        type: 'futures',
        session: '24x7',
        timezone: 'Asia/Kolkata',
        exchange: 'Binance Futures',
        minmov: 1,
        pricescale: pricescale,
        has_intraday: true,
        supported_resolution: configurationData.supported_resolutions,
        has_weekly_and_monthly: true,
        // volume_precision: 2,
        data_status: 'streaming',
        market_type: 'futures',
      };

      onSymbolResolvedCallback(symbolInfo);
    } catch (e) {
      console.error('resolveSymbol error:', e);
      onResolveErrorCallback('cannot resolve futures symbol');
    }
  },

  /**
   * TradingView requests history. We get klines from Binance USDT-M futures.
   * REST: GET https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&startTime=&endTime=&limit=1000
   */
  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    const { from, to, firstDataRequest } = periodParams;
    try {
      const parsed = parseFuturesSymbol(symbolInfo.name);
      const interval = intervalToBinance(resolution);

      // Binance expects ms
      const url = new URL('https://fapi.binance.com/fapi/v1/klines');
      url.searchParams.set('symbol', parsed.raw);
      url.searchParams.set('interval', interval);
      url.searchParams.set('startTime', String(from * 1000));
      url.searchParams.set('endTime', String(to * 1000));
      url.searchParams.set('limit', '1000');

      const resp = await fetch(url.toString());
      const json = await resp.json();
      if (!Array.isArray(json) || json.length === 0) {
        onHistoryCallback([], { noData: true });
        return;
      }

      const bars = json.map(k => ({
        time: k[0], // already ms
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));

      if (firstDataRequest && bars.length) {
        lastBarsCache.set(symbolInfo.name, { ...bars[bars.length - 1] });
      }
      onHistoryCallback(bars, { noData: false });
    } catch (err) {
      console.error('getBars futures error:', err);
      onErrorCallback(err);
    }
  },

  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
    const lastBar = lastBarsCache.get(symbolInfo.name);
    subscribeFuturesOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback, lastBar);
  },

  unsubscribeBars: (subscriberUID) => {
    unsubscribeFuturesFromStream(subscriberUID);
  },
};
