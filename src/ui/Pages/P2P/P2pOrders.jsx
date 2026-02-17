import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import P2pLayout from './P2pLayout'
import AuthService from '../../../api/services/AuthService'
import { ApiConfig } from '../../../api/apiConfig/apiConfig'
import { alertSuccessMessage } from '../../../customComponents/CustomAlertMessage'
import './p2p.css'

const P2pOrders = () => {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedSide, setSelectedSide] = useState('')
    const [selectedCrypto, setSelectedCrypto] = useState('')
    const [selectedFiat, setSelectedFiat] = useState('')

    // Filter options
    const [cryptoList, setCryptoList] = useState([])
    const [fiatList, setFiatList] = useState([])
    const [loadingFilters, setLoadingFilters] = useState(true)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [itemsPerPage] = useState(10)

    // Load filter options
    const loadFilterOptions = async () => {
        try {
            setLoadingFilters(true)
            const [fiatRes, cryptoRes] = await Promise.all([
                AuthService.getFiatCurrency(),
                AuthService.getCurrency()
            ])

            const fiatData = fiatRes?.success ? fiatRes.data : (fiatRes?.data || fiatRes || [])
            if (Array.isArray(fiatData)) {
                setFiatList(fiatData)
            }

            const cryptoData = cryptoRes?.success ? cryptoRes.data : (cryptoRes?.data || cryptoRes || [])
            if (Array.isArray(cryptoData)) {
                setCryptoList(cryptoData)
            }
        } catch (error) {
            console.error('Error loading filter options:', error)
        } finally {
            setLoadingFilters(false)
        }
    }

    const fetchOrders = async (page = 1) => {
        try {
            setLoading(true)
            const params = {
                page,
                limit: itemsPerPage
            }
            if (selectedStatus) params.status = selectedStatus
            if (selectedSide) params.side = selectedSide
            if (selectedCrypto) params.crypto = selectedCrypto
            if (selectedFiat) params.fiat = selectedFiat

            const response = await AuthService.getP2pOrders(params)
            if (response?.success && response?.data) {
                setOrders(response.data.orders || [])
                if (response.data.pagination) {
                    setCurrentPage(response.data.pagination.currentPage || 1)
                    setTotalPages(response.data.pagination.totalPages || 0)
                    setTotalCount(response.data.pagination.totalCount || 0)
                }
            } else {
                setOrders([])
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFilterOptions()
    }, [])

    useEffect(() => {
        fetchOrders(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStatus, selectedSide, selectedCrypto, selectedFiat])

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '')
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT': return '#fbbf24'
            case 'PAID': return '#7c9eb2'
            case 'RELEASED': return '#22c55e'
            case 'CANCELLED': return '#ef4444'
            case 'DISPUTE': return '#f97316'
            default: return '#888'
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT': return 'Pending'
            case 'PAID': return 'Paid'
            case 'RELEASED': return 'Completed'
            case 'CANCELLED': return 'Cancelled'
            case 'DISPUTE': return 'Disputed'
            default: return status
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        alertSuccessMessage("Copied to clipboard!")
    }

    // Fee for order: only SELL (user as seller) has fee; BUY shows "----"
    const getFeeForOrder = (order) => {
        if (order.role !== 'SELLER') return { text: '----', isSell: false }
        const p2pFee = cryptoList.find(c => (c.short_name || '').toUpperCase() === (order.cryptoCurrency || '').toUpperCase())?.p2p_fee ?? 0
        const feeAmount = (Number(order.cryptoAmount) || 0) * p2pFee / 100
        return { text: `${feeAmount.toFixed(2)} ${order.cryptoCurrency} (${p2pFee}%)`, isSell: true }
    }

    const paginate = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return
        fetchOrders(pageNumber)
    }

    const clearFilters = () => {
        setSelectedStatus('')
        setSelectedSide('')
        setSelectedCrypto('')
        setSelectedFiat('')
    }

    const hasActiveFilters = selectedStatus || selectedSide || selectedCrypto || selectedFiat

    return (
        <P2pLayout title="P2P Orders">
            <div className="p2p-dashboard-container">
                {/* Header */}
                <div className="p2p-orders-header">
                    <h2 className="p2p-orders-title">My Orders</h2>
                    <span className="p2p-orders-count">{totalCount} orders</span>
                </div>

                {/* Filter Section */}
                <div className="p2p-filter-section">
                    <div className="p2p-filter-group">
                        <span className="p2p-filter-label">Side</span>
                        <select
                            className="p2p-filter-select"
                            value={selectedSide}
                            onChange={(e) => setSelectedSide(e.target.value)}
                        >
                            <option value="">All Orders</option>
                            <option value="BUY">Buy Orders</option>
                            <option value="SELL">Sell Orders</option>
                        </select>
                    </div>

                    <div className="p2p-filter-group">
                        <span className="p2p-filter-label">Status</span>
                        <select
                            className="p2p-filter-select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="PENDING_PAYMENT">Pending Payment</option>
                            <option value="PAID">Paid</option>
                            <option value="RELEASED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="DISPUTE">Disputed</option>
                        </select>
                    </div>

                    <div className="p2p-filter-group">
                        <span className="p2p-filter-label">Crypto</span>
                        <select
                            className="p2p-filter-select"
                            value={selectedCrypto}
                            onChange={(e) => setSelectedCrypto(e.target.value)}
                            disabled={loadingFilters}
                        >
                            <option value="">All Crypto</option>
                            {cryptoList.map((crypto) => (
                                <option key={crypto._id} value={crypto.short_name}>
                                    {crypto.short_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="p2p-filter-group">
                        <span className="p2p-filter-label">Fiat</span>
                        <select
                            className="p2p-filter-select"
                            value={selectedFiat}
                            onChange={(e) => setSelectedFiat(e.target.value)}
                            disabled={loadingFilters}
                        >
                            <option value="">All Fiat</option>
                            {fiatList.map((fiat) => (
                                <option key={fiat._id} value={fiat.short_name}>
                                    {fiat.short_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {hasActiveFilters && (
                        <button className="p2p-find-orders-btn" onClick={clearFilters}>
                            <i className="ri-close-line"></i>
                            Clear Filters
                        </button>
                    )}

                    <button
                        className="p2p-find-orders-btn"
                        onClick={() => fetchOrders(1)}
                        style={{ marginLeft: 'auto' }}
                    >
                        <i className="ri-refresh-line"></i>
                        Refresh
                    </button>
                </div>

                {/* Desktop Table View */}
                <div className="p2p-orders-table-wrapper">
                    <table className="p2p-orders-table">
                        <thead>
                            <tr>
                                <th>Type / Date</th>
                                <th>Order Number</th>
                                <th>Price</th>
                                <th>Fiat / Crypto Amount</th>
                                <th>Fee</th>
                                <th>Counterparty</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="p2p-loading-container">
                                            <div className="spinner-border text-primary" role="status" />
                                            <p style={{ color: '#6b7280', marginTop: '12px' }}></p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="8">
                                        <div className="p2p-empty-state-card">
                                            <i className="ri-file-list-3-line" style={{ fontSize: '48px', color: '#6b7280' }}></i>
                                            <p>No orders found</p>
                                            <span style={{ color: '#6b7280', fontSize: '13px' }}>Your P2P orders will appear here</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order._id} onClick={() => navigate(`/p2p-order-details/${order._id}`)}>
                                    <td>
                                        <div className="p2p-order-type-cell">
                                            <span className={`p2p-order-type ${order.role === 'BUYER' ? 'buy' : 'sell'}`}>
                                                {order.role === 'BUYER' ? 'Buy' : 'Sell'}
                                            </span>
                                            <span className="p2p-order-crypto">{order.cryptoCurrency}</span>
                                            <span className="p2p-order-date">{formatDate(order.createdAt)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="p2p-order-id"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                copyToClipboard(order._id)
                                            }}
                                        >
                                            {order._id?.slice(0, 8)}...{order._id?.slice(-4)}
                                            <i className="ri-file-copy-line"></i>
                                        </span>
                                    </td>
                                    <td>
                                        <span className="p2p-price-value">
                                            {order.price?.toLocaleString()} {order.fiatCurrency}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="p2p-amount-cell">
                                            <span className="p2p-fiat-amount">
                                                {order.fiatAmount?.toLocaleString()} {order.fiatCurrency}
                                            </span>
                                            <span className="p2p-crypto-amount">
                                                {order.cryptoAmount} {order.cryptoCurrency}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={getFeeForOrder(order).isSell ? 'p2p-orders-fee-value' : ''}>
                                            {getFeeForOrder(order).text}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="p2p-counterparty-cell">
                                            <div className="p2p-counterparty-avatar">
                                                {order.counterparty?.profilePicture ? (
                                                    <img
                                                        src={`${ApiConfig.baseImage}${order.counterparty.profilePicture}`}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <span>{(order.counterparty?.userName || 'U').charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <span className="p2p-counterparty-name">
                                                {order.counterparty?.userName || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`p2p-order-status-badge ${order.status !== "CANCELLED" ? "status_complete" : ""
                                                }`}
                                            style={{
                                                color: getStatusColor(order.status),
                                                border: `1px solid ${getStatusColor(order.status)}30`,
                                            }}
                                        >
                                            {getStatusText(order.status)}
                                        </span>

                                    </td>
                                    <td>
                                        <button
                                            className="p2p-order-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigate(`/p2p-order-details/${order._id}`)
                                            }}
                                        >
                                            <i className="ri-chat-3-line"></i>
                                            Chat {order.unreadCount > 0 && <span className="p2p-unread-badge">({order.unreadCount})</span>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p2p-pagination-wrapper">
                            <div className="p2p-pagination-info">
                                Showing {orders.length} of {totalCount} orders
                            </div>
                            <div className="p2p-pagination-controls">
                                <button
                                    className="p2p-page-btn"
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                >
                                    &lt;
                                </button>

                                {currentPage > 2 && (
                                    <>
                                        <button
                                            className="p2p-page-btn"
                                            onClick={() => paginate(1)}
                                            disabled={loading}
                                        >
                                            1
                                        </button>
                                        {currentPage > 3 && <span className="p2p-page-dots">...</span>}
                                    </>
                                )}

                                {[...Array(totalPages)].map((_, idx) => {
                                    const pageNum = idx + 1
                                    if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) {
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`p2p-page-btn ${currentPage === pageNum ? 'p2p-active' : ''}`}
                                                onClick={() => paginate(pageNum)}
                                                disabled={loading}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    }
                                    return null
                                })}

                                {currentPage < totalPages - 1 && (
                                    <>
                                        {currentPage < totalPages - 2 && <span className="p2p-page-dots">...</span>}
                                        <button
                                            className="p2p-page-btn"
                                            onClick={() => paginate(totalPages)}
                                            disabled={loading}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}

                                <button
                                    className="p2p-page-btn"
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Card View */}
                <div className="p2p-mobile-orders-list">
                    {loading ? (
                        <div className="p2p-loading-container">
                            <div className="spinner-border text-primary" role="status" />
                            <p style={{ color: '#6b7280', marginTop: '12px' }}></p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="p2p-empty-state-card">
                            <i className="ri-file-list-3-line" style={{ fontSize: '48px', color: '#6b7280' }}></i>
                            <p>No orders found</p>
                            <span style={{ color: '#6b7280', fontSize: '13px' }}>Your P2P orders will appear here</span>
                        </div>
                    ) : orders.map((order) => (
                        <div
                            key={order._id}
                            className="p2p-mobile-order-card"
                            onClick={() => navigate(`/p2p-order-details/${order._id}`)}
                        >
                            <div className="p2p-mobile-card-header">
                                <div className="p2p-mobile-card-user">
                                    <div
                                        className="p2p-mobile-card-avatar"
                                        style={{
                                            background: order.role === 'BUYER' ?
                                                'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                                                'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                        }}
                                    >
                                        {order.role === 'BUYER' ? 'B' : 'S'}
                                    </div>
                                    <div className="p2p-mobile-card-user-info">
                                        <h4>
                                            <span style={{ color: order.role === 'BUYER' ? '#22c55e' : '#ef4444' }}>
                                                {order.role === 'BUYER' ? 'Buy' : 'Sell'}
                                            </span>
                                            <span style={{ color: '#e5e5e5', marginLeft: '6px' }}>{order.cryptoCurrency}</span>
                                        </h4>
                                        <p>{formatDate(order.createdAt)}</p>
                                    </div>
                                </div>
                                <span
                                    className={`p2p-order-status-badge ${order.status !== "CANCELLED" ? "status_complete" : ""} `}
                                    style={{
                                        background: `${getStatusColor(order.status)}15`,
                                        color: getStatusColor(order.status),
                                        border: `1px solid ${getStatusColor(order.status)}30`
                                    }}
                                >
                                    {getStatusText(order.status)}
                                </span>
                            </div>

                            <div className="p2p-mobile-card-details">
                                <div className="p2p-mobile-detail-item">
                                    <span className="p2p-mobile-detail-label">Amount</span>
                                    <span className="p2p-mobile-detail-value valueprice">
                                        {order.fiatAmount?.toLocaleString()} {order.fiatCurrency}
                                    </span>
                                </div>
                                <div className="p2p-mobile-detail-item">
                                    <span className="p2p-mobile-detail-label">Crypto</span>
                                    <span className="p2p-mobile-detail-value">
                                        {order.cryptoAmount} {order.cryptoCurrency}
                                    </span>
                                </div>
                                <div className="p2p-mobile-detail-item">
                                    <span className="p2p-mobile-detail-label">Price</span>
                                    <span className="p2p-mobile-detail-value">
                                        {order.price?.toLocaleString()} {order.fiatCurrency}
                                    </span>
                                </div>
                                <div className="p2p-mobile-detail-item">
                                    <span className="p2p-mobile-detail-label">Fee</span>
                                    <span className={`p2p-mobile-detail-value ${getFeeForOrder(order).isSell ? 'p2p-orders-fee-value' : ''}`}>
                                        {getFeeForOrder(order).text}
                                    </span>
                                </div>
                                <div className="p2p-mobile-detail-item">
                                    <span
                                        className="p2p-mobile-detail-label"

                                    >
                                        Order ID
                                    </span>
                                    <button className="p2p-mobile-view-btn" onClick={(e) => {
                                        e.stopPropagation()
                                        copyToClipboard(order._id)
                                    }}>

                                        {/* <i className="ri-chat-3-line"></i> */}
                                        #{order._id?.slice(-8)}
                                        <i className="ri-file-copy-line"></i>
                                    </button>
                                </div>

                                <div className="p2p-mobile-detail-item">
                                    <span className="p2p-mobile-detail-label">Counterparty</span>
                                    <span className="p2p-mobile-detail-value">
                                        {order.counterparty?.userName || 'Unknown'}
                                    </span>
                                </div>

                                <div className="p2p-mobile-detail-item">
                                    <span
                                        className="p2p-mobile-detail-label"

                                    >
                                        Action
                                    </span>
                                    <button className="p2p-mobile-view-btn">

                                        Chat {order.unreadCount > 0 && <span className="p2p-unread-badge">({order.unreadCount})</span>}
                                        <i className="ri-chat-3-line"></i>
                                    </button>
                                </div>




                            </div>

                            {/* <div className="p2p-mobile-card-footer">
                              
                               
                                        </div> */}
                        </div>
                    ))}

                    {/* Mobile Pagination */}
                    {totalPages > 1 && (
                        <div className="p2p-pagination-wrapper p2p-mobile">
                            <div className="p2p-pagination-info">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="p2p-pagination-controls">
                                <button
                                    className="p2p-page-btn"
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                >
                                    &lt;
                                </button>
                                <span className="p2p-page-current">{currentPage}</span>
                                <button
                                    className="p2p-page-btn"
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </P2pLayout>
    )
}

export default P2pOrders
