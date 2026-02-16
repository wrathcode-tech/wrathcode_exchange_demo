import { useEffect, useRef, useState, useContext } from 'react';
import { widget } from '../charting_library'; // same path you already use
import FuturesDatafeed from './datafeedFutures';
import './index.css';
import { ProfileContext } from '../../../context/ProfileProvider';
import { SocketContext } from '../../SocketContext';
import { disconnectFuturesChartSocket, setSharedSocket } from './streamingFutures';

/**
 * Usage:
 *  <TVFuturesChartContainer symbol="BTCUSDT_PERP" />
 *  (Symbol format: BASEQUOTE_PERP for perpetuals, e.g., ETHUSDT_PERP)
 */
export default function TVFuturesChartContainer({ symbol }) {
  const { newStoredTheme } = useContext(ProfileContext);
  const { getSocket, isConnected } = useContext(SocketContext);
  const [tvWidget, setTvWidget] = useState();
  const initOnceRef = useRef(false);
  const tvWidgetRef = useRef(null);
  tvWidgetRef.current = tvWidget;

  // Use same socket as UsdMFutures (futures:update already subscribed there)
  useEffect(() => {
    if (isConnected) {
      const socket = getSocket();
      if (socket) setSharedSocket(socket);
    }
  }, [isConnected, getSocket]);

  const initChart = (symbol) => {
    const containerId = 'TVFuturesChartContainer';
    const container = document.getElementById(containerId);
    if (!container) {
      setTimeout(() => initChart(symbol), 300);
      return;
    }

    const Theme = localStorage.getItem('theme');
    const isMobile = window.innerWidth <= 480;
    const options = {
      symbol,
      interval: '1',
      container: containerId,
      datafeed: FuturesDatafeed, // <= FUTURES DATAFEED
      library_path: '/charting_library/',
      timezone: 'Asia/Kolkata',
      has_intraday: true,
      intraday_multipliers: ['1', '60'],
      height: isMobile ? '400px' : '625px',
      load_last_chart: true,
      fullscreen: false,
      pricescale: 100000000,
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
        'header_undo_redo', 'header_resolutions',
        'left_toolbar'
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
        'paneProperties.background': Theme === 'light' ? '#ffffff' : '#181A20',
        'paneProperties.backgroundType': 'solid',
      },
      loading_screen: {
        backgroundColor: Theme === 'light' ? '#ffffff' : '#181A20',
      },
    };

    const w = new widget(options);


    w.onChartReady(() => {
      try {
        const chart = w.chart?.();
        if (!chart) return;
        chart.applyOverrides({
          'paneProperties.background': Theme === 'light' ? '#ffffff' : '#181A20',
          'scalesProperties.backgroundColor': Theme === 'light' ? '#ffffff' : '#181A20',
          'paneProperties.backgroundType': 'solid',
          'mainSeriesProperties.style': 1,
        });

        // Remove volume from chart
        const studies = chart.getAllStudies?.() || [];
        studies.forEach(study => {
          if (study?.name?.toLowerCase?.().includes('volume')) {
            chart.removeEntity(study.id);
          }
        });

        // === Custom timeframe buttons ===
        w.headerReady?.().then(() => {
          try {
            const ch = w.chart?.();
            if (!ch) return;
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
              const btn = w.createButton?.();
              if (!btn) return;
              btn.classList.add('custom-interval-button');
              btn.title = `Switch to ${i.label}`;
              btn.textContent = i.label;
              btn.addEventListener('click', () => {
                try {
                  w.chart?.()?.setResolution(i.value);
                } catch (err) {}
              });
            });
          } catch (err) {}
        });
      } catch (e) {
        // Chart API may not be ready
      }
    });
    

    setTvWidget(w);
  };

  useEffect(() => {
    if (!initOnceRef.current && symbol) {
      initChart(symbol);
      initOnceRef.current = true;
    }
  }, [symbol]);

  // Cleanup only on unmount (not when symbol changes)
  useEffect(() => {
    return () => {
      disconnectFuturesChartSocket();
      const w = tvWidgetRef.current;
      if (w) {
        try {
          w.remove();
        } catch (e) {
          console.warn("Error removing futures TV widget:", e);
        }
      }
    };
  }, []);

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

  // Inject HarmonyOS font into chart iframe (match spot)
  useEffect(() => {
    if (!tvWidget) return;
    tvWidget.onChartReady(() => {
      setTimeout(() => {
        const iframe = document.querySelector(`#TVFuturesChartContainer iframe`);
        if (iframe?.contentDocument) {
          const css = `
            @font-face {
              font-family: 'HarmonyOS Sans Regular';
              src: url('/font/HarmonyOS_Sans_Regular.woff') format('woff');
              font-weight: normal;
              font-style: normal;
            }
            body, .chart-page, .chart-container, .tv-text, .pane-legend {
              font-family: 'HarmonyOS Sans Regular', sans-serif !important;
              font-size: 14px !important;
            }
          `;
          const style = document.createElement('style');
          style.innerHTML = css;
          iframe.contentDocument.head.appendChild(style);
        }
      }, 1000);
    });
  }, [tvWidget]);

  // Inject chart-page background into iframe (match spot)
  useEffect(() => {
    if (!tvWidget) return;
    tvWidget.onChartReady(() => {
      try {
        const Theme = localStorage.getItem('theme');
        const chart = tvWidget.chart?.();
        if (!chart) return;
        const bg = Theme === 'light' ? '#ffffff' : '#181A20';
        chart.applyOverrides({
          'paneProperties.background': bg,
          'scalesProperties.backgroundColor': bg,
          'paneProperties.backgroundType': 'solid',
          'mainSeriesProperties.style': 1,
        });
        const iframe = document.querySelector(`#TVFuturesChartContainer iframe`);
        if (iframe?.contentDocument) {
          const style = document.createElement('style');
          style.innerHTML = `body, .chart-page { background-color: ${bg} !important; }`;
          iframe.contentDocument.head.appendChild(style);
        }
      } catch (e) {}
    });
  }, [tvWidget]);

  // change symbol live
  useEffect(() => {
    if (!tvWidget || !symbol) return;
    tvWidget.onChartReady(() => {
      try {
        const chart = tvWidget.chart?.();
        if (chart) chart.setSymbol(symbol, () => null);
      } catch (e) {
        // Widget may have been removed or chart not ready
      }
    });
  }, [symbol, tvWidget]);

  const isMobile = window.innerWidth <= 480;
  const chartHeight = isMobile ? '400px' : '625px';
  const Theme = localStorage.getItem('theme');
  const bgColor = Theme === 'light' ? '#ffffff' : '#181A20';

  return (
    <div
      style={{
        position: "relative",
        minHeight: chartHeight,
        height: chartHeight,
        width: '100%',
        backgroundColor: bgColor,
      }}
    >
      <div
        id="TVFuturesChartContainer"
        style={{
          width: '100%',
          height: chartHeight,
          minHeight: chartHeight,
          backgroundColor: bgColor,
        }}
      />
    </div>
  );
}
