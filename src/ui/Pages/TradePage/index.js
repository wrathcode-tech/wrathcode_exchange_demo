import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import TVChartContainer from "../../../customComponents/Libraries/TVChartContainer";
import '../TradePage/trade_new.css'
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { ProfileContext } from "../../../context/ProfileProvider";
import { SocketContext } from "../../../customComponents/SocketContext";
import "swiper/css";
import "swiper/css/pagination";
import { Helmet } from "react-helmet-async";

const Trade = () => {
    let params = useParams()
    let URL = params?.pairs?.split('_');

    const location = useLocation();

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    let recentPair = localStorage.getItem('RecentPair');
    let ParsedPair = null;
    try {
        ParsedPair = recentPair ? JSON.parse(recentPair) : null;
    } catch (e) {
        ParsedPair = null;
    }
    const [urlPath, setUrlPath] = useState(URL ? URL : []);
    const [search, setsearch] = useState('');
    const [AllData, setAllData] = useState([]);
    const [BuyOrders, setBuyOrders] = useState([]);
    const [CoinPairDetails, setCoinPairDetails] = useState();
    const [RecentTrade, setRecentTrade] = useState([]);
    const [SellOrders, setSellOrders] = useState([]);
    const [buyamount, setbuyamount] = useState(1);
    const [sellAmount, setsellAmount] = useState(1);
    const [infoPlaceOrder, setinfoPlaceOrder] = useState('LIMIT');
    const [coinFilter, setcoinFilter] = useState('ALL');
    const [BuyCoinBal, setBuyCoinBal] = useState();
    const [SellCoinBal, setSellCoinBal] = useState();
    const [openOrders, setopenOrders] = useState([]);
    const [orderType, setorderType] = useState('All');
    const [pastOrderType, setpastOrderType] = useState('All');
    const [priceDecimal, setpriceDecimal] = useState(3);
    const [pastOrders, setpastOrders] = useState([]);
    const [pastOrder2, setpastOrder2] = useState([]);
    const [favCoins, setfavCoins] = useState([]);
    const [sellOrderPrice, setsellOrderPrice] = useState('');
    const [buyOrderPrice, setbuyOrderPrice] = useState('');
    const [priceChange, setpriceChange] = useState('');
    const [changesHour, setChangesHour] = useState('');
    const [priceHigh, setpriceHigh] = useState('');
    const [priceLow, setpriceLow] = useState('');
    const [volume, setvolume] = useState('');
    const [showCoinList, setShowCoinList] = useState(false);
    const [loader, setloader] = useState(true);
    const [baseCurId, setbaseCurId] = useState(null);
    const [quoteCurId, setquoteCurId] = useState(null);
    const [buyprice, setbuyprice] = useState('');
    const [sellPrice, setsellPrice] = useState('');
    const [SelectedCoin, setSelectedCoin] = useState();
    const [isPricePositive, setIsPricePositive] = useState(true);
    const [showTab, setShowTab] = useState("chart");
    const [showBuySellTab, setShowBuySellTab] = useState("");
    const [orderBookActiveTab, setOrderBookActiveTab] = useState("orderbook");
    const [positionOrderTab, setPositionOrderTab] = useState("positions");
  const [showExecutedTrades, setShowExecutedTrades] = useState({});
    const [Coins, setCoins] = useState([]);
    const [expandedRowIndex, setExpandedRowIndex] = useState(null);
    const [activeBuyPercent, setActiveBuyPercent] = useState(null);
    const [activeSellPercent, setActiveSellPercent] = useState(null);
    const [showMobileFavouritesPopup, setShowMobileFavouritesPopup] = useState(false);
    const { userDetails, newStoredTheme } = useContext(ProfileContext);
    const KycStatus = userDetails?.kycVerified;
    const { isConnected, exchangeData, subscribeToExchange, unsubscribeFromExchange } = useContext(SocketContext);
    const [orderBookColor, setOrderBookColor] = useState({ buy: "#1c2a2b", sell: "#301e27" });
    const [spotWallets, setSpotWallets] = useState([]);
    const [walletsLoading, setWalletsLoading] = useState(false);
    const navigate = useNavigate()
    let socketId = localStorage.getItem("socketId")

    useEffect(() => {

        const Theme = localStorage.getItem('theme');
        if (Theme === "light") {
            setOrderBookColor({ buy: "#1c2a2b", sell: "#301e27" })
        } else {
            setOrderBookColor({ buy: "#1c2a2b", sell: "#301e27" })
        }
    }, [newStoredTheme]);



    // NOTE: Exchange subscription is handled in a single useEffect below (line ~195)
    // based on baseCurId/quoteCurId to avoid duplicate subscriptions




    // Handle exchange data updates from SocketContext
    useEffect(() => {
        if (!exchangeData) return;
        
        // Update balance
        if (exchangeData?.balance) {
            setBuyCoinBal(exchangeData.balance.quote_currency_balance);
            setSellCoinBal(exchangeData.balance.base_currency_balance);
        }
        
        // Update order book (backend uses buy_order/sell_order - singular)
        if (exchangeData?.buy_order) {
            setBuyOrders(exchangeData.buy_order);
        }
        if (exchangeData?.sell_order) {
            setSellOrders(exchangeData.sell_order);
        }
        
        // Update orders
        if (exchangeData?.open_orders !== undefined) {
            setopenOrders(exchangeData.open_orders || []);
        }
        if (exchangeData?.executed_order !== undefined) {
            setpastOrders(exchangeData.executed_order || []);
            setpastOrder2(exchangeData.executed_order || []);
        }
        
        // Update recent trades
        if (exchangeData?.recent_trades) {
            setRecentTrade(exchangeData.recent_trades);
        }
        
        // Update ticker data for price/volume info
        if (exchangeData?.ticker) {
            const tickerData = exchangeData.ticker;
            if (tickerData?.buy_price) setbuyprice(tickerData.buy_price);
            if (tickerData?.sell_price) setsellPrice(tickerData.sell_price);
            if (tickerData?.change !== undefined) setpriceChange(tickerData.change);
            if (tickerData?.change_24hour !== undefined) setChangesHour(tickerData.change_24hour);
            if (tickerData?.high) setpriceHigh(tickerData.high);
            if (tickerData?.low) setpriceLow(tickerData.low);
            if (tickerData?.volume) setvolume(tickerData.volume);
        }
        
        // Update all pairs list from exchange data if provided
        if (exchangeData?.pairs) {
            setCoins(exchangeData.pairs);
            // Also update AllData.pairs
            setAllData(prev => ({
                ...prev,
                ...exchangeData,
                pairs: exchangeData.pairs
            }));
        } else {
            // Store exchange data without overwriting pairs
            setAllData(prev => ({
                ...prev,
                ...exchangeData
            }));
        }
        setloader(false);
    }, [exchangeData]);

    // Subscribe to exchange data when pair changes (server-push, no polling)
    useEffect(() => {
        if (!baseCurId || !quoteCurId || !isConnected) return;

        // Subscribe to exchange updates for this pair
        subscribeToExchange(baseCurId, quoteCurId);

        return () => {
            // Unsubscribe when pair changes or component unmounts
            unsubscribeFromExchange(baseCurId, quoteCurId);
        };
    }, [baseCurId, quoteCurId, isConnected, subscribeToExchange, unsubscribeFromExchange]);

    // Pairs list now comes from exchangeData (which includes pairs)
    // No need for separate marketData subscription on TradePage


    // Orderbook data now comes from backend via exchangeData (SocketContext)
    // No need for frontend Binance WebSocket connection



    // ********* Auto Select Coin Pair after Socket Connection ********** //
    useEffect(() => {
        if (!SelectedCoin && CoinPairDetails && CoinPairDetails.length > 0 && isConnected) {
            let Pair;
            let filteredData;
            if (urlPath?.length > 0) {
                filteredData = CoinPairDetails?.filter?.((item) => {
                    return urlPath[0]?.includes(item?.base_currency) && urlPath[1]?.includes(item?.quote_currency)
                })
            }
            if (filteredData?.length > 0) {
                Pair = filteredData[0]
            }
            else {
                Pair = CoinPairDetails[0]
            }
            
            if (!Pair) return;
            
            navigate(`/trade/${Pair?.base_currency}_${Pair?.quote_currency}`);
            setloader(true);
            setsellOrderPrice('');
            setbuyOrderPrice('');
            setSelectedCoin(Pair);
            setbaseCurId(Pair?.base_currency_id);
            setquoteCurId(Pair?.quote_currency_id);
            setbuyprice(Pair?.buy_price);
            setsellPrice(Pair?.sell_price);
            // NOTE: Exchange subscription is triggered by baseCurId/quoteCurId change in another useEffect
        }
    }, [CoinPairDetails, isConnected, urlPath, navigate]);


    useEffect(() => {
        let filteredData = pastOrder2?.filter((item) => {
            return pastOrderType === item?.side || pastOrderType === 'All'
        })
        setpastOrders(filteredData ? filteredData?.reverse() : [])
    }, [pastOrderType]);


    // ********* Update Buy Sell 24HChange High Low Volume Price********** //
    useEffect(() => {
        let filteredData = AllData?.pairs?.filter((item) => {
            return item?.base_currency_id === SelectedCoin?.base_currency_id
        })
        if (filteredData) {
            setbuyprice(filteredData[0]?.buy_price);
            setsellPrice(filteredData[0]?.sell_price);
            setpriceChange(filteredData[0]?.change_percentage);
            setChangesHour(filteredData[0]?.change);
            setpriceHigh(filteredData[0]?.high);
            setpriceLow(filteredData[0]?.low);
            setvolume(filteredData[0]?.volume);

        }
    }, [AllData]);




    // ********* Update Buy Sell 24HChange High Low Volume Price********** //
    useEffect(() => {
        if (AllData && SelectedCoin) {
            let filteredData = AllData?.pairs?.filter((item) => {
                return item?.base_currency_id === SelectedCoin?.base_currency_id && item?.quote_currency_id === SelectedCoin?.quote_currency_id
            })
            if (filteredData) {
                if (filteredData[0]?.buy_price >= buyprice) {
                    setIsPricePositive(true)
                } else {
                    setIsPricePositive(false)
                }
                setbuyprice(filteredData[0]?.buy_price);
                setsellPrice(filteredData[0]?.sell_price);
                setpriceChange(filteredData[0]?.change_percentage);
                setChangesHour(filteredData[0]?.change);
                setpriceHigh(filteredData[0]?.high);
                setpriceLow(filteredData[0]?.low);
                setvolume(filteredData[0]?.volume);
            }
        }
    }, [AllData]);


    // ********* Search Coins ********** //
    useEffect(() => {
        let filteredData = AllData?.pairs?.filter((item) => {
            return item?.base_currency?.toLowerCase().includes(search?.toLowerCase()) || item?.quote_currency?.toLowerCase().includes(search?.toLowerCase())
        })
        setCoinPairDetails(filteredData)
    }, [search, AllData]);

    // Set default coin filter to first quote currency
    useEffect(() => {
        if (CoinPairDetails?.length > 0 && coinFilter === 'ALL') {
            const firstQuoteCurrency = CoinPairDetails[0]?.quote_currency;
            if (firstQuoteCurrency) {
                setcoinFilter(firstQuoteCurrency);
            }
        }
    }, [CoinPairDetails, coinFilter]);



    // Fetch spot wallets for logged in users
    const fetchSpotWallets = async () => {
        if (!token) return;
        setWalletsLoading(true);
        try {
            const result = await AuthService.getUserfunds("spot");
            if (result?.success) {
                // Filter wallets with balance > 0 and sort by balance
                const walletsWithBalance = (result.data || [])
                    .filter(w => parseFloat(w.balance) > 0)
                    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
                setSpotWallets(walletsWithBalance);
            }
        } catch (error) {
            console.error("Failed to fetch spot wallets:", error);
        } finally {
            setWalletsLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        token && favoriteList();
        token && fetchSpotWallets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Request pairs list via socket on mount (faster than API call)
    useEffect(() => {
        if (isConnected && !CoinPairDetails?.length) {
            // Request pairs only (no base/quote = pairs list only)
            subscribeToExchange();
        }
    }, [isConnected, CoinPairDetails?.length, subscribeToExchange]);


    const handleOrderPlace = async (infoPlaceOrder, buyprice, buyamount, base_currency_id, quote_currency_id, side) => {
        // Validate order before placing
        if (!validateOrder(buyprice, buyamount, side)) {
            return;
        }
        LoaderHelper.loaderStatus(true);
        await AuthService.placeOrder(infoPlaceOrder, buyprice, buyamount, base_currency_id, quote_currency_id, side).then((result) => {
            if (result?.success) {
                LoaderHelper.loaderStatus(false);
                try {
                    alertSuccessMessage('Order Placed Successfully!!')
                    setbuyOrderPrice('');
                    setsellOrderPrice('');
                    // Re-subscribe to exchange to refresh order data
                    subscribeToExchange(SelectedCoin?.base_currency_id, SelectedCoin?.quote_currency_id);
                } catch (error) {
                    LoaderHelper.loaderStatus(false);
                }
            } else {
                LoaderHelper.loaderStatus(false);
                alertErrorMessage(result?.message)
            }
        })
    };

    const cancelOrder = async (orderId) => {
        await AuthService.cancelOrder(orderId).then((result) => {
            if (result?.success) {
                LoaderHelper.loaderStatus(false);
                try {
                    alertSuccessMessage('Order Cancelled Successfully');
                } catch (error) {
                    LoaderHelper.loaderStatus(false);
                }
            } else {
                LoaderHelper.loaderStatus(false);
                alertErrorMessage(result?.message)
            }
        })
    };

    const handleAddFav = async (pairId) => {
        LoaderHelper.loaderStatus(true);
        await AuthService.favoriteCoin(pairId).then((result) => {
            if (result?.success) {
                LoaderHelper.loaderStatus(false);
                favoriteList()
            } else {
                LoaderHelper.loaderStatus(false);
                alertErrorMessage(result?.message)
            }
        })
    };
    const favoriteList = async () => {
        await AuthService.favoriteList().then((result) => {
            if (result?.success) {
                setfavCoins(result?.data?.pairs ? result?.data?.pairs : ['']);
            }
        });
    };


    // Reset orderbook when switching pairs
    const resetOrderbook = () => {
        setSellOrders([]);
        setBuyOrders([]);
        setRecentTrade([]);
    };

    const handleSelectCoin = (data) => {
        // Skip if selecting the same pair - don't reset or re-subscribe
        if (SelectedCoin?.base_currency_id === data?.base_currency_id && 
            SelectedCoin?.quote_currency_id === data?.quote_currency_id) {
            setShowCoinList(false);
            return;
        }
        
        resetOrderbook();
        setinfoPlaceOrder("LIMIT");
        navigate(`/trade/${data?.base_currency}_${data?.quote_currency}`);
        setloader(true);
        setsellOrderPrice('');
        setbuyOrderPrice('');
        setSelectedCoin(data);
        setbaseCurId(data?.base_currency_id);
        setquoteCurId(data?.quote_currency_id);
        setbuyprice(data?.buy_price);
        setsellPrice(data?.sell_price);
        setShowCoinList(false);
        setbuyamount(1);
        setsellAmount(1);
        setExpandedRowIndex(null);
        let filteredData = Coins?.filter((item) => item?.short_name === data?.base_currency)[0]
        setDesAndLinks({ ...filteredData })
        // NOTE: Exchange subscription is triggered automatically by baseCurId/quoteCurId change
    };

    const [desAndLinks, setDesAndLinks] = useState({ description: "", links: [] });
    const getDescAndLink = () => {
        if (SelectedCoin) {
            let filteredData = Coins?.filter((item) => item?.short_name === SelectedCoin?.base_currency)[0]
            setDesAndLinks({ ...filteredData })
        }
    }

    const handleOrderType = (e) => {
        // if (SelectedCoin?.available === "LOCAL") return;
        setinfoPlaceOrder(e.target.value);
        if (e.target.value === 'MARKET') {
            setsellOrderPrice('');
            setbuyOrderPrice('');
            setbuyprice(SelectedCoin?.buy_price)
            setsellPrice(SelectedCoin?.sell_price)
        };
    };

    const nineDecimalFormat = (data) => {
        if (typeof (data) === "number") {
            // return data
            return parseFloat(data?.toFixed(9))
        } else {
            return 0
        }
    };

    // Get decimal places from tick_size or step_size
    const getDecimalPlaces = (value) => {
        if (!value || value >= 1) return 0;
        const str = value.toString();
        if (str.includes('e-')) {
            return parseInt(str.split('e-')[1]);
        }
        const decimalPart = str.split('.')[1];
        return decimalPart ? decimalPart.length : 0;
    };

    // Get price precision based on tick_size
    const getPricePrecision = () => {
        const tickSize = SelectedCoin?.tick_size;
        if (tickSize === undefined || tickSize === null) return 8; // default if no tick_size
        return getDecimalPlaces(tickSize);
    };

    // Get quantity precision based on step_size
    const getQuantityPrecision = () => {
        const stepSize = SelectedCoin?.step_size;
        if (stepSize === undefined || stepSize === null) return 8; // default if no step_size
        return getDecimalPlaces(stepSize);
    };

    // Format price based on tick_size precision
    const formatPrice = (price) => {
        if (price === undefined || price === null || isNaN(price)) return '0';
        const precision = getPricePrecision();
        return parseFloat(Number(price).toFixed(precision));
    };

    // Format quantity based on step_size precision
    const formatQuantity = (qty) => {
        if (qty === undefined || qty === null || isNaN(qty)) return '0';
        const precision = getQuantityPrecision();
        return parseFloat(Number(qty).toFixed(precision));
    };

    // Validate order before placing
    const validateOrder = (price, quantity, side) => {
        const tick_size = SelectedCoin?.tick_size || 0.01;
        const step_size = SelectedCoin?.step_size || 0.00001;
        const min_notional = SelectedCoin?.min_notional || 5;
        const min_order_qty = SelectedCoin?.min_order_qty || 0.00001;
        const max_order_qty = SelectedCoin?.max_order_qty || 9000;

        const numPrice = parseFloat(price);
        const numQuantity = parseFloat(quantity);
        const total = numPrice * numQuantity;

        // Validate price tick_size
        const pricePrecision = getDecimalPlaces(tick_size);
        const priceMultiplier = Math.pow(10, pricePrecision);
        if (Math.round(numPrice * priceMultiplier) % Math.round(tick_size * priceMultiplier) !== 0) {
            alertErrorMessage(`Price must be a multiple of ${tick_size}`);
            return false;
        }

        // Validate quantity step_size
        const qtyPrecision = getDecimalPlaces(step_size);
        const qtyMultiplier = Math.pow(10, qtyPrecision);
        if (Math.round(numQuantity * qtyMultiplier) % Math.round(step_size * qtyMultiplier) !== 0) {
            alertErrorMessage(`Quantity must be a multiple of ${step_size}`);
            return false;
        }

        // Validate max_order_qty
        if (numQuantity > max_order_qty) {
            alertErrorMessage(`Maximum order quantity is ${max_order_qty} ${SelectedCoin?.base_currency}`);
            return false;
        }

        // Validate min_notional (minimum order value)
        if (total < min_notional) {
            alertErrorMessage(`Minimum order value is ${min_notional} ${SelectedCoin?.quote_currency}`);
            return false;
        }

        // Validate insufficient funds
        if (side === 'BUY') {
            const availableBalance = BuyCoinBal || 0;
            if (total > availableBalance) {
                alertErrorMessage(`Insufficient funds`);
                return false;
            }
        } else if (side === 'SELL') {
            const availableBalance = SellCoinBal || 0;
            if (numQuantity > availableBalance) {
                alertErrorMessage(`Insufficient funds`);
                return false;
            }
        }

        return true;
    };

    const formatTotal = (value) => {
        const precision = getPricePrecision();
        const finalValue = value?.toFixed(precision)?.replace(/\.?0+$/, '');
        let formattedNum = finalValue?.toString();
        let result = formattedNum?.replace(/^0\.0*/, '');
        const decimalPart = finalValue?.toString()?.split('.')[1];
        if (!decimalPart) return finalValue;
        let zeroCount = 0;
        for (let char of decimalPart) {
            if (char === '0') {
                zeroCount++;
            } else {
                break;
            }
        }
        if (zeroCount > 4) {
            return `0.0{${zeroCount}}${result}`;
        }
        if (value < 1e-7) {
            return `0.0{${zeroCount}}${result}`;
        } else {
            return finalValue;
        }
    };

    const toFixed8 = (data) => {
        const precision = getQuantityPrecision();
        const multiplier = Math.pow(10, precision);
        return Math.floor(data * multiplier) / multiplier;
    };

    // Check if a value being typed could lead to a valid price >= tick_size
    const isValidPriceInput = (value) => {
        if (value === '' || value === '0') return true;
        const tickSize = SelectedCoin?.tick_size || 0.01;
        const pricePrecision = getPricePrecision();

        // Check decimal precision
        const regex = new RegExp(`^\\d*\\.?\\d{0,${pricePrecision}}$`);
        if (!regex.test(value)) return false;

        // If it ends with a dot, allow it (user is still typing)
        if (value.endsWith('.')) return true;

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return false;

        // If value is 0, allow (will be validated on submit)
        if (numValue === 0) return true;

        // Value must be >= tick_size
        return numValue >= tickSize;
    };

    // Check if a value being typed could lead to a valid quantity >= step_size
    const isValidQuantityInput = (value) => {
        if (value === '' || value === '0') return true;
        const stepSize = SelectedCoin?.step_size || 0.00001;
        const qtyPrecision = getQuantityPrecision();

        // Check decimal precision
        const regex = new RegExp(`^\\d*\\.?\\d{0,${qtyPrecision}}$`);
        if (!regex.test(value)) return false;

        // If it ends with a dot, allow it (user is still typing)
        if (value.endsWith('.')) return true;

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return false;

        // If value is 0, allow (will be validated on submit)
        if (numValue === 0) return true;

        // Value must be >= step_size
        return numValue >= stepSize;
    };

    // Handle price input - strictly block values below tick_size
    const handlePriceInput = (value, setter) => {
        if (isValidPriceInput(value)) {
            setter(value);
        }
    };

    // Handle quantity input - strictly block values below step_size
    const handleQuantityInput = (value, setter) => {
        if (isValidQuantityInput(value)) {
            setter(value);
        }
    };

    // Round value to nearest step/tick on blur (cleanup)
    const handlePriceBlur = (value, setter) => {
        if (value === '' || value === '0' || value === '0.') {
            setter('');
            return;
        }
        const tickSize = SelectedCoin?.tick_size || 0.01;
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue === 0) {
            setter('');
            return;
        }
        // Ensure minimum tick_size
        if (numValue < tickSize) {
            setter(tickSize.toString());
            return;
        }
        // Round to nearest tick_size
        const rounded = Math.round(numValue / tickSize) * tickSize;
        const precision = getPricePrecision();
        setter(parseFloat(rounded.toFixed(precision)).toString());
    };

    const handleQuantityBlur = (value, setter) => {
        if (value === '' || value === '0' || value === '0.') {
            setter('');
            return;
        }
        const stepSize = SelectedCoin?.step_size || 0.00001;
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue === 0) {
            setter('');
            return;
        }
        // Ensure minimum step_size
        if (numValue < stepSize) {
            setter(stepSize.toString());
            return;
        }
        // Round to nearest step_size
        const rounded = Math.round(numValue / stepSize) * stepSize;
        const precision = getQuantityPrecision();
        setter(parseFloat(rounded.toFixed(precision)).toString());
    };

    const maxBuyVolume = Math.max(...BuyOrders.map(order => order.remaining), 1);
    const maxSellVolume = Math.max(...SellOrders.map(order => order.remaining), 1);
    return (
        <>
            <Helmet>
                <title>{`${SelectedCoin?.base_currency || "BTC"}/${SelectedCoin?.quote_currency || "USDT"} Spot Trading – Wrathcode`}</title>

                <meta
                    name="description"
                    content="Trade Bitcoin against USDT on Wrathcode with intuitive interface, live market data and safety features. Register today."
                />

                <meta
                    name="keywords"
                    content="spot bitcoin usdt, trade bitcoin exchange, Wrathcode spot trading, BTC USDT Wrathcode"
                />
            </Helmet>



            <div className="trade-wrapper spot pb-3 ">
                <div className="  container-fluid">
                    <div className="row g-1 g-md-2" >

                        <div className="col-12 col-lg-12 col-xl-2 col-xxl-2 trade_favourites_lft">
                            <div className="spotLists">

                                {/* Search */}
                                <div className="spot-list-search">
                                    <div className="ivu-input">
                                        <i className="ri-search-2-line"></i>
                                        <input
                                            autoComplete="off"
                                            spellCheck="false"
                                            type="search"
                                            placeholder="Search"
                                            onChange={(e) => setsearch(e.target.value)}
                                            value={search}
                                        />
                                    </div>
                                </div>

                                <ul className="favorites_list_tabs">
                                    {token && (
                                        <li>
                                            <button
                                                className={coinFilter === 'FAV' ? 'active' : ''}
                                                onClick={() => setcoinFilter('FAV')}
                                            >
                                                Favourites
                                            </button>
                                        </li>
                                    )}
                                    {CoinPairDetails && [...new Set(CoinPairDetails.map(item => item?.quote_currency)), "BTC", "BNB", "ETH"].map((quoteCurrency, idx) => (
                                        <li key={idx}>
                                            <button
                                                className={coinFilter === quoteCurrency ? 'active' : ''}
                                                onClick={() => setcoinFilter(quoteCurrency)}
                                            >
                                                {quoteCurrency}
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {/* Table */}
                                <div className="price_card table-responsive">
                                    <table className="table table-sm table-borderless mb-0 orderbook-table">
                                        <thead>
                                            <tr>
                                                <th>Pair</th>
                                                <th className="text-end">Price</th>
                                                <th className="text-end">Change</th>
                                            </tr>
                                        </thead>

                                        <tbody className="price_card_body">

                                            {/* ALL TAB */}
                                            {CoinPairDetails &&
                                                CoinPairDetails.map((data, index) => {
                                                    // Filter by favorites
                                                    if (coinFilter === "FAV" && !favCoins.includes(data?._id)) {
                                                        return null;
                                                    }
                                                    // Filter by quote currency
                                                    if (coinFilter !== "FAV" && (data?.quote_currency !== coinFilter && data?.base_currency !== coinFilter)) {
                                                        return null;
                                                    }


                                                    const isActive =
                                                        SelectedCoin?.base_currency === data?.base_currency &&
                                                        SelectedCoin?.quote_currency === data?.quote_currency;

                                                    return (
                                                        <tr
                                                            key={index}
                                                            className={isActive ? "active" : ""}
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => handleSelectCoin(data)}
                                                        >
                                                            {/* Pair */}
                                                            <td>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <img
                                                                        src={ApiConfig.baseImage + data?.icon_path}
                                                                        alt=""
                                                                        className="img-fluid me-1 round_img"
                                                                    />
                                                                    <div className="d-flex flex-column">
                                                                        {`${data?.base_currency}/${data?.quote_currency}`}
                                                                        <span className="tokensubcnt">{data?.base_currency_fullname}</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Price */}
                                                            <td className="text-end">
                                                                <div className="d-flex flex-column">
                                                                    <span>{data?.buy_price}</span>
                                                                    <span className="tokensubcnt">${data?.buy_price}</span>
                                                                </div>
                                                            </td>

                                                            {/* Change + Star */}
                                                            <td className="text-end">
                                                                <div className="d-flex justify-content-end align-items-center gap-2">
                                                                    <div className="d-flex flex-column text-end">
                                                                        <span
                                                                            className={
                                                                                data?.change_percentage >= 0
                                                                                    ? "text-green"
                                                                                    : "text-danger"
                                                                            }
                                                                        >
                                                                            {data?.change_percentage >= 0 ? `+${Number(parseFloat(data?.change_percentage)?.toFixed(5))}` : Number(parseFloat(data?.change_percentage)?.toFixed(5))}%
                                                                        </span>
                                                                        <span className="tokensubcnt">{parseFloat(data?.change?.toFixed(5)) || 0}</span>
                                                                    </div>

                                                                    {token && (
                                                                        <i
                                                                            className={
                                                                                favCoins.includes(data?._id)
                                                                                    ? "ri ri-star-fill ri-xl"
                                                                                    : "ri ri-star-line ri-xl"
                                                                            }
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAddFav(data?._id);
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-12 col-xl-6  col-xxl-6 midgraph_col">
                            {/* <div className={`bs_dropbox spotLists_bs_dropbox ${showCoinList === true ? 'active' : ""}`}>
                                <div className="spotLists active" >
                                    <div className=" trade_tabs buy_sell_cards   ">
                                        <div className="bs_box_header " >
                                            <h6>
                                                Trading Pair
                                            </h6>
                                            <span className="cursor-pointer" onClick={() => setShowCoinList(!showCoinList)}>
                                                <i className="ri-close-line"></i>
                                            </span>
                                        </div>

                                        <ul className="nav custom-tabs nav_order">
                                            <li className="all-tab">
                                                <a className="active" data-bs-toggle="tab" href="#tab_all" onClick={() => setcoinFilter('ALL')}> All </a>
                                            </li>
                                            <li className="cvt-tab">
                                                <a data-bs-toggle="tab" href="#tab_all" onClick={() => setcoinFilter('CVT')}>CVT</a>
                                            </li>
                                            <li className="usdt-tab">
                                                <a data-bs-toggle="tab" href="#tab_all" onClick={() => setcoinFilter('USDT')}>USDT</a>
                                            </li>
                                            {token &&
                                                <li className="favt-tab">
                                                    <a data-bs-toggle="tab" href="#tab_fav" onClick={() => setcoinFilter('FAV')}>FAV</a>
                                                </li>
                                            }
                                        </ul>
                                    </div>
                                    <div className="spot-list-search">
                                        <div className="ivu-input" >
                                            <i className="ri-search-2-line"></i>
                                            <input autoComplete="off" spellCheck="false" type="search" placeholder="Search" className=""
                                                onChange={(e) => { setsearch(e.target.value) }} value={search} />
                                        </div>
                                    </div>
                                    <div className="price_card">
                                        <div className="price_card_head">
                                            <div>Pair</div>
                                            <div>Price</div>
                                            <div>24H%</div>
                                        </div>
                                        <div className="price_card_body tab-content scroll_y" style={{ cursor: "pointer" }}>
                                            <div className="tab-pane px-0" id="tab_fav" >
                                                {CoinPairDetails ? CoinPairDetails?.map((data, index) => {
                                                    return (
                                                        favCoins.includes(data?._id) && <div className={`price_item_value ${SelectedCoin?.base_currency === data?.base_currency && SelectedCoin?.quote_currency === data?.quote_currency ? 'active' : ''}`} key={index}>
                                                            <span className="d-flex align-items-center gap-1">
                                                                {token && <i className={favCoins.includes(data?._id) ? "ri ri-star-fill ri-xl" : "ri ri-star-line ri-xl"} onClick={() => { handleAddFav(data?._id) }} >
                                                                </i>}
                                                                <dt className="td_div" onClick={() => handleSelectCoin(data)}>
                                                                    <img alt="" src={ApiConfig.baseImage + data?.icon_path} className="img-fluid  me-1 round_img" />
                                                                    {`${data?.base_currency}/${data?.quote_currency}`}
                                                                </dt>
                                                            </span>
                                                            <span className="">{data?.buy_price}</span>
                                                            <span className={data?.change_percentage >= 0 ? "text-green" : "text-danger"}>
                                                                {parseFloat(data?.change_percentage?.toFixed(5))}%
                                                            </span>
                                                        </div>

                                                    )
                                                }) : null}
                                            </div>
                                            <div className="tab-pane px-0 active" id="tab_all" >
                                                {CoinPairDetails ?
                                                    CoinPairDetails?.map((data, index) => {
                                                        return (
                                                            (coinFilter === 'ALL' ||
                                                                (coinFilter === 'USDT' && (data?.quote_currency === 'USDT' || data?.base_currency === 'USDT')) ||
                                                                (coinFilter === 'CVT' && (data?.quote_currency === 'CVT' || data?.base_currency === 'CVT'))) &&

                                                            <div className={`price_item_value ${SelectedCoin?.base_currency === data?.base_currency && SelectedCoin?.quote_currency === data?.quote_currency ? 'active' : ''}`} key={index} onClick={() => handleSelectCoin(data)}>
                                                                <span className="d-flex align-items-center gap-1">
                                                                    {token && <i className={favCoins.includes(data?._id) ? "ri ri-star-fill ri-xl" : "ri ri-star-line  ri-xl"} onClick={() => { handleAddFav(data?._id) }} >
                                                                    </i>}
                                                                    <dt className="td_div" >
                                                                        <img alt="" src={ApiConfig.baseImage + data?.icon_path} className="img-fluid  me-1 round_img" />
                                                                        {`${data?.base_currency}/${data?.quote_currency}`}
                                                                    </dt>
                                                                </span>
                                                                <span className="">{data?.buy_price}</span>
                                                                <span className={data?.change_percentage >= 0 ? "text-green" : "text-danger"}>{parseFloat(data?.change_percentage?.toFixed(5))}%</span>
                                                            </div>
                                                        );
                                                    })
                                                    : null}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div> */}

                            <div className="trade_card p-2  overflow_card mb-1" >
                                <div className="headline_left__lBBPY">

                                    <div className="headline_left__lBBPY_leftmain d-flex align-items-center">
                                        <div className="headline_symbolName__KfmIZ mt_tr_pr cursor-pointer" onClick={() => {
                                            setShowCoinList(!showCoinList);
                                            setShowMobileFavouritesPopup(true);
                                        }}>
                                            <div className="headline_bigName__dspVW "  >
                                                {/* <i className="faaa  ri-menu-add-line"></i> */}
                                                <img alt="" src={ApiConfig.baseImage + SelectedCoin?.icon_path} width="24" className="img-fluid round_img" />
                                            </div>

                                            <div>
                                                <div className="headline_bigName__dspVW ">
                                                    <h1>{SelectedCoin ? `${SelectedCoin?.base_currency}/${SelectedCoin?.quote_currency}` : "---/---"}
                                                        <i className="ri-arrow-down-s-line ms-1"></i>
                                                    </h1>
                                                </div>
                                                <div className="headline_etfDisplay__P4Hdv"><span>{SelectedCoin?.base_currency_fullname}</span></div>
                                            </div>
                                        </div>
                                        <div className="headline_leftItem__7BFYq headline_latestPrice__AYXu0 d-lg-none ms-0 mt-1">
                                            <div>
                                                <span className={`headline_title__x1csO font-weight-boldd  ${isPricePositive ? "text-green" : "text-danger"}`}  >{SelectedCoin ? parseFloat(buyprice?.toFixed(8)) : 0} </span>
                                            </div>
                                        </div>
                                        <div className="headline_leftItem__7BFYq ms-0 d-flex d-lg-none ">
                                            <div className="headline_withBorder__a6ZD2 me-1 ">24h Change</div>
                                            <div className={`headline_title__x1csO font-weight-boldd ${priceChange >= 0 ? "text-green" : "text-danger"}`}  >
                                                {priceChange >= 0 ? "+" : ""}   {parseFloat(parseFloat(priceChange||0?.toFixed(2))) || "0.00"}%
                                                <span className="ms-1"> {parseFloat(parseFloat(changesHour||0?.toFixed(2))) || "0.00"}</span>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="scroll-subtabs_scrollSubInfo__T5nZF headline_left__lBBPY_rightmain" >
                                        <div className="scroll-subtabs_tabs__Prom8" >
                                            <div className="scroll-subtabs_subMarketWrap__XVmHp" >
                                                <div className="headline_extendInfoWrapper__dooIS">
                                                    <div className="headline_leftItem__7BFYq  d-none d-lg-block">
                                                        <div className="headline_withBorder__a6ZD2 ">  Last Price  ({SelectedCoin?.quote_currency}) </div>

                                                        <span className={`headline_title__x1csO font-weight-boldd  ${isPricePositive ? "text-green" : "text-danger"}`}  >{SelectedCoin ? parseFloat(buyprice?.toFixed(8)) : 0} </span>

                                                    </div>
                                                    <div className="headline_leftItem__7BFYq d-none d-lg-block">
                                                        <div className="headline_withBorder__a6ZD2 ">24h Change</div>
                                                        <div className={`headline_title__x1csO font-weight-boldd ${priceChange >= 0 ? "text-green" : "text-danger"}`}  >
                                                            {priceChange >= 0 ? "+" : ""}   {parseFloat(parseFloat(priceChange||0?.toFixed(2))) || "0.00"}%
                                                            {/* <span className="mx-1"> {parseFloat(parseFloat(changesHour?.toFixed(2))) || "0.00"}</span> */}
                                                        </div>
                                                    </div>
                                                    <div className="headline_leftItem__7BFYq">
                                                        <div className="headline_withBorder__a6ZD2 ">24h High ({SelectedCoin?.quote_currency})</div>
                                                        <div className="headline_title__x1csO text-success font-weight-boldd"  >
                                                            {parseFloat(priceHigh||0?.toFixed(2)) || "0.00"}
                                                        </div>
                                                    </div>
                                                    <div className="headline_leftItem__7BFYq">
                                                        <div className="headline_withBorder__a6ZD2 ">24h Low ({SelectedCoin?.quote_currency})</div>
                                                        <div className="headline_title__x1csO text-danger font-weight-boldd" >
                                                            {parseFloat(priceLow||0?.toFixed(2)) || "0.00"}
                                                        </div>
                                                    </div>
                                                    <div className="headline_leftItem__7BFYq">
                                                        <div className="headline_withBorder__a6ZD2">24h Volume ({SelectedCoin?.base_currency})</div>
                                                        <div className="headline_title__x1csO font-weight-boldd">{parseFloat(volume||0?.toFixed(2)) || "0.00"}</div>
                                                    </div>
                                                    <div className="headline_leftItem__7BFYq">
                                                        <div className="headline_withBorder__a6ZD2">24h Volume ({SelectedCoin?.quote_currency}) </div>
                                                        <div className="headline_title__x1csO font-weight-boldd">

                                                            {parseFloat((SelectedCoin?.volumeQuote)?.toFixed(2)) || "0.00"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="trade_card trade_chart p-0"  >
                                <div className="treade_card_header tch_main_tab">
                                    <div className={`card_header_title  cursor-pointer ${showTab === "chart" && "active"}`} onClick={() => setShowTab("chart")}> Chart  </div>
                                    {/* <div className={`card_header_title  cursor-pointer ${showTab === "token_info" && "active"}`} onClick={() => { getDescAndLink(); setShowTab("token_info") }}> Token Info  </div> */}
                                    <div className={`card_header_title  cursor-pointer d-lg-none ${showTab === "order_book" && "active"}`} onClick={() => setShowTab("order_book")}> Order Book  </div>
                                    <div className={`card_header_title  cursor-pointer d-lg-none ${showTab === "trade_history" && "active"}`} onClick={() => setShowTab("trade_history")}> Market Trades </div>
                                    <div className={`card_header_title  cursor-pointer d-lg-none ${showTab === "wallets" && "active"}`} onClick={() => setShowTab("wallets")}> Wallets </div>

                                </div>
                                {/* tab 1 */}
                                <div id="tab_1" className={`cc_tab ${showTab !== "chart" && "d-none"}`} >
                                    {SelectedCoin?.base_currency && (
                                        <TVChartContainer symbol={`${SelectedCoin?.base_currency}/${SelectedCoin?.quote_currency}`} />
                                    )}
                                </div>


                                {/* tab 2 */}
                                <div id="tab_2" className={`cc_tab ${showTab !== "token_info" && "d-none"}`} >
                                    <div className="inf_row scroll_y" >
                                        <div className="headline_symbolName__KfmIZ mt_tr_pr cursor-pointer">
                                            <div className="headline_bigName__dspVW me-2">
                                                <img alt="" src={ApiConfig.baseImage + SelectedCoin?.icon_path} width="24" className="img-fluid round_img" />
                                            </div>
                                            <div>
                                                <div className="headline_bigName__dspVW ">
                                                    <h1> {SelectedCoin?.base_currency_fullname || "N/A"}</h1>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row g-2 g-md-4 " >
                                            <div className="col-lg-6" >
                                                <ul className="infor_row"  >

                                                    <li>
                                                        Total Supply <span>{desAndLinks?.total_supply || "N/A"}</span>
                                                    </li>
                                                    <li>
                                                        Circulating Supply <span>{desAndLinks?.circulating_supply || "N/A"}</span>
                                                    </li>
                                                    <li>
                                                        Volume <span>{SelectedCoin?.volumeQuote?.toFixed(2) || "N/A"} {SelectedCoin?.quote_currency || "N/A"}</span>
                                                    </li>

                                                    <li>
                                                        Issue Date   <span>{desAndLinks?.issueDate || "N/A"}</span>
                                                    </li>
                                                    {desAndLinks?.links?.length > 0 && desAndLinks?.links?.map((item) => {

                                                        return (
                                                            <li>
                                                                <a href={item?.description} target="_blank" rel="noreferrer">  {item?.name}   </a>
                                                            </li>
                                                        )
                                                    })}

                                                </ul>
                                            </div>
                                            <div className=" col-lg-6 t_info" >
                                                <h5>Information</h5>
                                                <p>
                                                    {desAndLinks?.description || ""}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-12 col-xl-4 col-xxl-4 mmn_btm_minus_spc" >
                            <div className="row g-1 g-md-2 px-1 px-md-0" >
                                <div className="col-lg-6" >

                                    {/* tab 3 content is here - Order Book */}
                                    <div id="tab_3" className={`trade_card orderbook_two d-lg-block ${showTab !== "order_book" ? "d-none" : ""}`}>
                                        <div className="treade_card_header d-none d-lg-flex">
                                            <div className={`card_header_title cursor-pointer ${orderBookActiveTab === "orderbook" ? "active" : ""}`} onClick={() => setOrderBookActiveTab("orderbook")}>Order Book</div>
                                            <div className={`card_header_title cursor-pointer ${orderBookActiveTab === "tradehistory" ? "active" : ""}`} onClick={() => setOrderBookActiveTab("tradehistory")}>Market Trades</div>
                                        </div>

                                        {(orderBookActiveTab === "orderbook" || showTab === "order_book") && (
                                            <div className="orderbooktab">

                                                {/* TABS */}
                                                <div className="trade_tabs buy_sell_cards buy_sell_row d-flex-between">
                                                    <ul className="nav custom-tabs nav_order">
                                                        <li className="fav-tab">
                                                            <a className="active" data-bs-toggle="tab" href="#all_orders">
                                                                <img src="/images/order_1.svg" alt="" width="22" height="11" />
                                                            </a>
                                                        </li>
                                                        <li className="usdt-tab">
                                                            <a data-bs-toggle="tab" href="#buy_orders">
                                                                <img src="/images/order_2.svg" alt="" width="22" height="11" />
                                                            </a>
                                                        </li>
                                                        <li className="btc-tab">
                                                            <a data-bs-toggle="tab" href="#sell_orders">
                                                                <img src="/images/order_3.svg" alt="" width="22" height="11" />
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div className="tab-content buy_sell_row_price">

                                                    {/* ================= ALL ORDERS ================= */}
                                                    <div className="tab-pane fade show active px-0" id="all_orders">
                                                        <div className="price_card">

                                                            {/* SELL ORDERS */}
                                                            <div className="price_card_body2">
                                                                <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bs-body-bg, #12121a)', display: 'table-header-group' }}>
                                                                        <tr>
                                                                            <th style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Price ({SelectedCoin?.quote_currency})</th>
                                                                            <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Quantity ({SelectedCoin?.base_currency})</th>
                                                                            <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Total ({SelectedCoin?.quote_currency})</th>
                                                                        </tr>
                                                                    </thead>
                                                                </table>
                                                            </div>
                                                            <div className="price_card_body scroll_y scroll_y_reverse" style={{ position: 'relative', minHeight: '200px' }}>
                                                                {loader ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
                                                                        <div className="spinner-border" style={{ width: '1.5rem', height: '1.5rem', borderColor: 'rgba(255, 255, 255, 0.3)', borderRightColor: 'transparent' }} />
                                                                    </div>
                                                                ) : (
                                                                    <table className="table table-sm table-borderless mb-0 orderbook-table" style={{ width: '100%' }}>
                                                                        <tbody>
                                                                            {SellOrders?.length > 0 ? (
                                                                                SellOrders.map((data, index) => {
                                                                                    const fill = maxSellVolume
                                                                                        ? Math.min((data.remaining / maxSellVolume) * 100, 100)
                                                                                        : 0;

                                                                                    return (
                                                                                        <tr
                                                                                            key={index}
                                                                                            style={{
                                                                                                cursor: "pointer",
                                                                                                background: `linear-gradient(to left, ${orderBookColor?.sell} ${fill}%, transparent ${fill}%)`
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                setbuyamount(formatQuantity(data.quantity));
                                                                                                infoPlaceOrder !== "MARKET" && setbuyOrderPrice(formatPrice(data.price));
                                                                                            }}
                                                                                        >
                                                                                            <td className="text-danger">{formatPrice(data.price)}</td>
                                                                                            <td className="text-end">{formatQuantity(data.remaining)}</td>
                                                                                            <td className="text-danger text-end">
                                                                                                {formatPrice(data.price * data.remaining)}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <tr>
                                                                                    <td colSpan="3" className="text-center text-muted py-4">
                                                                                        No sell orders
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>

                                                            <div className="mrkt_trde_tab justify-content-center">
                                                                <b className={isPricePositive ? "text-green" : "text-danger"}>
                                                                    {formatPrice(buyprice)}
                                                                </b>
                                                                <i className={`ri-arrow-${isPricePositive ? "up" : "down"}-line ri-xl mx-3 ${isPricePositive ? "text-green" : "text-danger"}`} />
                                                                <span>{parseFloat(priceChange||0?.toFixed(2))}%</span>
                                                            </div>

                                                            {/* BUY ORDERS */}
                                                            <div className="price_card_body scroll_y" style={{ position: 'relative', minHeight: '200px' }}>
                                                                {loader ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
                                                                        <div className="spinner-border" style={{ width: '1.5rem', height: '1.5rem', borderColor: 'rgba(255, 255, 255, 0.3)', borderRightColor: 'transparent' }} />
                                                                    </div>
                                                                ) : (
                                                                    <table className="table table-sm table-borderless mb-0 orderbook-table" style={{ width: '100%' }}>
                                                                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bs-body-bg, #12121a)' }}>
                                                                            <tr>
                                                                                <th style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Price ({SelectedCoin?.quote_currency})</th>
                                                                                <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Quantity ({SelectedCoin?.base_currency})</th>
                                                                                <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Total ({SelectedCoin?.quote_currency})</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {BuyOrders?.length > 0 ? (
                                                                                BuyOrders.map((data, index) => {
                                                                                    const fill = maxBuyVolume
                                                                                        ? Math.min((data.remaining / maxBuyVolume) * 100, 100)
                                                                                        : 0;

                                                                                    return (
                                                                                        <tr
                                                                                            key={index}
                                                                                            style={{
                                                                                                cursor: "pointer",
                                                                                                background: `linear-gradient(to left, ${orderBookColor?.buy} ${fill}%, transparent ${fill}%)`
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                setsellAmount(formatQuantity(data.remaining));
                                                                                                infoPlaceOrder !== "MARKET" && setsellOrderPrice(formatPrice(data.price));
                                                                                            }}
                                                                                        >
                                                                                            <td className="text-green">{formatPrice(data.price)}</td>
                                                                                            <td className="text-end">{formatQuantity(data.remaining)}</td>
                                                                                            <td className="text-green text-end">
                                                                                                {formatPrice(data.price * data.remaining)}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <tr>
                                                                                    <td colSpan="3" className="text-center text-muted py-4">
                                                                                        No buy orders
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ================= BUY ONLY ================= */}
                                                    <div className="tab-pane fade px-0" id="buy_orders">
                                                        <div className="price_card">
                                                            <div className="price_card_body scroll_y" style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                                                <table className="table table-sm table-borderless mb-0 orderbook-table" style={{ width: '100%' }}>
                                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bs-body-bg, #12121a)', display: 'table-header-group' }}>
                                                                        <tr>
                                                                            <th style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Price</th>
                                                                            <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Quantity</th>
                                                                            <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {BuyOrders?.map((data, index) => {
                                                                            const fill = maxBuyVolume
                                                                                ? Math.min((data.remaining / maxBuyVolume) * 100, 100)
                                                                                : 0;

                                                                            return (
                                                                                <tr
                                                                                    key={index}
                                                                                    style={{
                                                                                        cursor: "pointer",
                                                                                        background: `linear-gradient(to left, ${orderBookColor?.buy} ${fill}%, transparent ${fill}%)`
                                                                                    }}
                                                                                    onClick={() => {
                                                                                        setsellAmount(formatQuantity(data.remaining));
                                                                                        infoPlaceOrder !== "MARKET" && setsellOrderPrice(formatPrice(data.price));
                                                                                    }}
                                                                                >
                                                                                    <td className="text-green">{formatPrice(data.price)}</td>
                                                                                    <td className="text-end">{formatQuantity(data.remaining)}</td>
                                                                                    <td className="text-green text-end">
                                                                                        {formatPrice(data.price * data.remaining)}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ================= SELL ONLY ================= */}
                                                    <div className="tab-pane fade px-0" id="sell_orders">
                                                        <div className="price_card">
                                                            <div className="price_card_body scroll_y" style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                                                <table className="table table-sm table-borderless mb-0 orderbook-table" style={{ width: '100%' }}>
                                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bs-body-bg, #12121a)', display: 'table-header-group' }}>
                                                                        <tr>
                                                                            <th style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Price</th>
                                                                            <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Quantity</th>
                                                                            <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {SellOrders?.map((data, index) => {
                                                                            const fill = maxSellVolume
                                                                                ? Math.min((data.remaining / maxSellVolume) * 100, 100)
                                                                                : 0;

                                                                            return (
                                                                                <tr
                                                                                    key={index}
                                                                                    style={{
                                                                                        cursor: "pointer",
                                                                                        background: `linear-gradient(to left, ${orderBookColor?.sell} ${fill}%, transparent ${fill}%)`
                                                                                    }}
                                                                                    onClick={() => {
                                                                                        setbuyamount(formatQuantity(data.remaining));
                                                                                        infoPlaceOrder !== "MARKET" && setbuyOrderPrice(formatPrice(data.price));
                                                                                    }}
                                                                                >
                                                                                    <td className="text-danger">{formatPrice(data.price)}</td>
                                                                                    <td className="text-end">{formatQuantity(data.remaining)}</td>
                                                                                    <td className="text-danger text-end">
                                                                                        {formatPrice(data.price * data.remaining)}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        )}


                                        {(orderBookActiveTab === "tradehistory" && showTab !== "order_book") && (
                                            <div className="trade_history_tab">

                                                <div className="table-responsive" style={{ position: 'relative', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                                    <table className="table table-sm table-borderless mb-0 orderbook-table" style={{ width: '100%' }}>
                                                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bs-body-bg, #12121a)', display: 'table-header-group' }}>
                                                            <tr>
                                                                <th className="text-start" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>
                                                                    Price ({SelectedCoin?.quote_currency})
                                                                </th>
                                                                <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>
                                                                    Quantity ({SelectedCoin?.base_currency})
                                                                </th>
                                                                <th className="text-end" style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg, #12121a)' }}>
                                                                    Time
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody className="price_card_body">
                                                            {RecentTrade?.length > 0 ? (
                                                                RecentTrade.map((item, index) => (
                                                                    <tr key={index}>
                                                                        <td
                                                                            className={
                                                                                item?.side === "BUY"
                                                                                    ? "text-green text-start"
                                                                                    : "text-danger text-start"
                                                                            }
                                                                        >
                                                                            {parseFloat(item?.price || 0)}
                                                                        </td>

                                                                        <td className="text-end">
                                                                            {parseFloat(item?.quantity || 0)}
                                                                        </td>

                                                                        <td className="text-end">
                                                                            {item?.time || "---"}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr rowSpan="5" className="no-data-row">
                      <td colSpan="12">
                        <div className="no-data-wrapper">
                          <div className="no_data_s">
                            <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                          </div>
                        </div>
                      </td>
                    </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                            </div>
                                        )}









                                    </div>
                                </div>

                                {/* Market Trades - Mobile Only (when trade_history tab is active) */}
                                <div className="col-lg-6 d-lg-none">
                                    <div id="tab_mobile_trade_history" className={`trade_card orderbook_two ${showTab !== "trade_history" ? "d-none" : ""}`}>
                                        <div className="trade_history_tab">
                                            <div className="table-responsive">
                                                <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-start">
                                                                Price ({SelectedCoin?.quote_currency})
                                                            </th>
                                                            <th className="text-end">
                                                                Quantity ({SelectedCoin?.base_currency})
                                                            </th>
                                                            <th className="text-end">
                                                                Time
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="price_card_body">
                                                        {RecentTrade?.length > 0 ? (
                                                            RecentTrade.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td
                                                                        className={
                                                                            item?.side === "BUY"
                                                                                ? "text-green text-start"
                                                                                : "text-danger text-start"
                                                                        }
                                                                    >
                                                                        {parseFloat(item?.price || 0)}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {parseFloat(item?.quantity || 0)}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {item?.time || "---"}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr rowSpan="5" className="no-data-row">
                                                            <td colSpan="12">
                                                              <div className="no-data-wrapper">
                                                                <div className="no_data_s">
                                                                  <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                                </div>
                                                              </div>
                                                            </td>
                                                          </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallets - Mobile Only (when wallets tab is active) */}
                                <div className="col-lg-6 d-lg-none">
                                    <div className="assets_right mobile_assets_right">
                                        <div id="tab_4_mobile" className={`trade_card orderbook_two ${showTab !== "wallets" ? "d-none" : ""}`}>
                                            <div className="assets_list">
                                                <div className="top_heading"><h4>Spot Wallets<i class="ri-refresh-line cursor-pointer" onClick={() => fetchSpotWallets()}></i></h4><Link className="more_btn" to="/user_profile/asset_overview"><i className="ri-exchange-funds-fill"></i> Transfer</Link></div>

                                                <div className="assets_btn">
                                                    <button><Link to="/asset_managemnet/deposit">Deposit</Link></button>
                                                    <button><Link to="/asset_managemnet/withdraw">Withdrawal</Link></button>
                                                </div>
                                            </div>
                                            <div className="price_card">
                                                <div className="table-responsive price_card_body scroll_y scroll_y_mt">
                                                    {!token ? (
                                                        <div className="no-data-wrapper" style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                            <div className="no_data_s">
                                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                                <p className=" mt-2">Please login to view your wallets</p>
                                                                <Link to="/login" className="btn btn-primary btn-sm mt-2">Login</Link>
                                                            </div>
                                                        </div>
                                                    ) : walletsLoading ? (
                                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                                                            <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem' }} />
                                                        </div>
                                                    ) : (
                                                        <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Asset</th>
                                                                    <th className="text-end">Balance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {spotWallets?.length > 0 ? (
                                                                    spotWallets.map((wallet, index) => (
                                                                        <tr key={wallet?._id || index}>
                                                                            <td>
                                                                                <div className="d-flex align-items-center">
                                                                                    <img 
                                                                                        src={ApiConfig?.baseImage + wallet?.icon_path} 
                                                                                        alt={wallet?.short_name} 
                                                                                        width="24" 
                                                                                        height="24" 
                                                                                        className="me-2 rounded-circle"
                                                                                        onError={(e) => { e.target.src = '/images/coin_placeholder.png'; }}
                                                                                    />
                                                                                    <span>{wallet?.short_name}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="text-end">
                                                                                {parseFloat((wallet?.balance || 0).toFixed(8))}
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr className="no-data-row">
                                                                        <td colSpan="2">
                                                                            <div className="no-data-wrapper" style={{ padding: '20px', textAlign: 'center' }}>
                                                                                <div className="no_data_s">
                                                                                    <img src="/images/no_data_vector.svg" className="img-fluid" width="64" height="64" alt="" />
                                                                                    <p className="text-muted mt-2 mb-0" style={{ fontSize: '12px' }}>No assets in spot wallet</p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <div className="bs_tab_row d-lg-none" >
                                        <div className="row gx-3" >
                                            <div className="col-6" >
                                                <button className="btn btn-success  btn-block w-100" onClick={() => setShowBuySellTab("buy")}>
                                                    <span>Buy</span>
                                                </button>
                                            </div>
                                            <div className="col-6" >

                                                <button className="btn btn-danger btn-block w-100" onClick={() => setShowBuySellTab("sell")}>
                                                    <span>Sell</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* buy sell dropbox is here */}
                                    <div className={`bs_dropbox d-lg-block ${!showBuySellTab && "d-none"}`} >
                                        <div className="row">
                                            <div className="col-lg-6">
                                                <div className="d-flex bottm_lightbox_two">
                                                    <div id="tab_3" className={`trade_card d-lg-block summay_dasboard_pop ${showTab !== "order_book" && "d-block"}`}>
                                                        <div className="treade_card_header d-block d-lg-flex"><div className="card_header_title active">Order Book</div></div>
                                                        <div className=" trade_tabs buy_sell_cards  buy_sell_row d-flex-between">
                                                            <ul className="nav custom-tabs nav_order">
                                                                <li className="fav-tab"><a className="active" data-bs-toggle="tab" href="#all_orders"> <img alt='' src="/images/order_1.svg" width="22" height="11" />   </a></li>

                                                                <li className="usdt-tab">
                                                                    <a data-bs-toggle="tab" href="#buy_orders">
                                                                        <img alt='' src="/images/order_2.svg" width="22" height="11" />
                                                                    </a>
                                                                </li>
                                                                <li className="btc-tab">
                                                                    <a data-bs-toggle="tab" href="#sell_orders" className="me-0">
                                                                        <img alt='' src="/images/order_3.svg" width="22" height="11" />
                                                                    </a>
                                                                </li>
                                                            </ul>
                                                            <div className='num-div' >
                                                                <select className="form-select num-select p-0 input-select cursor-pointer" aria-label="Default select example" onClick={(e) => { setpriceDecimal(e.target.value) }}>
                                                                    <option value={8}>
                                                                        0.00000001
                                                                    </option>
                                                                    <option value={7}>
                                                                        0.0000001
                                                                    </option>
                                                                    <option value={6}>
                                                                        0.000001
                                                                    </option>
                                                                    <option value={5}>
                                                                        0.00001
                                                                    </option>
                                                                    <option value={4}>
                                                                        0.0001
                                                                    </option>
                                                                    <option value={3}>
                                                                        0.001
                                                                    </option>
                                                                    <option value={2}>
                                                                        0.01
                                                                    </option>
                                                                    <option value={1}>
                                                                        0.1
                                                                    </option>

                                                                </select>
                                                            </div>
                                                            {/* </div> */}
                                                        </div>
                                                        <div className="tab-content buy_sell_row_price">

                                                            {/* ================= ALL ORDERS ================= */}
                                                            <div className="tab-pane fade px-0 active show" id="all_orders">
                                                                <div className="price_card">

                                                                    {/* SELL ORDERS */}
                                                                    <div className="table-responsive">
                                                                        <div className="price_card_body scroll_y scroll_y_reverse">
                                                                            <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Price ({SelectedCoin?.quote_currency})</th>
                                                                                        <th className="text-end">
                                                                                            Quantity ({SelectedCoin?.base_currency})
                                                                                        </th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {loader ? (
                                                                                        <tr>
                                                                                            <td colSpan="2" className="text-center py-4">
                                                                                                <div className="spinner-border" style={{ width: '1.5rem', height: '1.5rem', borderColor: 'rgba(255, 255, 255, 0.3)', borderRightColor: 'transparent' }} />
                                                                                            </td>
                                                                                        </tr>
                                                                                    ) : SellOrders?.length > 0 ? (
                                                                                        SellOrders.map((data, index) => {
                                                                                            const fill = maxSellVolume
                                                                                                ? Math.min((data.remaining / maxSellVolume) * 100, 100)
                                                                                                : 0;

                                                                                            return (
                                                                                                <tr
                                                                                                    key={index}
                                                                                                    style={{
                                                                                                        cursor: "pointer",
                                                                                                        background: `linear-gradient(to left, ${orderBookColor?.sell} ${fill}%, transparent ${fill}%)`
                                                                                                    }}
                                                                                                    onClick={() => {
                                                                                                        setbuyamount(formatQuantity(data.remaining));
                                                                                                        infoPlaceOrder !== "MARKET" && setbuyOrderPrice(formatPrice(data.price));
                                                                                                    }}
                                                                                                >
                                                                                                    <td className="text-danger">
                                                                                                        {formatPrice(data.price)}
                                                                                                    </td>
                                                                                                    <td className="text-end">
                                                                                                        {formatQuantity(data.remaining)}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        })
                                                                                    ) : (
                                                                                        <tr>
                                                                                            <td colSpan="2" className="text-center text-muted py-4">
                                                                                                No sell orders
                                                                                            </td>
                                                                                        </tr>
                                                                                    )}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>

                                                                    {/* MARKET PRICE */}
                                                                    <div className="mrkt_trde_tab justify-content-center">
                                                                        <b className={isPricePositive ? "text-green" : "text-danger"}>
                                                                            {formatPrice(buyprice)}
                                                                        </b>
                                                                        <i
                                                                            className={
                                                                                isPricePositive
                                                                                    ? "ri-arrow-up-line ri-xl mx-3 text-green"
                                                                                    : "ri-arrow-down-line ri-xl mx-3 text-danger"
                                                                            }
                                                                        />
                                                                        <span>{parseFloat(priceChange||0?.toFixed(2))}%</span>
                                                                    </div>

                                                                    {/* BUY ORDERS */}
                                                                    <div className="price_card_body scroll_y">
                                                                        <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                                            <tbody>
                                                                                {loader ? (
                                                                                    <tr>
                                                                                        <td colSpan="2" className="text-center py-4">
                                                                                            <div className="spinner-border" style={{ width: '1.5rem', height: '1.5rem', borderColor: 'rgba(255, 255, 255, 0.3)', borderRightColor: 'transparent' }} />
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : BuyOrders?.length > 0 ? (
                                                                                    BuyOrders.map((data, index) => {
                                                                                        const fill = maxBuyVolume
                                                                                            ? Math.min((data.remaining / maxBuyVolume) * 100, 100)
                                                                                            : 0;

                                                                                        return (
                                                                                            <tr
                                                                                                key={index}
                                                                                                style={{
                                                                                                    cursor: "pointer",
                                                                                                    background: `linear-gradient(to left, ${orderBookColor?.buy} ${fill}%, transparent ${fill}%)`
                                                                                                }}
                                                                                                onClick={() => {
                                                                                                    setsellAmount(formatQuantity(data.remaining));
                                                                                                    infoPlaceOrder !== "MARKET" && setsellOrderPrice(formatPrice(data.price));
                                                                                                }}
                                                                                            >
                                                                                                <td className="text-green">
                                                                                                    {formatPrice(data.price)}
                                                                                                </td>
                                                                                                <td className="text-end">
                                                                                                    {formatQuantity(data.remaining)}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan="2" className="text-center text-muted py-4">
                                                                                            No buy orders
                                                                                        </td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* ================= BUY ONLY ================= */}
                                                            <div className="tab-pane fade px-0" id="buy_orders">
                                                                <div className="price_card">
                                                                    <div className="price_card_body scroll_y center_cntr">
                                                                        <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Price</th>
                                                                                    <th className="text-end">Quantity</th>
                                                                                    <th className="text-end">Total</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {BuyOrders?.length > 0 ? (
                                                                                    BuyOrders.map((data, index) => {
                                                                                        const fill = maxBuyVolume
                                                                                            ? Math.min((data.remaining / maxBuyVolume) * 100, 100)
                                                                                            : 0;

                                                                                        return (
                                                                                            <tr
                                                                                                key={index}
                                                                                                style={{
                                                                                                    cursor: "pointer",
                                                                                                    background: `linear-gradient(to left, ${orderBookColor?.buy} ${fill}%, transparent ${fill}%)`
                                                                                                }}
                                                                                                onClick={() => {
                                                                                                    setsellAmount(formatQuantity(data.remaining));
                                                                                                    infoPlaceOrder !== "MARKET" && setsellOrderPrice(formatPrice(data.price));
                                                                                                }}
                                                                                            >
                                                                                                <td className="text-green">{formatPrice(data.price)}</td>
                                                                                                <td className="text-end">{formatQuantity(data.remaining)}</td>
                                                                                                <td className="text-green text-end">
                                                                                                    {formatPrice(data.price * data.remaining)}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan="3" className="text-center">No data available</td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* ================= SELL ONLY ================= */}
                                                            <div className="tab-pane fade px-0" id="sell_orders">
                                                                <div className="price_card">
                                                                    <div className="price_card_body scroll_y center_cntr">
                                                                        <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Price</th>
                                                                                    <th className="text-end">Quantity</th>
                                                                                    <th className="text-end">Total</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {SellOrders?.length > 0 ? (
                                                                                    SellOrders.map((data, index) => {
                                                                                        const fill = maxSellVolume
                                                                                            ? Math.min((data.remaining / maxSellVolume) * 100, 100)
                                                                                            : 0;

                                                                                        return (
                                                                                            <tr
                                                                                                key={index}
                                                                                                style={{
                                                                                                    cursor: "pointer",
                                                                                                    background: `linear-gradient(to left, ${orderBookColor?.sell} ${fill}%, transparent ${fill}%)`
                                                                                                }}
                                                                                                onClick={() => {
                                                                                                    setbuyamount(formatQuantity(data.remaining));
                                                                                                    infoPlaceOrder !== "MARKET" && setbuyOrderPrice(formatPrice(data.price));
                                                                                                }}
                                                                                            >
                                                                                                <td className="text-danger">{formatPrice(data.price)}</td>
                                                                                                <td className="text-end">{formatQuantity(data.remaining)}</td>
                                                                                                <td className="text-danger text-end">
                                                                                                    {formatPrice(data.price * data.remaining)}
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    })
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan="3" className="text-center">No data available</td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>

                                                    </div>

                                                    <div className="trade_card trade_chart  buysell_card buysell_two">
                                                        <div className="treade_card_header buysell_heder d-block ">
                                                            <div className="bs_box_header d-lg-none" >
                                                                <h6>
                                                                    Trade
                                                                </h6>
                                                                <span className="cursor-pointer" onClick={() => setShowBuySellTab("")}>
                                                                    <i className="ri-close-line"></i>
                                                                </span>
                                                            </div>
                                                            <ul className="nav custom-tabs padding-0">
                                                                <li className="buysell-tab buy-tab"><a href="#/" className={`${(showBuySellTab === "buy" || !showBuySellTab) ? "active" : ""}`} onClick={() => setShowBuySellTab("buy")}><button><span>Buy</span></button></a></li>
                                                                <li className="  sell-tab"><a href="#/" className={`${showBuySellTab === "sell" ? "active" : ""}`} onClick={() => setShowBuySellTab("sell")}><button><span>Sell</span></button></a></li>
                                                            </ul>
                                                        </div>
                                                        <div className=" p-2 p-md-3" >
                                                            <div className="col-md-12 mb-3">
                                                                <div className="spot_limit d-flex align-items-center gap-4" >
                                                                    <button onClick={() => setinfoPlaceOrder("LIMIT")} className={`${infoPlaceOrder === "LIMIT" ? "active" : ""}`}>Limit</button>
                                                                    <button onClick={() => setinfoPlaceOrder("MARKET")} className={`${infoPlaceOrder === "MARKET" ? "active" : ""}`}>Market</button>
                                                                    {/* <select className=" mb-0 form-select-sm" name="infoPlaceOrder" onChange={handleOrderType} value={infoPlaceOrder}>
                                                                        <option value="LIMIT" >Limit</option>
                                                                        <option value="MARKET">Market</option>
                                                                    </select> */}
                                                                </div>
                                                            </div>
                                                            <div className="tab-content" >
                                                                <div className={`tab-pane px-0 ${(showBuySellTab === "buy" || !showBuySellTab) ? "show active" : ''}`} id="buytab" >
                                                                    <form action="" className="buysellform data-buy">
                                                                        <div className="actions_balance__kTHO0">
                                                                            <span className="actions_primaryText__ufKT0"> Available Balance: </span>
                                                                            <div>
                                                                                <span> {BuyCoinBal ? parseFloat((BuyCoinBal).toFixed(8)) : "0.00"}</span>
                                                                                <span className="text ms-1">{SelectedCoin?.quote_currency}</span>
                                                                                <Link className="actions_deposit__Ydutk" to={token ? '/asset_managemnet/deposit' : '/login'}>
                                                                                    <i className="ri-add-circle-fill"></i>
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group  mb-3" >
                                                                            <label>Price</label>
                                                                            <div className="input-group">
                                                                                {infoPlaceOrder === 'MARKET' ? <input type="text" className="form-control" value={"---Best Market Price---"} readOnly /> : <input type="text" className="form-control" disabled={infoPlaceOrder === 'MARKET'} value={buyOrderPrice !== '' ? buyOrderPrice : formatTotal(buyprice || 0)}
                                                                                    step={SelectedCoin?.tick_size || 0.01}
                                                                                    min={SelectedCoin?.tick_size || 0.01}
                                                                                    onChange={(e) => handlePriceInput(e.target.value, setbuyOrderPrice)}
                                                                                    onBlur={(e) => handlePriceBlur(e.target.value, setbuyOrderPrice)}
                                                                                />}

                                                                                <span className="input-group-text text-start"><small>  {SelectedCoin?.quote_currency}</small></span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group  mb-3" >
                                                                            <label>Amount</label>
                                                                            <div className="input-group ">
                                                                                <input type="text" aria-invalid="true" className="form-control" value={buyamount}
                                                                                    step={SelectedCoin?.step_size || 0.00001}
                                                                                    min={SelectedCoin?.step_size || 0.00001}
                                                                                    onChange={(e) => handleQuantityInput(e.target.value, setbuyamount)}
                                                                                    onBlur={(e) => handleQuantityBlur(e.target.value, setbuyamount)}
                                                                                />
                                                                                <span className="input-group-text text-start"><small> {SelectedCoin?.base_currency}</small></span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group  mb-3" >
                                                                            <label>Total</label>
                                                                            <div className="input-group  ">
                                                                                <input type="text" className="form-control" value={
                                                                                    (buyOrderPrice !== '' && buyOrderPrice && buyamount) ? formatTotal(+buyOrderPrice * +buyamount) :
                                                                                        (buyprice && buyamount) ? formatTotal(+buyprice * +buyamount) : formatTotal(0)
                                                                                } readOnly />
                                                                                <span className="input-group-text text-start"><small>Total</small></span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group" >
                                                                            <div className="btn-group btn-group-mini  mb-3 process_step" role="group" aria-label="Basic radio toggle button group">

                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio125" autoComplete="off" checked={activeBuyPercent === 25} readOnly />
                                                                                <label className={`btn btn-outline-success ${activeBuyPercent === 25 ? 'active' : ''}`} htmlFor="btnradio125" onClick={() => { setActiveBuyPercent(25); setbuyamount(toFixed8(((BuyCoinBal / 100) * 25) / (buyOrderPrice !== '' && buyOrderPrice ? buyOrderPrice : buyprice))) }} >25%</label>
                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio250" autoComplete="off" checked={activeBuyPercent === 50} readOnly />
                                                                                <label className={`btn btn-outline-success ${activeBuyPercent === 50 ? 'active' : ''}`} htmlFor="btnradio250" onClick={() => { setActiveBuyPercent(50); setbuyamount(toFixed8(((BuyCoinBal / 100) * 50) / (buyOrderPrice !== '' && buyOrderPrice ? buyOrderPrice : buyprice))) }}>50%</label>
                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio375" autoComplete="off" checked={activeBuyPercent === 75} readOnly />
                                                                                <label className={`btn btn-outline-success ${activeBuyPercent === 75 ? 'active' : ''}`} htmlFor="btnradio375" onClick={() => { setActiveBuyPercent(75); setbuyamount(toFixed8(((BuyCoinBal / 100) * 75) / (buyOrderPrice !== '' && buyOrderPrice ? buyOrderPrice : buyprice))) }}>75%</label>
                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio3100" autoComplete="off" checked={activeBuyPercent === 100} readOnly />
                                                                                <label className={`btn btn-outline-success last-child ${activeBuyPercent === 100 ? 'active' : ''}`} htmlFor="btnradio3100" onClick={() => { setActiveBuyPercent(100); setbuyamount(toFixed8(((BuyCoinBal)) / (buyOrderPrice !== '' && buyOrderPrice ? buyOrderPrice : buyprice))) }}>100%</label>
                                                                            </div>
                                                                        </div>

                                                                        {/* <small className="mb-2">Minimal Buy : 10 USDT</small> */}
                                                                        <>
                                                                            {token ?
                                                                                KycStatus === 0 || KycStatus === 1 || KycStatus === 3 ?
                                                                                    <Link to={KycStatus === 1 ? "" : '/user_profile/kyc'
                                                                                    } className={`btn custom-btn btn-success btn-mini  w-100 my-3 my-md-0`}>
                                                                                        {KycStatus === 1 ? "Verification Pending" : KycStatus === 0 ? "Submit Kyc" : "Kyc Rejected Verify Again"}
                                                                                    </Link> :
                                                                                    <button type='button' className="btn custom-btn btn-success btn-mini  w-100 my-3 my-md-0"
                                                                                        onClick={() => handleOrderPlace(infoPlaceOrder, buyOrderPrice !== '' && buyOrderPrice ? buyOrderPrice : buyprice, buyamount, SelectedCoin?.base_currency_id, SelectedCoin?.quote_currency_id, 'BUY')}>
                                                                                        Buy {SelectedCoin?.base_currency}
                                                                                    </button>
                                                                                :
                                                                                <div className="order-btns my-2" >
                                                                                    <button type='button' className="btn custom-btn btn-success btn-mini  w-100 my-3 my-md-0"
                                                                                        onClick={() => navigate("/login")}>
                                                                                        Login
                                                                                    </button>

                                                                                </div>
                                                                            }


                                                                        </>
                                                                    </form>
                                                                </div>
                                                                <div className={`tab-pane px-0 ${showBuySellTab === "sell" ? "show active" : ""}`} id="selltab" >
                                                                    <form action="" className="buysellform data-sell">
                                                                        <div className="actions_balance__kTHO0">
                                                                            <span className="actions_primaryText__ufKT0"> Available Balance: </span>
                                                                            <div>
                                                                                <span>{SellCoinBal ? SellCoinBal?.toFixed(9) : "0.00"} {" "}
                                                                                </span>
                                                                                <span className="text ms-1">{SelectedCoin?.base_currency}</span>
                                                                                <Link className="actions_deposit__Ydutk" to={token ? '/asset_managemnet/deposit' : '/login'}>
                                                                                    <i className="ri-add-circle-fill"></i>
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group  mb-3" >
                                                                            <label>Price</label>
                                                                            <div className="input-group ">
                                                                                {infoPlaceOrder === 'MARKET' ? <input type="text" className="form-control" value={"Best Market Price"} readOnly />
                                                                                    :
                                                                                    <input type="text" className="form-control" aria-label="Amount (to the nearest dollar)" value={sellOrderPrice !== '' ? sellOrderPrice : formatTotal(sellPrice || 0)}
                                                                                        step={SelectedCoin?.tick_size || 0.01}
                                                                                        min={SelectedCoin?.tick_size || 0.01}
                                                                                        onChange={(e) => handlePriceInput(e.target.value, setsellOrderPrice)}
                                                                                        onBlur={(e) => handlePriceBlur(e.target.value, setsellOrderPrice)}
                                                                                        disabled={infoPlaceOrder === 'MARKET'} />}

                                                                                <span className="input-group-text text-start" ><small> {SelectedCoin?.quote_currency}</small></span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group  mb-3" >
                                                                            <label>Amount</label>
                                                                            <div className="input-group ">
                                                                                <input type="text" aria-invalid="true" className="form-control" aria-label="Amount (to the nearest dollar)" value={sellAmount}
                                                                                    step={SelectedCoin?.step_size || 0.00001}
                                                                                    min={SelectedCoin?.step_size || 0.00001}
                                                                                    onChange={(e) => handleQuantityInput(e.target.value, setsellAmount)}
                                                                                    onBlur={(e) => handleQuantityBlur(e.target.value, setsellAmount)}
                                                                                />
                                                                                <span className="input-group-text text-start"><small>{SelectedCoin?.base_currency}</small></span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group  mb-3" >
                                                                            <label>Total</label>
                                                                            <div className="input-group  ">
                                                                                <input type="text" className="form-control" aria-label="Amount (to the nearest dollar)" readOnly value=
                                                                                    {(sellOrderPrice !== '' && sellOrderPrice && sellAmount) ? formatTotal(+sellOrderPrice * +sellAmount) :
                                                                                        (sellPrice && sellAmount) ? formatTotal(+sellPrice * +sellAmount) : formatTotal(0)}

                                                                                />
                                                                                <span className="input-group-text text-start"><small>Total</small></span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="form-group" >
                                                                            <div className="btn-group btn-group-mini process_step  mb-3 " role="group" aria-label="Basic radio toggle button group">
                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio15" autoComplete="off" checked={activeSellPercent === 25} readOnly />
                                                                                <label className={`btn btn-outline-danger ${activeSellPercent === 25 ? 'active' : ''}`} htmlFor="btnradio15" onClick={() => { setActiveSellPercent(25); setsellAmount(toFixed8(SellCoinBal / 100) * 25) }}>25%</label>
                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio20" autoComplete="off" checked={activeSellPercent === 50} readOnly />
                                                                                <label className={`btn btn-outline-danger ${activeSellPercent === 50 ? 'active' : ''}`} htmlFor="btnradio20" onClick={() => { setActiveSellPercent(50); setsellAmount(toFixed8((SellCoinBal / 100) * 50)) }}>50%</label>
                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio35" autoComplete="off" checked={activeSellPercent === 75} readOnly />
                                                                                <label className={`btn btn-outline-danger ${activeSellPercent === 75 ? 'active' : ''}`} htmlFor="btnradio35" onClick={() => { setActiveSellPercent(75); setsellAmount(toFixed8((SellCoinBal / 100) * 75)) }}>75%</label>
                                                                                <input type="radio" className="btn-check" name="btnradio" id="btnradio300" autoComplete="off" checked={activeSellPercent === 100} readOnly />
                                                                                <label className={`btn btn-outline-danger last-child ${activeSellPercent === 100 ? 'active' : ''}`} htmlFor="btnradio300" onClick={() => { setActiveSellPercent(100); setsellAmount(toFixed8(SellCoinBal)) }}>100%</label>
                                                                            </div>
                                                                        </div>
                                                                        {/* <small className="">Minimal Sell: {nineDecimalFormat(10 / SelectedCoin?.buy_price)} {SelectedCoin?.base_currency}</small> */}

                                                                        <>

                                                                            {token ?
                                                                                KycStatus === 0 || KycStatus === 1 || KycStatus === 3 ?
                                                                                    <Link to={KycStatus === 1 ? "" : '/user_profile/kyc'
                                                                                    } className={`btn custom-btn btn-danger btn-mini w-100 my-3 my-md-0`}>
                                                                                        {KycStatus === 1 ? "Verification Pending" : KycStatus === 0 ? "Submit Kyc" : "Kyc Rejected Verify Again"}
                                                                                    </Link> :
                                                                                    <button type='button' className="btn custom-btn btn-danger btn-mini w-100 my-3 my-md-0"
                                                                                        onClick={() => handleOrderPlace(infoPlaceOrder, sellOrderPrice !== '' && sellOrderPrice ? sellOrderPrice : sellPrice, sellAmount, SelectedCoin?.base_currency_id, SelectedCoin?.quote_currency_id, 'SELL')} disabled={!sellAmount || !token || sellAmount === '0'}>
                                                                                        Sell {SelectedCoin?.base_currency}
                                                                                    </button>
                                                                                :
                                                                                <div className="order-btns my-2" >
                                                                                    <button type='button' className="btn custom-btn btn-success btn-mini  w-100 my-3 my-md-0"
                                                                                        onClick={() => navigate("/login")}>
                                                                                        Login
                                                                                    </button>

                                                                                    {/* <Link to='/signup' className="btn  custom-border-btn  custom-border-btn-white  btn-mini w-100  ">
                                                                            Register
                                                                        </Link> */}
                                                                                </div>
                                                                            }

                                                                        </>
                                                                    </form>
                                                                </div>

                                                            </div>


                                                            <div className="freerate">
                                                                <span>Fee rate</span>  Maker 0%/ Taker 0.01%
                                                            </div>

                                                        </div>


                                                        <div className="assets_list">

                                                            <ul>
                                                                <li>Coin<span>Total Assets</span></li>

                                                                <li>{SelectedCoin?.quote_currency}<span>{BuyCoinBal ? BuyCoinBal?.toFixed(9) : "0.00"}</span></li>
                                                                <li>{SelectedCoin?.base_currency}<span>{SellCoinBal ? SellCoinBal?.toFixed(9) : "0.00"}</span></li>
                                                            </ul>

                                                        </div>


                                                    </div>

                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="trade_account_summary_assets">

                            <div className="trade_summary_table_lft mt-0 position_order trade_summary_table_lft_position_order">
                                <div className="top_th_easyop border-0">
                                    <ul className="position_list">
                                        <li className={`nav-item positions ${positionOrderTab === "positions" ? "active" : ""}`} role="presentation">
                                            <button onClick={() => setPositionOrderTab("positions")}>Open Orders</button>
                                        </li>
                                        <li className={`nav-item open ${positionOrderTab === "open" ? "active" : ""}`} role="presentation">
                                            <button onClick={() => setPositionOrderTab("open")}>Order History</button>
                                        </li>

                                    </ul>
                                    <div className={`cnt_table positions ${positionOrderTab === "positions" ? "active" : ""}`}>

                                        <div className="desktop_view2">
                                            <div className="table-responsive" style={{ height: '353px' }}>

                                                <table className="table table_home ">
                                                    <thead>
                                                        <tr>
                                                            <th>Trading Pair</th>
                                                            <th> Date</th>
                                                            <th> Type</th>
                                                            <th> <div className="num-div justify-content-start">
                                                                <select className=" form-select num-select p-0 input-select cursor-pointer" name="" value={orderType} onChange={(e) => { setorderType(e.target.value) }}>
                                                                    <option value="All">All</option>
                                                                    <option value="BUY">Buy</option>
                                                                    <option value="SELL">Sell</option>
                                                                </select>
                                                            </div></th>
                                                            <th> Price</th>
                                                            <th>Amount</th>
                                                            <th>Remaining</th>
                                                            <th>Filled</th>
                                                            <th>Total</th>
                                                            <th> Action </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {openOrders?.length > 0 ? openOrders.map((item, index) =>
                                                            (orderType === item?.side || orderType === 'All') &&
                                                            <tr key={index}>
                                                                <td>{`${SelectedCoin?.base_currency}/${SelectedCoin?.quote_currency}`}</td>
                                                                <td>
                                                                    <small>
                                                                        <div className="c_view justify-content-start" >
                                                                            <span>{moment(item?.updatedAt).format("DD/MM/YYYY  ")}
                                                                                <small>{moment(item?.updatedAt).format("hh:mm")}</small>
                                                                            </span>
                                                                        </div>
                                                                    </small>
                                                                </td>
                                                                <td>{item?.order_type}</td>
                                                                <td>{item?.side}</td>
                                                                <td>{item?.price?.toFixed(8)}</td>
                                                                <td>{item?.quantity?.toFixed(8)}</td>
                                                                <td>{item?.remaining?.toFixed(8)}</td>
                                                                <td>{item?.filled?.toFixed(8)}</td>
                                                                <td>{(item?.price * item?.quantity)?.toFixed(8)}</td>
                                                                <td>
                                                                    <button className="btn text-danger btn-sm btn-icon" type="button" onClick={() => { cancelOrder(item?._id) }}><i className="ri-delete-bin-6-line pr-0"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ) : <tr rowSpan="5" className="no-data-row">
                                                            <td colSpan="12">
                                                                <div className="no-data-wrapper">
                                                                    <div className="no_data_s">
                                                                        <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        }
                                                    </tbody>
                                                </table>

                                            </div>
                                        </div>

                                        <div className='order_history_mobile_view twomobile'>
                                            <div className='d-flex datalist_mbl'>
                                                {openOrders?.length > 0 ? (
                                                    openOrders
                                                        .filter((item) => orderType === item?.side || orderType === 'All')
                                                        .map((item, index) => (
                                                            <div key={item?._id || index} className='order_datalist'>
                                                                <ul className='listdata'>
                                                                    <li>
                                                                        <span className='date'>Date</span>
                                                                        <span className='date_light'>{moment(item?.updatedAt).format("DD/MM/YYYY")}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Time</span>
                                                                        <span>{moment(item?.updatedAt).format("hh:mm")}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Currency Pair</span>
                                                                        <span>{SelectedCoin?.base_currency}/{SelectedCoin?.quote_currency}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Type</span>
                                                                        <span>{item?.order_type}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Side</span>
                                                                        <span>{item?.side}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Price</span>
                                                                        <span>{item?.price?.toFixed(8)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Amount</span>
                                                                        <span>{item?.quantity?.toFixed(8)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Remaining</span>
                                                                        <span>{item?.remaining?.toFixed(8)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Filled</span>
                                                                        <span>{item?.filled?.toFixed(8)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Total</span>
                                                                        <span>{(item?.price * item?.quantity)?.toFixed(8)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Action</span>
                                                                        <span>
                                                                            <button className="btn text-danger btn-sm btn-icon p-0" type="button" onClick={() => cancelOrder(item?._id)}>
                                                                                <i className="ri-delete-bin-6-line pr-0"></i>
                                                                            </button>
                                                                        </span>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="no-data-wrapper w-100">
                                                        <div className="no_data_s">
                                                            <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>

                                    <div className={`cnt_table open ${positionOrderTab === "open" ? "active" : ""}`}>

                                        <div className="desktop_view2">
                                            <div className="table-responsive" style={{ height: '353px' }} >
                                                <table className="table table_home ">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Trading Pair</th>
                                                            <th> <div className="num-div justify-content-start">
                                                                <select className=" form-select num-select p-0 input-select cursor-pointer" value={pastOrderType} onChange={(e) => { setpastOrderType(e.target.value) }}>
                                                                    <option value="All">All</option>
                                                                    <option value="BUY">Buy</option>
                                                                    <option value="SELL">Sell</option>
                                                                </select>
                                                            </div></th>
                                                            <th>Price</th>
                                                            <th>Average</th>
                                                            <th>Quantity</th>
                                                            <th>Remaining</th>
                                                            <th>Total</th>
                                                            <th>Fee</th>
                                                            <th>Order Type</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pastOrders?.length > 0 ? pastOrders.map((item, index) =>
                                                            (item?.side === pastOrderType || pastOrderType === "All") &&
                                                            <>
                                                                <tr key={index} onClick={() => setExpandedRowIndex(expandedRowIndex === index ? null : index)} className="cursor-pointer">
                                                                    <td>

                                                                        <div className="c_view justify-content-start">
                                                                            {item?.executed_prices?.length > 0 && (
                                                                                <p className="ms-2 mx-2 text-xl d-inline text-success">{expandedRowIndex === index ? '▾' : '▸'}</p>
                                                                            )}
                                                                            <span>{moment(item?.updatedAt).format("DD/MM/YYYY")}
                                                                                <small>{moment(item?.updatedAt).format("hh:mm")}</small>
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>{item?.side === "BUY" ? `${item?.ask_currency}/${item?.pay_currency}` : `${item?.pay_currency}/${item?.ask_currency}`}</td>
                                                                    <td>{item?.side}</td>
                                                                    <td>{nineDecimalFormat(item?.price)}</td>
                                                                    <td>{nineDecimalFormat(item?.avg_execution_price)}</td>
                                                                    <td>{nineDecimalFormat(item?.quantity)}</td>
                                                                    <td>{nineDecimalFormat(item?.remaining)}</td>
                                                                    <td>{nineDecimalFormat(item?.quantity * item?.avg_execution_price)}</td>
                                                                    <td>{nineDecimalFormat(item?.total_fee)} {item?.ask_currency}</td>
                                                                    <td>{item?.order_type}</td>
                                                                    <td className={`text-${item?.status === "FILLED" ? "success" : item?.status === "CANCELLED" ? "danger" : "warning"}`}>
                                                                        {item?.status === 'FILLED' ? 'EXECUTED' : item?.status}

                                                                    </td>
                                                                </tr>

                                                                {/* Sub-row for executed trades */}
                                                                {expandedRowIndex === index && item?.executed_prices?.length > 0 && (
                                                                    <tr>
                                                                        <td colSpan="12">
                                                                            <div className='table-responsive bg-dark'>
                                                                                <table className="table table_home   ">
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th>#</th>
                                                                                            <th>Trading price	</th>
                                                                                            <th>Executed</th>
                                                                                            <th>Trading Fee</th>
                                                                                            <th>Total</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {item.executed_prices.map((trade, i) => (
                                                                                            <tr key={i}>
                                                                                                <td>{i + 1}</td>
                                                                                                <td >{nineDecimalFormat(trade.price)} {item?.side === "BUY" ? `${item?.pay_currency}` : `${item?.ask_currency}`}</td>
                                                                                                <td>{nineDecimalFormat(trade.quantity)} {item?.side === "BUY" ? `${item?.ask_currency}` : `${item?.pay_currency}`}</td>
                                                                                                <td>{nineDecimalFormat(+trade.fee)} {item?.ask_currency}</td>
                                                                                                <td>{nineDecimalFormat(+trade.price * trade.quantity)}</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </>

                                                        ) : <tr rowSpan="5" className="no-data-row">
                                                            <td colSpan="12">
                                                                <div className="no-data-wrapper">
                                                                    <div className="no_data_s">
                                                                        <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>}
                                                    </tbody>
                                                </table>

                                            </div>
                                        </div>
                                        <div className='order_history_mobile_view twomobile'>
                                            <div className='d-flex datalist_mbl'>
                                                {pastOrders?.length > 0 ? (
                                                    pastOrders
                                                        .filter((item) => item?.side === pastOrderType || pastOrderType === 'All')
                                                        .map((item, index) => (
                                                            <div key={item?._id || index} className='order_datalist'>
                                                                <ul className='listdata'>
                                                                    <li>
                                                                        <span className='date'>Date</span>
                                                                        <span className='date_light'>{moment(item?.updatedAt).format("DD/MM/YYYY")}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Time</span>
                                                                        <span>{moment(item?.updatedAt).format("hh:mm")}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Currency Pair</span>
                                                                        <span>{item?.side === "BUY" ? `${item?.ask_currency}/${item?.pay_currency}` : `${item?.pay_currency}/${item?.ask_currency}`}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Side</span>
                                                                        <span>{item?.side}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Price</span>
                                                                        <span>{nineDecimalFormat(item?.price)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Average</span>
                                                                        <span>{nineDecimalFormat(item?.avg_execution_price)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Quantity</span>
                                                                        <span>{nineDecimalFormat(item?.quantity)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Remaining</span>
                                                                        <span>{nineDecimalFormat(item?.remaining)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Total</span>
                                                                        <span>{nineDecimalFormat(item?.quantity * item?.avg_execution_price)}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Fee</span>
                                                                        <span>{nineDecimalFormat(item?.total_fee)} {item?.ask_currency}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Order Type</span>
                                                                        <span>{item?.order_type}</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>Status</span>
                                                                        <span className={`text-${item?.status === "FILLED" ? "success" : item?.status === "CANCELLED" ? "danger" : "warning"}`}>
                                                                            {item?.status === 'FILLED' ? 'EXECUTED' : item?.status}
                                                                        </span>
                                                                    </li>
                                                                </ul>

                                                                {item?.executed_prices?.length > 0 && (
                                                                    <div className={`executed_trades_list ${showExecutedTrades[item?._id] ? 'active' : ''}`}>
                                                                        <button onClick={() => setShowExecutedTrades({ ...showExecutedTrades, [item?._id]: !showExecutedTrades[item?._id] })}>
                                                                            <i className={`ri-arrow-drop-down-line ${showExecutedTrades[item?._id] ? 'rotated' : ''}`}></i>Executed Trades
                                                                        </button>
                                                                        {showExecutedTrades[item?._id] && (
                                                                            <div className='executed_trades_list_items'>
                                                                                {item.executed_prices.map((trade, i) => (
                                                                                    <ul key={i}>
                                                                                        <li>Trade #{i + 1}:</li>
                                                                                        <li>Trading Price: <span>{nineDecimalFormat(trade.price)} {item?.side === "BUY" ? item?.pay_currency : item?.ask_currency}</span></li>
                                                                                        <li>Executed: <span>{nineDecimalFormat(trade.quantity)} {item?.side === "BUY" ? item?.ask_currency : item?.pay_currency}</span></li>
                                                                                        <li>Trading Fee: <span>{nineDecimalFormat(+trade.fee)} {item?.ask_currency}</span></li>
                                                                                        <li>Total: <span>{nineDecimalFormat(+trade.price * trade.quantity)}</span></li>
                                                                                    </ul>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="no-data-wrapper w-100">
                                                        <div className="no_data_s">
                                                            <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>


                                    </div>

                                </div>



                            </div>


                            <div className="assets_right d-none d-lg-block" >
                                {/* tab 4 content is here - Desktop Only */}
                                <div id="tab_4">

                                    <div className="assets_list">

                                        <div className="top_heading"><h4>Spot Wallets <i class="ri-refresh-line cursor-pointer" onClick={() => fetchSpotWallets()}></i></h4><Link className="more_btn" to="/user_profile/asset_overview"><i className="ri-exchange-funds-fill"></i> Transfer</Link></div>

                                        <div className="assets_btn">
                                            <button><Link to="/asset_managemnet/deposit">Deposit</Link></button>
                                            <button><Link to="/asset_managemnet/withdraw">Withdrawal</Link></button>
                                        </div>

                                    </div>
                                    <div className="price_card">
                                        <div className="table-responsive price_card_body scroll_y scroll_y_mt">
                                            {!token ? (
                                                <div className="no-data-wrapper" style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                    <div className="no_data_s">
                                                        <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                        <p className=" mt-2">Please login to view your wallets</p>
                                                        <Link to="/login" className="btn btn-primary btn-sm mt-2">Login</Link>
                                                    </div>
                                                </div>
                                            ) : walletsLoading ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                                                    <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem',borderColor: 'rgba(255, 255, 255, 0.3)', borderRightColor: 'transparent' }} />
                                                </div>
                                            ) : (
                                                <table className="table table-sm table-borderless mb-0 orderbook-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Asset</th>
                                                            <th className="text-end">Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {spotWallets?.length > 0 ? (
                                                            spotWallets.map((wallet, index) => (
                                                                <tr key={wallet?._id || index}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <img 
                                                                                src={ApiConfig?.baseImage + wallet?.icon_path} 
                                                                                alt={wallet?.short_name} 
                                                                                width="24" 
                                                                                height="24" 
                                                                                className="me-2 rounded-circle"
                                                                                onError={(e) => { e.target.src = '/images/coin_placeholder.png'; }}
                                                                            />
                                                                            <span>{wallet?.short_name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {parseFloat((wallet?.balance || 0).toFixed(8))}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr className="no-data-row">
                                                                <td colSpan="2">
                                                                    <div className="no-data-wrapper" style={{ padding: '20px', textAlign: 'center' }}>
                                                                        <div className="no_data_s">
                                                                            <img src="/images/no_data_vector.svg" className="img-fluid" width="64" height="64" alt="" />
                                                                            <p className="text-muted mt-2 mb-0" style={{ fontSize: '12px' }}>No assets in spot wallet</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>


                    </div>
                </div>
            </div >

            {/* Mobile Favourites Popup */}
            {showMobileFavouritesPopup && (
                <div className="mobile-favourites-popup-overlay" onClick={() => setShowMobileFavouritesPopup(false)}>
                    <div className="mobile-favourites-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-favourites-popup-header">
                            <h4>Select Pair</h4>
                            <button className="mobile-favourites-close-btn" onClick={() => setShowMobileFavouritesPopup(false)}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="mobile-favourites-popup-content">
                            <div className="spotLists">
                                {/* Search */}
                                <div className="spot-list-search">
                                    <div className="ivu-input">
                                        <i className="ri-search-2-line"></i>
                                        <input
                                            autoComplete="off"
                                            spellCheck="false"
                                            type="search"
                                            placeholder="Search"
                                            onChange={(e) => setsearch(e.target.value)}
                                            value={search}
                                        />
                                    </div>
                                </div>

                                <ul className="favorites_list_tabs">
                                    {token && (
                                        <li>
                                            <button
                                                className={coinFilter === 'FAV' ? 'active' : ''}
                                                onClick={() => setcoinFilter('FAV')}
                                            >
                                                Favourites
                                            </button>
                                        </li>
                                    )}
                                    {CoinPairDetails && [...new Set(CoinPairDetails.map(item => item?.quote_currency)), "BTC", "BNB", "ETH"].map((quoteCurrency, idx) => (
                                        <li key={idx}>
                                            <button
                                                className={coinFilter === quoteCurrency ? 'active' : ''}
                                                onClick={() => setcoinFilter(quoteCurrency)}
                                            >
                                                {quoteCurrency}
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {/* Table */}
                                <div className="price_card table-responsive">
                                    <table className="table table-sm table-borderless mb-0 orderbook-table">
                                        <thead>
                                            <tr>
                                                <th>Pair</th>
                                                <th className="text-end">Price</th>
                                                <th className="text-end">Change</th>
                                            </tr>
                                        </thead>
                                        <tbody className="price_card_body">
                                            {CoinPairDetails &&
                                                CoinPairDetails.map((data, index) => {
                                                    // Filter by favorites
                                                    if (coinFilter === "FAV" && !favCoins.includes(data?._id)) {
                                                        return null;
                                                    }
                                                    // Filter by quote currency
                                                    if (coinFilter !== "FAV" && (data?.quote_currency !== coinFilter && data?.base_currency !== coinFilter)) {
                                                        return null;
                                                    }

                                                    const isActive =
                                                        SelectedCoin?.base_currency === data?.base_currency &&
                                                        SelectedCoin?.quote_currency === data?.quote_currency;

                                                    return (
                                                        <tr
                                                            key={index}
                                                            className={isActive ? "active" : ""}
                                                            style={{ cursor: "pointer" }}
                                                            onClick={() => {
                                                                handleSelectCoin(data);
                                                                setShowMobileFavouritesPopup(false);
                                                            }}
                                                        >
                                                            {/* Pair */}
                                                            <td>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <img
                                                                        src={ApiConfig.baseImage + data?.icon_path}
                                                                        alt=""
                                                                        className="img-fluid me-1 round_img"
                                                                    />
                                                                    <div className="d-flex flex-column">
                                                                        {`${data?.base_currency}/${data?.quote_currency}`}
                                                                        <span className="tokensubcnt">{data?.base_currency_fullname}</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Price */}
                                                            <td className="text-end">
                                                                <div className="d-flex flex-column">
                                                                    <span>{data?.buy_price}</span>
                                                                    <span className="tokensubcnt">${data?.buy_price}</span>
                                                                </div>
                                                            </td>

                                                            {/* Change + Star */}
                                                            <td className="text-end">
                                                                <div className="d-flex justify-content-end align-items-center gap-2">
                                                                    <div className="d-flex flex-column text-end">
                                                                        <span
                                                                            className={
                                                                                data?.change_percentage >= 0
                                                                                    ? "text-green"
                                                                                    : "text-danger"
                                                                            }
                                                                        >
                                                                            {data?.change_percentage >= 0 ? `+${Number(parseFloat(data?.change_percentage)?.toFixed(5))}` : Number(parseFloat(data?.change_percentage)?.toFixed(5))}%
                                                                        </span>
                                                                        <span className="tokensubcnt">{parseFloat(data?.change?.toFixed(5)) || 0}</span>
                                                                    </div>

                                                                    {token && (
                                                                        <i
                                                                            className={
                                                                                favCoins.includes(data?._id)
                                                                                    ? "ri ri-star-fill ri-xl"
                                                                                    : "ri ri-star-line ri-xl"
                                                                            }
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAddFav(data?._id);
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Trade
