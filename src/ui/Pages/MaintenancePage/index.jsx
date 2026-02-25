import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePlatformStatus } from '../../../context/PlatformStatusProvider';

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
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpire?.();
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
    <span className="maintenance_countdown">
      {diff.d > 0 && `${diff.d}d `}
      {String(diff.h).padStart(2, '0')}:{String(diff.m).padStart(2, '0')}:{String(diff.s).padStart(2, '0')}
    </span>
  );
}

const MaintenancePage = () => {
  const { platformStatus, refetch } = usePlatformStatus();
  const fullItem = platformStatus?.full_maintenance;
  const scheduledAt = fullItem?.scheduled_at;
  const action = fullItem?.scheduled_action || 'disable';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="maintenance_page">
      <div className="maintenance_bg" style={{ backgroundImage: 'url(/images/maintance.jpg)' }} />
      <div className="maintenance_overlay" />
      <div className="maintenance_content">
        <h1>System Under Maintenance</h1>
        <p>We are currently performing scheduled maintenance. Please check back later.</p>
        {scheduledAt && (
          <div className="maintenance_timer">
            <span className="maintenance_timer_label">
              {action === 'enable' ? 'Maintenance will be enabled in:' : 'Maintenance will be disabled in:'}
            </span>
            <Countdown scheduledAt={scheduledAt} onExpire={refetch} />
          </div>
        )}
        <Link to="/" className="btn custom-btn btn-xl maintenance_btn">
          <i className="ri-home-7-line me-3" /> Back to Home
        </Link>
      </div>
      <style>{`
        .maintenance_page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .maintenance_bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .maintenance_overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
        }
        .maintenance_content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 2rem;
          max-width: 480px;
        }
        .maintenance_content h1 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .maintenance_content p {
          color: #9ca3af;
          margin-bottom: 1rem;
        }
        .maintenance_timer {
          margin: 1.25rem 0;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
        }
        .maintenance_timer_label {
          display: block;
          font-size: 0.875rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        .maintenance_countdown {
          font-size: 1.5rem;
          font-weight: 600;
          color: #f3bb2b;
        }
        .maintenance_btn {
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage;
