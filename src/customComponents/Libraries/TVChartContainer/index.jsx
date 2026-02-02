import { useContext, useEffect, useRef, useState } from 'react';
import './index.css';
import { widget } from '../charting_library';
import Datafeed from './datafeed';
import { ProfileContext } from '../../../context/ProfileProvider';
import { SocketContext } from '../../SocketContext';
import { disconnectChartSocket, setSharedSocket } from './streaming';


export default function TVChartContainer({ symbol }) {
  
  const { newStoredTheme } = useContext(ProfileContext);
  const { getSocket, isConnected } = useContext(SocketContext);
  const [tvWidget, setTvWidget] = useState();
  const functCheckRef = useRef(true);

  // Set shared socket for chart to use the same connection as TradePage
  useEffect(() => {
    if (isConnected) {
      const socket = getSocket();
      if (socket) {
        setSharedSocket(socket);
      }
    }
  }, [isConnected, getSocket]);

  const getChart = (symbol) => {
    const chartContainer = document.getElementById("TVChartContainer");

    if (!chartContainer) {
      console.error("Chart container not found! Retrying...");
      setTimeout(() => getChart(symbol), 500); // Retry after 500ms
      return;
    }
    const Theme = localStorage.getItem('theme');
    const isMobile = window.innerWidth <= 480;

    const widgetOptions = {
      symbol: `${symbol}`,
      load_last_chart: true,
      interval: '1',
      fullscreen: false,
      timezone: 'Asia/Kolkata',
      container: "TVChartContainer",
      datafeed: Datafeed,
      has_intraday: true,
      library_path: '/charting_library/',
      pricescale: 100000000,
      intraday_multipliers: ['1', '60'],
      custom_css_url: 'css/style.css',
      hide_resolution_in_legend: true,
      height: isMobile ? '400px' : '625px',
      time_frames: [
        { text: '1D', resolution: 'D', description: '1 Day' },
        { text: '1W', resolution: 'W', description: '1 Week' },
        { text: '1M', resolution: 'M', description: '1 Month' },
      ],
      time_scale: {
        min_bar_spacing: 1
      },
      theme: Theme === 'light' ? "light" : "dark",
      overrides: {
        // Apply HarmonyOS Font to scales (price & time)
        "scalesProperties.fontSize": 14,
        "scalesProperties.fontFamily": "HarmonyOS Sans Regular, sans-serif",
        "scalesProperties.textColor": "#ffffff", // Adjust for visibility
    
        // Apply HarmonyOS Font to legend (indicators, tooltips)
        "paneProperties.legendProperties.showLegend": true,
        "paneProperties.legendProperties.showStudyValues": true,
        "paneProperties.legendProperties.fontSize": 14,
        "paneProperties.legendProperties.fontFamily": "HarmonyOS Sans Regular, sans-serif",
      },
      styleOverrides: {
        "paneProperties.background": Theme === 'light' ? "#ffffff" : "#181A20",
        "paneProperties.backgroundType": "solid",
      },
      loading_screen: {
        backgroundColor: "#181A20",
      },
      disabled_features: [
        "use_sessionStorage_for_settings", "adaptive_logo",
        "border_around_the_chart", 'header_symbol_search',
        'header_interval_dialog_button', 'header_compare',
        'header_undo_redo', 'header_resolutions',
        'left_toolbar'
      ],
    };

    const tvWidgetInstance = new widget(widgetOptions);

    // **Force Apply Background After Initialization**
    tvWidgetInstance.onChartReady(() => {
        const chart = tvWidgetInstance.chart();
        chart.applyOverrides({
            "paneProperties.background": Theme === 'light' ? "#ffffff" : "#181A20",
        });
    });

    setTvWidget(tvWidgetInstance);
};

useEffect(() => {
  if (tvWidget) {
    tvWidget.onChartReady(() => {
      setTimeout(() => {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentDocument) {
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
      }, 1000); // Delay to ensure iframe is loaded
    });
  }
}, [tvWidget]);


useEffect(() => {
  if (tvWidget) {
    tvWidget.onChartReady(() => {
      const chart = tvWidget.chart();
      if (chart) {
        // **Force Change Background Color**
        chart.applyOverrides({
          "paneProperties.background": "#181A20",
          "scalesProperties.backgroundColor": "#181A20",
          "paneProperties.backgroundType": "solid",
          "mainSeriesProperties.style": 1, // Keep this for candlesticks
        });

        // **Modify TradingView iframe background via CSS**
        const iframe = document.querySelector('iframe');
        if (iframe) {
          const css = `
            body, .chart-page {
              background-color:#181A20 !important;
            }
          `;
          const style = document.createElement('style');
          style.innerHTML = css;
          iframe.contentDocument.head.appendChild(style);
        }
      }
    });
  }
}, [tvWidget]);



  // Initialize chart when symbol is valid
  // Socket subscription is handled by streaming.js (queues if socket not ready yet)
  useEffect(() => {
    if (symbol.split('/')[0] !== 'undefined') {
      if (functCheckRef.current) {
        getChart(symbol);
      }
      functCheckRef.current = false;
    };
  }, [symbol]);

  // Cleanup on unmount - disconnect chart socket and remove widget
  useEffect(() => {
    return () => {
      // Disconnect the chart socket when leaving the page
      disconnectChartSocket();
      
      // Remove the TradingView widget
      if (tvWidget) {
        try {
          tvWidget.remove();
        } catch (e) {
          // Widget removal error - safe to ignore
        }
      }
    };
  }, [tvWidget]);

  useEffect(() => {
    if (tvWidget) {
      tvWidget.onChartReady(() => {
        const chart = tvWidget.chart();
        if (chart) {
          chart.setSymbol(symbol, () => null);
        }
      });
    }
  }, [symbol]);

  // useEffect(() => {
  //   getChart(symbol);
  // }, [newStoredTheme, Theme]);
  useEffect(() => {
    if (tvWidget) {

      // Wait for the chart to initialize before changing the theme
      const checkInitialization = async () => {
        try {
          // Wait until _innerWindowLoaded promise is fulfilled
          await tvWidget._innerWindowLoaded;
          const Theme = localStorage.getItem('theme');

          // Change theme based on the stored theme
          if (Theme === 'light') {
            tvWidget.changeTheme("light");
          } else {
            tvWidget.changeTheme("dark");
          }
        } catch (error) {
          console.error("Error during chart initialization or theme change:", error);
        }
      };

      checkInitialization();
    }
  }, [newStoredTheme, tvWidget]);

  useEffect(() => {
    if (tvWidget) {
      tvWidget.onChartReady(() => {
        const chart = tvWidget.chart();
        if (chart) {
          tvWidget.headerReady().then(function () {
            const intervals = [
              { value: '1', label: '1 Min' },
              { value: '5', label: '5 Min' },
              { value: '15', label: '15 Min' },
              { value: '30', label: '30 Min' },
              { value: '60', label: '1 Hour' },
              { value: 'D', label: '1 Day' },
              { value: 'W', label: '1 Week' },
              { value: 'M', label: '1 Month' }
            ];
            intervals.forEach(interval => {
              const button = tvWidget.createButton();
              button.classList.add('custom-interval-button');
              button.title = `Switch to ${interval.label}`;
              button.addEventListener('click', function () {
                tvWidget.chart().setResolution(interval.value);
              });
              button.textContent = interval.label;
            });
          });
        }
      });
    }
  }, [tvWidget]);


  useEffect(() => {
    if (tvWidget) {
      tvWidget.onChartReady(() => {
        const chart = tvWidget.chart();
        if (chart) {
          // **Find and remove the built-in volume study**
          const studies = chart.getAllStudies();
          studies.forEach(study => {
            if (study.name.toLowerCase().includes('volume')) {
              chart.removeEntity(study.id);
            }
          });
  
          // **Ensure volume is displayed in a separate pane**
          chart.createStudy('Volume', false, true);
  
          // **Apply UI customizations**
          chart.applyOverrides({
            "paneProperties.background": "#181A20",
            "scalesProperties.backgroundColor": "#181A20",
            "paneProperties.backgroundType": "solid",
            "mainSeriesProperties.style": 1, // Keep candlesticks
          });
        }
      });
    }
  }, [tvWidget]);
  
  

  // useEffect(() => {
  //   if (tvWidget) {
  //     tvWidget.onChartReady(() => {
  //       const chart = tvWidget.chart();
  //       if (chart) {
  //         // Add Moving Average (MA) and Relative Strength Index (RSI) by default
  //         chart.createStudy('Moving Average', false, false, [14], null, {
  //           'Plot.color': '#FF0000' // Red MA Line
  //         });
  
  //         chart.createStudy('Relative Strength Index', false, false, [14], null, {
  //           'plot.color': '#00FF00' // Green RSI Line
  //         });
  
  //         // chart.createStudy('Volume', false, false, [], null, {
  //         //   'volume.color': '#0000FF' // Blue Volume bars
  //         // });
  //       }
  //     });
  //   }
  // }, [tvWidget]);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (tvWidget) {
      tvWidget.onChartReady(() => {
        setIsReady(true);
      });
    }
  }, [tvWidget]);
  
  

  const isMobile = window.innerWidth <= 480;
  const chartHeight = isMobile ? '400px' : '625px';
  const Theme = localStorage.getItem('theme');
  const bgColor = Theme === 'light' ? '#ffffff' : '#181A20';

  return (
    <div style={{ position: "relative", minHeight: chartHeight, height: chartHeight, backgroundColor: bgColor }}>
      {/* Chart Container */}
      <div
        id="TVChartContainer"
        style={{
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.1s ease",
          backgroundColor: bgColor,
          height: "100%",
        }}
      />
  
      {/* Loader Overlay */}
      {!isReady && (
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
            background: bgColor,
            zIndex: 10,
          }}
        >
          <div className="spinner-border text-primary" role="status" style={{ width: '1.5rem', height: '1.5rem', borderColor: 'rgba(255, 255, 255, 0.3)', borderRightColor: 'transparent' }}  />
        </div>
      )}
    </div>
  );
  
}  