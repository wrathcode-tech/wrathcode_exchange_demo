import { useEffect, useRef, useState, useContext } from 'react';
import { widget } from '../charting_library'; // same path you already use
import FuturesDatafeed from './datafeedFutures';
import './index.css';
import { ProfileContext } from '../../../context/ProfileProvider';
import { disconnectFuturesChartSocket } from './streamingFutures';

/**
 * Usage:
 *  <TVFuturesChartContainer symbol="BTCUSDT_PERP" />
 *  (Symbol format: BASEQUOTE_PERP for perpetuals, e.g., ETHUSDT_PERP)
 */
export default function TVFuturesChartContainer({ symbol }) {
  const { newStoredTheme } = useContext(ProfileContext);
  const [tvWidget, setTvWidget] = useState();
  const initOnceRef = useRef(false);

  const initChart = (symbol) => {
    const containerId = 'TVFuturesChartContainer';
    const container = document.getElementById(containerId);
    if (!container) {
      setTimeout(() => initChart(symbol), 300);
      return;
    }

    const Theme = localStorage.getItem('theme');
    const options = {
      symbol,
      interval: '1',
      container: containerId,
      datafeed: FuturesDatafeed, // <= FUTURES DATAFEED
      library_path: '/charting_library/',
      timezone: 'Asia/Kolkata',
      has_intraday: true,
      intraday_multipliers: ['1', '60'],
      autosize: true,
      load_last_chart: true,
      custom_css_url: 'css/style.css',
      hide_resolution_in_legend: true,
      time_frames: [
        { text: '1D', resolution: 'D', description: '1 Day' },
        { text: '1W', resolution: 'W', description: '1 Week' },
        { text: '1M', resolution: 'M', description: '1 Month' },
      ],
      time_scale: { min_bar_spacing: 1 },
      theme: Theme === 'light' ? 'light' : 'dark',
      disabled_features: [
        'use_sessionStorage_for_settings', 'adaptive_logo',
        'border_around_the_chart', 'header_symbol_search',
        'header_interval_dialog_button', 'header_compare',
        'header_undo_redo', 'header_resolutions'
      ],
      overrides: {
        'scalesProperties.fontSize': 14,
        'scalesProperties.fontFamily': 'HarmonyOS Sans Regular, sans-serif',
        'scalesProperties.textColor': '#ffffff',
        'paneProperties.legendProperties.showLegend': true,
        'paneProperties.legendProperties.showStudyValues': true,
        'paneProperties.legendProperties.fontSize': 14,
        'paneProperties.legendProperties.fontFamily': 'HarmonyOS Sans Regular, sans-serif',
      },
      styleOverrides: {
        'paneProperties.background': Theme === 'light' ? '#ffffff' : '#111114',
        'paneProperties.backgroundType': 'solid',
      },
      loading_screen: {
        backgroundColor: '#111114',
      },
    };

    const w = new widget(options);


    w.onChartReady(() => {
      const chart = w.chart();
      chart.applyOverrides({
        'paneProperties.background': Theme === 'light' ? '#ffffff' : '#111114',
        'scalesProperties.backgroundColor': Theme === 'light' ? '#ffffff' : '#111114',
        'paneProperties.backgroundType': 'solid',
        'mainSeriesProperties.style': 1,
      });
    
      // Remove default volume (if any) and add volume in a separate pane
      const studies = chart.getAllStudies();
      studies.forEach(study => {
        if (study.name.toLowerCase().includes('volume')) {
          chart.removeEntity(study.id);
        }
      });
      // chart.createStudy('Volume', false, true);
    
      // === ✅ ADD COMMON FUTURES INDICATORS ===
      chart.createStudy('Moving Average', false, false, [14], null, { 'Plot.color': '#FF0000' });

      // chart.createStudy('Relative Strength Index', false, true); // RSI default
      // chart.createStudy('MACD', false, true); // MACD
      // chart.createStudy('Bollinger Bands', false, false); // BB on main chart
      // chart.createStudy('VWAP', false, false); // VWAP main chart
      // chart.createStudy('ATR', false, true); // ATR for volatility
      // chart.createStudy('MA', false, false, [20]); // EMA 20
      // chart.createStudy('EMA', false, false, [50]); // EMA 50
      // chart.createStudy('EMA', false, false, [200]); // EMA 200
    
      // Try adding Volume Profile (if available in your charting library build)
      try {
      } catch (e) {
        console.warn('Volume Profile not available in this TradingView library version');
      }
    
      // === Custom timeframe buttons ===
      w.headerReady().then(() => {
        const intervals = [
          { value: '1', label: '1 Min' },
          { value: '5', label: '5 Min' },
          { value: '15', label: '15 Min' },
          { value: '30', label: '30 Min' },
          { value: '60', label: '1 Hour' },
          { value: 'D', label: '1 Day' },
          { value: 'W', label: '1 Week' },
          { value: 'M', label: '1 Month' },
        ];
        intervals.forEach(i => {
          const btn = w.createButton();
          btn.classList.add('custom-interval-button');
          btn.title = `Switch to ${i.label}`;
          btn.textContent = i.label;
          btn.addEventListener('click', () => w.chart().setResolution(i.value));
        });
      });
    });
    

    setTvWidget(w);
  };

  useEffect(() => {
    if (!initOnceRef.current && symbol) {
      initChart(symbol);
      initOnceRef.current = true;
    }
    
    // Cleanup on unmount
    return () => {
      disconnectFuturesChartSocket();
      if (tvWidget) {
        try {
          tvWidget.remove();
        } catch (e) {
          console.warn("Error removing futures TV widget:", e);
        }
      }
      console.log("🧹 Futures TVChartContainer cleanup completed");
    };
  }, [symbol]);

  // theme switch
  useEffect(() => {
    if (!tvWidget) return;
    (async () => {
      try {
        await tvWidget._innerWindowLoaded;
        const Theme = localStorage.getItem('theme');
        tvWidget.changeTheme(Theme === 'light' ? 'light' : 'dark');
      } catch (e) {
        console.error('Theme change failed:', e);
      }
    })();
  }, [newStoredTheme, tvWidget]);

  // change symbol live
  useEffect(() => {
    if (!tvWidget || !symbol) return;
    tvWidget.onChartReady(() => {
      tvWidget.chart().setSymbol(symbol, () => null);
    });
  }, [symbol, tvWidget]);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!tvWidget) return;
    tvWidget.onChartReady(() => setReady(true));
  }, [tvWidget]);

  return (
    <> 
    {/* <div
      id="TVFuturesChartContainer"
      // className='dashboard_summary_lft'
      style={{
        // height: '600px',
        // width:"1000px",
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.1s ease',
        backgroundColor: '#111114',
        height: "100%",
        width: "100%",
      }}
    /> */}


<div style={{ position: "relative", minHeight: "600px", height: "600px", backgroundColor: "#111114" }}>
      {/* Chart Container */}
      <div
        id="TVFuturesChartContainer"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 0.1s ease",
          backgroundColor: "#111114",
          height: "100%",
        }}
      />
  
      {/* Loader Overlay */}
      {!ready && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#111114",
            zIndex: 10,
          }}
        >
          <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
        </div>
      )}
    </div>

    </>
  );
}
