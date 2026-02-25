import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PlatformService from '../api/services/PlatformService';

export const PlatformStatusContext = createContext({
  platformStatus: null,
  loading: true,
  refetch: () => {},
  isFullMaintenance: false,
  getStatus: (key) => ({}),
});

const DEFAULT_STATUS = {
  spot_trading: { enabled: true, scheduled_at: null, scheduled_action: null },
  futures_trading: { enabled: true, scheduled_at: null, scheduled_action: null },
  p2p_trading: { enabled: true, scheduled_at: null, scheduled_action: null },
  staking: { enabled: true, scheduled_at: null, scheduled_action: null },
  launchpad: { enabled: true, scheduled_at: null, scheduled_action: null },
  swap: { enabled: true, scheduled_at: null, scheduled_action: null },
  deposit: { enabled: true, scheduled_at: null, scheduled_action: null },
  withdrawal: { enabled: true, scheduled_at: null, scheduled_action: null },
  full_maintenance: { enabled: false, scheduled_at: null, scheduled_action: null },
};

export function PlatformStatusProvider({ children }) {
  const [platformStatus, setPlatformStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await PlatformService.getPlatformStatus();
      if (result?.success && result?.data) {
        setPlatformStatus(result.data);
      } else {
        setPlatformStatus(DEFAULT_STATUS);
      }
    } catch {
      setPlatformStatus(DEFAULT_STATUS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const getStatus = useCallback((key) => {
    return platformStatus?.[key] ?? DEFAULT_STATUS[key] ?? { enabled: true, scheduled_at: null, scheduled_action: null };
  }, [platformStatus]);

  const isFullMaintenance = platformStatus?.full_maintenance?.enabled === true;

  return (
    <PlatformStatusContext.Provider value={{
      platformStatus: platformStatus ?? DEFAULT_STATUS,
      loading,
      refetch: fetchStatus,
      isFullMaintenance,
      getStatus,
    }}>
      {children}
    </PlatformStatusContext.Provider>
  );
}

export function usePlatformStatus() {
  return useContext(PlatformStatusContext);
}
