import React, { useState, useEffect, useRef } from 'react';
import { usePlatformStatus } from '../../context/PlatformStatusProvider';

function formatScheduledTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function Countdown({ scheduledAt, onExpire }) {
  const [diff, setDiff] = useState(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!scheduledAt) return;
    expiredRef.current = false;
    const target = new Date(scheduledAt);
    const tick = () => {
      const ms = target - new Date();
      if (ms <= 0) {
        setDiff({ d: 0, h: 0, m: 0, s: 0 });
        if (!expiredRef.current && onExpire) {
          expiredRef.current = true;
          onExpire();
        }
        return;
      }
      setDiff({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms / 3600000) % 24),
        m: Math.floor((ms / 60000) % 60),
        s: Math.floor((ms / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [scheduledAt, onExpire]);
  if (!diff) return null;
  return (
    <span className="platform_banner_countdown">
      {diff.d > 0 && `${diff.d}d `}
      {String(diff.h).padStart(2, '0')}:{String(diff.m).padStart(2, '0')}:{String(diff.s).padStart(2, '0')}
    </span>
  );
}

const LABELS = {
  spot_trading: 'Spot Trading',
  futures_trading: 'Futures Trading',
  p2p_trading: 'P2P Trading',
  staking: 'Staking',
  launchpad: 'Launchpad',
  swap: 'Swap',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  full_maintenance: 'Full maintenance',
};

const PlatformStatusBanner = () => {
  const { platformStatus, isFullMaintenance, refetch } = usePlatformStatus();
  const [banners, setBanners] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!platformStatus || isFullMaintenance) return;
    const items = [];
    Object.entries(platformStatus).forEach(([key, item]) => {
      if (item?.scheduled_at) {
        const label = LABELS[key] || key;
        const action = item.scheduled_action || 'disable';
        const time = formatScheduledTime(item.scheduled_at);
        // enable = feature will be enabled at scheduled time (coming back online)
        // disable = feature will be disabled at scheduled time (going down)
        const text = action === 'enable'
          ? `${label} will be enabled at ${time}`
          : `${label} will be disabled at ${time}`;
        items.push({ key, text, scheduled_at: item.scheduled_at, action });
      }
    });
    setBanners(items);
  }, [platformStatus, isFullMaintenance]);

  if (dismissed || banners.length === 0) return null;

  return (
    <div className="platform_status_banner">
      <div className="platform_status_banner_inner">
        <i className="ri-time-line" />
        <div className="platform_status_banner_content">
          {banners.map(({ key, text, scheduled_at, action }) => (
            <div key={key} className="platform_status_banner_item" role="status" aria-live="polite">
              <span className="platform_status_banner_text">{text}</span>
              <span className="platform_status_banner_countdown_wrap">
                <span className="platform_status_banner_label">
                  {action === 'enable' ? 'Will be enabled in:' : 'Will be disabled in:'}
                </span>
                <Countdown scheduledAt={scheduled_at} onExpire={refetch} />
              </span>
            </div>
          ))}
        </div>
        {/* <Link to="/maintenance" className="platform_status_banner_link">View details</Link> */}
        <button
          type="button"
          className="platform_status_banner_close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <i className="ri-close-line" />
        </button>
      </div>
      <style>{`
        .platform_status_banner {
    color: #fff;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #333;
        }
        .platform_status_banner_inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
        }
        .platform_status_banner_inner > i { color: #f3bb2b; font-size: 1.25rem; }
        .platform_status_banner_content { flex: 1; min-width: 200px; }
        .platform_status_banner_item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; flex-wrap: wrap; }
        .platform_status_banner_text { flex: 1; min-width: 200px; }
        .platform_status_banner_countdown_wrap { display: inline-flex; align-items: center; gap: 0.35rem; }
        .platform_status_banner_label { color: #9ca3af; font-size: 0.8125rem; }
        .platform_banner_countdown { font-weight: 600; color: #f3bb2b; }
        .platform_status_banner_link { color: #f3bb2b; text-decoration: none; font-size: 0.875rem; white-space: nowrap; }
        .platform_status_banner_link:hover { text-decoration: underline; }
        .platform_status_banner_close { background: none; border: none; color: #9ca3af; cursor: pointer; padding: 0.25rem; }
        .platform_status_banner_close:hover { background: none; }
      `}</style>
    </div>
  );
};

export default PlatformStatusBanner;
