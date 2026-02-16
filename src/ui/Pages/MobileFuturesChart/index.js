import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TVFuturesChartContainerMobile from '../../../customComponents/Libraries/FuturesChartContainer/indexmobile';

const MobileFuturesChart = () => {
  const params = useParams();
  const theme = params?.theme;

  // Initial symbol from URL: pairs = "BTC_USDT" -> symbol = "BTCUSDT_PERP"
  const initialPair = params?.pairs?.split('_') || ['BTC', 'USDT'];
  const [selectedCoin, setSelectedCoin] = useState({
    base_currency: initialPair[0],
    quote_currency: initialPair[1] || 'USDT',
  });

  const symbol = `${selectedCoin.base_currency}${selectedCoin.quote_currency}_PERP`;

  // Listen for RN WebView messages to change symbol without reload
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHANGE_SYMBOL' && data.symbol) {
          const [base, quote] = data.symbol.split('_');
          if (base && quote) {
            setSelectedCoin({ base_currency: base, quote_currency: quote });
          }
        }
      } catch (err) {}
    };

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    return () => {
      document.removeEventListener('message', handleMessage);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light_theme');
    } else {
      document.body.classList.remove('light_theme');
    }
  }, [theme]);

  return (
    <div className="trade-wrapper mobile_trade futures login_bg mb-5 pb-3">
      <div className="futures-container mobile-futures-container container-fluid p-0">
        <div className="row g-2">
          <div className="col-12">
            <div className="mb-1 p-0">
              <div className="cstm_tabs">
                {selectedCoin.base_currency ? (
                  <TVFuturesChartContainerMobile symbol={symbol} theme={theme} />
                ) : (
                  <div className="spinner-border text-primary" role="status" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFuturesChart;
