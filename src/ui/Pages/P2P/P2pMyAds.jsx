import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import P2pLayout from './P2pLayout';
import AuthService from '../../../api/services/AuthService';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import { alertSuccessMessage, alertErrorMessage } from '../../../customComponents/CustomAlertMessage';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import './p2p.css';

const P2pMyAds = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [ads, setAds] = useState([]);
    const [expandedAdId, setExpandedAdId] = useState(null);

    // Close ad modal state
    const [closeModal, setCloseModal] = useState({
        show: false,
        adId: null,
        adDetails: null,
        reason: '',
        isSubmitting: false,
        error: ''
    });

    // Toggle status loading
    const [togglingAdId, setTogglingAdId] = useState(null);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Filter states
    const [filters, setFilters] = useState({
        side: '',
        status: '',
        fiatCurrency: '',
        qouteCurrency: ''
    });

    // Mobile filter visibility
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Crypto list with p2p_fee (for fee display on SELL ads)
    const [cryptoList, setCryptoList] = useState([]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch P2P crypto list (short_name, p2p_fee) for fee display
    useEffect(() => {
        const fetchCryptoList = async () => {
            try {
                const result = await AuthService.getCurrency();
                if (result?.success && result?.data) setCryptoList(result.data);
            } catch (_) {}
        };
        fetchCryptoList();
    }, []);

    // Fee for ad: SELL = volume * p2p_fee%, BUY = "----"
    const getFeeForAd = (ad) => {
        if (ad.side !== 'SELL') return { text: '----', isSell: false };
        const p2pFee = cryptoList.find(c => (c.short_name || '').toUpperCase() === (ad.qouteCurrency || '').toUpperCase())?.p2p_fee ?? 0;
        const feeAmount = (Number(ad.volume) || 0) * p2pFee / 100;
        return { text: `${feeAmount.toFixed(2)} ${ad.qouteCurrency} (${p2pFee}%)`, isSell: true };
    };

    // Fetch user ads
    const fetchUserAds = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                ...(filters.side && { side: filters.side }),
                ...(filters.status && { status: filters.status }),
                ...(filters.fiatCurrency && { fiatCurrency: filters.fiatCurrency }),
                ...(filters.qouteCurrency && { qouteCurrency: filters.qouteCurrency })
            };

            const result = await AuthService.getUserAds(params);
            if (result?.success) {
                setAds(result.data?.ads || []);
                setPagination(result.data?.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalCount: 0,
                    limit: 10,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            } else {
                setAds([]);
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
            setAds([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchUserAds(1);
    }, [fetchUserAds]);

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            side: '',
            status: '',
            fiatCurrency: '',
            qouteCurrency: ''
        });
    };

    // Handle pagination
    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.totalPages) {
            fetchUserAds(page);
        }
    };

    // Toggle expanded row
    const toggleExpanded = (adId) => {
        setExpandedAdId(expandedAdId === adId ? null : adId);
    };

    // Open close modal
    const openCloseModal = (ad) => {
        setCloseModal({
            show: true,
            adId: ad._id,
            adDetails: ad,
            reason: '',
            isSubmitting: false,
            error: ''
        });
    };

    // Close modal
    const handleCloseModal = () => {
        setCloseModal({
            show: false,
            adId: null,
            adDetails: null,
            reason: '',
            isSubmitting: false,
            error: ''
        });
    };

    // Handle reason input
    const handleReasonChange = (e) => {
        const value = e.target.value;
        if (value.length <= 500) {
            setCloseModal(prev => ({
                ...prev,
                reason: value,
                error: ''
            }));
        }
    };

    // Validate ObjectId
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

    // Handle close ad submission
    const handleCloseAdSubmit = async () => {
        const { adId, reason } = closeModal;

        // Validation
        if (!adId) {
            setCloseModal(prev => ({ ...prev, error: 'Ad ID is missing' }));
            return;
        }

        if (!isValidObjectId(adId)) {
            setCloseModal(prev => ({ ...prev, error: 'Invalid ad ID format' }));
            return;
        }

        if (reason && reason.length > 500) {
            setCloseModal(prev => ({ ...prev, error: 'Reason cannot exceed 500 characters' }));
            return;
        }

        setCloseModal(prev => ({ ...prev, isSubmitting: true, error: '' }));
        LoaderHelper.loaderStatus(true);

        try {
            const result = await AuthService.closeAd(adId, reason);
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                alertSuccessMessage(result?.message || 'Ad closed successfully');
                handleCloseModal();
                fetchUserAds(pagination.currentPage);
            } else {
                setCloseModal(prev => ({
                    ...prev,
                    isSubmitting: false,
                    error: result?.message || 'Failed to close ad'
                }));
                alertErrorMessage(result?.message || 'Failed to close ad');
            }
        } catch (error) {
            LoaderHelper.loaderStatus(false);
            setCloseModal(prev => ({
                ...prev,
                isSubmitting: false,
                error: 'Something went wrong. Please try again.'
            }));
            alertErrorMessage('Something went wrong. Please try again.');
        }
    };

    // Check if ad can be closed
    const canCloseAd = (ad) => {
        return ad.status === 'OPEN' || ad.status === 'PARTIALLY_FILLED';
    };

    // Check if ad can be toggled online/offline
    const canToggleStatus = (ad) => {
        return ad.status === 'OPEN' || ad.status === 'PARTIALLY_FILLED';
    };

    // Toggle ad online/offline status
    const handleToggleStatus = async (ad) => {
        setTogglingAdId(ad._id);
        LoaderHelper.loaderStatus(true);
        try {
            const newStatus = !ad.isOnline;
            const result = await AuthService.updateAdStatus(ad._id, newStatus);
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                alertSuccessMessage(result?.message || `Ad is now ${newStatus ? 'online' : 'offline'}`);
                // Update local state
                setAds(prevAds => prevAds.map(a =>
                    a._id === ad._id ? { ...a, isOnline: newStatus } : a
                ));
            } else {
                alertErrorMessage(result?.message || 'Failed to update status');
            }
        } catch (error) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage('Something went wrong. Please try again.');
            console.error('Error toggling ad status:', error);
        } finally {
            setTogglingAdId(null);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status color (simple, muted colors)
    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return '#d1d5db';
            case 'PARTIALLY_FILLED': return '#d1d5db';
            case 'FILLED': return '#9ca3af';
            case 'CANCELLED': return '#6b7280';
            case 'CLOSED': return '#6b7280';
            default: return '#9ca3af';
        }
    };

    // Get status label
    const getStatusLabel = (status) => {
        switch (status) {
            case 'OPEN': return 'Active';
            case 'PARTIALLY_FILLED': return 'Partial';
            case 'FILLED': return 'Completed';
            case 'CANCELLED': return 'Cancelled';
            case 'CLOSED': return 'Closed';
            default: return status;
        }
    };

    // Format label from camelCase
    const formatLabel = (text) => {
        return text
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    };

    // Render pagination buttons
    const renderPagination = () => {
        const pages = [];
        const { currentPage, totalPages } = pagination;

        pages.push(
            <button
                key="prev"
                className="p2p-page-btn"
                disabled={!pagination.hasPrevPage}
                onClick={() => handlePageChange(currentPage - 1)}
            >
                ‹
            </button>
        );

        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            pages.push(
                <button
                    key={i}
                    className={`p2p-page-btn ${currentPage === i ? 'p2p-active' : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        if (totalPages > 5) {
            pages.push(<span key="dots" className="p2p-page-dots">...</span>);
            pages.push(
                <button
                    key={totalPages}
                    className={`p2p-page-btn ${currentPage === totalPages ? 'p2p-active' : ''}`}
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </button>
            );
        }

        pages.push(
            <button
                key="next"
                className="p2p-page-btn"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(currentPage + 1)}
            >
                ›
            </button>
        );

        return pages;
    };

    // Render payment details
    const renderPaymentDetails = (paymentDetails) => {
        if (!paymentDetails || paymentDetails.length === 0) {
            return <span className="p2p-myads-no-details">No payment details</span>;
        }

        const excludeKeys = ['_id', 'templateId', 'type', 'name', 'qrCode'];

        return (
            <div className="p2p-myads-payment-details">
                {paymentDetails.map((payment, index) => {
                    const displayFields = Object.entries(payment).filter(
                        ([key, value]) => !excludeKeys.includes(key) && value && value !== ''
                    );

                    return (
                        <div key={payment._id || index} className="p2p-myads-payment-card">
                            <div className="p2p-myads-payment-header">
                                <span className="p2p-myads-payment-type">{payment.name || payment.type}</span>
                                {payment.type && payment.type !== payment.name && (
                                    <span className="p2p-myads-payment-type-badge">{payment.type}</span>
                                )}
                            </div>
                            <div className="p2p-myads-payment-fields">
                                {displayFields.map(([key, value]) => (
                                    <div key={key} className="p2p-myads-payment-field">
                                        <span className="p2p-myads-payment-label">{formatLabel(key)}</span>
                                        <span className="p2p-myads-payment-value">{value}</span>
                                    </div>
                                ))}
                            </div>
                            {payment.qrCode && (
                                <div className="p2p-myads-payment-qr">
                                    <img
                                        src={`${ApiConfig.baseImage}${payment.qrCode}`}
                                        alt="QR Code"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <P2pLayout title="My Ads">
            <div className="p2p-myads-container">
                <div className="p2p-dashboard-container">
                    {/* Page Header */}
                    <div className="p2p-myads-header">
                        <div>
                            <h2 className="p2p-myads-title">My Ads</h2>
                            <p className="p2p-myads-subtitle">Manage your P2P advertisements</p>
                        </div>
                        <button
                            className="p2p-create-ad-btn"
                            onClick={() => navigate('/p2p-create-post')}
                        >
                            + Create Ad
                        </button>
                    </div>

                    {/* Mobile Filter Toggle */}
                    {isMobile && (
                        <div className="p2p-mobile-filter-header">
                            <button
                                className={`p2p-mobile-filter-toggle ${showMobileFilters ? 'active' : ''}`}
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                            >
                                <i className="ri-filter-3-line"></i>
                                <span>Filters</span>
                                <i className={`ri-arrow-${showMobileFilters ? 'up' : 'down'}-s-line`}></i>
                            </button>
                            {(filters.side || filters.status || filters.fiatCurrency || filters.qouteCurrency) && (
                                <div className="p2p-mobile-active-filters">
                                    {filters.side && <span className="p2p-active-filter-tag">{filters.side}</span>}
                                    {filters.status && <span className="p2p-active-filter-tag">{filters.status === 'OPEN' ? 'Active' : filters.status}</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Filter Section */}
                    <div className={`p2p-filter-section myadsfillter ${isMobile ? (showMobileFilters ? 'show' : '') : ''}`}>
                        <div className="p2p-filter-group">
                            <span className="p2p-filter-label">Side</span>
                            <select
                                className="p2p-filter-select"
                                value={filters.side}
                                onChange={(e) => handleFilterChange('side', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="BUY">Buy</option>
                                <option value="SELL">Sell</option>
                            </select>
                        </div>

                        <div className="p2p-filter-group">
                            <span className="p2p-filter-label">Status</span>
                            <select
                                className="p2p-filter-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="OPEN">Active</option>
                                <option value="PARTIALLY_FILLED">Partial</option>
                                <option value="FILLED">Completed</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>

                        <div className="p2p-filter-group">
                            <span className="p2p-filter-label">Crypto</span>
                            <select
                                className="p2p-filter-select"
                                value={filters.qouteCurrency}
                                onChange={(e) => handleFilterChange('qouteCurrency', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="USDT">USDT</option>
                                <option value="BTC">BTC</option>
                                <option value="ETH">ETH</option>
                            </select>
                        </div>

                        <div className="p2p-filter-group">
                            <span className="p2p-filter-label">Fiat</span>
                            <select
                                className="p2p-filter-select"
                                value={filters.fiatCurrency}
                                onChange={(e) => handleFilterChange('fiatCurrency', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="INR">INR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>

                        <button
                            className="p2p-find-orders-btn"
                            onClick={() => {
                                clearFilters();
                                if (isMobile) setShowMobileFilters(false);
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="p2p-myads-stats-grid">
                        {[
                            { label: 'Total Ads', value: pagination.totalCount },
                            { label: 'Active Ads', value: ads.filter(ad => ad.status === 'OPEN' || ad.status === 'PARTIALLY_FILLED').length },
                            { label: 'Partially Filled', value: ads.filter(ad => ad.status === 'PARTIALLY_FILLED').length },
                            { label: 'Online Ads', value: ads.filter(ad => ad.isOnline && (ad.status === 'OPEN' || ad.status === 'PARTIALLY_FILLED')).length },
                            { label: 'Offline Ads', value: ads.filter(ad => !ad.isOnline && (ad.status === 'OPEN' || ad.status === 'PARTIALLY_FILLED')).length },
                            { label: 'Completed', value: ads.filter(ad => ad.status === 'FILLED' || ad.status === 'CLOSED').length }
                        ].map((stat, idx) => (
                            <div key={idx} className="p2p-myads-stat-card">
                                <div className="p2p-myads-stat-card-label">{stat.label}</div>
                                <div className="p2p-myads-stat-card-value">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="p2p-loading-container">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    )}

                    {/* Table */}
                    {!loading && (
                        <div className="p2p-orders-table-wrapper">
                            <table className="p2p-orders-table">
                                <thead>
                                    <tr>
                                        <th>Type / Asset</th>
                                        <th>Price</th>
                                        <th>Volume</th>
                                        <th>Limits</th>
                                        <th>Fee</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ads.length > 0 ? (
                                        ads.map((ad) => (
                                            <React.Fragment key={ad._id}>
                                                <tr className={expandedAdId === ad._id ? 'p2p-row-expanded' : ''}>
                                                    <td>
                                                        <div className="p2p-myads-asset-cell">
                                                            <span className={`p2p-myads-side-badge ${ad.side === 'BUY' ? 'buy' : 'sell'}`}>
                                                                {ad.side}
                                                            </span>
                                                            <div className="p2p-myads-asset-info">
                                                                <span className="p2p-myads-asset-name">
                                                                    {ad.qouteCurrency}
                                                                </span>
                                                                {/* <span className="p2p-myads-asset-fiat" style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                / {ad.fiatCurrency}
                                                            </span> */}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-myads-table-cell-content">
                                                            <span className="p2p-myads-price-text">
                                                                {Number(ad.fixedPrice).toLocaleString()}    {ad.fiatCurrency}
                                                            </span>
                                                            {/* <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                            {ad.fiatCurrency}
                                                        </span> */}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-myads-table-cell-content">
                                                            <span className="p2p-myads-volume-text">
                                                                {ad.volume} {ad.qouteCurrency}
                                                            </span>
                                                            {/* <span style={{ fontSize: '11px', color: '#52525b', marginTop: '2px' }}>
                                                            {((1 - ad.remainingVolume / ad.volume) * 100).toFixed(1)}% filled
                                                        </span> */}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-myads-table-cell-content">
                                                            <span className="p2p-myads-limits-text">
                                                                {Number(ad.minLimit).toLocaleString()} - {Number(ad.maxLimit).toLocaleString()}
                                                            </span>
                                                            {/* <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                            {ad.fiatCurrency}
                                                        </span> */}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-myads-table-cell-content">
                                                            {(() => {
                                                                const fee = getFeeForAd(ad);
                                                                return (
                                                                    <span className={fee.isSell ? 'p2p-myads-fee-value' : ''}>{fee.text}</span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-myads-table-cell-content-gap">
                                                            <div className="p2p-payment-badges">
                                                                {ad.paymentMethodType?.slice(0, 2).map((method, i) => (
                                                                    <span key={i} className="p2p-payment-badge">
                                                                        {method}
                                                                    </span>
                                                                ))}
                                                                {ad.paymentMethodType?.length > 2 && (
                                                                    <span className="p2p-payment-badge-count">
                                                                        +{ad.paymentMethodType.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* {ad.paymentMethodType?.length > 0 && (
                                                            <span style={{ fontSize: '11px', color: '#52525b' }}>
                                                                {ad.paymentMethodType.length} method{ad.paymentMethodType.length > 1 ? 's' : ''}
                                                            </span>
                                                        )} */}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-myads-status-cell">
                                                            <span
                                                                className="p2p-myads-status"
                                                                style={{ color: getStatusColor(ad.status) }}
                                                            >
                                                                {getStatusLabel(ad.status)}
                                                            </span>
                                                            {/* {canToggleStatus(ad) && (
                                                            <span className={`p2p-myads-online-badge ${ad.isOnline ? 'online' : 'offline'}`} style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                fontSize: '11px',
                                                                fontWeight: '500'
                                                            }}>
                                                                <span className="p2p-myads-online-dot" style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    background: ad.isOnline ? '#4ade80' : '#6b7280'
                                                                }}></span>
                                                                {ad.isOnline ? 'Online' : 'Offline'}
                                                            </span>
                                                        )} */}
                                                        </div>
                                                    </td>
                                                    <td className="p2p-myads-actions-cell">
                                                        <div className="p2p-myads-actions">
                                                            <button
                                                                className={`p2p-myads-action-btn p2p-myads-action-btn-view ${expandedAdId === ad._id ? 'active' : ''}`}
                                                                onClick={() => toggleExpanded(ad._id)}
                                                            >
                                                                <i className={`ri-${expandedAdId === ad._id ? 'eye-off' : 'eye'}-line p2p-myads-action-btn-icon`}></i>
                                                                {expandedAdId === ad._id ? 'Hide' : 'View'}
                                                            </button>
                                                            {canToggleStatus(ad) && (
                                                                <button
                                                                    className="p2p-myads-action-btn"
                                                                    onClick={() => handleToggleStatus(ad)}
                                                                    disabled={togglingAdId === ad._id}
                                                                >
                                                                    <i className={`ri-${ad.isOnline ? 'wifi-off' : 'wifi'}-line p2p-myads-action-btn-icon ${!ad.isOnline ? 'p2p-myads-action-btn-icon-online' : ''}`}></i>
                                                                    {togglingAdId === ad._id ? '...' : (ad.isOnline ? 'Offline' : 'Online')}
                                                                </button>
                                                            )}
                                                            {canCloseAd(ad) && (
                                                                <button
                                                                    className="p2p-myads-action-btn p2p-myads-action-btn-close"
                                                                    onClick={() => openCloseModal(ad)}
                                                                >
                                                                    <i className="ri-close-circle-line p2p-myads-action-btn-icon"></i>
                                                                    Close
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Expanded Row */}
                                                {expandedAdId === ad._id && (
                                                    <tr className="p2p-expanded-row">
                                                        <td colSpan="8">
                                                            <div className="p2p-myads-expanded-content">
                                                                <div className="p2p-myads-expanded-grid">
                                                                    {/* Left Column - Key Metrics */}
                                                                    <div className='volumedatails'>
                                                                        <div className="p2p-myads-expanded-section">
                                                                            <h4 className="p2p-myads-expanded-title">Volume & Limits</h4>
                                                                            <div className="p2p-myads-expanded-content-list">
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Volume</span>
                                                                                    <span className="p2p-myads-expanded-item-value">
                                                                                        {ad.remainingVolume} / {ad.volume} {ad.qouteCurrency}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Limits</span>
                                                                                    <span className="p2p-myads-expanded-item-value">
                                                                                        {Number(ad.minLimit).toLocaleString()} - {Number(ad.maxLimit).toLocaleString()} {ad.fiatCurrency}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Filled</span>
                                                                                    <span className="p2p-myads-expanded-item-value">
                                                                                        {(ad.volume - ad.remainingVolume).toFixed(4)} {ad.qouteCurrency}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Fill Rate</span>
                                                                                    <span className="p2p-myads-expanded-item-value">
                                                                                        {((1 - ad.remainingVolume / ad.volume) * 100).toFixed(1)}%
                                                                                    </span>
                                                                                </div>
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Fee</span>
                                                                                    <span className={`p2p-myads-expanded-item-value ${ad.side === 'SELL' ? 'p2p-myads-fee-value' : ''}`}>
                                                                                        {getFeeForAd(ad).text}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Payment Methods */}
                                                                        {ad.paymentMethodType && ad.paymentMethodType.length > 0 && (
                                                                            <div className="p2p-myads-expanded-section">
                                                                                <h4 className="p2p-myads-expanded-title">
                                                                                    Payment Methods
                                                                                    <span className="p2p-myads-expanded-title-count">({ad.paymentMethodType?.length || 0})</span>
                                                                                </h4>
                                                                                <div className="p2p-myads-expanded-payments">
                                                                                    {ad.paymentMethodType?.map((method, i) => (
                                                                                        <span key={i} className="p2p-payment-badge p2p-payment-badge-expanded">{method}</span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Right Column - Ad Details */}
                                                                    <div className='volumedatails'>
                                                                        <div className="p2p-myads-expanded-section">
                                                                            <h4 className="p2p-myads-expanded-title">
                                                                                Ad Details
                                                                                {canToggleStatus(ad) && (
                                                                                    <span className={`p2p-myads-online-badge ${ad.isOnline ? 'online' : 'offline'}`}>
                                                                                        <span className="p2p-myads-online-dot"></span>
                                                                                        {ad.isOnline ? 'Online' : 'Offline'}
                                                                                    </span>
                                                                                )}
                                                                            </h4>

                                                                            <div className="p2p-myads-expanded-content-list">
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Ad ID</span>
                                                                                    <span className="p2p-myads-expanded-item-value-small">{ad.adUid}</span>
                                                                                </div>
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Price Type</span>
                                                                                    <span className="p2p-myads-expanded-item-value">{ad.priceType}</span>
                                                                                </div>
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Payment Time</span>
                                                                                    <span className="p2p-myads-expanded-item-value">{ad.paymentTimeLimit} min</span>
                                                                                </div>
                                                                                <div className="p2p-myads-expanded-item">
                                                                                    <span className="p2p-myads-expanded-item-label">Created</span>
                                                                                    <span className="p2p-myads-expanded-item-value-small">{formatDate(ad.createdAt)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Payment Details (for SELL orders) */}
                                                                {ad.side === 'SELL' && ad.paymentDetails?.length > 0 && (
                                                                    <div className="p2p-myads-expanded-section p2p-myads-expanded-section-border">
                                                                        <h4 className="p2p-myads-expanded-title p2p-myads-expanded-title-large">
                                                                            Payment Account Details
                                                                            <span className="p2p-myads-expanded-title-count">({ad.paymentDetails?.length || 0})</span>
                                                                        </h4>
                                                                        {renderPaymentDetails(ad.paymentDetails)}
                                                                    </div>
                                                                )}

                                                                {/* Closed Info (if ad is closed) */}
                                                                {(ad.status === 'CLOSED' || ad.status === 'CANCELLED' || ad.status === 'FILLED') && ad.closedByUser !== undefined && (
                                                                    <div className="p2p-myads-expanded-section p2p-myads-expanded-section-border">
                                                                        <h4 className="p2p-myads-expanded-title p2p-myads-expanded-title-large">Closure Information</h4>
                                                                        <div className="p2p-myads-closure-info">
                                                                            <div className="p2p-myads-closure-badge">
                                                                                <span className="p2p-myads-closure-icon">{ad.closedByUser ? '👤' : '⚙️'}</span>
                                                                                <span className="p2p-myads-closure-text">
                                                                                    {ad.closedByUser
                                                                                        ? 'Closed by you'
                                                                                        : ad.status === 'FILLED'
                                                                                            ? 'Fully filled'
                                                                                            : 'Closed by system'}
                                                                                </span>
                                                                                {ad.closedAt && (
                                                                                    <span className="p2p-myads-closure-date">
                                                                                        on {formatDate(ad.closedAt)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {ad.closeReason && (
                                                                                <div className="p2p-myads-closure-reason">
                                                                                    <span className="p2p-myads-closure-reason-label">Reason:</span>
                                                                                    <span className="p2p-myads-closure-reason-text">{ad.closeReason}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="p2p-empty-state">
                                            <div className="p2p-empty-state-card bg-none">
                                            <i className="ri-file-list-3-line" style={{ fontSize: '48px', color: '#6b7280' }}></i>
                                            <p>No orders found</p>
                                        </div>
                                                <button
                                                    className="p2p-create-ad-btn-small"
                                                    onClick={() => navigate('/p2p-create-post')}
                                                >
                                                    Create your first ad
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {ads.length > 0 && (
                                <div className="p2p-pagination-wrapper">
                                    <span className="p2p-pagination-info">
                                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                                    </span>
                                    <div className="p2p-pagination-buttons">
                                        {renderPagination()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile Card View */}
                    {!loading && (
                        <div className="p2p-mobile-orders-list">
                            {ads.length > 0 ? (
                                ads.map((ad) => (
                                    <div key={ad._id} className="p2p-mobile-order-card">
                                        <div className="p2p-mobile-card-header myadsheading">
                                            <div className="p2p-mobile-card-user">
                                                <span className={`p2p-myads-side-badge ${ad.side === 'BUY' ? 'buy' : 'sell'}`}>
                                                    {ad.side}
                                                </span>
                                                <div className="p2p-mobile-card-user-info">
                                                    <h4>{ad.qouteCurrency}/{ad.fiatCurrency}</h4>
                                                    <p>
                                                        {formatDate(ad.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p2p-mobile-card-price">
                                                {canToggleStatus(ad) && (
                                                    <span className={`p2p-myads-online-badge small ${ad.isOnline ? 'online' : 'offline'}`}>
                                                        <span className="p2p-myads-online-dot"></span>
                                                        {ad.isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                )}

                                            </div>
                                        </div>

                                        <div className="p2p-mobile-card-details">


                                            <div className="p2p-mobile-detail-item">
                                                <span className="p2p-mobile-detail-label">Status</span>
                                                <span className="p2p-mobile-detail-value"><div className="p2p-currency"> <span className={`p2p-order-status-badge ${ad.status === "OPEN" ? "status_complete" : ""
                                                    }`} style={{ color: getStatusColor(ad.status), fontSize: '12px' }}>{getStatusLabel(ad.status)}</span></div></span>
                                            </div>
                                            <div className="p2p-mobile-detail-item">
                                                <span className="p2p-mobile-detail-label">Price</span>
                                                <span className="p2p-mobile-detail-value"><div className="p2p-currency">{Number(ad.fixedPrice).toLocaleString()} {ad.fiatCurrency}</div></span>
                                            </div>
                                            <div className="p2p-mobile-detail-item">
                                                <span className="p2p-mobile-detail-label">Volume</span>
                                                <span className="p2p-mobile-detail-value">{ad.remainingVolume}/{ad.volume} {ad.qouteCurrency}</span>
                                            </div>
                                            <div className="p2p-mobile-detail-item">
                                                <span className="p2p-mobile-detail-label">Limits</span>
                                                <span className="p2p-mobile-detail-value">{Number(ad.minLimit).toLocaleString()} - {Number(ad.maxLimit).toLocaleString()}</span>
                                            </div>
                                            <div className="p2p-mobile-detail-item">
                                                <span className="p2p-mobile-detail-label">Fee</span>
                                                <span className={`p2p-mobile-detail-value ${getFeeForAd(ad).isSell ? 'p2p-myads-fee-value' : ''}`}>{getFeeForAd(ad).text}</span>
                                            </div>
                                            <div className="p2p-mobile-detail-item">
                                                <span className="p2p-mobile-detail-label">Time Limit</span>
                                                <span className="p2p-mobile-detail-value">{ad.paymentTimeLimit} min</span>
                                            </div>

                                            <div className="p2p-mobile-detail-item">
                                                <span className="p2p-mobile-detail-label">Payment</span>
                                                <span className="p2p-mobile-detail-value">
                                                    {ad.paymentMethodType?.map((method, i) => (
                                                        <span key={i} className="p2p-mobile-payment-badge">{method}</span>
                                                    ))}
                                                </span>
                                            </div>

                                        </div>

                                        {/* <div className="p2p-mobile-card-payments">
                                       
                                    </div> */}

                                        {/* Mobile Actions */}
                                        <div className="p2p-mobile-card-actions">
                                            <button
                                                className="p2p-myads-action-btn"
                                                onClick={() => toggleExpanded(ad._id)}
                                            >
                                                <i className={`ri-${expandedAdId === ad._id ? 'eye-off' : 'eye'}-line`}></i>
                                                {expandedAdId === ad._id ? 'Hide' : 'View'}
                                            </button>
                                            {canToggleStatus(ad) && (
                                                <button
                                                    className="p2p-myads-action-btn"
                                                    onClick={() => handleToggleStatus(ad)}
                                                    disabled={togglingAdId === ad._id}
                                                >
                                                    <i className={`ri-${ad.isOnline ? 'wifi-off' : 'wifi'}-line`} style={!ad.isOnline ? { color: '#4ade80' } : {}}></i>
                                                    {togglingAdId === ad._id ? '...' : (ad.isOnline ? 'Offline' : 'Online')}
                                                </button>
                                            )}
                                            {canCloseAd(ad) && (
                                                <button
                                                    className="p2p-myads-action-btn"
                                                    onClick={() => openCloseModal(ad)}
                                                >
                                                    <i className="ri-close-circle-line"></i>
                                                    Close
                                                </button>
                                            )}
                                        </div>

                                        {/* Mobile Expanded Details */}
                                        {expandedAdId === ad._id && (
                                            <div className="p2p-mobile-expanded-details">
                                                <div className="p2p-myads-expanded-section">
                                                    <h4 className="p2p-myads-expanded-title">Ad Details</h4>
                                                    <div className="p2p-myads-expanded-grid mobile">
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Ad ID</span>
                                                            <span className="p2p-myads-expanded-value small">{ad.adUid}</span>
                                                        </div>
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Price Type</span>
                                                            <span className="p2p-myads-expanded-value">{ad.priceType}</span>
                                                        </div>
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Payment Time</span>
                                                            <span className="p2p-myads-expanded-value">{ad.paymentTimeLimit} min</span>
                                                        </div>
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Created</span>
                                                            <span className="p2p-myads-expanded-value">{formatDate(ad.createdAt)}</span>
                                                        </div>
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Total Volume</span>
                                                            <span className="p2p-myads-expanded-value">{ad.volume} {ad.qouteCurrency}</span>
                                                        </div>
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Remaining</span>
                                                            <span className="p2p-myads-expanded-value">{ad.remainingVolume} {ad.qouteCurrency}</span>
                                                        </div>
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Filled</span>
                                                            <span className="p2p-myads-expanded-value">{(ad.volume - ad.remainingVolume).toFixed(4)} {ad.qouteCurrency}</span>
                                                        </div>
                                                        <div className="p2p-myads-expanded-item">
                                                            <span className="p2p-myads-expanded-label">Fill Rate</span>
                                                            <span className="p2p-myads-expanded-value">
                                                                {((1 - ad.remainingVolume / ad.volume) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment Methods */}
                                                {ad.paymentMethodType && ad.paymentMethodType.length > 0 && (
                                                    <div className="p2p-myads-expanded-section">
                                                        <h4 className="p2p-myads-expanded-title">
                                                            Payment Methods
                                                            <span className="p2p-myads-expanded-count">({ad.paymentMethodType?.length || 0})</span>
                                                        </h4>
                                                        <div className="p2p-myads-expanded-payments">
                                                            {ad.paymentMethodType?.map((method, i) => (
                                                                <span key={i} className="p2p-payment-badge">{method}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Payment Details for SELL */}
                                                {ad.side === 'SELL' && ad.paymentDetails?.length > 0 && (
                                                    <div className="p2p-myads-expanded-section">
                                                        <h4 className="p2p-myads-expanded-title">
                                                            Payment Account Details
                                                            <span className="p2p-myads-expanded-count">({ad.paymentDetails?.length || 0})</span>
                                                        </h4>
                                                        {renderPaymentDetails(ad.paymentDetails)}
                                                    </div>
                                                )}

                                                {/* Closed Info for Mobile */}
                                                {(ad.status === 'CLOSED' || ad.status === 'CANCELLED' || ad.status === 'FILLED') && ad.closedByUser !== undefined && (
                                                    <div className="p2p-myads-expanded-section">
                                                        <h4 className="p2p-myads-expanded-title">Closure Information</h4>
                                                        <div className="p2p-myads-closure-info">
                                                            <div className="p2p-myads-closure-badge">
                                                                <span className="p2p-myads-closure-icon">{ad.closedByUser ? '👤' : '⚙️'}</span>
                                                                <span className="p2p-myads-closure-text">
                                                                    {ad.closedByUser
                                                                        ? 'Closed by you'
                                                                        : ad.status === 'FILLED'
                                                                            ? 'Fully filled'
                                                                            : 'Closed by system'}
                                                                </span>
                                                                {ad.closedAt && (
                                                                    <span className="p2p-myads-closure-date">
                                                                        on {formatDate(ad.closedAt)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {ad.closeReason && (
                                                                <div className="p2p-myads-closure-reason">
                                                                    <span className="p2p-myads-closure-reason-label">Reason:</span>
                                                                    <span className="p2p-myads-closure-reason-text">{ad.closeReason}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p2p-empty-state-mobile">
                                    <div className="p2p-empty-icon">📋</div>
                                    <p>No ads found</p>
                                    <button
                                        className="p2p-create-ad-btn-small"
                                        onClick={() => navigate('/p2p-create-post')}
                                    >
                                        Create your first ad
                                    </button>
                                </div>
                            )}

                            {/* Mobile Pagination */}
                            {ads.length > 0 && (
                                <div className="p2p-pagination-wrapper p2p-mobile">
                                    <span className="p2p-pagination-info">
                                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                                    </span>
                                    <div className="p2p-pagination-buttons">
                                        {renderPagination()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Close Ad Modal */}
                    {closeModal.show && (
                        <div className="p2p-modal-overlay" onClick={handleCloseModal}>
                            <div className="p2p-close-ad-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="p2p-close-ad-modal-header">
                                    <h3 className="p2p-close-ad-modal-title">Close Advertisement</h3>
                                    <button className="p2p-close-ad-modal-close" onClick={handleCloseModal}>
                                        ×
                                    </button>
                                </div>

                                <div className="p2p-close-ad-modal-body">
                                    {/* Warning Banner */}
                                    <div className="p2p-close-ad-warning">
                                        <span className="p2p-close-ad-warning-icon">⚠️</span>
                                        <div className="p2p-close-ad-warning-content">
                                            <strong>Are you sure you want to close this ad?</strong>
                                            <p>This action cannot be undone. Any remaining volume will be returned to your wallet.</p>
                                        </div>
                                    </div>

                                    {/* Ad Summary */}
                                    {closeModal.adDetails && (
                                        <div className="p2p-close-ad-summary">
                                            <div className="p2p-close-ad-summary-header">
                                                <span className={`p2p-myads-side-badge ${closeModal.adDetails.side === 'BUY' ? 'buy' : 'sell'}`}>
                                                    {closeModal.adDetails.side}
                                                </span>
                                                <span className="p2p-close-ad-summary-pair">
                                                    {closeModal.adDetails.qouteCurrency}/{closeModal.adDetails.fiatCurrency}
                                                </span>
                                            </div>
                                            <div className="p2p-close-ad-summary-grid">
                                                <div className="p2p-close-ad-summary-item">
                                                    <span className="p2p-close-ad-summary-label">Price</span>
                                                    <span className="p2p-close-ad-summary-value">
                                                        {Number(closeModal.adDetails.fixedPrice).toLocaleString()} {closeModal.adDetails.fiatCurrency}
                                                    </span>
                                                </div>
                                                <div className="p2p-close-ad-summary-item">
                                                    <span className="p2p-close-ad-summary-label">Remaining</span>
                                                    <span className="p2p-close-ad-summary-value">
                                                        {closeModal.adDetails.remainingVolume} {closeModal.adDetails.qouteCurrency}
                                                    </span>
                                                </div>
                                                <div className="p2p-close-ad-summary-item">
                                                    <span className="p2p-close-ad-summary-label">Filled</span>
                                                    <span className="p2p-close-ad-summary-value">
                                                        {(closeModal.adDetails.volume - closeModal.adDetails.remainingVolume).toFixed(4)} {closeModal.adDetails.qouteCurrency}
                                                    </span>
                                                </div>
                                                <div className="p2p-close-ad-summary-item">
                                                    <span className="p2p-close-ad-summary-label">Status</span>
                                                    <span className="p2p-close-ad-summary-value" style={{ color: getStatusColor(closeModal.adDetails.status) }}>
                                                        {getStatusLabel(closeModal.adDetails.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reason Input */}
                                    <div className="p2p-close-ad-reason-group">
                                        <label className="p2p-close-ad-reason-label">
                                            Reason for closing <span className="p2p-optional-badge">Optional</span>
                                        </label>
                                        <textarea
                                            className={`p2p-close-ad-reason-input ${closeModal.error ? 'error' : ''}`}
                                            placeholder="Enter your reason for closing this ad (optional)..."
                                            value={closeModal.reason}
                                            onChange={handleReasonChange}
                                            maxLength={500}
                                            rows={3}
                                        />
                                        <div className="p2p-close-ad-reason-footer">
                                            {closeModal.error && (
                                                <span className="p2p-close-ad-error">{closeModal.error}</span>
                                            )}
                                            <span className="p2p-close-ad-char-count">
                                                {closeModal.reason.length}/500
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p2p-close-ad-modal-footer">
                                    <button
                                        className="p2p-close-ad-btn-cancel"
                                        onClick={handleCloseModal}
                                        disabled={closeModal.isSubmitting}
                                    >
                                        Keep Ad Open
                                    </button>
                                    <button
                                        className="p2p-close-ad-btn-confirm"
                                        onClick={handleCloseAdSubmit}
                                        disabled={closeModal.isSubmitting}
                                    >
                                        {closeModal.isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                                                Closing...
                                            </>
                                        ) : (
                                            'Confirm Close'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </P2pLayout>
    );
};

export default P2pMyAds;
