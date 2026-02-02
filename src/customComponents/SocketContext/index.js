import React, { createContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { ApiConfig } from '../../api/apiConfig/apiConfig';

export const SocketContext = createContext();

// =====================================================================
// 🔧 SOCKET CONFIGURATION
// =====================================================================
const SOCKET_CONFIG = {
  transports: ['websocket'],
  upgrade: false,
  rejectUnauthorized: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
};

const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState({ pairs: [], futures_pairs: [], hot_pairs_chart: {} });
  const [exchangeData, setExchangeData] = useState(null);
  const [futuresData, setFuturesData] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const socketRef = useRef(null);
  
  // Track pending subscriptions to apply when socket connects
  const pendingSubscriptions = useRef({
    market: false,
    exchange: null,
    futures: null
  });

  // =====================================================================
  // 🔗 SOCKET CONNECTION
  // =====================================================================
  const connectSocket = useCallback(() => {
    // Don't create multiple connections - check if socket exists (connected or connecting)
    if (socketRef.current) {
      // If already connected, just return
      if (socketRef.current.connected) {
        return socketRef.current;
      }
      // If socket exists but disconnected, try to reconnect
      if (!socketRef.current.connected && !socketRef.current.connecting) {
        socketRef.current.connect();
      }
      return socketRef.current;
    }

    // Get auth token if available
    const token = localStorage.getItem('token');

    const newSocket = io(`${ApiConfig?.webSocketUrl}`, {
      ...SOCKET_CONFIG,
      auth: token ? { token } : undefined,
    });

    socketRef.current = newSocket;

    // =====================================================================
    // 📡 CONNECTION EVENTS
    // =====================================================================
    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Apply pending subscriptions (market is NOT auto-subscribed anymore)
      if (pendingSubscriptions.current.market) {
        newSocket.emit('market:subscribe');
      }
      if (pendingSubscriptions.current.exchange) {
        newSocket.emit('exchange:subscribe', pendingSubscriptions.current.exchange);
      }
      if (pendingSubscriptions.current.futures) {
        newSocket.emit('futures:subscribe', pendingSubscriptions.current.futures);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      
      // Auto reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
      attemptReconnect();
    });

    newSocket.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });

    // =====================================================================
    // 📊 MARKET DATA EVENTS (Server-push)
    // =====================================================================
    newSocket.on('market:update', (data) => {
      // Handle market data update (full data from server)
      setMarketData({
        pairs: data.pairs || [],
        futures_pairs: data.futures_pairs || [],
        hot_pairs_chart: data.hot_pairs_chart || {}
      });
    });

    // =====================================================================
    // 💱 EXCHANGE DATA EVENTS (Server-push)
    // =====================================================================
    newSocket.on('exchange:update', (data) => {
      if (data) {
        setExchangeData(data);
      }
    });

    // =====================================================================
    // 📈 FUTURES DATA EVENTS (Server-push)
    // =====================================================================
    newSocket.on('futures:update', (data) => {
      if (data) {
        setFuturesData(data);
      }
    });

    setSocket(newSocket);
    return newSocket;
  }, []);

  // =====================================================================
  // 🔄 RECONNECTION LOGIC
  // =====================================================================
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('[Socket] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current), 10000);
    reconnectAttempts.current += 1;

    console.log(`[Socket] Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);

    setTimeout(() => {
      if (!socketRef.current?.connected) {
        connectSocket();
      }
    }, delay);
  }, [connectSocket]);

  // =====================================================================
  // 📊 SUBSCRIPTION HELPERS
  // =====================================================================
  const subscribeToMarket = useCallback(() => {
    pendingSubscriptions.current.market = true;
    if (socketRef.current?.connected) {
      socketRef.current.emit('market:subscribe');
    }
  }, []);

  const unsubscribeFromMarket = useCallback(() => {
    pendingSubscriptions.current.market = false;
    if (socketRef.current?.connected) {
      socketRef.current.emit('market:unsubscribe');
    }
  }, []);

  // Track current exchange subscription to avoid duplicates
  const currentExchangeSubscription = useRef(null);

  const subscribeToExchange = useCallback((baseCurrencyId, quoteCurrencyId) => {
    // If no pair specified, request pairs list only (for initial page load)
    if (!baseCurrencyId || !quoteCurrencyId) {
      if (socketRef.current?.connected) {
        socketRef.current.emit('exchange:subscribe', {});
      }
      return;
    }
    
    const subKey = `${baseCurrencyId}-${quoteCurrencyId}`;
    
    // Avoid duplicate subscription to the same pair
    if (currentExchangeSubscription.current === subKey) {
      return;
    }
    
    currentExchangeSubscription.current = subKey;
    pendingSubscriptions.current.exchange = { base_currency_id: baseCurrencyId, quote_currency_id: quoteCurrencyId };
    
    if (socketRef.current?.connected) {
      socketRef.current.emit('exchange:subscribe', {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId
      });
    }
  }, []);

  const unsubscribeFromExchange = useCallback((baseCurrencyId, quoteCurrencyId) => {
    currentExchangeSubscription.current = null;
    pendingSubscriptions.current.exchange = null;
    if (socketRef.current?.connected) {
      socketRef.current.emit('exchange:unsubscribe', {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId
      });
    }
  }, []);

  const subscribeToFutures = useCallback((baseCurrencyId, quoteCurrencyId) => {
    // If no pair specified, request futures pairs list only (for initial page load)
    if (!baseCurrencyId || !quoteCurrencyId) {
      if (socketRef.current?.connected) {
        socketRef.current.emit('futures:subscribe', {});
      }
      return;
    }
    
    pendingSubscriptions.current.futures = { base_currency_id: baseCurrencyId, quote_currency_id: quoteCurrencyId };
    if (socketRef.current?.connected) {
      socketRef.current.emit('futures:subscribe', {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId
      });
    }
  }, []);

  const unsubscribeFromFutures = useCallback((baseCurrencyId, quoteCurrencyId) => {
    pendingSubscriptions.current.futures = null;
    if (socketRef.current?.connected) {
      socketRef.current.emit('futures:unsubscribe', {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId
      });
    }
  }, []);

  // =====================================================================
  // 🚀 INITIALIZATION
  // =====================================================================
  useEffect(() => {
    const activeSocket = connectSocket();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!socketRef.current?.connected) {
          reconnectAttempts.current = 0;
          connectSocket();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [connectSocket]);

  // =====================================================================
  // 🎨 SLIDER SETTINGS (unchanged)
  // =====================================================================
  const settings = {
    centerMode: true,
    centerPadding: "30px",
    dots: false,
    infinite: true,
    autoplay: true,
    speed: 4000,
    autoplaySpeed: 0,
    arrows: false,
    cssEase: "linear",
    slidesToShow: 6,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 768, settings: { centerPadding: '2px', slidesToShow: 3, slidesToScroll: 'auto' } },
      { breakpoint: 1199, settings: { slidesToShow: 4, slidesToScroll: 'auto' } },
    ],
  };

  const settingstwo = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 600,
    autoplaySpeed: 2000,
    arrows: false,
    slidesToShow: 3,
    slidesToScroll: 3,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, dots: true } },
      { breakpoint: 600, settings: { slidesToShow: 2, slidesToScroll: 2, initialSlide: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 2, slidesToScroll: 2 } },
    ]
  };

  const Sliderpartners = {
    dots: false,
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    speed: 600,
    autoplaySpeed: 2000,
    arrows: false,
    responsive: [
      { breakpoint: 768, settings: { slidesToShow: 4, slidesToScroll: 1 } },
      { breakpoint: 480, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    ],
  };

  const Sliderpartners2 = {
    dots: false,
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    arrows: false,
    speed: 8000,
    pauseOnHover: false,
    cssEase: "linear",
    rtl: true,
    responsive: [
      { breakpoint: 768, settings: { slidesToShow: 4, slidesToScroll: 1 } },
      { breakpoint: 480, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    ],
  };

  // =====================================================================
  // 📤 CONTEXT VALUE
  // =====================================================================
  
  // Expose getSocket function for external components (like chart) to use the same socket
  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  const contextValue = {
    socket,
    isConnected,
    marketData,
    exchangeData,
    futuresData,
    subscribeToMarket,
    unsubscribeFromMarket,
    subscribeToExchange,
    unsubscribeFromExchange,
    subscribeToFutures,
    unsubscribeFromFutures,
    getSocket, // Expose socket getter for chart to use same connection
    settings,
    settingstwo,
    Sliderpartners,
    Sliderpartners2
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContextProvider;
