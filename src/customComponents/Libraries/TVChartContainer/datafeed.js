
import { makeApiRequest, makeApiRequest2, parseFullSymbol, fetchBinanceSpotKlines, fetchSpotExchangeInfo } from './helpers.js';
import { subscribeOnStream, unsubscribeFromStream } from './streaming.js';

const lastBarsCache = new Map();

const configurationData = {
    supported_resolutions: ["1", "3", "5", "15", "30", "60", "D", "W", "M"],
};

export default {
    onReady: (callback) => setTimeout(() => callback({ supported_resolutions: configurationData.supported_resolutions })),

    searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
        onResultReadyCallback(symbolType);
    },

    resolveSymbol: async (
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback,
        extension
    ) => {
        if (symbolName) {
            const pair = symbolName?.split('/');
            if (!pair?.[0] || !pair?.[1]) {
                onResolveErrorCallback('cannot resolve symbol');
                return;
            }
            // Use Binance exchangeInfo (fast public API) instead of AuthService.getPairs()
            const { priceScale, isLocal } = await fetchSpotExchangeInfo(pair[0], pair[1]);
            const symbolInfo = {
                ticker: symbolName,
                name: symbolName,
                description: symbolName,
                type: symbolName,
                session: '24x7',
                timezone: 'Asia/Kolkata',
                exchange: '',
                minmov: 1,
                pricescale: priceScale,
                has_intraday: true,
                intraday_multipliers: ['1', '3', '5', '15', '30', '60'],
                supported_resolution: configurationData.supported_resolutions,
                has_weekly_and_monthly: true,
                volume_precision: 2,
                data_status: 'streaming',
                local: isLocal
            };
            onSymbolResolvedCallback(symbolInfo);
        } else {
            onResolveErrorCallback('cannot resolve symbol');
        }
    },

    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        let { from, to, firstDataRequest } = periodParams;
        const parsedSymbol = parseFullSymbol(symbolInfo.name);
        const isLocal = symbolInfo.local === true;
        try {
            // 1. Try Binance first only for non-LOCAL pairs (LOCAL pairs use backend)
            let binanceBars = null;
            if (!isLocal) {
                binanceBars = await fetchBinanceSpotKlines(
                    parsedSymbol.fromSymbol,
                    parsedSymbol.toSymbol,
                    from,
                    to,
                    resolution
                );
            }

            if (binanceBars && binanceBars.length > 0) {
                const fromMs = from * 1000;
                const toMs = to * 1000;
                const bars = binanceBars
                    .filter(bar => bar.time >= fromMs && bar.time < toMs)
                    .map(bar => ({
                        time: bar.time,
                        low: bar.low,
                        high: bar.high,
                        open: bar.open,
                        close: bar.close,
                        volume: bar.volume,
                    }));
                if (firstDataRequest && bars.length) {
                    lastBarsCache.set(symbolInfo.name, { ...bars[bars.length - 1] });
                }
                onHistoryCallback(bars, { noData: false });
                return;
            }

            // 2. Fallback: CryptoCompare or backend (when Binance has no data / limit reached)
            let data;
            let ApiData;
            const r = String(resolution || '');
            const isDayOrHigher = ['D', '1D', 'W', '1W', 'M', '1M'].includes(r.toUpperCase());
            const isHour = r === '60';
            const chartResolution = isDayOrHigher ? 'histoday' : isHour ? 'histohour' : 'histominute';
            if (isLocal) {
                ApiData = await makeApiRequest2(parsedSymbol.fromSymbol, parsedSymbol.toSymbol, from, to, chartResolution);
                data = ApiData?.data;
            } else {
                ApiData = await makeApiRequest(parsedSymbol.fromSymbol, parsedSymbol.toSymbol, to, chartResolution);
                data = ApiData?.Data?.Data;
            }
            if (ApiData?.Response === 'Error' || !data?.length) {
                onHistoryCallback([], { noData: true });
                return;
            }
            const bars = [];
            data.forEach(bar => {
                if (bar.time >= from && bar.time < to) {
                    bars.push({
                        time: bar.time * 1000,
                        low: bar.low,
                        high: bar.high,
                        open: bar.open,
                        close: bar.close,
                        volume: bar.volume || bar?.volumeto,
                    });
                }
            });
            if (firstDataRequest && bars.length) {
                lastBarsCache.set(symbolInfo.name, { ...bars[bars.length - 1] });
            }
            onHistoryCallback(bars, { noData: false });
        } catch (error) {
            onErrorCallback(error);
        }
    },


    subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
        subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback, lastBarsCache.get(symbolInfo.name));
    },

    unsubscribeBars: unsubscribeFromStream,
};
