

import AuthService from "../../../api/services/AuthService";

export async function makeApiRequest(fromSym, toSym, to,url) {
	if (fromSym == "undefined") {
		return
	}
	try {
		const response = await AuthService?.cryptoCompareApi(fromSym, toSym, to,url);
		return response;
	} catch (error) {
		throw new Error(error.status);
	}
}
export async function makeApiRequest2(fromSymbol, toSymbol, from, to,chartResolution) {
	if (fromSymbol == "undefined") {
		return
	}
	try {
		const response = await AuthService?.getHistoricalData(fromSymbol, toSymbol, from, to,chartResolution);
		return response;
	} catch (error) {
		throw new Error(error.status);
	}
}

export function generateSymbol(exchange, fromSymbol, toSymbol) {
	const short = `${fromSymbol}/${toSymbol}`;
	return {
		short,
		full: `${exchange}:${short}`,
	};
}

export function parseFullSymbol(fullSymbol) {
	const match = fullSymbol?.split('/');
	if (!match) {
		return null;
	}
	return {
		fromSymbol: match[0],
		toSymbol: match[1],
	};
}

let _spotExchangeInfoCache = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Prefetch Binance exchangeInfo when website loads. Call from App.js on mount.
 * Non-blocking; populates cache so first chart load is instant.
 */
export function prefetchSpotExchangeInfo() {
	if (_spotExchangeInfoCache && Date.now() - _spotExchangeInfoCache.time < CACHE_TTL_MS) return;
	fetch('https://api.binance.com/api/v3/exchangeInfo')
		.then((r) => r.json())
		.then((json) => {
			_spotExchangeInfoCache = { json, time: Date.now() };
		})
		.catch(() => {});
}

/**
 * Fetch symbol info from Binance Spot exchangeInfo (fast public API, no auth).
 * Returns { priceScale, isLocal }. isLocal=true if symbol not on Binance.
 * Caches exchangeInfo for 5min to avoid repeated fetches when switching symbols.
 */
export async function fetchSpotExchangeInfo(fromSymbol, toSymbol) {
	const symbol = `${fromSymbol}${toSymbol}`.toUpperCase();
	try {
		if (!_spotExchangeInfoCache || Date.now() - _spotExchangeInfoCache.time > CACHE_TTL_MS) {
			const resp = await fetch('https://api.binance.com/api/v3/exchangeInfo');
			const json = await resp.json();
			_spotExchangeInfoCache = { json, time: Date.now() };
		}
		const s = _spotExchangeInfoCache.json.symbols?.find(x => x.symbol === symbol);
		if (!s) return { priceScale: 100000000, isLocal: true };
		const priceFilter = (s.filters || []).find(f => f.filterType === 'PRICE_FILTER');
		const tickSize = priceFilter?.tickSize || '0.01';
		const dot = tickSize.indexOf('.');
		const decimals = dot === -1 ? 0 : tickSize.slice(dot + 1).replace(/0+$/, '').length;
		const priceScale = Math.min(Math.pow(10, decimals || 2), 100000000);
		return { priceScale, isLocal: false };
	} catch {
		return { priceScale: 100000000, isLocal: true };
	}
}

/** Map spot chart resolution to Binance klines interval */
export function resolutionToBinanceSpot(resolution) {
	const r = String(resolution || '').toUpperCase();
	if (r === '1D' || r === 'D') return '1d';
	if (r === '1W' || r === 'W') return '1w';
	if (r === '1M' || r === 'M') return '1M';
	if (r === '60') return '1h';
	if (r === '30') return '30m';
	if (r === '15') return '15m';
	if (r === '5') return '5m';
	if (r === '3') return '3m';
	if (r === '1') return '1m';
	return '1m';
}

/**
 * Fetch historical klines from Binance Spot API.
 * Returns bars or null if empty/error (caller can fallback to CryptoCompare).
 */
export async function fetchBinanceSpotKlines(fromSymbol, toSymbol, from, to, resolution) {
	const symbol = `${fromSymbol}${toSymbol}`.toUpperCase();
	const interval = resolutionToBinanceSpot(resolution);
	try {
		const url = new URL('https://api.binance.com/api/v3/klines');
		url.searchParams.set('symbol', symbol);
		url.searchParams.set('interval', interval);
		url.searchParams.set('startTime', String(from * 1000));
		url.searchParams.set('endTime', String(to * 1000));
		url.searchParams.set('limit', '1000');

		const resp = await fetch(url.toString());
		const json = await resp.json();
		if (!Array.isArray(json) || json.length === 0) return null;

		return json.map(k => ({
			time: k[0],
			open: parseFloat(k[1]),
			high: parseFloat(k[2]),
			low: parseFloat(k[3]),
			close: parseFloat(k[4]),
			volume: parseFloat(k[5]),
		}));
	} catch {
		return null;
	}
}

