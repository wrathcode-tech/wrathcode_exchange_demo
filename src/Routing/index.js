import React, { useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import SignupPage from "../../src/ui/Pages/SignupPage";
import UserHeader from "../customComponents/UserHeader";
import Footer from "../customComponents/Footer";
import LandingPage from "../ui/Pages/LandingPage";
import LoginPage from "../ui/Pages/LoginPage";
import ForgotPassword from "../ui/Pages/ForgotPassword";
import ProfilePage from "../ui/Pages/ProfilePage";
import ComingSoonPage from "../ui/Pages/ComingSoonPage";
import AuthHeader from "../customComponents/AuthHeader";
import Trade from "../ui/Pages/TradePage";
import Market from "../ui/Pages/Market";
import NotificationPage from "../ui/Pages/NotificationPage";
import { ProfileContext } from "../context/ProfileProvider";
import Termsofuse from "../ui/Pages/Termsofuse";
import AmlPolicy from "../ui/Pages/AmlPolicy";
import Contactus from "../ui/Pages/Contactus";
import FeesPage from "../ui/Pages/FeesPage";
import ListCoin from "../ui/Pages/ListCoin";
import ReferalPage from "../ui/Pages/ReferalPage";
import TokenPage from "../ui/Pages/TokenPage";
import SecuritySystem from "../ui/Pages/SecuritySystem";
import RefrealList from "../ui/Pages/RefrealList";
import BlogList from "../ui/Pages/Blog/BlogList";
import MobileChart from "../ui/Pages/MobileChart";
import MobileFuturesChart from "../ui/Pages/MobileFuturesChart";
import BlogDetails from "../ui/Pages/Blog/BlogDetails";
import SettingsPage from "../ui/Pages/SettingsPage";
import SupportPage from "../ui/Pages/Support";
import TwofactorPage from "../ui/Pages/TwofactorPage";
import ActivitylogPage from "../ui/Pages/ActivitylogPage";
import Dashboard from "../ui/Pages/Dashboard";
import AssetOverview from "../ui/Pages/AssetOverview";
import WalletPage from "../ui/Pages/WalletPage";
import SpotOrders from "../ui/Pages/SpotOrders";
import TransactionHistory from "../ui/Pages/TransactionHistory";
import OpenOrders from "../ui/Pages/OpenOrders";
import SidebarDeposit from "../customComponents/SidebarDeposit";
import DepositPage from "../ui/Pages/DepositPage";
import WithdrawPage from "../ui/Pages/WithdrawPage";
import MemePage from "../ui/Pages/MemePage";
import KycPage from "../ui/Pages/KycPage";
import Earning from "../ui/Pages/Earning";
import Swap from "../ui/Pages/Swap";
import RiskDisclosure from "../ui/Pages/RiskDisclosure";
import PrivacyDataProtectionPolicy from "../ui/Pages/PrivacyDataProtectionPolicy";
import ComplaintsHandlingProcedure from "../ui/Pages/ComplaintsHandlingProcedure";
import GeneralDisclaimer from "../ui/Pages/GeneralDisclaimer";
import FAQSidebar from "../ui/Pages/FAQ/FAQSidebar";
import FAQ from "../ui/Pages/FAQ";
import RegistrationVerification from "../ui/Pages/RegistrationVerification";
import RegistrationResult from "../ui/Pages/RegistrationResult";
import QuickBuySellHistory from "../ui/Pages/QuickBuySellHistory";
import InternalWalletTransHistory from "../ui/Pages/InternalWalletTransHistory";
import EarningPlanHistory from "../ui/Pages/EarningPlanHistory";
import UsdMFutures from "../ui/Pages/FuturesAndOptions/UsdMFutures";
import BonusHistory from "../ui/Pages/Bonus History";
import AnnouncementList from "../ui/Pages/AnnouncmentManagement/AnnouncementList";
import AnnouncementDetails from "../ui/Pages/AnnouncmentManagement/AnnouncementDetails";
import Announcement from "../ui/Pages/AnnouncmentManagement/Announcement";
import LaunchpadHome from "../ui/Pages/Launchpad/LaunchpadHome";
import LaunchpadCoinPage from "../ui/Pages/Launchpad/LaunchpadCoinPage";
import LaunchpadTransation from "../ui/Pages/Launchpad/LaunchpadTransation";

// P2p Routes
import P2pDashboard from "../ui/Pages/P2P/P2pDashboard";
import P2pOrderDetails from "../ui/Pages/P2P/P2pOrderDetails";
import P2pCreatePost from "../ui/Pages/P2P/P2pCreatePost";
import P2pMyAds from "../ui/Pages/P2P/P2pMyAds";
import P2pOrders from "../ui/Pages/P2P/P2pOrders";
import P2pProfile from "../ui/Pages/P2P/P2pProfile";


function Routing() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const { userDetails } = useContext(ProfileContext);
  const isChartPage = location?.pathname?.includes('/chart') || location?.pathname?.includes('/futures-chart');

  return (
    <>
      {isChartPage ? null : token ? <AuthHeader key={location.pathname} userDetails={userDetails} /> : <UserHeader key={location.pathname} />}
      <Routes>
        <Route exact path="/" element={<LandingPage />} />
        <Route path="/user_profile" element={token ? (<ProfilePage userDetails={userDetails} />) : (<Navigate to="/login" replace state={{ redirectTo: location.pathname }} />)} >
          <Route element={token ? (<SettingsPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route index path="dashboard" element={token ? (<Dashboard userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="asset_overview" element={token ? (<AssetOverview userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="wallet/:walletType" element={token ? (<WalletPage />) : (<Navigate to="/login" replace />)} />
          <Route path="swap_history" element={token ? (<QuickBuySellHistory userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="spot_orders" element={token ? (<SpotOrders userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="transaction_history" element={token ? (<TransactionHistory userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="earning_plan_history" element={token ? (<EarningPlanHistory userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="wallet_transfer_History" element={token ? (<InternalWalletTransHistory userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="bonus_history" element={token ? (<BonusHistory userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="open_orders" element={token ? (<OpenOrders userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="profile_setting" element={token ? (<SettingsPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="kyc" element={token ? (<KycPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="notification" element={token ? (<NotificationPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="launchpad_transactions" element={token ? (<LaunchpadTransation userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="two_factor_autentication" element={token ? (<TwofactorPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="activity_logs" element={token ? (<ActivitylogPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
      
          <Route path="swap" element={token ? (<Swap userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="support" element={token ? (<SupportPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
        </Route>

        <Route path="/asset_managemnet" element={token ? (<SidebarDeposit userDetails={userDetails} />) : (<Navigate to="/login" replace />)} >
          <Route index path="deposit" element={token ? (<DepositPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
          <Route path="withdraw" element={token ? (<WithdrawPage userDetails={userDetails} />) : (<Navigate to="/login" replace />)} />
        </Route>
        <Route path="/referal_list" element={token ? <RefrealList /> : <Navigate to="/login" replace />} />



        <Route exact path="/forgot_password" element={<ForgotPassword />} />
        <Route exact path="/signup" element={!token ? <SignupPage /> : <Navigate to="/user_profile/dashboard" replace />} />
        <Route exact path="/account-verification/:authenticationToken" element={!token ? <RegistrationVerification /> : <Navigate to="/user_profile/dashboard" replace />} />
        <Route exact path="/account-activate/:authenticationToken" element={!token ? <RegistrationResult /> : <Navigate to="/user_profile/dashboard" replace />} />
        <Route exact path="/login" element={!token ? <LoginPage /> : <Navigate to="/user_profile/dashboard" replace />} />
        <Route exact path="/market" element={<Market />} />
        <Route exact path="/earning" element={<Earning />} />
        <Route exact path="/usd_futures/:pairs" element={<UsdMFutures />} />

        <Route exact path="/meme" element={<MemePage />} />
        <Route exact path="/trade/:pairs" element={<Trade />}></Route>
        <Route exact path="/notification" element={<NotificationPage />} />
        <Route exact path="/general-disclaimer" element={<GeneralDisclaimer />} />
        <Route exact path="/RiskDisclosure" element={<RiskDisclosure />} />
        <Route exact path="/TermsofUse" element={<Termsofuse />} />
        <Route exact path="/aml-kyc-policy" element={<AmlPolicy />} />
        <Route exact path="/blogdetails" element={<BlogDetails />}></Route>
        <Route exact path="/PrivacyDataProtectionPolicy" element={<PrivacyDataProtectionPolicy />} />
        <Route exact path="/complaints-handling-procedure" element={<ComplaintsHandlingProcedure />} />
        <Route exact path="/contact" element={<Contactus />} />
        <Route exact path="/fees" element={<FeesPage />} />
        <Route exact path="/coin_list" element={<ListCoin />} />
        <Route exact path="/token" element={<TokenPage />} />
        <Route exact path="/refer_earn" element={<ReferalPage />} />
        <Route exact path="/security_system" element={<SecuritySystem />} />
        <Route exact path="/blogs" element={<BlogList />} />
        <Route exact path="/FAQ" element={<FAQ />}></Route>
        <Route exact path="/FAQSidebar" element={<FAQSidebar />}></Route>
        <Route exact path="/" element={<LandingPage />} />
        <Route path="/chart/:theme/:pairs" element={<MobileChart />} />
        <Route path="/futures-chart/:theme/:pairs" element={<MobileFuturesChart />} />
        <Route path="/announcement" element={<Announcement />} />
        <Route path="/launchpad" element={<LaunchpadHome />} />
        <Route path="/launchpadCoin_Details/:id" element={<LaunchpadCoinPage />} />
        <Route path="/announcement_list/:title/:announce_title_id" element={<AnnouncementList />} />
        <Route path="/announcement_details/:title/:announce_title_id" element={<AnnouncementDetails />} />
        <Route path="/*" element={<ComingSoonPage />} />

        {/* P2P Routes */}
        <Route path="/p2p-dashboard" element={token ? <P2pDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/p2p-order-details/:adId" element={token ? <P2pOrderDetails /> : <Navigate to="/login" replace />} />
        <Route path="/p2p-create-post" element={token ? <P2pCreatePost /> : <Navigate to="/login" replace />} />
        <Route path="/p2p-my-ads" element={token ? <P2pMyAds /> : <Navigate to="/login" replace />} />
        <Route path="/p2p-orders" element={token ? <P2pOrders /> : <Navigate to="/login" replace />} />
        <Route path="/p2p-profile" element={token ? <P2pProfile /> : <Navigate to="/login" replace />} />
      </Routes>
      {location.pathname === '/' && <Footer />}
    </>
  );
}

export default Routing;
