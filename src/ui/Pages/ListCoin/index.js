import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import AuthService from "../../../api/services/AuthService";
import { Helmet } from "react-helmet-async";

const ListCoin = () => {

  const [projectName, setProjectName] = useState("");
  const [contactName, setContactName] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [comments, setComments] = useState("");
  const [contractAddress, setContrectAddress] = useState("");
  const [countryCode, setCountryCode] = useState("91");


  const handleAddCoin = async (projectName, contactName, telegramId, phoneNumber, emailAddress, referredBy, comments, countryCode, contractAddress) => {
    if (!projectName || !contactName || !phoneNumber || !emailAddress || !telegramId || !contractAddress) {
      alertErrorMessage('Please fill out all required fields before submitting')
      return;
    }
    LoaderHelper.loaderStatus(true);
    await AuthService.assetAddList(projectName, contactName, telegramId, phoneNumber, emailAddress, referredBy, comments, countryCode, contractAddress).then(async (result) => {
      if (result?.success) {
        LoaderHelper.loaderStatus(false);
        try {
          alertSuccessMessage(result?.message)
          setProjectName("");
          setContactName("");
          setTelegramId("");
          setPhoneNumber("");
          setEmailAddress("");
          setReferredBy("");
          setComments("");
          setContrectAddress("");
        } catch (error) {
          alertErrorMessage(error);
        }
      } else {
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result?.message);
      }
    });
  };



  return (
    <>
      <Helmet>
        <title>List Your Coin & Build Hype on URG-X | Fast Token Listing Exchange</title>

        <meta
          name="description"
          content="Grow your token’s visibility and liquidity with URG-X! Quick listing, top-tier security, and marketing support to build hype around your coin."
        />

        <meta
          name="keywords"
          content="token listing, crypto coin launch, URG-X listing, coin exposure, crypto marketing"
        />
      </Helmet>


      <div className="coin_list_outer_s">

        <section className="l_sec section-padding " >
          <div className="container">
            <div className="row g-md-5 align-items-center">
              <div className="col-lg-6">
                <div className="inner  ">
                  <h1 className="title"> List your asset  </h1>
                  <p className="h5" >Get listed on our Token quickly and easily</p>

                  {/* <div className="list-your-asset__manager">
                  <div className="list-your-asset__listing__icon">
                    <div className="list-your-asset__listing__ava">
                      <img src="images/rajput.png" alt="listing-manager" />
                    </div>
                    <i className="ri-customer-service-fill"></i>
                  </div>
                  <div className="list-your-asset__listing">
                    <div className="list-your-asset__listing__item">
                      <span className="MuiTypography-root MuiTypography-body200 body200 css-1uedhof">RS Rajput</span>
                      <span className="MuiTypography-root MuiTypography-body300 body300 css-jjw0dm">Listing manager</span>
                    </div>
                    <div className="list-your-asset__listing__item">
                      <a className="css-x53hod" href="https://t.me/+VD32TwJiXQMyY2E1" target="_blank" >
                        <span className="title">Ask on telegram direct</span>
                        <span className="icon">
                          <i className="ri-send-plane-fill"></i>
                        </span>
                      </a>
                    </div>
                  </div>
                </div> */}

                  {/* <nav className="mt-4">
                  <ol className="breadcrumb  ">
                    <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">List Your Coin</li>
                  </ol>
                </nav> */}
                </div>
              </div>
              <div className="col-lg-6"><img alt="" src="/images/coin_list.svg" className="img-fluid mx-auto" /></div>
            </div>
          </div>
        </section>
        <section className="os_sec " >
          <div className="container">
            <h3>Our services reflects your needs</h3>
            <div className="row g-md-5 ">
              <div className="col-lg-6">
                <div className="col-cards" >
                  <div className="row g-2 g-md-4 mb-4">
                    <div className="col-lg-6 col-6">
                      <div className="card" >
                        <div className="card-body" >
                          <i className="ri-chat-smile-2-line ri-xl"></i>
                          <p>BUILDING HYPE AROUND YOUR COIN</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6  col-6">
                      <div className="card" >
                        <div className="card-body" >
                          <i className="ri-send-plane-line ri-xl"></i>
                          <p>FAST LISTING </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6  col-6">
                      <div className="card" >
                        <div className="card-body" >
                          <i className="ri-qr-scan-2-line ri-xl"></i>
                          <p>FOCUS ON TRADE VOLUME </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6  col-6">
                      <div className="card" >
                        <div className="card-body" >
                          <i className="ri-group-line  ri-xl"></i>
                          <p> NEW AUDIENCE FOR YOUR COMMUNITY </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6  col-6">
                      <div className="card" >
                        <div className="card-body" >
                          <i className="ri-shield-check-line  ri-xl"></i>
                          <p> SECURITY IS A NECESSITY </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6  col-6">
                      <div className="card" >
                        <div className="card-body" >
                          <i className="ri-line-chart-line ri-xl"></i>
                          <p> GAIN PROFIT WITH OUR AFFILIATE PROGRAMM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="col-lg-6">
                <div className="card f_card" >
                  <div className="card-body" >
                    <h4>List your asset</h4>
                    <p>
                      <small>Please fill out the form below to get started. Provide your contact details and one of our sales department managers will get in touch with you as soon as possible</small>
                    </p>
                    <div className="c_form" >
                      <div className="row" >
                        <div className="col-md-12 mb-3" >
                          <div className="form-group" >
                            <label>Project Name</label><span className="text-danger">*</span>
                            <input className="form-control" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                          </div>
                        </div>

                        <div className="col-md-12 mb-3" >
                          <div className="form-group" >
                            <label>Smart Contract Address</label><span className="text-danger">*</span>
                            <input className="form-control" value={contractAddress} onChange={(e) => setContrectAddress(e.target.value)} placeholder="0xaxxxxxx" />
                          </div>
                        </div>

                        <div className="col-md-6  mb-3" >
                          <div className="form-group" >
                            <label>Contact Name  </label><span className="text-danger">*</span>
                            <input className="form-control" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                          </div>
                        </div>

                        <div className="col-md-6  mb-3" >
                          <div className="form-group" >
                            <label>Telegram ID</label><span className="text-danger">*</span>
                            <input className="form-control" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} />
                          </div>
                        </div>





                        <div className="col-md-6  mb-3" >
                          <div className="form-group" >
                            <label>Your e-mail address  </label><span className="text-danger">*</span>
                            <input className="form-control" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                          </div>
                        </div>

                        <div className="col-md-6  mb-3" >
                          <div className="form-group" >
                            <label>Referred by  (Optional)  </label>
                            <input className="form-control" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-12 mb-3"><label>Phone number</label><span className="text-danger">*</span></div>
                          <div className="col-md-3 mb-3" >
                            <select name="countryCode" className="form-control form-select" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                              {/* {codes.map((country, index) => (
                                <option key={index} value={country.countryCodes[0]}>
                                  {"+" + country.countryCodes[0]}
                                </option>
                              ))} */}
                            </select>
                          </div>

                          <div className="col-md-9  mb-3" >
                            <div className="form-group" >
                              <input className="form-control" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                            </div>
                          </div>

                        </div>





                        <div className="col-md-12  mb-4" >
                          <div className="form-group" >
                            <label>Comments (Optional) </label>
                            <textarea className="form-control" value={comments} onChange={(e) => setComments(e.target.value)}></textarea>
                          </div>
                        </div>

                        <div className="col-lg-12 col-md-10 col-12 mx-auto">
                          <button type="button" className="btn custom-btn btn-xl w-100 btn-block" onClick={() => handleAddCoin(projectName, contactName, telegramId, phoneNumber, emailAddress, referredBy, comments, countryCode, contractAddress)}>Send Rquest</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default ListCoin;