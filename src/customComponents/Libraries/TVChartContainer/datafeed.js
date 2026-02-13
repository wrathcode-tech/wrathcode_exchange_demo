
import AuthService from '../../../api/services/AuthService.js';
import { makeApiRequest, makeApiRequest2, parseFullSymbol } from './helpers.js';
import { subscribeOnStream, unsubscribeFromStream } from './streaming.js';

const lastBarsCache = new Map();

const configurationData = {
    supported_resolutions: ["3", "5", "15", "60", "D", "W", "M"],
};

export default {
    onReady: (callback) => setTimeout(() => callback({ supported_resolutions: ["3", "5", "15", "60", "D", "W", "M"] })),

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
            let pair = symbolName?.split('/')
            const allPairs = await AuthService.getPairs()
            const filteredPair = allPairs?.data?.filter((item) => item?.base_currency === pair[0] && item?.quote_currency === pair[1])
            const isLocal = filteredPair?.map((item) => item?.available === 'LOCAL')[0];
            const decimals = (filteredPair?.map((item) => item?.buy_price)[0]?.toString()?.split('.')[1] || '')?.length;
            let decimalFormater = Math.min(Math.pow(10, decimals ), 100000000000)
            const symbolInfo = {
                ticker: symbolName,
                name: symbolName,
                description: symbolName,
                type: symbolName,
                session: '24x7',
                timezone: 'Asia/Kolkata',
                exchange: '',
                minmov: 1,
                pricescale: decimalFormater,
                has_intraday: true,
                intraday_multipliers: ['1', '60'],
                supported_resolution: configurationData.supported_resolutions,
                has_weekly_and_monthly: false,
                volume_precision: 2,
                data_status: 'streaming',
                local: isLocal
            };
            onSymbolResolvedCallback(symbolInfo);
        }
        else if (!symbolName) {
            onResolveErrorCallback('cannot resolve symbol');
            return;
        }
    },

    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        let { from, to, firstDataRequest } = periodParams;
        const parsedSymbol = parseFullSymbol(symbolInfo.name);
        let isLocal = symbolInfo.local === true
        try {
            let data;
            let ApiData;
            if (isLocal) {
                const chartResolution = resolution === '1D' ? 'histoday' : resolution == 60 ? 'histohour' : 'histominute'
                ApiData = await makeApiRequest2(parsedSymbol.fromSymbol, parsedSymbol.toSymbol, from, to,chartResolution);
                data = ApiData?.data;
            } else {
                const url = resolution === '1D' ? 'histoday' : resolution == 60 ? 'histohour' : 'histominute'
                ApiData = await makeApiRequest(parsedSymbol.fromSymbol, parsedSymbol.toSymbol, to, url);
                data = ApiData?.Data?.Data;
            }
            if (ApiData?.Response === 'Error' || data?.length === 0) {
                onHistoryCallback([], {
                    noData: true,
                });
                return;
            }
            let bars = [];
            data.forEach(bar => {
                if (bar.time >= from && bar.time < to) {
                    bars = [...bars, {
                        time: bar.time * 1000,
                        low: bar.low,
                        high: bar.high,
                        open: bar.open,
                        close: bar.close,
                        volume: bar.volume || bar ?.volumeto,
                    }];
                }
            });
            if (firstDataRequest) {
                lastBarsCache.set(symbolInfo.name, {
                    ...bars[bars.length - 1],
                });
            }
            onHistoryCallback(bars, {
                noData: false,
            });
        } catch (error) {
            onErrorCallback(error);
        }
    },


    subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
        subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback, lastBarsCache.get(symbolInfo.name));
    },

    unsubscribeBars: unsubscribeFromStream,
};
