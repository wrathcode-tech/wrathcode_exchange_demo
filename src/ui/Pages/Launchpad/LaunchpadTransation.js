import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const LaunchpadTransation = (props) => {
    const [transactionHistory, setTransactionHistory] = useState([]);


    const handleTransactionHistory = async (page = 1) => {
        try {
            LoaderHelper.loaderStatus(true);
            const result = await AuthService.userTokenTransactionHistory(page, 20);
            const data = result?.data;
            if (result?.success) {
                setTransactionHistory(Array.isArray(data) ? data : []);
            } else {
                setTransactionHistory([]);
                alertErrorMessage(result?.message || "No transaction data found");
            }
        } catch (e) {
            alertErrorMessage("Failed to fetch transaction history");
            setTransactionHistory([]);
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    };

    useEffect(() => {
        handleTransactionHistory();
    }, []);

    const columns = [
        { name: "#", selector: (_, index) => index + 1 },
        {
            name: "Updated Time",
            selector: (row) => moment(row?.createdAt).format("DD/MM/YYYY LT"),
        },
        { name: "Amount", selector: (row) => row?.amount || 0 },
        { name: "Currency", selector: (row) => row?.currency || "-" },
        { name: "Short Name", selector: (row) => row?.short_name || "-" },
        { name: "Description", selector: (row) => row?.description || "-" },
        // { name: "Transaction Type", selector: (row) => row?.transaction_type || "-" },

        {
            name: "Status",
            selector: (row) => (
                <span
                    style={{
                        color:
                            row?.status === "SUCCESS"
                                ? "#5EBA89 "
                                : row?.status === "FAILED"
                                    ? "#E45561"
                                    : " #555",
                        fontWeight: 600,
                    }}
                >
                    {row?.status}
                </span>
            ),
        },
    ];


    return (
        <div className="dashboard_right">
            <div className="dashboard_listing_section Overview_mid">
                <div className="listing_left_outer full_width transaction_history_t">
                    <div className="market_section spotorderhist" style={{ color: "#fff" }}>
                        <div className="top_heading">
                            <h4>Launchpad Transactions History</h4>
                        </div>
                        <div className="dashboard_summary">
                            <div className="table-responsive">
                                {transactionHistory && transactionHistory.length > 0 ? (
                                    <table className="table table-striped" style={{ color: "#fff" }}>
                                        <thead>
                                            <tr>
                                                {columns.map((column, index) => (
                                                    <th key={index} style={{ color: "#fff" }}>
                                                        {column.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {transactionHistory.map((item, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    {columns.map((column, colIndex) => (
                                                        <td key={colIndex} style={{ color: "#fff" }}>
                                                            {typeof column.selector === "function"
                                                                ? column.selector(item, rowIndex)
                                                                : "-"}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <>
                                        <div className="no_data_vector text-center">
                                            <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width={96} height={96} alt="no-data" />
                                            <img src="/images/no_data_vector_light.png" className="img-fluid light_img" width={96} height={96} alt="no-data" />
                                        </div>
                                        <p className="text-center" style={{ color: "#fff" }}>
                                            No transaction data found.
                                        </p>
                                    </>
                                )}

                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};

export default LaunchpadTransation;
