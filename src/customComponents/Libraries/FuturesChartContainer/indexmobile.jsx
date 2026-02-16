import { useContext, useEffect, useRef, useState } from 'react';
import './index.css';
import { widget } from '../charting_library';
import MobileDatafeedFutures from './mobileDatafeedFutures';
import { ProfileContext } from '../../../context/ProfileProvider';
import { disconnectMobileFuturesChartSocket } from './mobileStreamingFutures';

/**
 * Standalone mobile futures chart for WebView.
 * Uses Binance API + Binance WebSocket - no backend dependency.
 * Usage: <TVFuturesChartContainerMobile symbol="BTCUSDT_PERP" theme="dark" />
 */
export default function TVFuturesChartContainerMobile({ symbol, theme }) {
  const { newStoredTheme } = useContext(ProfileContext);
  const tvWidgetRef = useRef(null);
  const containerId = 'TVFuturesChartContainerMobile';
  const Theme = theme ?? newStoredTheme ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : 'dark');
  const [isReady, setIsReady] = useState(false);

  const initChart = (initSymbol) => {
    if (tvWidgetRef.current) return;

    const widgetOptions = {
      symbol: initSymbol,
      load_last_chart: true,
      interval: '1',
      fullscreen: false,
      timezone: 'Asia/Kolkata',
      container: containerId,
      datafeed: MobileDatafeedFutures,
      has_intraday: true,
      library_path: '/charting_library/',
      pricescale: 100000000,
      intraday_multipliers: ['1', '60'],
      custom_css_url: 'mobileCss/style.css',
      hide_resolution_in_legend: false,
      height: '300px',
      time_frames: [
        { text: '1D', resolution: 'D', description: '1 Day' },
        { text: '1W', resolution: 'W', description: '1 Week' },
        { text: '1M', resolution: 'M', description: '1 Month' },
      ],
      time_scale: { min_bar_spacing: 1 },
      theme: Theme === 'light' ? 'light' : 'dark',
      enabled_features: ['drag_scroll'],
      overrides: {
        'scalesProperties.fontSize': 14,
        'scalesProperties.fontFamily': 'HarmonyOS Sans Regular, sans-serif',
        'scalesProperties.textColor': Theme === 'light' ? '#000000' : '#ffffff',
        'paneProperties.legendProperties.showLegend': true,
        'paneProperties.legendProperties.showStudyValues': true,
        'paneProperties.legendProperties.fontSize': 14,
        'paneProperties.legendProperties.fontFamily': 'HarmonyOS Sans Regular, sans-serif',
      },
      styleOverrides: {
        'paneProperties.background': Theme === 'light' ? '#ffffff' : '#1f2630',
        'paneProperties.backgroundType': 'solid',
      },
      loading_screen: {
        backgroundColor: Theme === 'light' ? '#ffffff' : '#1f2630',
      },
      disabled_features: [
        'use_sessionStorage_for_settings',
        'left_toolbar',
        'header_symbol_search',
        'header_interval_dialog_button',
        'header_settings',
        'header_compare',
        'header_undo_redo',
        'header_resolutions',
        'header_fullscreen_button',
        'study_dialog_search_control',
        'symbol_info',
        'timeframes_toolbar',
        'pane_context_menu',
        'control_bar',
        'header_chart_type',
        'context_menus',
        'main_series_scale_menu',
        'legend_context_menu',
      ],
      enabled_features: [],
    };

    const tvWidget = new widget(widgetOptions);
    tvWidgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      setIsReady(true);

      const chart = tvWidget.chart();
      const studies = chart.getAllStudies?.() || [];
      studies.forEach((study) => {
        if (study?.name?.toLowerCase?.().includes('volume')) {
          chart.removeEntity(study.id);
        }
      });

      tvWidget.headerReady().then(() => {
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
        intervals.forEach((interval) => {
          const button = tvWidget.createButton();
          button.classList.add('custom-interval-button');
          button.title = `Switch to ${interval.label}`;
          button.addEventListener('click', () => {
            tvWidget.chart().setResolution(interval.value);
          });
          button.textContent = interval.label;
        });
      });
    });
  };

  useEffect(() => {
    initChart(symbol);

    return () => {
      disconnectMobileFuturesChartSocket();
      if (tvWidgetRef.current) {
        try {
          tvWidgetRef.current.remove();
          tvWidgetRef.current = null;
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (tvWidgetRef.current && symbol) {
      tvWidgetRef.current.onChartReady(() => {
        tvWidgetRef.current.chart().setSymbol(symbol, '1');
      });
    }
  }, [symbol]);

  useEffect(() => {
    if (tvWidgetRef.current) {
      tvWidgetRef.current.onChartReady(() => {
        const chart = tvWidgetRef.current.chart();
        const themeVal = theme ?? newStoredTheme ?? localStorage?.getItem('theme') ?? 'dark';
        const bg = themeVal === 'light' ? '#ffffff' : '#1f2630';
        chart.applyOverrides({
          'paneProperties.background': bg,
          'scalesProperties.backgroundColor': bg,
          'paneProperties.backgroundType': 'solid',
        });
      });
    }
  }, [theme, newStoredTheme]);

  const bgColor = (theme ?? newStoredTheme ?? localStorage?.getItem('theme')) === 'light' ? '#ffffff' : '#1f2630';

  return (
    <div style={{ position: 'relative', minHeight: '300px', height: '300px', backgroundColor: bgColor }}>
      <div
        id={containerId}
        className={(theme ?? newStoredTheme) === 'light' ? 'light-theme' : 'dark-theme'}
        style={{
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.1s ease',
          backgroundColor: bgColor,
          height: '100%',
        }}
      />

      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: bgColor,
            zIndex: 10,
          }}
        >
          <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
        </div>
      )}
    </div>
  );
}
