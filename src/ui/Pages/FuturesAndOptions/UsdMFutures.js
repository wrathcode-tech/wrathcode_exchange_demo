import React, { useContext, useEffect, useState } from 'react'
import './CoinFutures.css'
import './OptionHome.css'
import TVFuturesChartContainer from '../../../customComponents/Libraries/FuturesChartContainer';
import { SocketContext } from '../../../customComponents/SocketContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import AuthService from '../../../api/services/AuthService';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import {
    getTickSize,
    getStepSize,
    formatPriceByTick,
    formatQtyByStep,
    validateFuturesOrderInputs,
    normalizeOrderbookOrders,
} from './futuresUtils';

function UsdMFutures() {
    const token = localStorage.getItem('token');
    const orderBookColor = { buy: "#1c2a2b", sell: "#301e27" };

    const params = useParams();
    const navigate = useNavigate();
    const { isConnected, futuresData, subscribeToFutures, unsubscribeFromFutures, setFuturesHistoryTab } = useContext(SocketContext);

    let URL = params?.pairs?.split('_');
    const [urlPath, setUrlPath] = useState(URL ? URL : []);
    const [pairData, setPairData] = useState([]);
    const [topPairs, setTopPairs] = useState([]);
    const [selectedCoin, setSelectedCoin] = useState({});
    const [BuyOrders, setBuyOrders] = useState([]);
    const [RecentTrade, setRecentTrade] = useState([]);
    const [SellOrders, setSellOrders] = useState([]);
    const [isPricePositive, setIsPricePositive] = useState(true);
    const [balance, setBalance] = useState({ baseCurrency: 0, quoteCurrency: 0 });
    const [estimatedportfolio, setEstimatedportfolio] = useState(0);
    const [leverageOptions, setLeverageOptions] = useState([]);
    const [showAllListItems, setShowAllListItems] = useState({ 0: false, 1: false, 2: false });
    const [showExecutedTrades, setShowExecutedTrades] = useState({ 0: false, 1: false, 2: false });


    const [showTpSlOption, setShowTpSlOption] = useState(false);
    const [Leverage, setLeverage] = useState(1);
    const [limitPrice, setLimitPrice] = useState(0);
    const [quantity, setQuantity] = useState("");
    const [orderType, setOrderType] = useState("Limit");
    const [takeProfit, setTakeProfit] = useState("");
    const [stopLoss, setStopLoss] = useState("");

    const [OpenOrders, setOpenOrders] = useState([]);
    const [openPositions, setOpenPositions] = useState([]);
    const [totalMaintenanceMargin, setTotalMaintenanceMargin] = useState(0);
    const [totalUnrealizedPnl, setTotalUnrealizedPnl] = useState(0);
    const [totalIsolatedMargin, setTotalIsolatedMargin] = useState(0);
    const [ordersHistory, setOrdersHistory] = useState([]);
    const [tradeHistory, setTradeHistory] = useState([]);
    const [closePositions, setClosePositions] = useState([]);
    const [historySkip, setHistorySkip] = useState(0);
    const [totalOrderHistory, setTotalOrderHistory] = useState(0);
    const [totalTradeHistory, setTotalTradeHistory] = useState(0);
    const [totalPositionHistory, setTotalPositionHistory] = useState(0);
    const HISTORY_LIMIT = 20;

    const [activeMainTab, setActiveMainTab] = useState("order");
    const [activeInnerTab, setActiveInnerTab] = useState("all_orders");
    const [activePositionTab, setActivePositionTab] = useState("positions");
    const [activeLimitTab, setActiveLimitTab] = useState("positions_two");
    const [activeMobileTab, setActiveMobileTab] = useState("chart");
    const [showMobileOrderPanel, setShowMobileOrderPanel] = useState(false);
    const [mobileOrderSide, setMobileOrderSide] = useState("buy");



    // Handle futures data updates from SocketContext (orderbook & trades from backend, like spot)
    useEffect(() => {
        if (!futuresData) return;

        if (futuresData?.pairs) {
            setPairData(futuresData.pairs);
            const filteredData = futuresData.pairs?.filter(
                (item) => item?.short_name === "BTC" || item?.short_name === "ETH" || item?.short_name === "BNB"
            );
            setTopPairs(filteredData || []);
        }

        const positions = futuresData?.open_position || [];
        setOpenPositions(positions);
        setOpenOrders(futuresData?.open_orders || []);
        // History only when backend sends it (tab set via futures:set_history_tab)
        if (futuresData?.orders_history !== undefined) {
            const arr = futuresData.orders_history || [];
            setOrdersHistory(arr);
            setTotalOrderHistory(futuresData.orders_history_total ?? Math.max(arr.length, historySkip + arr.length));
        }
        if (futuresData?.trade_history !== undefined) {
            const arr = futuresData.trade_history || [];
            setTradeHistory(arr);
            setTotalTradeHistory(futuresData.trade_history_total ?? Math.max(arr.length, historySkip + arr.length));
        }
        if (futuresData?.close_position !== undefined) {
            const arr = futuresData.close_position || [];
            setClosePositions(arr);
            setTotalPositionHistory(futuresData.close_position_total ?? (historySkip + arr.length));
        }

        // Orderbook & recent trades from backend (see docs/FUTURES_WEBSOCKET_SPEC.md)
        if (futuresData?.buy_order !== undefined) {
            setBuyOrders(normalizeOrderbookOrders(futuresData.buy_order || []));
        }
        if (futuresData?.sell_order !== undefined) {
            setSellOrders(normalizeOrderbookOrders(futuresData.sell_order || []));
        }
        if (futuresData?.recent_trades !== undefined) {
            setRecentTrade(
                (futuresData.recent_trades || []).map((t) => ({
                    price: parseFloat(t.price) || 0,
                    quantity: parseFloat(t.quantity) || 0,
                    side: t.side || "BUY",
                    time: t.time || new Date().toLocaleTimeString("en-GB", { hour12: false }),
                }))
            );
        }

        const totalMaint = positions.reduce((sum, pos) => sum + (pos.maintenanceMargin || 0), 0);
        const totalPnl = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0);
        const totalIM = positions.reduce((sum, pos) => sum + (pos.isolatedMargin || 0), 0);
        setTotalMaintenanceMargin(toFixedFive(totalMaint));
        setTotalUnrealizedPnl(toFixedFive(totalPnl));
        setTotalIsolatedMargin(toFixedFive(totalIM));

        setBalance({
            baseCurrency: toFixedFive(futuresData?.balance?.base_currency_balance) || 0,
            quoteCurrency: toFixedFive(futuresData?.balance?.quote_currency_balance) || 0,
        });
    }, [futuresData]);

    // Subscribe to futures data when pair changes
    useEffect(() => {
        if (!selectedCoin?.base_currency_id || !selectedCoin?.quote_currency_id) return;

        subscribeToFutures(selectedCoin.base_currency_id, selectedCoin.quote_currency_id);

        return () => {
            unsubscribeFromFutures(selectedCoin.base_currency_id, selectedCoin.quote_currency_id);
        };
    }, [selectedCoin?.base_currency_id, selectedCoin?.quote_currency_id, subscribeToFutures, unsubscribeFromFutures]);

    // Request futures pairs list via socket on mount (faster than API call)
    useEffect(() => {
        if (isConnected && !pairData?.length) {
            // Request pairs only (no base/quote = pairs list only)
            subscribeToFutures();
        }
    }, [isConnected, pairData?.length, subscribeToFutures]);

    // futures:set_history_tab – request history only when user opens that tab
    const prevHistoryTabRef = React.useRef(null);
    useEffect(() => {
        const tabMap = {
            order_history: 'orders',
            exercise_history: 'trades',
            position_history: 'positions'
        };
        if (['positions', 'open'].includes(activePositionTab)) {
            setFuturesHistoryTab(null);
            prevHistoryTabRef.current = null;
        } else if (tabMap[activePositionTab]) {
            const isSameTab = prevHistoryTabRef.current === activePositionTab;
            const skip = isSameTab ? historySkip : 0;
            if (!isSameTab) setHistorySkip(0);
            prevHistoryTabRef.current = activePositionTab;
            setFuturesHistoryTab(tabMap[activePositionTab], skip, HISTORY_LIMIT);
        }
    }, [activePositionTab, historySkip, setFuturesHistoryTab]);

    const handleHistoryPagination = (action) => {
        const tabMap = { order_history: 'orders', exercise_history: 'trades', position_history: 'positions' };
        const totalMap = { order_history: totalOrderHistory, exercise_history: totalTradeHistory, position_history: totalPositionHistory };
        const total = totalMap[activePositionTab] ?? 0;
        let newSkip = historySkip;
        if (action === 'prev' && historySkip >= HISTORY_LIMIT) newSkip = historySkip - HISTORY_LIMIT;
        else if (action === 'next') {
            if (historySkip + HISTORY_LIMIT < total) newSkip = historySkip + HISTORY_LIMIT;
            else if (total === HISTORY_LIMIT && historySkip === 0) newSkip = HISTORY_LIMIT; // optimistic: full page, try next
        } else if (action === 'first') newSkip = 0;
        else if (action === 'last' && total > 0) newSkip = Math.max(0, total - HISTORY_LIMIT);
        if (newSkip === historySkip) return;
        setHistorySkip(newSkip);
        const tab = tabMap[activePositionTab];
        if (tab) setFuturesHistoryTab(tab, newSkip, HISTORY_LIMIT);
    };

    // ********* Auto Select Coin Pair after Socket Connection ********** //
    useEffect(() => {
        if (Object.keys(selectedCoin)?.length === 0 && pairData?.length > 0) {
            var Pair;
            var filteredData;
            if (urlPath?.length > 0) {
                filteredData = pairData?.filter?.((item) => {
                    return urlPath[0]?.includes(item?.short_name) && urlPath[1]?.includes(item?.margin_asset)
                })
            }
            if (filteredData?.length > 0) {
                Pair = filteredData[0]
            }
            else {
                Pair = pairData[0]
            }
            navigate(`/usd_futures/${Pair?.short_name}_${Pair?.margin_asset}`);
            setSelectedCoin(Pair);
            const steps = 6;
            const options = [];

            for (let i = 0; i < steps; i++) {
                const val = Math.round((Pair?.max_leverage / (steps - 1)) * i);
                options.push(val < 1 ? 1 : val); // ensure minimum 1x
            }

            setLeverageOptions(options.slice(0, 6));
            setLimitPrice(Pair?.buy_price);

            subscribeToFutures(Pair?.base_currency_id, Pair?.quote_currency_id);
        } else if (Object.keys(selectedCoin)?.length > 0 && pairData?.length > 0) {
            let selectedItem = pairData?.filter?.((item) => {
                return selectedCoin?.short_name === item?.short_name && selectedCoin?.margin_asset === item?.margin_asset
            })[0] || {}

            if (selectedItem?.buy_price >= selectedCoin?.buy_price) {
                setIsPricePositive(true)
            } else {
                setIsPricePositive(false)
            }

            setSelectedCoin(selectedItem);


        }
    }, [pairData]);

    const handleSelectCoin = (data) => {
        navigate(`/usd_futures/${data?.short_name}_${data?.margin_asset}`);
        setSelectedCoin(data);
        setLimitPrice(data?.buy_price);
        subscribeToFutures(data?.base_currency_id, data?.quote_currency_id);
    };

    const estimatedPortfolio = async () => {
        try {
            LoaderHelper.loaderStatus(true);
            const result = await AuthService.estimatedPortfolio("");
            if (result?.success) {
                setEstimatedportfolio(result?.data?.dollarPrice);
            }
        } catch (error) {
        }
        finally { LoaderHelper.loaderStatus(false); }
    };

    useEffect(() => {
        estimatedPortfolio()
    }, []);


    const toFixedFive = (data) => {
        if (typeof (data) === "number") {
            return parseFloat(data?.toFixed(5));
        } else {
            return data;
        }
    };
    const toFixedThree = (data) => {
        if (typeof (data) === "number") {
            return parseFloat(data?.toFixed(5));
        } else {
            return data;
        }
    };

    const qunaityPrecision = (data) => {
        if (typeof data === "number") {
            return formatQtyByStep(data, selectedCoin);
        }
        return data;
    };

    const pricePrecision = (data) => {
        if (typeof data === "number") {
            return formatPriceByTick(data, selectedCoin);
        }
        return data;
    };

    const maxBuyVolume = Math.max(
        ...BuyOrders.map((o) => o.remaining ?? o.size ?? o.sum ?? 0),
        1
    );
    const maxSellVolume = Math.max(
        ...SellOrders.map((o) => o.remaining ?? o.size ?? o.sum ?? 0),
        1
    );




    const minValue = 1;
    const maxValue = selectedCoin?.max_leverage;

    const handleDecrease = () => {
        setLeverage(prev => (prev > minValue ? prev - 1 : prev));
        setPercentage(0);
    };

    const handleIncrease = () => {
        setLeverage(prev => (prev < maxValue ? prev + 1 : prev));
        setPercentage(0);
    };

    const handleInputChange = (e) => {
        let val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
        if (val > maxValue) val = maxValue;
        if (val < minValue) val = minValue;
        setLeverage(val);
        setPercentage(0);
    };

    const handleSelectClick = (val) => {
        setLeverage(val);
        setPercentage(0);
    };

    // Drag handle for circle
    const handleDrag = (e) => {
        const bar = e.currentTarget.getBoundingClientRect();
        const percent = ((e.clientX - bar.left) / bar.width) * 100;
        const newVal = Math.round((percent / 100) * (maxValue - minValue) + minValue);
        if (newVal >= minValue && newVal <= maxValue) setLeverage(newVal);
    };


    const [searchTerm, setSearchTerm] = useState("");

    // Filter pairs based on search term
    const filteredPairs = pairData?.filter((pair) => {
        const term = searchTerm.toLowerCase();
        return (
            pair?.short_name?.toLowerCase().includes(term) ||
            pair?.margin_asset?.toLowerCase().includes(term) ||
            pair?.name?.toLowerCase().includes(term)
        );
    });

    function computeFuturesRisk(entryPrice = 0, qty = 0, leverage = 0, maintRate = 0.005) {
        if (!entryPrice || !qty || !leverage) {
            console.log("Missing required parameters");
            return { cost: 0, longLiq: 0, shortLiq: 0 };
        }

        // Use entry price for Limit, or selectedCoin price for Market
        let currentPrice = orderType === "Limit" ? entryPrice : selectedCoin?.buy_price || 0;

        // Add +0.1%
        const fractionPer = orderType === "Market" ? 1.001 : 1 // 0.1%
        currentPrice = currentPrice * fractionPer;

        entryPrice = currentPrice;

        const notional = entryPrice * qty;
        const cost = notional / leverage;

        const maintenance = notional * maintRate;
        const maintFraction = maintenance / notional;

        const longLiq = entryPrice * (1 - 1 / leverage + maintFraction);
        const shortLiq = entryPrice * (1 + 1 / leverage - maintFraction);

        return {
            cost: toFixedFive(cost),
            longLiq: pricePrecision(longLiq || 0),
            shortLiq: pricePrecision(shortLiq || 0),
        };
    }

    const [percentage, setPercentage] = useState(0);

    function computeQuantityFromBalance(percentage) {

        const fractionPer = orderType === "Market" ? 1.001 : 1 // 0.1%
        const price =
            orderType === "Limit"
                ? pricePrecision(limitPrice)
                : pricePrecision(selectedCoin?.buy_price * fractionPer) || 0;

        const marginBalance = balance?.quoteCurrency
        const leverage = Leverage

        if (!marginBalance || !percentage || !leverage || !price) return 0;

        // Step 1: balance % user selected
        const usableBalance = (marginBalance * percentage) / 100;

        // Step 2: max notional possible with leverage
        const maxNotional = usableBalance * leverage;

        // Step 3: qty = notional / price
        const qty = maxNotional / price;

        setQuantity(qunaityPrecision(qty || 0))
        setPercentage(percentage)
    }



    const [futuresRisk, setFuturesRisk] = useState({ cost: 0, longLiq: 0, shortLiq: 0 });

    useEffect(() => {
        if (orderType === "Market") return
        const riskData = computeFuturesRisk(limitPrice || 0, quantity || 0, Leverage || 0)
        setFuturesRisk(riskData)


    }, [limitPrice, quantity, Leverage, orderType]);

    useEffect(() => {
        if (orderType !== "Market") return
        const riskData = computeFuturesRisk(limitPrice || 0, quantity || 0, Leverage || 0)
        setFuturesRisk(riskData)


    }, [limitPrice, quantity, Leverage, selectedCoin, orderType]);

    function validateOrder({ balance, futuresRisk, quantity, orderType, limitPrice }) {
        if (balance < futuresRisk?.cost) {
            alertErrorMessage("Insufficient balance");
        }
        if (quantity <= 0) {
            alertErrorMessage("Quantity must be greater than 0");
            return { valid: false, message: "Quantity must be greater than 0" };
        }

        if (orderType === "Limit" && limitPrice <= 0) {
            alertErrorMessage("Limit price must be greater than 0");
        }

        return { valid: true };
    };

    const placeFutureOrder = async (side) => {
        try {
            LoaderHelper.loaderStatus(true);
            // ====== Validation ======
            if (side !== "LONG" && side !== "SHORT") {
                return alertErrorMessage("Invalid side. Must be LONG or SHORT.");
            }

            if (!selectedCoin) {
                return alertErrorMessage("No trading pair selected.");
            }

            if (!orderType) {
                return alertErrorMessage("Please select order type (Limit/Market).");
            }

            if (Leverage <= 0) {
                return alertErrorMessage("Invalid leverage selected.");
            }

            // Ensure balance is available
            if (!balance?.quoteCurrency || balance?.quoteCurrency <= 0) {
                return alertErrorMessage("Insufficient balance.");
            }

            // Price validations
            if (orderType === "Limit") {
                if (!limitPrice || limitPrice <= 0) {
                    return alertErrorMessage("Please enter a valid limit price.");
                }
            }

            // Quantity validation
            if (!quantity || quantity <= 0) {
                return alertErrorMessage("Please enter a valid quantity.");
            }

            // Tick/step size validation (like spot Trade page)
            const validation = validateFuturesOrderInputs({
                price: orderType === "Limit" ? limitPrice : selectedCoin?.buy_price,
                quantity,
                pair: selectedCoin,
                orderType,
            });
            if (!validation.valid) {
                return alertErrorMessage(validation.message);
            }

            // Cost check
            if (balance?.quoteCurrency < futuresRisk?.cost) {
                return alertErrorMessage("Insufficient balance for this order.");
            }

            const finalOrderType = orderType.toUpperCase();

            if (finalOrderType !== "LIMIT" && finalOrderType !== "MARKET") {
                return alertErrorMessage("Invalid order type. Must be LIMIT or MARKET.");
            }

            // ====== Prepare data with precision ======
            const finalPrice = finalOrderType === "LIMIT"
                ? pricePrecision(limitPrice)
                : pricePrecision(selectedCoin?.buy_price);

            if (!finalPrice || finalPrice <= 0) {
                return alertErrorMessage("Please enter a valid limit price.");
            }

            const finalQuantity = qunaityPrecision(quantity);

            // ====== Send to backend ======
            const result = await AuthService?.placeFutureOrder(
                selectedCoin?.short_name,
                selectedCoin?.margin_asset,
                finalOrderType,
                side,
                +finalQuantity,
                +finalPrice,
                +Leverage,
                +takeProfit,
                +stopLoss,
                showTpSlOption
            );

            if (!result?.success) {
                return alertErrorMessage(result?.message || "Failed to place order.");
            }

            // ✅ Success
            alertSuccessMessage("Order placed successfully!");

        } catch (err) {
            alertErrorMessage(err?.message || "Something went wrong while placing the order.");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    };

    const placeReverseOrder = async (side, quantityToReverse, leverage, positionId, positionSide, pairId) => {
        // console.log("🚀 ~ placeReverseOrder ~ side, quantityToReverse, leverage, positionId, positionSide, pairId:", side, quantityToReverse, leverage, positionId, positionSide, pairId)
        // return
        try {
            LoaderHelper.loaderStatus(true);

            // ====== Validation ======
            if (!["LONG", "SHORT"].includes(side)) return alertErrorMessage("Invalid side. Must be LONG or SHORT.");
            if (!["LONG", "SHORT"].includes(positionSide)) return alertErrorMessage("Invalid position side. Must be LONG or SHORT.");
            if (leverage <= 0) return alertErrorMessage("Invalid leverage selected.");
            if (!balance?.quoteCurrency || balance?.quoteCurrency <= 0) return alertErrorMessage("Insufficient balance.");
            if (!quantityToReverse || quantityToReverse <= 0) return alertErrorMessage("Please enter a valid quantity.");

            // ====== Find pair info from pairData ======
            const pair = pairData?.find(p => p._id === pairId);
            if (!pair) return alertErrorMessage("Trading pair not found.");

            const fractionPer = 1.001; // Price fraction %
            const feePer = 0.0004; // Fee%
            const price = pair.buy_price * fractionPer;

            const finalQuantity = formatQtyByStep(quantityToReverse, pair);

            // ====== Cost check ======
            const estimatedCost = (price * finalQuantity) / leverage;
            const estimatedFeeCOst = estimatedCost * feePer
            if (balance?.quoteCurrency < (estimatedCost + estimatedFeeCOst)) return alertErrorMessage("Insufficient balance for this reverse order.");

            // ====== Close current position ======
            const closeRes = await AuthService?.closePosition(positionId);
            if (!closeRes?.success) return alertErrorMessage(closeRes?.message || "Failed to close position.");

            alertSuccessMessage("Position close order placed successfully");

            // ====== Place reverse market order ======
            const oppositeSide = side; // the new side
            const result = await AuthService?.placeReverseFutureOrder(
                pair.short_name,
                pair.margin_asset,
                oppositeSide,
                +finalQuantity,
                +leverage
            );

            if (!result?.success) return alertErrorMessage(result?.message || "Failed to place reverse order.");
            alertSuccessMessage("Reverse order placed successfully!");
        } catch (err) {
            alertErrorMessage(err?.message || "Something went wrong while placing the reverse order.");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    };


    const closePosition = async (positionId) => {
        try {
            LoaderHelper.loaderStatus(true);
            if (!positionId) {
                return alertErrorMessage("Invalid position id");
            }

            // ====== API call ======
            const result = await AuthService?.closePosition(positionId)

            if (!result?.success) {
                return alertErrorMessage(result?.message || "Failed to close position.");
            }

            alertSuccessMessage("Position close order placed successfully");
        } catch (err) {
            alertErrorMessage(err?.message || "Something went wrong while closing the position.");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    };

    const cancelFutureOrder = async (orderId) => {
        try {
            LoaderHelper.loaderStatus(true);
            if (!orderId) {
                return alertErrorMessage("Invalid order id");
            }

            // ====== API call ======
            const result = await AuthService?.cancelFutureOrder(orderId)

            if (!result?.success) {
                return alertErrorMessage(result?.message || "Failed to cancel order.");
            }

            alertSuccessMessage("Order cancelled placed successfully");
        } catch (err) {
            alertErrorMessage(err?.message || "Something went wrong while cancelling the order.");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    };

    const loginScreen = () => {
        navigate(`/login`);
    }



    return (
        <>


            <div className="usd_future_dashboard">
                <div className="top_bar_usd_future">
                    <div className="top_future_left_s">
                        <div className="usd_left_pr">
                            <div className="btcusd__currency " data-bs-toggle="modal" data-bs-target="#exampleModal2">
                                <img className='icon_img' src={ApiConfig?.baseImage + selectedCoin?.icon_path} alt="bitcoin" /> {selectedCoin?.short_name}/{selectedCoin?.margin_asset} <span> <img src="/images/futures_img/arrowbottom_icon.svg" alt="arrow" /></span>
                            </div>
                            {/* <!-- Modal Start --> */}
                            <div className="modal fade currency_popup_s search_form_modal_2" id="exampleModal2" tabindex="-1"
                                aria-labelledby="exampleModalLabel" aria-hidden="true">
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <button type="button" className="btn-close" data-bs-dismiss="modal"
                                                aria-label="Close"></button>
                                        </div>
                                        <div className="modal-body">
                                            <div className="search_form">
                                                <i className="ri-search-2-line"></i>
                                                <input
                                                    type="search"
                                                    placeholder="Search"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <div className="bn-tabs_favorites_bl">
                                                <div className="top_tabs_center">
                                                    <ul className="nav nav-tabs" id="myTab" role="tablist">

                                                        <li className="nav-item" role="presentation">
                                                            <button className="nav-link active" id="usd-tab" data-bs-toggle="tab"
                                                                data-bs-target="#main-tab" type="button" role="tab"
                                                                aria-controls="usd-m" aria-selected="false">USDⓈ-M</button>
                                                        </li>
                                                    </ul>

                                                </div>

                                                <div className="tab-content" id="myTabContent">


                                                    <div className="tab-pane fade show active" id="main-tab" role="tabpanel"
                                                        aria-labelledby="favorites-tab">
                                                        <div id="all" role="tabpanel"
                                                            aria-labelledby="all-tab">
                                                            <div className="currency_data_list">
                                                                <div className="table-responsive ">
                                                                    <table>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Symbols/Vol</th>
                                                                                <th>Last Price</th>
                                                                                <th>24h Change</th>
                                                                                <th>Max Leverage</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {filteredPairs?.length > 0 ?
                                                                                filteredPairs?.map((pair) => {
                                                                                    return (
                                                                                        <tr key={pair?._id} onClick={() => handleSelectCoin(pair)} className='cursor-pointer' data-bs-dismiss="modal" aria-label="Close">
                                                                                            <td>
                                                                                                <div className="cnt_first_t">
                                                                                                    <div className="icon_currency icon">
                                                                                                        {/* <i className={"ri ri-star-line  ri-xl"}  >
                                                                                                        </i> */}
                                                                                                        <img src={ApiConfig?.baseImage + pair?.icon_path} alt="currency" className='' />
                                                                                                    </div>
                                                                                                    <div className="cnt">
                                                                                                        <h6>
                                                                                                            {pair?.short_name}/{pair?.margin_asset} <span>Perp</span>
                                                                                                        </h6>
                                                                                                        <p>Vol {toFixedThree(pair?.volume)}</p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td>{pricePrecision(pair?.buy_price)}</td>
                                                                                            <td className={pair?.change_percentage > 0 ? "text-success" : "danger"}>{toFixedThree(pair?.change_percentage)}%</td>
                                                                                            <td>{pair?.max_leverage}x</td>
                                                                                        </tr>
                                                                                    )
                                                                                })
                                                                                :
                                                                                <tr>
                                                                                    <td colSpan="4">
                                                                                        <div className="text-center no-data mb-0 center_b">
                                                                                            <div className='table_responsive_2'>
                                                                                                <div className="no_data_s">
                                                                                                    <img src="/images/no_data_vector.svg" className='img-fluid ' alt="no data" width="52" />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            }
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>






                                        </div>

                                    </div>
                                </div>
                            </div>
                            {/* <!-- Modal End --> */}


                            <div className="price_top_right">
                                <strong className={isPricePositive ? "text-green" : "text-red"}>
                                    {pricePrecision(selectedCoin?.buy_price) || "0.00"}
                                </strong>
                                <span className={selectedCoin?.change > 0 ? "text-green" : "text-red"}>
                                    {toFixedFive(selectedCoin?.change) || "0.00"} (
                                    {toFixedFive(selectedCoin?.change_percentage) || "0.00"}%)
                                </span>
                            </div>
                        </div>

                        <div className="market_price_list_top">
                            <ul>

                                {/* High / Low */}
                                {selectedCoin?.high && (
                                    <li>
                                        <span>24h High</span>
                                        <div className="price_tag">{toFixedFive(selectedCoin.high)}</div>
                                    </li>
                                )}
                                {selectedCoin?.low && (
                                    <li>
                                        <span>24h Low</span>
                                        <div className="price_tag">{toFixedFive(selectedCoin.low)}</div>
                                    </li>
                                )}


                                {/* Change & % */}
                                {/* {(selectedCoin?.change || selectedCoin?.change_percentage) && (
                                    <li>
                                        <span>24h Change</span>
                                        <div className={`price_tag ${selectedCoin.change > 0 ? "text-green" : "text-red"}`}>
                                            {toFixedThree(selectedCoin.change)} ({toFixedThree(selectedCoin.change_percentage)}%)
                                        </div>
                                    </li>
                                )} */}

                                {/* Volume */}
                                {selectedCoin?.volume && (
                                    <li>
                                        <span>24h Volume</span>
                                        <div className="price_tag">{toFixedThree(selectedCoin.volume)} {selectedCoin?.short_name}</div>
                                    </li>
                                )}
                                {/* {selectedCoin?.volumeQuote && (
                                    <li>
                                        <span>24h Turnover</span>
                                        <div className="price_tag">{toFixedFive(selectedCoin.volumeQuote)} {selectedCoin?.margin_asset}</div>
                                    </li>
                                )} */}

                                {/* Leverage */}

                                {selectedCoin?.max_leverage && (
                                    <li>
                                        <span>Max Leverage</span>
                                        <div className="price_tag">{selectedCoin.max_leverage}x</div>
                                    </li>
                                )}



                                {/* Fees */}
                                {/* {selectedCoin?.maker_fee && (
                                    <li>
                                        <span>Maker Fee</span>
                                        <div className="price_tag">{selectedCoin.maker_fee}%</div>
                                    </li>
                                )}
                                {selectedCoin?.taker_fee && (
                                    <li>
                                        <span>Taker Fee</span>
                                        <div className="price_tag">{selectedCoin.taker_fee}%</div>
                                    </li>
                                )} */}
                            </ul>
                        </div>


                    </div>

                    <div className="top_future_right_s">
                        <ul>
                            {topPairs?.length > 0 && topPairs?.map((item) => {
                                return (
                                    <>
                                        <li key={item?._id} onClick={() => handleSelectCoin(item)}><img src="/images/futures_img/tradetop_icon.svg" alt="Trade Information" />{item?.short_name}{item?.margin_asset}  <small className={item?.change_percentage > 0 ? 'success-color' : 'danger-color'}>{toFixedThree(item?.change_percentage)}%</small></li>

                                    </>
                                )
                            })}

                        </ul>
                    </div>
                </div>

                <div className="dashboard_mid_s space_gap_0 pa_2">
                    <div className="dashboard_summary_lft">

                        <ul className='future_mobileview_tabs'>
                            <li className={activeMobileTab === 'chart' ? 'active' : ''} onClick={() => setActiveMobileTab('chart')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveMobileTab('chart'); } }}>Chart</li>
                            <li className={activeMobileTab === 'order' ? 'active' : ''} onClick={() => setActiveMobileTab('order')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveMobileTab('order'); } }}>Order Book</li>
                            <li className={activeMobileTab === 'trades' ? 'active' : ''} onClick={() => setActiveMobileTab('trades')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveMobileTab('trades'); } }}>Recent Trades</li>
                            <li className={activeMobileTab === 'assets' ? 'active' : ''} onClick={() => setActiveMobileTab('assets')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveMobileTab('assets'); } }}>Assets</li>
                        </ul>
                        <div className='future_data_mobile'>
                            {activeMobileTab === 'chart' && (
                                Object.keys(selectedCoin)?.length >0 ?
                                    <TVFuturesChartContainer symbol={`${selectedCoin?.short_name}${selectedCoin?.margin_asset}_PERP`} />
                                    : <div className="favouriteData dsfdsf" style={{ width: '100%', height: '400px', alignItems: 'center' }}>
                                        <div className="spinner-border m-5" role="status">
                                            <span className="sr-only"></span>
                                        </div>
                                    </div>
                            )}
                            {activeMobileTab === 'order' && (
                                <div className="future_mobile_tab_content table_info_data">
                                    <div className="order_tabs buy_sell_cards buy_sell_row d-flex-between">
                                        <ul className="nav custom-tabs nav_order">
                                            <li className="fav-tab">
                                                <a className={activeInnerTab === "all_orders" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveInnerTab("all_orders"); }} href="#/" style={{ cursor: "pointer" }}><img alt="" src="/images/order_1.svg" width="22" height="11" /></a>
                                            </li>
                                            <li className="usdt-tab">
                                                <a className={activeInnerTab === "buy_orders" ? "active" : ""} onClick={(e) => { e.preventDefault(); setActiveInnerTab("buy_orders"); }} href="#/" style={{ cursor: "pointer" }}><img alt="" src="/images/order_2.svg" width="22" height="11" /></a>
                                            </li>
                                            <li className="btc-tab">
                                                <a className={activeInnerTab === "sell_orders" ? "active me-0" : "me-0"} onClick={(e) => { e.preventDefault(); setActiveInnerTab("sell_orders"); }} href="#/" style={{ cursor: "pointer" }}><img alt="" src="/images/order_3.svg" width="22" height="11" /></a>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="tab-content mt-2 buy_sell_row_price futurestbllft">
                                        <div className="table_info_data">
                                            {activeInnerTab === "all_orders" && (
                                                <div className="scroll_y scroll_y_reverse">
                                                    {SellOrders?.length > 0 ? (
                                                        <table>
                                                            <thead><tr><th>Price ({selectedCoin?.margin_asset || "---"})</th><th>Size ({selectedCoin?.short_name || "---"})</th><th>Sum ({selectedCoin?.short_name || "---"})</th></tr></thead>
                                                            <tbody>
                                                                {SellOrders.map((item, idx) => {
                                                                    const vol = item.remaining ?? item.size ?? 0;
                                                                    const fillPercentage = maxSellVolume ? (vol / maxSellVolume) * 100 : 0;
                                                                    return (
                                                                        <tr key={item?._id || `sell-${idx}`} style={{ background: `linear-gradient(to left, ${orderBookColor?.sell} ${fillPercentage}%, transparent ${fillPercentage}%)` }} className="cursor-pointer" onClick={() => { setLimitPrice(pricePrecision(item?.price)); setPercentage(0); }}>
                                                                            <td className="danger">{pricePrecision(item?.price)}</td>
                                                                            <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                            <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <table><tbody><tr><td colSpan="3"><div className="favouriteData lodericon d-flex justify-content-center align-items-center"><div className="spinner-border" role="status"></div></div></td></tr></tbody></table>
                                                    )}
                                                    {BuyOrders?.length > 0 ? (
                                                        <table>
                                                            <thead><tr><th>Price ({selectedCoin?.margin_asset || "---"})</th><th>Size ({selectedCoin?.short_name || "---"})</th><th>Sum ({selectedCoin?.short_name || "---"})</th></tr></thead>
                                                            <tbody>
                                                                {BuyOrders.map((item, idx) => {
                                                                    const vol = item.remaining ?? item.size ?? 0;
                                                                    const fillPercentage = maxBuyVolume ? (vol / maxBuyVolume) * 100 : 0;
                                                                    return (
                                                                        <tr key={item?._id || `buy-${idx}`} style={{ background: `linear-gradient(to left, ${orderBookColor?.buy} ${fillPercentage}%, transparent ${fillPercentage}%)` }} className="cursor-pointer" onClick={() => { setLimitPrice(pricePrecision(item?.price)); setPercentage(0); }}>
                                                                            <td className="sucess">{pricePrecision(item?.price)}</td>
                                                                            <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                            <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <table><tbody><tr><td colSpan="3"><div className="favouriteData lodericon d-flex justify-content-center align-items-center"><div className="spinner-border" role="status"></div></div></td></tr></tbody></table>
                                                    )}
                                                </div>
                                            )}
                                            {activeInnerTab === "buy_orders" && (
                                                <div className="scroll_y">
                                                    {BuyOrders?.length > 0 ? (
                                                        <table>
                                                            <thead><tr><th>Price ({selectedCoin?.margin_asset || "---"})</th><th>Size ({selectedCoin?.short_name || "---"})</th><th>Sum ({selectedCoin?.short_name || "---"})</th></tr></thead>
                                                            <tbody>
                                                                {BuyOrders.map((item, idx) => {
                                                                    const vol = item.remaining ?? item.size ?? 0;
                                                                    const fillPercentage = maxBuyVolume ? (vol / maxBuyVolume) * 100 : 0;
                                                                    return (
                                                                        <tr key={item?._id || `buy-${idx}`} style={{ background: `linear-gradient(to left, ${orderBookColor?.buy} ${fillPercentage}%, transparent ${fillPercentage}%)` }} className="cursor-pointer" onClick={() => { setLimitPrice(pricePrecision(item?.price)); setPercentage(0); }}>
                                                                            <td className="sucess">{pricePrecision(item?.price)}</td>
                                                                            <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                            <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <table><tbody><tr><td colSpan="3"><div className="favouriteData lodericon d-flex justify-content-center align-items-center"><div className="spinner-border" role="status"></div></div></td></tr></tbody></table>
                                                    )}
                                                </div>
                                            )}
                                            {activeInnerTab === "sell_orders" && (
                                                <div className="scroll_y scroll_y_reverse">
                                                    {SellOrders?.length > 0 ? (
                                                        <table>
                                                            <thead><tr><th>Price ({selectedCoin?.margin_asset || "---"})</th><th>Size ({selectedCoin?.short_name || "---"})</th><th>Sum ({selectedCoin?.short_name || "---"})</th></tr></thead>
                                                            <tbody>
                                                                {SellOrders.map((item, idx) => {
                                                                    const vol = item.remaining ?? item.size ?? 0;
                                                                    const fillPercentage = maxSellVolume ? (vol / maxSellVolume) * 100 : 0;
                                                                    return (
                                                                        <tr key={item?._id || `sell-${idx}`} style={{ background: `linear-gradient(to left, ${orderBookColor?.sell} ${fillPercentage}%, transparent ${fillPercentage}%)` }} className="cursor-pointer" onClick={() => { setLimitPrice(pricePrecision(item?.price)); setPercentage(0); }}>
                                                                            <td className="danger">{pricePrecision(item?.price)}</td>
                                                                            <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                            <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <table><tbody><tr><td colSpan="3"><div className="favouriteData lodericon d-flex justify-content-center align-items-center"><div className="spinner-border" role="status"></div></div></td></tr></tbody></table>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeMobileTab === 'trades' && (
                                <div className="future_mobile_tab_content table_info_data">
                                    <div className="table-responsive">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Price({selectedCoin?.margin_asset || "---"})</th>
                                                    <th>Amount({selectedCoin?.short_name || "---"})</th>
                                                    <th>Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {RecentTrade?.length > 0 ? (
                                                    RecentTrade.map((order) => (
                                                        <tr key={order.id}>
                                                            <td className={order?.side === "BUY" ? "sucess" : "danger"}>{toFixedThree(order?.price)}</td>
                                                            <td>{toFixedThree(order?.quantity)}</td>
                                                            <td>{order?.time}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3">
                                                            <div className="no_data_s text-center">
                                                                <div className="spinner-border text-secondary" role="status"></div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {activeMobileTab === 'assets' && (
                                <div className="future_mobile_tab_content asset_total_value costbtc_total">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div><h5>USDT-Perp</h5></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div><h6>Total Assets</h6></div>
                                        <div><span>{toFixedFive(estimatedportfolio + totalIsolatedMargin) || 0} {selectedCoin?.margin_asset}</span></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div><h6>Available</h6></div>
                                        <div><span>{toFixedFive(balance?.quoteCurrency + totalIsolatedMargin) || 0} {selectedCoin?.margin_asset}</span></div>
                                    </div>
                                    <hr />
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div><h5>USDT-Perp</h5></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div><h6>Maintance Margin</h6></div>
                                        <div><span>{totalMaintenanceMargin || 0} {selectedCoin?.margin_asset}</span></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div><h6>Unrealized PNL</h6></div>
                                        <div><span className={`text-${totalUnrealizedPnl > 0 ? "green" : "red"}`}>{totalUnrealizedPnl || 0} USDT</span></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between buy_transferbtn">
                                        <Link to='/asset_managemnet/deposit'>Deposit Crypto</Link>
                                        <Link to='/user_profile/asset_overview'>Transfer</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="order_trade_s">
                        <div className="trade_movers_tb">

                            {/* Main Tabs */}
                            <ul className="nav nav-tabs" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeMainTab === "order" ? "active" : ""}`}
                                        onClick={() => setActiveMainTab("order")}
                                    >
                                        Order Book
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className={`nav-link ${activeMainTab === "trades" ? "active" : ""}`}
                                        onClick={() => setActiveMainTab("trades")}
                                    >
                                        Recent Trades
                                    </button>
                                </li>
                            </ul>

                            {/* Main Tabs Content */}
                            <div className="tab-content table-trade">

                                {/* ORDER BOOK DATA */}
                                {activeMainTab === "order" && (
                                    <div className="tab-pane show active" id="order">

                                        {/* Inner tabs for buy/sell/all */}
                                        <div className="order_tabs buy_sell_cards buy_sell_row d-flex-between">
                                            <ul className="nav custom-tabs nav_order">
                                                <li className="fav-tab">
                                                    <a
                                                        className={activeInnerTab === "all_orders" ? "active" : ""}
                                                        onClick={() => setActiveInnerTab("all_orders")}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <img alt="" src="/images/order_1.svg" width="22" height="11" />
                                                    </a>
                                                </li>
                                                <li className="usdt-tab">
                                                    <a
                                                        className={activeInnerTab === "buy_orders" ? "active" : ""}
                                                        onClick={() => setActiveInnerTab("buy_orders")}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <img alt="" src="/images/order_2.svg" width="22" height="11" />
                                                    </a>
                                                </li>
                                                <li className="btc-tab">
                                                    <a
                                                        className={activeInnerTab === "sell_orders" ? "active me-0" : "me-0"}
                                                        onClick={() => setActiveInnerTab("sell_orders")}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <img alt="" src="/images/order_3.svg" width="22" height="11" />
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                        {/* Inner Tab Content */}
                                        <div className="tab-content mt-2 buy_sell_row_price futurestbllft">
                                            <div className='table_info_data'>



                                                {/* All Orders */}
                                                {activeInnerTab === "all_orders" && (
                                                    <div className="tab-pane show active toggle2" id="all_orders">
                                                        <div className="table_info_data">

                                                            {/* <div className="price_card_head">
                                                                <div className="ps-0">Price(USDT)</div><div>Quantity(BTC)</div><div>Total(USDT)</div></div> */}
                                                            <div className="scroll_y scroll_y_reverse">
                                                                {SellOrders?.length > 0 ?
                                                                    <table>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Price ({selectedCoin?.margin_asset || "---"})</th>
                                                                                <th>Size ({selectedCoin?.short_name || "---"})</th>
                                                                                <th>Sum ({selectedCoin?.short_name || "---"})</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {SellOrders?.length > 0 ? (
                                                                                SellOrders.map((item, idx) => {
                                                                                    const vol = item.remaining ?? item.size ?? 0;
                                                                                    const fillPercentage = maxSellVolume ? (vol / maxSellVolume) * 100 : 0;
                                                                                    return (
                                                                                        <tr
                                                                                            key={item?._id || `sell-${idx}`}
                                                                                            style={{
                                                                                                background: `linear-gradient(to left, ${orderBookColor?.sell} ${fillPercentage}%, transparent ${fillPercentage}%)`,
                                                                                            }}
                                                                                            className="cursor-pointer"
                                                                                            onClick={() => {
                                                                                                setLimitPrice(pricePrecision(item?.price));
                                                                                                setPercentage(0);
                                                                                            }}
                                                                                        >
                                                                                            <td className="danger">{pricePrecision(item?.price)}</td>
                                                                                            <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                                            <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <tr>
                                                                                    <td colSpan="12">
                                                                                        <div className="favouriteData lodericon d-flex justify-content-center align-items-center">
                                                                                            <div className="spinner-border" role="status"></div>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            )}


                                                                        </tbody>
                                                                    </table>
                                                                    : <div className="favouriteData lodericon d-flex justify-content-center align-items-center">
                                                                        <div className="spinner-border" role="status"></div>
                                                                    </div>}
                                                            </div>

                                                            <div className="mrkt_trde_tab justify-content-center">
                                                                <table>

                                                                    <tbody>


                                                                        {/* Total Row */}
                                                                        <tr className="totaltb">
                                                                            <td className="danger">{pricePrecision(selectedCoin?.buy_price)}</td>
                                                                            <td></td>
                                                                            <td>
                                                                                <div className="subtotal">
                                                                                    <div>
                                                                                        <span>%</span>
                                                                                        {toFixedFive(selectedCoin?.change_percentage)}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>

                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            <div className="price_card_body scroll_y">
                                                                {BuyOrders?.length > 0 ? <table>
                                                                    {/* <thead>
                                                                        <tr>
                                                                            <th>Price ({selectedCoin?.margin_asset || "---"})</th>
                                                                            <th>Size ({selectedCoin?.short_name || "---"})</th>
                                                                            <th>Sum ({selectedCoin?.short_name || "---"})</th>
                                                                        </tr>
                                                                    </thead> */}
                                                                    <tbody>

                                                                        {BuyOrders?.length > 0 ? (
                                                                            BuyOrders.map((item, idx) => {
                                                                                const vol = item.remaining ?? item.size ?? 0;
                                                                                const fillPercentage = maxBuyVolume ? (vol / maxBuyVolume) * 100 : 0;
                                                                                return (
                                                                                    <tr
                                                                                        key={item?._id || `buy-${idx}`}
                                                                                        style={{
                                                                                            background: `linear-gradient(to left, ${orderBookColor?.buy} ${fillPercentage}%, transparent ${fillPercentage}%)`,
                                                                                        }}
                                                                                        className="cursor-pointer"
                                                                                        onClick={() => {
                                                                                            setLimitPrice(pricePrecision(item?.price));
                                                                                            setPercentage(0);
                                                                                        }}
                                                                                    >
                                                                                        <td className="sucess">{pricePrecision(item?.price)}</td>
                                                                                        <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                                        <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            // <tr>
                                                                            //     <td colSpan="3">
                                                                            <div className="favouriteData d-flex justify-content-center align-items-center">
                                                                                <div className="spinner-border" role="status"></div>
                                                                            </div>
                                                                            //     </td>
                                                                            // </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table> :
                                                                    <div className="favouriteData lodericon d-flex justify-content-center align-items-center">
                                                                        <div className="spinner-border" role="status"></div>
                                                                    </div>}
                                                            </div>

                                                        </div>
                                                    </div>
                                                )}


                                                {/* Buy Orders */}
                                                {activeInnerTab === "buy_orders" && (
                                                    <div className="tab-pane show active" id="buy_orders">
                                                        <div className="table_info_data">

                                                            <div className="table-responsive">
                                                                {BuyOrders?.length > 0 ? <table>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Price ({selectedCoin?.margin_asset || "---"})</th>
                                                                            <th>Size ({selectedCoin?.short_name || "---"})</th>
                                                                            <th>Sum ({selectedCoin?.short_name || "---"})</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {BuyOrders?.length > 0 ? (
                                                                            BuyOrders.map((item, idx) => {
                                                                                const vol = item.remaining ?? item.size ?? 0;
                                                                                const fillPercentage = maxBuyVolume ? (vol / maxBuyVolume) * 100 : 0;
                                                                                return (
                                                                                    <tr
                                                                                        key={item?._id || `buy-${idx}`}
                                                                                        style={{
                                                                                            background: `linear-gradient(to left, ${orderBookColor?.buy} ${fillPercentage}%, transparent ${fillPercentage}%)`,
                                                                                        }}
                                                                                        className="cursor-pointer"
                                                                                        onClick={() => {
                                                                                            setLimitPrice(pricePrecision(item?.price));
                                                                                            setPercentage(0);
                                                                                        }}
                                                                                    >
                                                                                        <td className="sucess">{pricePrecision(item?.price)}</td>
                                                                                        <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                                        <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            // <tr>
                                                                            //     <td colSpan="3">
                                                                            <div className="favouriteData d-flex justify-content-center align-items-center">
                                                                                <div className="spinner-border" role="status"></div>
                                                                            </div>
                                                                            //     </td>
                                                                            // </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                                    : <div className="favouriteData lodericon d-flex justify-content-center align-items-center">
                                                                        <div className="spinner-border" role="status"></div>
                                                                    </div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}




                                                {/* Sell Orders */}
                                                {activeInnerTab === "sell_orders" && (
                                                    <div className="tab-pane show active" id="sell_orders">
                                                        <div className="table_info_data">
                                                            <div className="table-responsive">
                                                                {SellOrders?.length > 0 ?
                                                                    <table>
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Price ({selectedCoin?.margin_asset || "---"})</th>
                                                                                <th>Size ({selectedCoin?.short_name || "---"})</th>
                                                                                <th>Sum ({selectedCoin?.short_name || "---"})</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {SellOrders?.length > 0 ? (
                                                                                SellOrders.map((item, idx) => {
                                                                                    const vol = item.remaining ?? item.size ?? 0;
                                                                                    const fillPercentage = maxSellVolume ? (vol / maxSellVolume) * 100 : 0;
                                                                                    return (
                                                                                        <tr
                                                                                            key={item?._id || `sell-${idx}`}
                                                                                            style={{
                                                                                                background: `linear-gradient(to left, ${orderBookColor?.sell} ${fillPercentage}%, transparent ${fillPercentage}%)`,
                                                                                            }}
                                                                                            className="cursor-pointer"
                                                                                            onClick={() => {
                                                                                                setLimitPrice(pricePrecision(item?.price));
                                                                                                setPercentage(0);
                                                                                            }}
                                                                                        >
                                                                                            <td className="danger">{pricePrecision(item?.price)}</td>
                                                                                            <td>{qunaityPrecision(item?.remaining ?? item?.size)}</td>
                                                                                            <td>{toFixedFive(item?.sum ?? (item?.price * (item?.remaining ?? item?.size)))}</td>
                                                                                        </tr>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                // <tr>
                                                                                //     <td colSpan="3">
                                                                                <div className="favouriteData d-flex justify-content-center align-items-center">
                                                                                    <div className="spinner-border" role="status"></div>
                                                                                </div>
                                                                                //     </td>
                                                                                // </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table> : <div className="favouriteData d-flex justify-content-center align-items-center">
                                                                        <div className="spinner-border" role="status"></div>
                                                                    </div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>

                                        </div>
                                    </div>
                                )}

                                {/* RECENT TRADES */}
                                {activeMainTab === "trades" && (
                                    <div className="tab-pane show active mt-2" id="trades">
                                        <div className="table_info_data">
                                            <div className="table-responsive">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Price({selectedCoin?.margin_asset || "---"})</th>
                                                            <th>Amount({selectedCoin?.short_name || "---"})</th>
                                                            <th>Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {RecentTrade?.length > 0 ? (
                                                            RecentTrade.map((order) => (
                                                                <tr key={order.id}>
                                                                    <td className={order?.side === "BUY" ? "sucess" : "danger"}>
                                                                        {toFixedThree(order?.price)}
                                                                    </td>
                                                                    <td>{toFixedThree(order?.quantity)}</td>
                                                                    <td>{order?.time}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="3">
                                                                    <div className="no_data_s text-center">
                                                                        <div className="spinner-border text-secondary" role="status"></div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>



                    </div>

                    <div className={`relative_select_right ${showMobileOrderPanel ? 'mobile_order_panel_open' : ''}`}>
                        <button type="button" className="relative_select_right_mobile_close d-lg-none" onClick={() => setShowMobileOrderPanel(false)} aria-label="Close"><i className="ri-close-line"></i></button>
                        <div className="relative_select_right_mobile_tabs d-lg-none">
                            <button type="button" className={mobileOrderSide === 'buy' ? 'active' : ''} onClick={() => setMobileOrderSide('buy')}>Buy</button>
                            <button type="button" className={mobileOrderSide === 'sell' ? 'active' : ''} onClick={() => setMobileOrderSide('sell')}>Sell</button>
                        </div>
                        <div className="top_cross_dashboard">
                            <ul>
                                <li>
                                    <a href="#" data-bs-toggle="modal" data-bs-target="#cross">Cross <i className="ri-arrow-down-s-fill"></i></a>

                                    {/* <!-- Modal Start Margin  --> */}
                                    <div className="modal fade currency_popup_s crosstabs" id="cross" tabindex="-1"
                                        aria-labelledby="exampleModalLabel" aria-hidden="true">
                                        <div className="modal-dialog modal-dialog-centered">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <button type="button" className="btn-close" data-bs-dismiss="modal"
                                                        aria-label="Close"></button>
                                                </div>
                                                <div className="modal-body">

                                                    <h3>Margin Mode</h3>
                                                    <h4>{selectedCoin?.short_name}{selectedCoin?.margin_asset} <sup>Perp</sup></h4>
                                                    <div className='isolated_checked'>Isolated</div>
                                                    <p>* Changing the margin mode will only affect the contract you have selected.</p>
                                                    <p>* Cross Margin Mode: All positions that use the same margin asset share a combined balance. If liquidation occurs, the total balance of that asset, along with any other open positions under it, may be at risk.</p>
                                                    <p>* Isolated Margin Mode: Each position has its own dedicated margin, allowing you to control risk individually. If a position’s margin ratio reaches 100%, it will be liquidated. You can add or remove margin for each position while using this mode.</p>



                                                    <div className='bn-modal-footer d-flex btnsupport'>
                                                        <button className="bn-button verifybtn" data-bs-dismiss="modal">Got it</button>
                                                        {/* <button className="customerbtn">Customer Support</button> */}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>



                                    {/* <div className="modal fade currency_popup_s crosstabs" id="cross" tabindex="-1"
                                        aria-labelledby="exampleModalLabel" aria-hidden="true">
                                        <div className="modal-dialog modal-dialog-centered">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <button type="button" className="btn-close" data-bs-dismiss="modal"
                                                        aria-label="Close"></button>
                                                </div>
                                                <div className="modal-body">
                                                    <div className='user_identyid'>
                                                        <img src="/images/user_identy.svg" alt="copy icon" />
                                                    </div>
                                                    <h4>Identity Verification Required</h4>
                                                    <p>To comply with regulations, complete identity verification to access Binance Futures services.</p>
                                                    <div className='bn-modal-footer d-flex btnsupport'>
                                                        <button className="bn-button verifybtn">Verify Now</button>
                                                        <button className="customerbtn">Customer Support</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div> */}
                                    {/* <!-- Modal End --> */}

                                </li>
                                <li>
                                    <a href="#" data-bs-toggle="modal" data-bs-target="#twox">{Leverage}x <i className="ri-arrow-down-s-fill"></i></a>
                                    {/* <!-- Modal Start leverage --> */}
                                    <div className="modal fade currency_popup_s crosstabs" id="twox" tabindex="-1"
                                        aria-labelledby="exampleModalLabel" aria-hidden="true">
                                        <div className="modal-dialog modal-dialog-centered">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <button type="button" className="btn-close" data-bs-dismiss="modal"
                                                        aria-label="Close"></button>
                                                </div>
                                                <div className="modal-body">
                                                    <h3>Adjust Leverage</h3>

                                                    <div className='range_value'>
                                                        <h4>Leverage</h4>

                                                        <div className='range_valuebox'>
                                                            <div className='mines' onClick={handleDecrease}>-</div>
                                                            <div className='inputvalue'>
                                                                <input
                                                                    type='text'
                                                                    value={Leverage + 'x'}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </div>
                                                            <div className='plus' onClick={handleIncrease}>+</div>
                                                        </div>

                                                        {/* Progress Bar with Circle */}
                                                        <div
                                                            className='progress-bar'
                                                            onMouseDown={(e) => handleDrag(e)} // click से भी value बदलेगी
                                                            onMouseMove={(e) => e.buttons === 1 && handleDrag(e)} // drag के लिए
                                                        >
                                                            <div
                                                                className='progress-fill'
                                                                style={{ width: `${(Leverage / maxValue) * 100}%` }}
                                                            ></div>
                                                            <div
                                                                className='progress-thumb'
                                                                style={{ left: `${(Leverage / maxValue) * 100}%` }}
                                                            ></div>
                                                        </div>

                                                        <div className='value_selected'>
                                                            <ul>
                                                                {leverageOptions.map((val) => (
                                                                    <li key={val} onClick={() => handleSelectClick(val)}>
                                                                        {val}x
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    {/* <p>* Maximum position at current leverage: 50,000,000 USDT</p> */}
                                                    {/* <p>Please note that leverage changing will also apply for open positions and open orders.
                                                    </p> */}

                                                    <p className='redcolor'>* Selecting higher leverage such as [10x] increases your liquidation
                                                        risk. Always manage your risk levels. See our help article for more information.</p>
                                                    <div className='bn-modal-footer d-flex btnsupport'>
                                                        <button className="bn-button verifybtn" data-bs-dismiss="modal">Confirm</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* <!-- Modal End --> */}
                                </li>
                                {/* <li><a href="#" data-bs-toggle="modal" data-bs-target="#twox">S</a></li> */}
                            </ul>

                        </div>

                        <div className="spot_future_">
                            <ul>
                                {/* <li><a href="/trade/futures">Spot <i className="ri-external-link-line"></i></a></li> */}

                                {/* <li className="active"><a href="#">Futures</a></li> */}
                            </ul>
                        </div>
                        <div className="leverage_bl cursor-pointer" data-bs-toggle="modal" data-bs-target="#twox" >
                            <div>
                                <div className="rage_txt" >
                                    <img src="/images/futures_img/irage_icon.svg" alt="leverage" /> Leverage
                                </div>
                                <div className="range_price">{Leverage}x <img src="/images/futures_img/arrowright_dotted.svg" /></div>
                            </div>


                        </div>

                        <div className="market_spot_form">


                            <ul className="limit_tabs">
                                <li
                                    className={`nav-item positions_two ${activeLimitTab === "positions_two" ? "active" : ""}`}
                                    role="presentation"
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveLimitTab("positions_two");
                                            setOrderType("Limit");
                                            setShowTpSlOption(false);
                                            setQuantity("");
                                            setPercentage(0);
                                        }}
                                    >
                                        Limit
                                    </button>
                                </li>
                                <li
                                    className={`nav-item open_two ${activeLimitTab === "open_two" ? "active" : ""}`}
                                    role="presentation"
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveLimitTab("open_two");
                                            setOrderType("Market");
                                            setShowTpSlOption(false);
                                            setQuantity("");
                                            setPercentage(0);
                                        }}
                                    >
                                        Market
                                    </button>
                                </li>

                            </ul>
                            {/* 

                            <ul className="nav nav-tabs" id="orderTabs" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link active" id="limit-tab" data-bs-toggle="tab" data-bs-target="#limit"
                                        type="button" role="tab" aria-controls="limit" aria-selected="true" onClick={() => { setOrderType("Limit"); setShowTpSlOption(false); setQuantity(""); setPercentage(0) }}>
                                        Limit
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="market-tab" data-bs-toggle="tab" data-bs-target="#market"
                                        type="button" role="tab" aria-controls="market" aria-selected="false" onClick={() => { setOrderType("Market"); setShowTpSlOption(false); setQuantity(""); setPercentage(0) }}>
                                        Market
                                    </button>
                                </li>
                            </ul> */}


                            <div className={`cnt_table_two positions_two ${activeLimitTab === "positions_two" ? "active" : ""}`}>
                                <form className="price_info">
                                    <div className="price_inputbl">
                                        <label>Price</label>
                                        <div className="price_select_option">
                                            <input className="inputtype" type="number" placeholder="Price" value={limitPrice} onWheel={(e) => e.target.blur()} step={getTickSize(selectedCoin)} min={getTickSize(selectedCoin)} onChange={(e) => { setLimitPrice(pricePrecision(+e.target.value)); setPercentage(0) }} />
                                            <select>
                                                <option>{selectedCoin?.margin_asset}</option>
                                                {/* <option>BTC</option> */}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="price_inputbl">
                                        <label>Size <span className="btctoggle">({selectedCoin?.short_name})

                                        </span></label>
                                        <div className="price_select_option">
                                            <input className="inputtype" type="number" placeholder="Size" value={quantity} onWheel={(e) => e.target.blur()} step={getStepSize(selectedCoin)} min={getStepSize(selectedCoin)} onChange={(e) => { setQuantity(qunaityPrecision(+e.target.value)); setPercentage(0) }} />
                                            <select>
                                                <option>{selectedCoin?.short_name}</option>
                                                {/* <option>BTC</option> */}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="price_inputbl value_choose process_step">
                                        <ul>
                                            {[20, 40, 60, 80, 100].map((perc) => (
                                                <li><button type='button' className={percentage === perc && "active"} onClick={() => computeQuantityFromBalance(perc)}>{perc}%</button></li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="price_inputbl">
                                        <div className="avail_total_usd">
                                            <label>Avail.</label>
                                            <div className="usd_price">{toFixedFive(balance?.quoteCurrency)} {selectedCoin?.margin_asset}</div>
                                        </div>
                                    </div>
                                    <div className="price_inputbl">
                                        <div className="tpsl_reduce d-flex gap-1">
                                            <div className="form-check">
                                                <div className='tpsltabs'>
                                                    <input className="form-check-input" type="checkbox" id="tp-sl" checked={showTpSlOption} onChange={(e) => setShowTpSlOption(e.target.checked)} />
                                                    <label className="form-check-label" for="tp-sl">TP/SL</label>
                                                </div>

                                                {/* <!-- TP/SL ON CLICK CONTENT COMMENT START --> */}

                                                {showTpSlOption &&
                                                    <div className='tp_sl_option'>
                                                        <div className="price_inputbl">
                                                            <label>Take Profit</label>
                                                            <div className="price_select_option">
                                                                <input className="inputtype" type="number" placeholder="PnL" onWheel={(e) => e.target.blur()} value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
                                                                <select>
                                                                    <option>PnL</option>
                                                                    {/* <option>Lst</option> */}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="price_inputbl">
                                                            <label>Stop Loss</label>
                                                            <div className="price_select_option">
                                                                <input
                                                                    className="inputtype"
                                                                    type="number"
                                                                    placeholder="PnL"
                                                                    onWheel={(e) => e.target.blur()}
                                                                    value={stopLoss}
                                                                    onChange={(e) => {
                                                                        let val = Number(e.target.value);
                                                                        if (isNaN(val)) {
                                                                            setStopLoss(""); // allow clearing input
                                                                        } else {
                                                                            setStopLoss(val > 0 ? -val : val); // always keep negative
                                                                        }
                                                                    }}
                                                                />

                                                                <select>
                                                                    <option>PnL</option>
                                                                    {/* <option>Lst</option> */}
                                                                </select>
                                                            </div>
                                                        </div>

                                                    </div>
                                                }
                                                {/* <!-- TP/SL ON CLICK CONTENT COMMENT END --> */}

                                            </div>


                                        </div>
                                    </div>
                                    <div className="price_inputbl">
                                        <div className="buysell_btn d-flex gap-2 align-items-center">
                                            {!token ? (
                                                <button className="buybtn" type="button" onClick={() => loginScreen()}>
                                                    Login
                                                </button>
                                            ) : (balance?.quoteCurrency < futuresRisk?.cost || quantity <= 0 ||
                                                (orderType === "Limit" && limitPrice <= 0)) ? (
                                                <button
                                                    className="buybtn"
                                                    type="button"
                                                    onClick={() => {
                                                        validateOrder({
                                                            balance: balance?.quoteCurrency || 0,
                                                            futuresRisk,
                                                            quantity,
                                                            orderType,
                                                            limitPrice,
                                                        });
                                                    }}
                                                >
                                                    Buy/Long
                                                </button>

                                            ) : (
                                                <button className="buybtn" type="button" onClick={() => placeFutureOrder("LONG")}>
                                                    Buy/Long
                                                </button>
                                            )}

                                            {!token ? (
                                                <button className="sellbtn" type="button" onClick={() => loginScreen()}>
                                                    Login
                                                </button>
                                            ) : (balance?.quoteCurrency < futuresRisk?.cost || quantity <= 0 ||
                                                (orderType === "Limit" && limitPrice <= 0)) ? (
                                                <button
                                                    className="sellbtn"
                                                    type="button"
                                                    onClick={() => {
                                                        validateOrder({
                                                            balance: balance?.quoteCurrency || 0,
                                                            futuresRisk,
                                                            quantity,
                                                            orderType,
                                                            limitPrice,
                                                        });
                                                    }}
                                                >
                                                    Sell/Short
                                                </button>

                                            ) : (
                                                <button className="sellbtn" type="button" onClick={() => placeFutureOrder("SHORT")}>
                                                    Sell/Short
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="price_inputbl  mt-2">

                                        <div className="d-flex justify-content-between costbtc_total liq_price">
                                            <div className="d-flex align-items-center">
                                                <h5>Liq Price <span> {futuresRisk?.shortLiq || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Liq Price <span> {futuresRisk?.longLiq || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between costbtc_total">
                                            <div className="d-flex align-items-center">
                                                <h5>Cost <span>{futuresRisk?.cost || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Cost <span>{futuresRisk?.cost || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between costbtc_total">
                                            <div className="d-flex align-items-center">
                                                <h5>Max long <span> NL</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Max short <span> NL</span></h5>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between costbtc_total">
                                            <div className="d-flex align-items-center">
                                                <h5>Taker Fee <span> {selectedCoin?.taker_fee || "---"}%</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Maker Fee <span> {selectedCoin?.maker_fee || "---"}%</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className={`cnt_table_two open_two ${activeLimitTab === "open_two" ? "active" : ""}`}>
                                <form className="price_info">
                                    <div className="price_inputbl">
                                        <label>Price</label>
                                        <div className="price_select_option">
                                            <input className="inputtype" type="text" placeholder="Market Price" disabled />
                                            <select>
                                                <option>{selectedCoin?.margin_asset}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="price_inputbl">
                                        <label>Amount <span className="btctoggle">({selectedCoin?.short_name}) <img
                                            src="/images/futures_img/arrowright_dotted.svg" /></span></label>
                                        <div className="price_select_option">
                                            <input className="inputtype" type="number" placeholder="Size" value={quantity} onWheel={(e) => e.target.blur()} step={getStepSize(selectedCoin)} min={getStepSize(selectedCoin)} onChange={(e) => { setQuantity(qunaityPrecision(+e.target.value)); setPercentage(0) }} />                                                <select>
                                                <option>{selectedCoin?.short_name}</option>
                                                {/* <option>USDT</option> */}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="price_inputbl value_choose">
                                        <ul>
                                            {[20, 40, 60, 80, 100].map((perc) => (
                                                <li><button type='button' className={percentage === perc && "active"} onClick={() => computeQuantityFromBalance(perc)}>{perc}%</button></li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="price_inputbl">
                                        <div className="avail_total_usd">
                                            <label>Avail.</label>
                                            <div className="usd_price">{toFixedFive(balance?.quoteCurrency)} {selectedCoin?.margin_asset}</div>
                                        </div>
                                    </div>
                                    <div className="price_inputbl">
                                        <div className="tpsl_reduce d-flex gap-3">
                                            <div className="form-check">
                                                <div className='tpsltabs'>
                                                    <input className="form-check-input" type="checkbox" id="tp-sl" checked={showTpSlOption} onChange={(e) => setShowTpSlOption(e.target.checked)} />
                                                    <label className="form-check-label" for="tp-sl">TP/SL</label>
                                                </div>
                                            </div>

                                            {showTpSlOption &&
                                                <div className='tp_sl_option'>
                                                    <div className="price_inputbl">
                                                        <label>Take Profit</label>
                                                        <div className="price_select_option">
                                                            <input className="inputtype" type="number" placeholder="PnL" onWheel={(e) => e.target.blur()} value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
                                                            <select>
                                                                <option>PnL</option>
                                                                {/* <option>Lst</option> */}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="price_inputbl">
                                                        <label>Stop Loss</label>
                                                        <div className="price_select_option">
                                                            <input
                                                                className="inputtype"
                                                                type="number"
                                                                placeholder="PnL"
                                                                onWheel={(e) => e.target.blur()}
                                                                value={stopLoss}
                                                                onChange={(e) => {
                                                                    let val = Number(e.target.value);
                                                                    if (isNaN(val)) {
                                                                        setStopLoss(""); // allow clearing input
                                                                    } else {
                                                                        setStopLoss(val > 0 ? -val : val); // always keep negative
                                                                    }
                                                                }}
                                                            />
                                                            <select>
                                                                <option>PnL</option>
                                                                {/* <option>Lst</option> */}
                                                            </select>
                                                        </div>
                                                    </div>

                                                </div>
                                            }




                                            {/* <div className="form-check">
                                                    <input className="form-check-input" type="checkbox" id="reduce-only" />
                                                    <label className="form-check-label" for="reduce-only">Reduce only</label>
                                                </div> */}
                                        </div>
                                    </div>
                                    <div className="price_inputbl">
                                        <div className="buysell_btn d-flex gap-2 align-items-center">
                                            {!token ? (
                                                <button className="buybtn" type="button" onClick={() => loginScreen()}>
                                                    Login
                                                </button>
                                            ) : (balance?.quoteCurrency < futuresRisk?.cost || quantity <= 0 ||
                                                (orderType === "Limit" && limitPrice <= 0)) ? (
                                                <button
                                                    className="buybtn"
                                                    type="button"
                                                    onClick={() => {
                                                        validateOrder({
                                                            balance: balance?.quoteCurrency || 0,
                                                            futuresRisk,
                                                            quantity,
                                                            orderType,
                                                            limitPrice,
                                                        });
                                                    }}
                                                >
                                                    Buy/Long
                                                </button>

                                            ) : (
                                                <button className="buybtn" type="button" onClick={() => placeFutureOrder("LONG")}>
                                                    Buy/Long
                                                </button>
                                            )}

                                            {!token ? (
                                                <button className="sellbtn" type="button" onClick={() => loginScreen()}>
                                                    Login
                                                </button>
                                            ) : (balance?.quoteCurrency < futuresRisk?.cost || quantity <= 0 ||
                                                (orderType === "Limit" && limitPrice <= 0)) ? (
                                                <button
                                                    className="sellbtn"
                                                    type="button"
                                                    onClick={() => {
                                                        validateOrder({
                                                            balance: balance?.quoteCurrency || 0,
                                                            futuresRisk,
                                                            quantity,
                                                            orderType,
                                                            limitPrice,
                                                        });
                                                    }}
                                                >
                                                    Sell/Short
                                                </button>

                                            ) : (
                                                <button className="sellbtn" type="button" onClick={() => placeFutureOrder("SHORT")}>
                                                    Sell/Short
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="price_inputbl  mt-2">

                                        <div className="d-flex justify-content-between costbtc_total liq_price">
                                            <div className="d-flex align-items-center">
                                                <h5>Liq Price <span> {futuresRisk?.shortLiq || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Liq Price <span> {futuresRisk?.longLiq || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between costbtc_total">
                                            <div className="d-flex align-items-center">
                                                <h5>Cost <span>{futuresRisk?.cost || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Cost <span>{futuresRisk?.cost || "---"} {selectedCoin?.margin_asset}</span></h5>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between costbtc_total">
                                            <div className="d-flex align-items-center">
                                                <h5>Max long <span> NL</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Max short <span> NL</span></h5>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between costbtc_total">
                                            <div className="d-flex align-items-center">
                                                <h5>Taker Fee <span> {selectedCoin?.taker_fee || "---"}%</span></h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h5>Maker Fee <span> {selectedCoin?.maker_fee || "---"}%</span></h5>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                         
                        </div>
                    </div>
                </div>

                <div className="trade_account_summary_assets futuresflex">

                    <div className="trade_summary_table_lft mt-0 position_order">

                            <ul className="position_list">
                                <li
                                    className={`nav-item positions ${activePositionTab === "positions" ? "active" : ""}`}
                                    role="presentation"
                                >
                                    <button type="button" onClick={(e) => { e.preventDefault(); setActivePositionTab("positions"); }}>Positions({openPositions?.length || 0})</button>
                                </li>
                                <li
                                    className={`nav-item open ${activePositionTab === "open" ? "active" : ""}`}
                                    role="presentation"
                                >
                                    <button type="button" onClick={(e) => { e.preventDefault(); setActivePositionTab("open"); }}>Open Orders({OpenOrders?.length || 0})</button>
                                </li>
                                <li
                                    className={`nav-item order_history ${activePositionTab === "order_history" ? "active" : ""}`}
                                    role="presentation"
                                >
                                    <button type="button" onClick={(e) => { e.preventDefault(); setActivePositionTab("order_history"); }}>Order History</button>
                                </li>
                                <li
                                    className={`nav-item exercise_history ${activePositionTab === "exercise_history" ? "active" : ""}`}
                                    role="presentation"
                                >
                                    <button type="button" onClick={(e) => { e.preventDefault(); setActivePositionTab("exercise_history"); }}>Trade History</button>
                                </li>
                                <li
                                    className={`nav-item position_history ${activePositionTab === "position_history" ? "active" : ""}`}
                                    role="presentation"
                                >
                                    <button type="button" onClick={(e) => { e.preventDefault(); setActivePositionTab("position_history"); }}>Position History</button>
                                </li>
                            </ul>
                            <div className={`cnt_table positions ${activePositionTab === "positions" ? "active" : ""}`}>
                                <div className="desktop_view2">
                                    <div className="table-responsive">
                                        {openPositions?.length > 0 ?
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Symbol</th>
                                                        <th>Size</th>
                                                        <th>Entry Price</th>
                                                        <th>Mark Price</th>
                                                        <th>Liq. Price</th>
                                                        <th>Isolated Margin</th>
                                                        <th>Maintenance Margin</th>
                                                        <th>PNL</th>
                                                        <th className='yellowcolor'>MKT Close</th>
                                                        {/* <th>Reverse</th> */}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {openPositions?.map((pos) => {
                                                        const oppositeSide = pos.side === "LONG" ? "SHORT" : "LONG";

                                                        const handleReverse = () => {
                                                            // place double quantity opposite order
                                                            placeReverseOrder(oppositeSide, pos.quantity, pos.leverage, pos._id, pos.side, pos.pair_id);
                                                        };


                                                        return (
                                                            <tr key={pos._id}>
                                                                <td className={pos?.side === "LONG" ? "text-green" : "text-red"}>
                                                                    {pos.symbol}
                                                                    <div className='fulltbl'>
                                                                        <span className='subtxt'>Perp </span>
                                                                        <span className='subtxt'>{pos.leverage}x</span>
                                                                    </div>
                                                                </td>
                                                                <td >{toFixedFive(pos.quantity)} {pos.baseCurrency} </td>
                                                                <td>{toFixedFive(pos.entryPrice)}</td>
                                                                <td>{toFixedFive(pos.lastMarkPrice)}</td>
                                                                <td>{toFixedFive(pos.liquidationPrice) || "---"}</td>
                                                                <td >{toFixedFive(pos.isolatedMargin)} {pos.marginAsset || "USDT"} (Cross)</td>
                                                                <td>{toFixedFive(pos.maintenanceMargin)} {pos.marginAsset || "USDT"}</td>
                                                                <td className={pos.unrealizedPnl >= 0 ? "text-green" : "text-red"}>{toFixedFive(pos.unrealizedPnl)} </td>
                                                                <td>
                                                                    <button type='button' onClick={() => closePosition(pos._id)}>Market Close</button>
                                                                </td>
                                                                {/* <td>
                                                                <button className='reverse' type='button' onClick={handleReverse}>Reverse</button>
                                                            </td> */}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table> : <tr rowSpan="5" className="no-data-row">
                                                <td colSpan="12">
                                                    <div className="no-data-wrapper">
                                                        <div className="no_data_s">
                                                            <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>}

                                    </div>
                                </div>

                                <div className='order_history_mobile_view'>
                                    {openPositions?.length > 0 ? (
                                        <div className='d-flex flex-column gap-2'>
                                            {openPositions.map((pos) => (
                                                <div key={pos._id} className='d-flex'>
                                                    <div className='order_datalist'>
                                                        <ul className='listdata'>
                                                            <li>
                                                                <span className='date'>Symbol</span>
                                                                <span className={`date_light ${pos?.side === "LONG" ? "text-green" : "text-red"}`}>{pos.symbol} Perp {pos.leverage}x</span>
                                                            </li>
                                                            <li>
                                                                <span>Size</span>
                                                                <span>{toFixedFive(pos.quantity)} {pos.baseCurrency}</span>
                                                            </li>
                                                            <li>
                                                                <span>Entry Price</span>
                                                                <span>{toFixedFive(pos.entryPrice)}</span>
                                                            </li>
                                                            <li>
                                                                <span>Mark Price</span>
                                                                <span>{toFixedFive(pos.lastMarkPrice)}</span>
                                                            </li>
                                                            <li>
                                                                <span>Liq. Price</span>
                                                                <span>{toFixedFive(pos.liquidationPrice) || "---"}</span>
                                                            </li>
                                                            <li>
                                                                <span>Isolated Margin</span>
                                                                <span>{toFixedFive(pos.isolatedMargin)} {pos.marginAsset || "USDT"}</span>
                                                            </li>
                                                            <li>
                                                                <span>PNL</span>
                                                                <span className={pos.unrealizedPnl >= 0 ? "text-green" : "text-red"}>{toFixedFive(pos.unrealizedPnl)}</span>
                                                            </li>
                                                            <li>
                                                                <span className='yellowcolor'>Action</span>
                                                                <span><button type='button' className='market-close' onClick={() => closePosition(pos._id)}>Market Close</button></span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-data-wrapper py-4">
                                            <div className="no_data_s">
                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                            </div>
                                        </div>
                                    )}
                                </div>


                            </div>

                            <div className={`cnt_table open ${activePositionTab === "open" ? "active" : ""}`}>
                                <div className="desktop_view2">
                                    <div className="table-responsive">
                                        {OpenOrders?.length > 0 ?
                                            <table>

                                                <thead>
                                                    <tr>
                                                        <th>Time</th>
                                                        <th>Symbol</th>
                                                        <th>Type</th>
                                                        <th>Side</th>
                                                        <th>Price</th>
                                                        <th>Average</th>
                                                        <th>Amount</th>
                                                        <th>Filled</th>
                                                        <th>Reduce Only</th>
                                                        <th>Post Only</th>
                                                        <th>Trigger Conditi ons</th>
                                                        <th>TP/SL</th>
                                                        <th>TIF</th>
                                                        <th className='yellowcolor'>Cancel All</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(
                                                        OpenOrders.map((order) => {
                                                            // Determine trigger condition display
                                                            let triggerCondition = "---";
                                                            if (order.isSL && order.positionSide) {
                                                                triggerCondition =
                                                                    order.positionSide === "LONG"
                                                                        ? `<= ${pricePrecision(order.price)}`
                                                                        : `>= ${pricePrecision(order.price)}`;
                                                            } else if (order.isTP && order.positionSide) {
                                                                triggerCondition =
                                                                    order.positionSide === "LONG"
                                                                        ? `>=  ${pricePrecision(order.price)}`
                                                                        : `<= ${pricePrecision(order.price)}`;
                                                            }

                                                            return (
                                                                <tr key={order._id}>
                                                                    {/* Time */}
                                                                    <td>
                                                                        {new Date(order.createdAt).toLocaleDateString()}{" "}
                                                                        <span className="time">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                                    </td>

                                                                    {/* Symbol */}
                                                                    <td>
                                                                        {order.symbol}
                                                                        <div className="fulltbl">
                                                                            <span className="subtxt">Perp </span>
                                                                        </div>
                                                                    </td>

                                                                    {/* Type */}
                                                                    <td>{order.type} {order.isTP ? "TAKE PROFIT" : order.isSL ? "STOP LOSS" : ""}</td>

                                                                    {/* Side */}
                                                                    <td className={order.side === "LONG" ? "greencolor" : "redcolor"}>
                                                                        {order.side === "LONG" ? "Buy" : "Sell"}
                                                                    </td>

                                                                    {/* Price */}
                                                                    <td>
                                                                        {!order.isTP && !order.isSL
                                                                            ? order.price
                                                                                ? pricePrecision(order.price)
                                                                                : "-"
                                                                            : "---"}
                                                                    </td>

                                                                    {/* Avg Filled Price */}
                                                                    <td>{pricePrecision(order.avgFillPrice) || "---"}</td>

                                                                    {/* Amount / Quantity */}
                                                                    <td>{order.quantity} {order.baseCurrency}</td>

                                                                    {/* Filled */}
                                                                    <td>{order.filledQty || 0} {order.baseCurrency}</td>

                                                                    {/* Reduce Only */}
                                                                    <td>{order.reduceOnly ? "Yes" : "No"}</td>

                                                                    {/* Post Only */}
                                                                    <td>{order.postOnly ? "Yes" : "No"}</td>

                                                                    {/* Trigger Conditions */}
                                                                    <td>{triggerCondition}</td>

                                                                    {/* TP/SL */}
                                                                    <td className={order.isTP ? "text-green" : order.isSL ? "text-red" : ""}>
                                                                        {order.isTP
                                                                            ? pricePrecision(order.takeProfitPnl)
                                                                            : order.isSL
                                                                                ? pricePrecision(order.stopLossPnl)
                                                                                : "---"}
                                                                    </td>


                                                                    {/* TIF */}
                                                                    <td>{order.timeInForce || "GTC"}</td>

                                                                    {/* Cancel / Action */}
                                                                    <td className="yellowcolor">
                                                                        <button type='button' onClick={() => cancelFutureOrder(order?.orderId)}>
                                                                            Cancel <i className="ri-delete-bin-6-line"></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>

                                            </table> : <tr rowSpan="5" className="no-data-row">
                                                <td colSpan="12">
                                                    <div className="no-data-wrapper">
                                                        <div className="no_data_s">
                                                            <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    </div>
                                </div>

                                <div className='order_history_mobile_view'>
                                    {OpenOrders?.length > 0 ? (
                                        <div className='d-flex flex-column gap-2'>
                                            {OpenOrders.map((order) => {
                                                let triggerCondition = "---";
                                                if (order.isSL && order.positionSide) {
                                                    triggerCondition = order.positionSide === "LONG" ? `<= ${pricePrecision(order.price)}` : `>= ${pricePrecision(order.price)}`;
                                                } else if (order.isTP && order.positionSide) {
                                                    triggerCondition = order.positionSide === "LONG" ? `>= ${pricePrecision(order.price)}` : `<= ${pricePrecision(order.price)}`;
                                                }
                                                return (
                                                    <div key={order._id} className='d-flex'>
                                                        <div className='order_datalist'>
                                                            <ul className='listdata'>
                                                                <li>
                                                                    <span className='date'>Date</span>
                                                                    <span className='date_light'>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Time</span>
                                                                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Symbol</span>
                                                                    <span>{order.symbol} Perp</span>
                                                                </li>
                                                                <li>
                                                                    <span>Type</span>
                                                                    <span>{order.type} {order.isTP ? "TAKE PROFIT" : order.isSL ? "STOP LOSS" : ""}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Side</span>
                                                                    <span className={order.side === "LONG" ? "text-green" : "text-red"}>{order.side === "LONG" ? "Buy" : "Sell"}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Price</span>
                                                                    <span>{!order.isTP && !order.isSL && order.price ? pricePrecision(order.price) : "---"}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Average</span>
                                                                    <span>{pricePrecision(order.avgFillPrice) || "---"}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Amount</span>
                                                                    <span>{order.quantity} {order.baseCurrency}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Filled</span>
                                                                    <span>{order.filledQty || 0} {order.baseCurrency}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Trigger</span>
                                                                    <span>{triggerCondition}</span>
                                                                </li>
                                                                <li>
                                                                    <span className='yellowcolor'>Action</span>
                                                                    <span><button type='button' className='market-close' onClick={() => cancelFutureOrder(order?.orderId)}>Cancel <i className="ri-delete-bin-6-line"></i></button></span>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="no-data-wrapper py-4">
                                            <div className="no_data_s">
                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                            </div>
                                        </div>
                                    )}
                                </div>


                            </div>

                            <div className={`cnt_table order_history ${activePositionTab === "order_history" ? "active" : ""}`}>
                                <div className="desktop_view2">
                                    <div className="table-responsive">
                                        {ordersHistory?.length > 0 ? <table>
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Symbol</th>
                                                    <th>Type</th>
                                                    <th>Side</th>
                                                    <th>Price</th>
                                                    <th>Average</th>
                                                    <th>Amount</th>
                                                    <th>Filled</th>
                                                    <th>Reduce Only</th>
                                                    <th>TP/SL</th>
                                                    <th>Status</th>
                                                    <th className="yellowcolor">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ordersHistory.map((order) => (
                                                    <tr key={order._id}>
                                                        {/* Time */}
                                                        <td>
                                                            {new Date(order.createdAt).toLocaleDateString()}{" "}
                                                            <span className="time">
                                                                {new Date(order.createdAt).toLocaleTimeString()}
                                                            </span>
                                                        </td>

                                                        {/* Symbol */}
                                                        <td>
                                                            {order.symbol}
                                                            <div className="fulltbl">
                                                                <span className="subtxt">Perp</span>
                                                            </div>
                                                        </td>

                                                        {/* Type */}
                                                        <td>{order.type}</td>

                                                        {/* Side */}
                                                        <td className={order.side === "LONG" ? "text-green" : "text-red"}>
                                                            {order.side === "LONG" ? "Buy" : "Sell"}
                                                        </td>

                                                        {/* Price */}
                                                        <td>
                                                            {order.price
                                                                ? toFixedFive(order.price)
                                                                : "---"}
                                                        </td>
                                                        <td>
                                                            {order.avgFillPrice
                                                                ? toFixedFive(order.avgFillPrice)
                                                                : "-"}
                                                        </td>

                                                        {/* Amount */}
                                                        <td>
                                                            {toFixedFive(order.quantity)} {order.baseCurrency}
                                                        </td>

                                                        {/* Filled */}
                                                        <td>
                                                            {toFixedFive(order.filledQty)} {order.baseCurrency}
                                                        </td>

                                                        {/* Reduce Only */}
                                                        <td>{order.reduceOnly ? "Yes" : "No"}</td>


                                                        {/* TP/SL */}
                                                        <td>
                                                            {order.isTP ? "TP" : order.isSL ? "SL" : "--"}
                                                        </td>

                                                        {/* Status */}
                                                        <td className={order.status ? "text-green" : "text-red"}>{order.status}</td>

                                                        {/* Error  */}
                                                        <td className="yellowcolor">
                                                            {order.error || "---"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table> : <tr rowSpan="5" className="no-data-row">
                                            <td colSpan="12">
                                                <div className="no-data-wrapper">
                                                    <div className="no_data_s">
                                                        <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>}
                                    </div>
                                    {ordersHistory?.length > 0 && activePositionTab === "order_history" && (
                                        <div className="hVPalX gap-2 d-flex justify-content-end align-items-center mt-2">
                                            <span className="text-white">{historySkip + 1}-{Math.min(historySkip + HISTORY_LIMIT, totalOrderHistory)} of {totalOrderHistory}</span>
                                            <div className="sc-eAKtBH gVtWSU d-flex gap-1">
                                                <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('first')}>
                                                    <i className="ri-skip-back-fill text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('prev')}>
                                                    <i className="ri-arrow-left-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('next')}>
                                                    <i className="ri-arrow-right-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('last')}>
                                                    <i className="ri-skip-forward-fill text-white"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='order_history_mobile_view'>
                                    {ordersHistory?.length > 0 ? (
                                        <div className='d-flex flex-column gap-2'>
                                            {ordersHistory.map((order) => {
                                                const orderId = order._id;
                                                const orderDate = new Date(order.createdAt);
                                                return (
                                                    <div key={orderId} className='d-flex'>
                                                        <div className='order_datalist'>
                                                            <ul className='listdata'>
                                                                <li>
                                                                    <span className='date'>Date</span>
                                                                    <span className='date_light'>{orderDate.toLocaleDateString()}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Time</span>
                                                                    <span>{orderDate.toLocaleTimeString()}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Symbol</span>
                                                                    <span>{order.symbol}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Side</span>
                                                                    <span className={order.side === "LONG" ? "text-green" : "text-red"}>{order.side === "LONG" ? "Buy" : "Sell"}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Price</span>
                                                                    <span>{order.price ? toFixedFive(order.price) : "---"}</span>
                                                                </li>
                                                                {showAllListItems[orderId] && (
                                                                    <>
                                                                        <li>
                                                                            <span>Average</span>
                                                                            <span>{order.avgFillPrice ? toFixedFive(order.avgFillPrice) : "-"}</span>
                                                                        </li>
                                                                        <li>
                                                                            <span>Amount</span>
                                                                            <span>{toFixedFive(order.quantity)} {order.baseCurrency}</span>
                                                                        </li>
                                                                        <li>
                                                                            <span>Filled</span>
                                                                            <span>{toFixedFive(order.filledQty)} {order.baseCurrency}</span>
                                                                        </li>
                                                                        <li>
                                                                            <span>Reduce Only</span>
                                                                            <span>{order.reduceOnly ? "Yes" : "No"}</span>
                                                                        </li>
                                                                        <li>
                                                                            <span>TP/SL</span>
                                                                            <span>{order.isTP ? "TP" : order.isSL ? "SL" : "--"}</span>
                                                                        </li>
                                                                        <li>
                                                                            <span>Status</span>
                                                                            <span className={order.status ? "text-success" : "text-danger"}>{order.status}</span>
                                                                        </li>
                                                                        <li>
                                                                            <span>Description</span>
                                                                            <span className="yellowcolor">{order.error || "---"}</span>
                                                                        </li>
                                                                    </>
                                                                )}
                                                            </ul>
                                                            <button
                                                                type="button"
                                                                className="view_more_btn"
                                                                onClick={() => setShowAllListItems({ ...showAllListItems, [orderId]: !showAllListItems[orderId] })}
                                                            >
                                                                {showAllListItems[orderId] ? <i className="ri-arrow-down-s-line"></i> : <i className="ri-arrow-up-s-line"></i>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="no-data-wrapper py-4">
                                            <div className="no_data_s">
                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                            </div>
                                        </div>
                                    )}
                                    {ordersHistory?.length > 0 && activePositionTab === "order_history" && (
                                        <div className="hVPalX d-flex flex-row justify-content-center align-items-center gap-0 flex-wrap mt-2">
                                            <span className="text-white">{historySkip + 1}-{Math.min(historySkip + HISTORY_LIMIT, totalOrderHistory)} of {totalOrderHistory}</span>
                                            <div className="sc-eAKtBH gVtWSU d-flex flex-row gap-1">
                                                <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('first')}>
                                                    <i className="ri-skip-back-fill text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('prev')}>
                                                    <i className="ri-arrow-left-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('next')}>
                                                    <i className="ri-arrow-right-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('last')}>
                                                    <i className="ri-skip-forward-fill text-white"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                            <div className={`cnt_table exercise_history ${activePositionTab === "exercise_history" ? "active" : ""}`}>
                                <div className="desktop_view2">
                                    <div className="table-responsive">
                                        {tradeHistory.length > 0 ? <table>
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Symbol</th>
                                                    <th>Type</th>
                                                    <th>Side</th>
                                                    <th>Price</th>
                                                    <th>Amount</th>
                                                    <th>Fee</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(
                                                    tradeHistory.map((trade) => {
                                                        const createdAt = new Date(trade.createdAt);
                                                        const date = createdAt.toISOString().split("T")[0];
                                                        const time = createdAt.toTimeString().split(" ")[0];

                                                        return (
                                                            <tr key={trade._id}>
                                                                {/* Time */}
                                                                <td>
                                                                    {date} <span className="time">{time}</span>
                                                                </td>

                                                                {/* Symbol */}
                                                                <td className={trade.side === "LONG" ? "text-green" : "text-red"}>
                                                                    {trade.symbol}
                                                                    <div className="fulltbl">
                                                                        <span className="subtxt">Perp</span>
                                                                    </div>
                                                                </td>

                                                                {/* Order Type */}
                                                                <td>{trade.role === "TAKER" ? "Market" : "Limit"}</td>

                                                                {/* Side */}
                                                                <td className={trade.side === "LONG" ? "text-green" : "text-red"}>
                                                                    {trade.side === "LONG" ? "BUY" : "SELL"}
                                                                </td>

                                                                {/* Price */}
                                                                <td>
                                                                    {toFixedFive(trade.price)}{" "}
                                                                </td>

                                                                {/* Amount */}
                                                                <td>
                                                                    {toFixedFive(trade.quantity)}{" "}
                                                                </td>

                                                                {/* Fee */}
                                                                <td>{toFixedFive(trade.fee)}</td>


                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table> : <tr rowSpan="5" className="no-data-row">
                                            <td colSpan="12">
                                                <div className="no-data-wrapper">
                                                    <div className="no_data_s">
                                                        <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>}

                                    </div>
                                    {tradeHistory?.length > 0 && activePositionTab === "exercise_history" && (
                                        <div className="hVPalX d-flex flex-row justify-content-center align-items-center gap-0 flex-wrap mt-2">
                                            <span className="text-white">{historySkip + 1}-{Math.min(historySkip + HISTORY_LIMIT, totalTradeHistory)} of {totalTradeHistory}</span>
                                            <div className="sc-eAKtBH gVtWSU d-flex flex-row gap-1">
                                                <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('first')}>
                                                    <i className="ri-skip-back-fill text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('prev')}>
                                                    <i className="ri-arrow-left-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('next')}>
                                                    <i className="ri-arrow-right-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('last')}>
                                                    <i className="ri-skip-forward-fill text-white"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='order_history_mobile_view'>
                                    {tradeHistory?.length > 0 ? (
                                        <div className='d-flex flex-column gap-2'>
                                            {tradeHistory.map((trade) => {
                                                const createdAt = new Date(trade.createdAt);
                                                const date = createdAt.toLocaleDateString();
                                                const time = createdAt.toLocaleTimeString();
                                                return (
                                                    <div key={trade._id} className='d-flex'>
                                                        <div className='order_datalist'>
                                                            <ul className='listdata'>
                                                                <li>
                                                                    <span className='date'>Date</span>
                                                                    <span className='date_light'>{date}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Time</span>
                                                                    <span>{time}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Symbol</span>
                                                                    <span className={trade.side === "LONG" ? "text-green" : "text-red"}>{trade.symbol}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Type</span>
                                                                    <span>{trade.role === "TAKER" ? "Market" : "Limit"}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Side</span>
                                                                    <span className={trade.side === "LONG" ? "text-green" : "text-red"}>{trade.side === "LONG" ? "BUY" : "SELL"}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Price</span>
                                                                    <span>{toFixedFive(trade.price)}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Amount</span>
                                                                    <span>{toFixedFive(trade.quantity)}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Fee</span>
                                                                    <span>{toFixedFive(trade.fee)}</span>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="no-data-wrapper py-4">
                                            <div className="no_data_s">
                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                            </div>
                                        </div>
                                    )}
                                    {tradeHistory?.length > 0 && activePositionTab === "exercise_history" && (
                                        <div className="hVPalX d-flex flex-row justify-content-center align-items-center gap-0 flex-wrap mt-2">
                                            <span className="text-white">{historySkip + 1}-{Math.min(historySkip + HISTORY_LIMIT, totalTradeHistory)} of {totalTradeHistory}</span>
                                            <div className="sc-eAKtBH gVtWSU d-flex gap-1">
                                                <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('first')}>
                                                    <i className="ri-skip-back-fill text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('prev')}>
                                                    <i className="ri-arrow-left-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('next')}>
                                                    <i className="ri-arrow-right-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('last')}>
                                                    <i className="ri-skip-forward-fill text-white"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                            <div className={`cnt_table position_history ${activePositionTab === "position_history" ? "active" : ""}`}>
                                <div className="desktop_view2">
                                    <div className="table-responsive">
                                        {closePositions?.length > 0 ? <table>
                                            <thead>
                                                <tr>
                                                    <th>Symbol</th>
                                                    <th>Size</th>
                                                    <th>Entry Price</th>
                                                    <th>Exit Price</th>
                                                    <th>PNL</th>
                                                    <th>Open</th>
                                                    <th>Closed</th>
                                                    <th>Is liquidated?</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    closePositions?.map((pos) => {
                                                        const createdAt = new Date(pos.createdAt);
                                                        const updatedAt = new Date(pos.updatedAt);

                                                        const openDate = createdAt.toISOString().split("T")[0];
                                                        const openTime = createdAt.toTimeString().split(" ")[0];

                                                        const closeDate = updatedAt.toISOString().split("T")[0];
                                                        const closeTime = updatedAt.toTimeString().split(" ")[0];

                                                        return (
                                                            <tr key={pos._id}>
                                                                <td className={pos?.side === "LONG" ? "text-green" : "text-red"}>
                                                                    {pos.symbol}
                                                                    <div className="fulltbl">
                                                                        <span className="subtxt">Perp </span>
                                                                        <span className="subtxt">{pos?.side} </span>
                                                                        <span className="subtxt">{pos.leverage}x</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {pos?.side === "LONG"
                                                                        ? toFixedFive(pos.totalLongQty)
                                                                        : toFixedFive(pos.totalShortQty)}{" "}
                                                                    {pos.baseCurrency}
                                                                </td>
                                                                <td>{toFixedFive(pos.entryPrice)}</td>
                                                                <td>{toFixedFive(pos.exit_price)}</td>
                                                                <td
                                                                    className={
                                                                        pos.realizedPnl >= 0 ? "text-green" : "text-red"
                                                                    }
                                                                >
                                                                    {toFixedFive(pos.realizedPnl)}
                                                                </td>
                                                                <td>
                                                                    {openDate} <span className="time">{openTime}</span>
                                                                </td>
                                                                <td>
                                                                    {closeDate} <span className="time">{closeTime}</span>
                                                                </td>
                                                                <td>
                                                                    {pos.liquidated ? "YES" : "NO"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table> : <tr rowSpan="5" className="no-data-row">
                                            <td colSpan="12">
                                                <div className="no-data-wrapper">
                                                    <div className="no_data_s">
                                                        <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>}

                                    </div>
                                    {closePositions?.length > 0 && activePositionTab === "position_history" && (
                                        <div className="hVPalX gap-2 d-flex justify-content-end align-items-center mt-2">
                                            <span className="text-white">{historySkip + 1}-{Math.min(historySkip + HISTORY_LIMIT, totalPositionHistory)} of {totalPositionHistory}</span>
                                            <div className="sc-eAKtBH gVtWSU d-flex flex-row gap-1">
                                                <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('first')}>
                                                    <i className="ri-skip-back-fill text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('prev')}>
                                                    <i className="ri-arrow-left-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('next')}>
                                                    <i className="ri-arrow-right-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('last')}>
                                                    <i className="ri-skip-forward-fill text-white"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className='order_history_mobile_view'>
                                    {closePositions?.length > 0 ? (
                                        <div className='d-flex flex-column gap-2'>
                                            {closePositions.map((pos) => {
                                                const createdAt = new Date(pos.createdAt);
                                                const updatedAt = new Date(pos.updatedAt);
                                                const openDate = createdAt.toLocaleDateString();
                                                const openTime = createdAt.toLocaleTimeString();
                                                const closeDate = updatedAt.toLocaleDateString();
                                                const closeTime = updatedAt.toLocaleTimeString();
                                                return (
                                                    <div key={pos._id} className='d-flex'>
                                                        <div className='order_datalist'>
                                                            <ul className='listdata'>
                                                                <li>
                                                                    <span className='date'>Symbol</span>
                                                                    <span className={`date_light ${pos?.side === "LONG" ? "text-green" : "text-red"}`}>{pos.symbol} Perp {pos?.side} {pos.leverage}x</span>
                                                                </li>
                                                                <li>
                                                                    <span>Size</span>
                                                                    <span>{pos?.side === "LONG" ? toFixedFive(pos.totalLongQty) : toFixedFive(pos.totalShortQty)} {pos.baseCurrency}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Entry Price</span>
                                                                    <span>{toFixedFive(pos.entryPrice)}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Exit Price</span>
                                                                    <span>{toFixedFive(pos.exit_price)}</span>
                                                                </li>
                                                                <li>
                                                                    <span>PNL</span>
                                                                    <span className={pos.realizedPnl >= 0 ? "text-green" : "text-red"}>{toFixedFive(pos.realizedPnl)}</span>
                                                                </li>
                                                                <li>
                                                                    <span>Open</span>
                                                                    <span>{openDate} <span className="time">{openTime}</span></span>
                                                                </li>
                                                                <li>
                                                                    <span>Closed</span>
                                                                    <span>{closeDate} <span className="time">{closeTime}</span></span>
                                                                </li>
                                                                <li>
                                                                    <span>Liquidated</span>
                                                                    <span>{pos.liquidated ? "YES" : "NO"}</span>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="no-data-wrapper py-4">
                                            <div className="no_data_s">
                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                                            </div>
                                        </div>
                                    )}
                                    {closePositions?.length > 0 && activePositionTab === "position_history" && (
                                        <div className="hVPalX gap-2 d-flex justify-content-between align-items-center mt-2 flex-wrap">
                                            <span className="text-white">{historySkip + 1}-{Math.min(historySkip + HISTORY_LIMIT, totalPositionHistory)} of {totalPositionHistory}</span>
                                            <div className="sc-eAKtBH gVtWSU d-flex gap-1">
                                                <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('first')}>
                                                    <i className="ri-skip-back-fill text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('prev')}>
                                                    <i className="ri-arrow-left-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('next')}>
                                                    <i className="ri-arrow-right-s-line text-white"></i>
                                                </button>
                                                <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf btn btn-sm btn-outline-secondary" onClick={() => handleHistoryPagination('last')}>
                                                    <i className="ri-skip-forward-fill text-white"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                        {/* </div> */}

                    {/* </div> */}

                           
                                {/* <div className='d-flex'>
                                <div class="order_history_mobile_view">
                                <div class="no-data-wrapper py-4">
                                    <div class="no_data_s">
                                <img src="/images/no_data_vector.svg" class="img-fluid" width="96" height="96" alt="no data" />
                                </div>
                                </div>
                                </div>
                                </div> */}

                      

                    </div>

                    <div className="assets_right">
                        <h2>Assets</h2>
                        <div className="asset_total_value costbtc_total">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h5>USDT-Perp</h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6>Total Assets</h6>
                                </div>
                                <div><span>{toFixedFive(estimatedportfolio + totalIsolatedMargin) || 0} {selectedCoin?.margin_asset}</span></div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6>Available</h6>
                                </div>
                                <div><span>{toFixedFive(balance?.quoteCurrency + totalIsolatedMargin) || 0} {selectedCoin?.margin_asset}</span></div>
                            </div>
                            <hr />
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h5>USDT-Perp</h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6>Maintance Margin</h6>
                                </div>
                                <div><span>{totalMaintenanceMargin || 0} {selectedCoin?.margin_asset}</span></div>
                            </div>

                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h6>Unrealized PNL</h6>
                                </div>
                                <div><span className={`text-${totalUnrealizedPnl > 0 ? "green" : "red"}`}>{totalUnrealizedPnl || 0} USDT</span></div>
                            </div>


                            <div className="d-flex align-items-center justify-content-between buy_transferbtn">
                                <Link to='/asset_managemnet/deposit'>Deposit Crypto</Link>
                                <Link to='/user_profile/asset_overview'>Transfer</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
            {/* <!-- buy/long / sell short pop-up --> */}
            <div className="modal fade currency_popup_s crosstabs" id="buypop" tabindex="-1" aria-labelledby="buypopLabel" aria-hidden="true" >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="btn-close" data-bs-dismiss="modal"
                                aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className='user_identyid'>
                                <img src="/images/user_identy.svg" alt="copy icon" />
                            </div>
                            <h4>3 Identity Verification Required</h4>
                            <p>To comply with regulations, complete identity verification to access Binance Futures services.</p>
                            <div className='bn-modal-footer d-flex btnsupport'>
                                <button className="bn-button verifybtn">Verify Now</button>
                                <button className="customerbtn">Customer Support</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bs_tab_row d-lg-none">
                <div className="row gx-3">
                    <div className="col-6">
                        <button type="button" className="btn btn-success btn-block w-100" onClick={() => { setMobileOrderSide('buy'); setShowMobileOrderPanel(true); }}><span>Buy</span></button>
                    </div>
                    <div className="col-6">
                        <button type="button" className="btn btn-danger btn-block w-100" onClick={() => { setMobileOrderSide('sell'); setShowMobileOrderPanel(true); }}><span>Sell</span></button>
                    </div>
                </div>
            </div>
            {showMobileOrderPanel && (
                <div className="relative_select_right_mobile_backdrop d-lg-none" onClick={() => setShowMobileOrderPanel(false)} aria-hidden="true" />
            )}
            {/* <!-- Modal End --> */}
            {/* 
            {showPopup && (
                <div style={styles.overlay}>
                    <div className="popup_modal" style={styles.popup}>
                        <img src="/images/Futures_cs.svg" alt="Coming Soon" style={styles.image} />
                    </div>

                </div>
            )} */}



        </>
    )
}

export default UsdMFutures