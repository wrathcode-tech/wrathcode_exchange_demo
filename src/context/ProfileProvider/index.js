import React, { useEffect, createContext, useState, useCallback, useRef } from 'react';
import AuthService from '../../api/services/AuthService';
import LoaderHelper from '../../customComponents/Loading/LoaderHelper';
import { alertErrorMessage } from '../../customComponents/CustomAlertMessage';

export const ProfileContext = createContext();

export function ProfileProvider(props) {
  const [userDetails, setUserDetails] = useState({});
  const [loginDetails, setLoginDetails] = useState([]);
  const [newStoredTheme, setNewStoredTheme] = useState('');
  const [lastLogin, setLastLogin] = useState("");
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [themeUpdated, setThemeUpdated] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('theme') === 'light';
    } catch {
      return false;
    }
  });
  const [refreshModal, setRefreshModal] = useState(true);
  const [refreshNotification, setRefreshNotification] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  // Shared state for APIs that should only run once after login
  const [estimatedPortfolio, setEstimatedPortfolio] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notificationCounts, setNotificationCounts] = useState({ unseen: 0 });
  const [pairs, setPairs] = useState([]);
  const [walletTypes, setWalletTypes] = useState([]);

  // Refs to track if APIs have been called
  const isInitialized = useRef(false);

  const token = localStorage.getItem('token');

  const updateModelHideStatus = (value) => {
    localStorage.setItem(value, true);
    setRefreshModal(!refreshModal);
  };

  const handleUserDetails = useCallback(async () => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.getDetails();
      if (result?.success) {
        setUserDetails(result?.data);
      } else {
        alertErrorMessage(result?.message);
      }
    } catch (error) {
      // Silent fail
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, []);

  const activityLogs = useCallback(async () => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.getActivityLogs(0, 1);
      if (result?.success) {
        setLastLogin(result?.data[0]?.createdAt);
      }
    } catch {
      // Silent fail
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, []);

  // Fetch estimated portfolio - shared across components
  const fetchEstimatedPortfolio = useCallback(async (type = "") => {
    try {
      const result = await AuthService.estimatedPortfolio(type);
      if (result?.success) {
        setEstimatedPortfolio(result?.data || {});
        return result?.data;
      }
    } catch {
      // Silent fail
    }
    return null;
  }, []);

  // Refresh portfolio (for manual refresh from components)
  const refreshEstimatedPortfolio = useCallback(async (type = "") => {
    return await fetchEstimatedPortfolio(type);
  }, [fetchEstimatedPortfolio]);

  // Fetch notifications - shared across components
  const fetchNotifications = useCallback(async () => {
    try {
      const result = await AuthService.notifications();
      if (result?.success) {
        setNotifications(result?.data?.reverse() || []);
        setNotificationCounts(result?.counts || { unseen: 0 });
        return result;
      }
    } catch {
      // Silent fail
    }
    return null;
  }, []);

  // Fetch pairs - shared across components
  const fetchPairs = useCallback(async () => {
    try {
      const result = await AuthService.getPairs();
      if (result?.success) {
        setPairs(result?.data || []);
        return result?.data;
      }
    } catch {
      // Silent fail
    }
    return null;
  }, []);

  // Fetch wallet types - shared across components
  const fetchWalletTypes = useCallback(async () => {
    try {
      const result = await AuthService.availableWalletTypes();
      if (result?.success) {
        setWalletTypes(result?.data || []);
        return result?.data;
      }
    } catch {
      // Silent fail
    }
    return null;
  }, []);

  // Generate socket IDs
  const generateSocketUniqueId = useCallback((length = 15) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uniqueId += characters.charAt(randomIndex);
    }
    localStorage.setItem("socketId", uniqueId);
  }, []);

  const generateFutureSocketUniqueId = useCallback((length = 15) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uniqueId += characters.charAt(randomIndex);
    }
    localStorage.setItem("socketIdFuture", uniqueId);
  }, []);

  // Initialize all APIs once after login
  useEffect(() => {
    // Always generate socket IDs
    generateSocketUniqueId();
    generateFutureSocketUniqueId();

    // Only fetch user-specific data if logged in and not already initialized
    if (token && !isInitialized.current) {
      isInitialized.current = true;
      
      // Run all initial API calls
      handleUserDetails();
      activityLogs();
      fetchEstimatedPortfolio("");
      fetchNotifications();
      fetchPairs();
      fetchWalletTypes();
    }

    // Reset initialization flag when token is cleared (logout)
    if (!token) {
      isInitialized.current = false;
      setEstimatedPortfolio({});
      setNotifications([]);
      setNotificationCounts({ unseen: 0 });
      setPairs([]);
      setWalletTypes([]);
    }
  }, [token, handleUserDetails, activityLogs, fetchEstimatedPortfolio, fetchNotifications, fetchPairs, fetchWalletTypes, generateSocketUniqueId, generateFutureSocketUniqueId]);

  // Refresh notifications when refreshNotification flag changes
  useEffect(() => {
    if (token && refreshNotification) {
      fetchNotifications();
    }
  }, [refreshNotification, token, fetchNotifications]);

  const handleTheme = () => {
    const htmlTag = document.documentElement;
    const currentTheme = htmlTag.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    htmlTag.setAttribute('data-theme', newTheme);
    setNewStoredTheme(newTheme);
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const htmlTag = document.documentElement;
    if (storedTheme) {
      htmlTag.setAttribute('data-theme', storedTheme);
    } else {
      const defaultTheme = 'dark';
      htmlTag.setAttribute('data-theme', defaultTheme);
      localStorage.setItem('CurrentTheme', defaultTheme);
    }
  }, []);

  // Sync themeUpdated to DOM and localStorage (no reload needed)
  useEffect(() => {
    const htmlTag = document.documentElement;
    if (themeUpdated) {
      document.body.classList.add('light_theme');
      localStorage.setItem('theme', 'light');
      htmlTag.setAttribute('data-theme', 'light');
    } else {
      document.body.classList.remove('light_theme');
      localStorage.setItem('theme', 'dark');
      htmlTag.setAttribute('data-theme', 'dark');
    }
  }, [themeUpdated]);

  return (
    <ProfileContext.Provider value={{
      // Existing values
      refreshNotification,
      setRefreshNotification,
      updateModelHideStatus,
      currentPage,
      setCurrentPage,
      lastLogin,
      userDetails,
      setUserDetails,
      handleUserDetails,
      setLoginDetails,
      loginDetails,
      handleTheme,
      newStoredTheme,
      activeTab,
      setActiveTab,
      themeUpdated,
      setThemeUpdated,
      
      // New shared state
      estimatedPortfolio,
      refreshEstimatedPortfolio,
      notifications,
      notificationCounts,
      fetchNotifications,
      pairs,
      fetchPairs,
      walletTypes,
      fetchWalletTypes,
    }}>
      {props.children}
    </ProfileContext.Provider>
  );
}
