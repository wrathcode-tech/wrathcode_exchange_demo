import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ProfileContext } from "../../context/ProfileProvider";

const Footer = () => {
    const { setActiveTab } = useContext(ProfileContext);
    const [activeFooterSection, setActiveFooterSection] = useState(null);

    const handleupper = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleFooterSection = (key) => (e) => {
        e.preventDefault();
        setActiveFooterSection((prev) => (prev === key ? null : key));
    };

    return (

        <>
            <footer className="p-0">
                <div className="container">
                </div>

                <div className="row main_footer_menu_s m-0">
                    <div className="container">


                        <div className="mobile_grid_list">

                            <div className="col-sm-3 border_hr">
                                <div className={`footer_section ${activeFooterSection === 'about' ? 'active' : ''}`}>
                                    <div className="topheading_footer" onClick={toggleFooterSection('about')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFooterSection('about')(e); } }} aria-expanded={activeFooterSection === 'about'}>
                                        <h3>About Us</h3>
                                        <div className="icon_i"><i className="ri-add-fill"></i><i className="ri-subtract-fill"></i></div>
                                    </div>
                                    <ul className="menu">
                                        <li ><Link to="/TermsofUse" onClick={handleupper}> Terms of Use </Link></li>
                                        <li ><Link to="/RiskDisclosure" onClick={handleupper}>Risk Disclosure</Link></li>
                                        <li ><Link to="/PrivacyDataProtectionPolicy" onClick={handleupper}>Privacy & KYC Policy</Link></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-sm-3">
                                <div className={`footer_section ${activeFooterSection === 'services' ? 'active' : ''}`}>
                                    <div className="topheading_footer" onClick={toggleFooterSection('services')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFooterSection('services')(e); } }} aria-expanded={activeFooterSection === 'services'}>
                                        <h3>Services</h3>
                                        <div className="icon_i"><i className="ri-add-fill"></i><i className="ri-subtract-fill"></i></div>
                                    </div>
                                    <ul className="menu">
                                        <li ><Link to="/announcement" onClick={handleupper}>Announcements</Link></li>
                                        <li ><Link to="/trade/BTC_USDT" onClick={handleupper}>Trade Crypto</Link></li>
                                        <li ><Link to="/fees" onClick={handleupper}>Fees</Link></li>
                                        <li ><Link to="/refer_earn" onClick={handleupper}>Referral Program</Link></li>
                                        <li ><Link to="/coin_list" onClick={handleupper}>Listing Application</Link></li>
                                        {/* <li ><Link to="/user_profile/arbitrage_bot" onClick={handleupper}>Arbitrage Trading Bot</Link></li> */}
                                        {/* <li ><Link to="/crypto_calculator" onClick={handleupper}>Crypto Calculator</Link></li> */}
                                    </ul>
                                </div>
                            </div>
                            <div className="col-sm-3 border_hr">
                                <div className={`footer_section ${activeFooterSection === 'support' ? 'active' : ''}`}>
                                    <div className="topheading_footer" onClick={toggleFooterSection('support')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFooterSection('support')(e); } }} aria-expanded={activeFooterSection === 'support'}>
                                        <h3>Support</h3>
                                        <div className="icon_i"><i className="ri-add-fill"></i><i className="ri-subtract-fill"></i></div>
                                    </div>
                                    <ul className="menu">
                                        <li ><Link to="/contact" onClick={handleupper}>Help Center</Link></li>
                                        <li ><Link to="/FAQ" onClick={handleupper}>FAQ's</Link></li>
                                        <li ><Link to="/security_system" onClick={handleupper}>Security</Link></li>
                                        <li ><Link to="/user_profile/support" onClick={() => { handleupper(); setActiveTab('Support') }}>Submit a Request</Link></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-sm-3">
                                <div className={`footer_section ${activeFooterSection === 'legal' ? 'active' : ''}`}>
                                    <div className="topheading_footer" onClick={toggleFooterSection('legal')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFooterSection('legal')(e); } }} aria-expanded={activeFooterSection === 'legal'}>
                                        <h3>Legal</h3>
                                        <div className="icon_i"><i className="ri-add-fill"></i><i className="ri-subtract-fill"></i></div>
                                    </div>
                                    <ul className="menu">
                                        <li ><Link to="/aml-kyc-policy" onClick={handleupper}>AML/KYC Policy</Link></li>
                                        <li ><Link to="/complaints-handling-procedure" onClick={handleupper}>Complaints Handling Procedure</Link></li>
                                        <li ><Link to="/general-disclaimer" onClick={handleupper}>General Disclaimer</Link></li>
                                    </ul>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="col-sm-12">
                        {/* <div className="copyright">
                                    <p><span>“URG-X </span>is a platform operated by <span>Lunexor s.r.o.,</span> a company registered in the Czech Republic with its headquarters at <span>Kurzova</span> 2222/16, 155
                                    00 Prague 5, Company ID: 22400711.Lunexor s.r.o. is registered as a Virtual Asset Service Provider (VASP) in the Czech Trade Register. In
                                    preparation for the entry into force of Regulation (EU) 2023/1114 <span>(“MiCA”), Lunexor </span>is currently completing its transition
                                    to CASP compliance, which will become fully applicable as of July 1st, 2025.” *FIU - IND Registration is in process.</p> 
                                <h5>Disclaimer</h5>
                                <p>Cryptocurrency products are not regulated and carry significant risks. There may be no regulatory avenues for recovering losses incurred
                                    from these transactions. The information and materials presented here are subject to change without prior notice, including prices, which may
                                    vary based on market demand and supply. The content available on this site is proprietary to <span>URG-X</span>, along with its parent, licensor, and/or
                                    affiliates, and is intended solely for informational purposes for informed investors. This material does not constitute: (i) an offer or solicitation
                                    to invest in, buy or sell any interests or shares, or to engage in any investment or trading strategy, or (ii) an intention to provide accounting,
                                    legal, or tax advice, or investment recommendations.Note
                                    to EU Users: Users from European Region are not allowed to trade with USDT pairs due to MICA regulatory guidelines, however, users
                                    can transact with USDC/EURC.</p>
                                </div> */}
                        <div className="copyright_s">
                            <div className="container">
                                <div className="row">
                                    <div className="col-lg-12 col-12 mt-4 text-center">
                                        <p className="copyright-text"> Copyright © 2026 <b className="URG-X" ><a href="https://URG-X.com/" target="_blank" rel="noopener noreferrer">URG-X</a> </b>. All rights reserved</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </footer>

        </>


    )
}


export default Footer
