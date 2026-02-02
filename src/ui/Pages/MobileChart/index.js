import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TVChartContainer from "../../../customComponents/Libraries/TVChartContainer/indexmobile";

const MobileChart = () => {
    const params = useParams();
    const theme = params?.theme;

    // Initial symbol from URL if present
    const initialPair = params?.pairs?.split('_') || ["BTC", "USDT"];
    const [selectedCoin, setSelectedCoin] = useState({
        base_currency: initialPair[0],
        quote_currency: initialPair[1]
    });

    // Listen for RN WebView messages to change symbol without reload
    useEffect(() => {
        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === "CHANGE_SYMBOL" && data.symbol) {
                    const [base, quote] = data.symbol.split('_');
                    if (base && quote) {
                        setSelectedCoin({ base_currency: base, quote_currency: quote });
                    }
                }
            } catch (err) {
                // Invalid JSON message - ignore
            }
        };
    
        // Listen for React Native messages
        document.addEventListener("message", handleMessage); // Android
        window.addEventListener("message", handleMessage);   // iOS
    
        return () => {
            document.removeEventListener("message", handleMessage);
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    // Chart handles its own socket subscription via mobileStreaming.js
    // No need for separate SocketContext subscription here

    // Apply theme
    useEffect(() => {
        if (theme === "light") {
            document.body.classList.add("light_theme");
        } else {
            document.body.classList.remove("light_theme");
        }
    }, [theme]);

    return (
        <div className="trade-wrapper mobile_trade spot login_bg mb-5 pb-3">
            <div className="spot-container mobile-spot-container container-fluid p-0">
                <div className="row g-2">
                    <div className="col-12">
                        <div className="mb-1 p-0">
                            <div className="cstm_tabs">
                                {selectedCoin.base_currency === undefined ? (
                                     <div className="spinner-border text-primary" role="status">
                                   </div>
                                ) : (
                                    <TVChartContainer
                                        symbol={`${selectedCoin.base_currency}/${selectedCoin.quote_currency}`}
                                        theme={theme}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileChart;
