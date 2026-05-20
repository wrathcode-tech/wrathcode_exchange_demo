import React, { useState } from 'react'

const FAQApi = () => {
  const [changeScreen, setChangeScreen] = useState("main");
  return (
    <div className="col-lg-8">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb  faq_breadcrumb mt-0 pb-3">
          <li className="breadcrumb-item">
            <a href="#/">Faq</a>
          </li>
          <li
            className="breadcrumb-item cursor-pointer"
            aria-current="page"
            onClick={() => {
              setChangeScreen("main");
            }}
          >
            API
          </li>
          {changeScreen !== "main" && (
            <li className="breadcrumb-item active text-warning  cursor-pointer" aria-current="page">
              {changeScreen}
            </li>
          )}
        </ol>
        <hr />
      </nav>

      {/* Account Mangement */}
      {changeScreen === "main" && (
        <div className="faq_list">
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("Introduction to the Wrathcode ExchangeAPI");
            }}
          >
            <h5 className="mb-0"> Introduction to the Wrathcode ExchangeAPI</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}

      {changeScreen === "main" && (
        <div className="faq_list">
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("API Dashboard");
            }}
          >
            <h5 className="mb-0"> API Dashboard </h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}

      {changeScreen === "main" && (
        <div className="faq_list">
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("High-Frequency Trading");
            }}
          >
            <h5 className="mb-0">High-Frequency Trading</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}

      {changeScreen === "main" && (
        <div className="faq_list">
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("User Data on Wrathcode ExchangeAPI");
            }}
          >
            <h5 className="mb-0">User Data on Wrathcode ExchangeAPI</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}

      {changeScreen === "main" && (
        <div className="faq_list">
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("Market Data on Wrathcode ExchangeAPI");
            }}
          >
            <h5 className="mb-0">Market Data on Wrathcode ExchangeAPI</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}

      {changeScreen === "main" && (
        <div className="faq_list">
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("Placing Orders using Wrathcode ExchangeAPI");
            }}
          >
            <h5 className="mb-0">Placing Orders using Wrathcode ExchangeAPI</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}


      {/* Introduction to the Wrathcode ExchangeAPI */}
      {changeScreen === "Introduction to the Wrathcode ExchangeAPI" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <div id="collapse_1" className="accordion-collapse collapse show" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <ol>The Wrathcode ExchangeAPI serves various functionalities, including:
                    <li>1. Pulling Market Data based on specific requirements.</li>
                    <li>2. Placing and Managing different types of Orders on the Wrathcode ExchangeBooks and Partner Exchanges.</li>
                    <li>3. To begin using the Wrathcode ExchangeAPI, you will need the following prerequisites:</li>
                    <li>4. Key and Secret: These credentials are necessary for API authentication.</li>
                    <li>5. Programming and Scripting Language: Familiarity with languages such as Python and Javascript is
                      required.</li>
                    <li>6. Few Libraries: You will need to use libraries like socket.io, Request Module, and Crypto Module to
                      interact with the API effectively.</li>
                  </ol>
                  <p>For detailed instructions on acquiring the required credentials and utilizing the API, please refer to the
                    API Dashboard section of the documentation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* API Dashboard Tab */}
      {changeScreen === "API Dashboard" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                API Dashboard
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <ol>
                    You can find the API dashboard on the profile section of the Wrathcode ExchangeWeb Platform. The
                    API Dashboard allows you to,
                    <li>1) Generate API Key</li>
                    <li>2) Manage pre-existing API Keys</li>
                  </ol>
                  <ol>
                    To navigate to the API Dashboard:
                    <li>1. Click Profile. You will be redirected to the My Profile page.</li>
                    <li>2. Click API Dashboard, The API Dashboard appears. Here, you can create new API keys
                      and manage pre-existing API Keys.</li>
                  </ol>

                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                Generate API Key
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <ol>
                    The process for generation of the API Key is as follows
                    <li>1. To create a new key, Navigate to the API Dashboard. Click Create A New One, and
                      you will be redirected to the Create an API Key window.</li>
                    <li>2. Enter a name for your API key and check the Bind IP Address to the API Key option, if
                      required. Click SEND OTP. A One Time Password (OTP) will be shared on your
                      registered Email ID and Mobile number.
                      Note : Checking the Binding IP address to the API Key option will bind the API key to
                      the IP of the device from which the key is generated. This Key cannot be shared
                      with any other user with a different IP.</li>
                    <li>3. Enter the received OTP on the next screen in the respective boxes. Click CREATE. An
                      API Key will be generated.</li>
                    <li>4. Store the API Key and Secret on the following screens properly.
                      CAUTION
                      The Secret key is forever hidden after you refresh the screen. Make sure to store it
                      properly.</li>
                    <li>5. After storing the API you may click Go to Dashboard to go back to the API Dashboard.
                      You will be able to see your generated API Key on this page.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                Manage pre-existing API Keys
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <ol>You can manage your pre-existing API keys by navigating to the API Dashboard. On this page, you will get the
                    option to:
                    <li>1. Retrieve the API Key</li>
                    <li>2. Delete the API Key</li>
                  </ol>
                  <h6>Retrieve the API Key</h6>
                  <p>1. On the API Dashboard, you have the option to retrieve the API Key. The process for the retrieval of the API Key
                    is as follows:</p>
                  <p>2. Go to API Dashboard. On the Dashboard, you will see the list of API Keys created for your account.</p>
                  <ol>There are three ways to retrieve the API Key:
                    <li>• Scanning the QR code present on the screen will reveal the API Key.</li>
                    <li>• You have the option to copy the key to the clipboard by clicking the Copy icon in the top right corner.</li>
                    <li>• You can read the API key using the read icon.</li>
                  </ol>
                  <p>(Either of these options can be used to access your API key)
                    CAUTION
                    It is impossible to retrieve the secret after the API Key is generated. Please store it properly.</p>
                  <h6>Deleting the API Key</h6>
                  <p>You can delete an API Key by navigating to the API Dashboard. The process for deleting the API Key is given below:</p>
                  <p>1. Click DELETE in the top right corner. A confirmation dialogue box will appear. Click Continue.</p>
                  <p>2. A new dialogue box will appear. Enter your account password and click Confirm. Your API key will be deleted.</p>
                  <p>CAUTION
                    A key, once deleted, cannot be used for any further authentications for the API.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* High-Frequency Trading Tab */}
      {changeScreen === "High-Frequency Trading" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <div id="collapse_1" className="accordion-collapse collapse show" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>High-Frequency Trading (HFT) is an advanced trading approach that utilizes sophisticated computer
                    algorithms to execute rapid buying and selling of digital assets. This strategy operates on a millisecond
                    time scale, enabling a large number of trades to be executed within a short period. HFT traders leverage
                    small price movements in the crypto markets and capitalize on arbitrage opportunities.
                    HFT traders employ cutting-edge algorithms and technology to analyze vast amounts of real-time data
                    and make swift decisions based on their analysis. They execute trades quickly using their algorithms.
                    HFT is a popular strategy adopted by both individual and institutional investors. However, it comes with
                    inherent risks due to its reliance on complex algorithms, and mistakes can lead to substantial losses.</p>
                  <h6>High-Frequency Trading using Wrathcode Exchange </h6>
                  <p>Wrathcode ExchangeAPI offers specialized access to our High-Frequency APIs for enterprise clients. These APIs enable
                    our clients to trade and receive data with faster API response times and higher rate-limits.
                    The base URL for all HFT-related URLs is: <a href='https://hft-api.Wrathcode Exchange.com' target='_blank'>https://hft-api.Wrathcode Exchange.com</a> </p>
                  <p>To learn more about High-Frequency Trading using Wrathcode ExchangeAPI and access the specialized endpoint,
                    please contact us.</p>
                  <p>INFO For HFT access, our team will request your static IP address, which we will add to our Trusted IPs
                    list. Once your IP address is designated as 'Trusted,' you will receive the required access to our HFT API
                    services.</p>

                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                Tips for staying safe from scams
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p>We are continuously working to alert our users about potential frauds and scams through our official
                    support channels. To further protect yourself, please follow these simple steps:</p>
                  <ul>• Wrathcode Exchangepersonnel will NEVER reach out to you personally or request any payment for assistance. If you
                    receive such messages in the future, DO NOT respond and consider blocking these scammers.</ul>
                  <ul>• Always ensure that you are interacting with our official team by verifying the blue tick mark on our
                    Twitter, Instagram, or Telegram channel. Alternatively, you can communicate with us through support
                    tickets raised on our official website or Wrathcode Exchangeapplications (Android/iOS).</ul>
                  <ul>• Please note that Wrathcode Exchangedoes not provide official support on Instagram, Facebook, or Telegram. Always
                    submit a support ticket for any issues and interact only with our team on official social media pages.</ul>
                  <ul>• You can also contact us through our official support channels on Telegram and Twitter for additional
                    assistance and information.</ul>
                  <p>By following these guidelines, you can further safeguard yourself from potential scams and ensure a secure
                    experience on our platform. Your safety is our utmost priority, and we remain committed to providing a
                    trusted environment for all our users.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                What can I do to avoid a scam?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p>As the interest in cryptocurrencies and digital assets grows, so does the number of scams. We urge our users to remain
                    vigilant and avoid sharing any personal details.</p>
                  <p>Here are some important guidelines to stay safe:</p>
                  <ol>
                    <li>• Wrathcode Exchangedoes not provide official support on Instagram or Facebook. Always ensure you are interacting with our official
                      team by verifying the blue tick mark on our Twitter, Instagram, or Telegram channel, or by using support tickets raised on our
                      official website or Wrathcode Exchangeapplications (Android/iOS).</li>
                    <li>• Never share personal or financial information in response to unexpected requests. Wrathcode Exchangepersonnel will never call, email,
                      or text you to ask for personal information, bank account details, or credit card numbers.</li>
                    <li>• Be cautious of suspicious texts, pop-up windows, or links and attachments in emails. Delete them immediately. When in
                      doubt, verify the identity of the contact by confirming the email is sent from our official domain @Wrathcode Exchange.com or from our
                      official blue tick marked channels on Twitter, Instagram, and Telegram.</li>
                    <li>• Wrathcode Exchangewill never rush you into making a decision. We encourage you to take your time and not feel pressured by anyone
                      claiming to be from Wrathcode Exchangecustomer service, asking for immediate information or payment. They may be potential
                      scammers.</li>
                  </ol>
                  <p>Before taking any action, take the time to respond and conduct checks and verifications. Consult someone you trust if
                    needed. You can always reach out to us through support tickets raised on our official website or Wrathcode Exchangeapplications
                    (Android/iOS) or interact with the Wrathcode Exchangeteam on our official social media pages.
                    By following these precautions and exercising caution, you can help protect yourself from scams and ensure a secure
                    experience in the world of cryptocurrencies and digital assets. Your safety is our utmost concern, and we remain committed
                    to providing a trusted platform for all our users.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                How to report a scam to Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    If you think you noticed Wrathcode Exchangebrand name used incorrectly anywhere, please inform us immediately by
                    raising a support ticket on our official website or Wrathcode Exchangeapplications (Android/iOS)
                  </p>
                  <p>You can also reach us through our official support channels for Telegram and Twitter, or write to us at
                    <a href='mailto:sales@wrathcode.com' target='_blank'>sales@wrathcode.com</a> </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* User Data on Wrathcode ExchangeAPI */}
      {changeScreen === "User Data on Wrathcode ExchangeAPI" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                User Balance: Gives you insights on the balance available for the account.
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>The User Balance API endpoint, is used to retrieve information about account balance. This information will be
                    divided into different tokens and respective balance. You can use the following endpoint to retrieve the
                    information.
                    <a href='https://api.coindcx.com/exchange/v1/users/balances' target='_blank'>https://api.coindcx.com/exchange/v1/users/balances</a>
                    This API endpoint returns the following response:
                  </p>
                  <p>
                    [
                    <br />
                    "currency": "BTC",
                    <br />
                    "balance": 1.167,
                    <br />
                    "locked_balance": 2.1
                    <br />
                    ]
                  </p>
                  <table className='table' >
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Currency</td>
                        <td>Indicates the name of the currency. For example, BTC, USDT, etc.</td>
                      </tr>
                      <tr>
                        <td>balance</td>
                        <td>Indicates the balance in your account for the specified currency..</td>
                      </tr>
                      <tr>
                        <td>locked_balance</td>
                        <td>Locked balance refers to the amount that is locked or frozen for a specific amount of time. This can happen due to several reasons.
                          For example, When you place a limit order that is not yet executed, the amount that you have placed the order for, will be locked.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                User Info: Gives you information about the user
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p>This API endpoint allows you to retrieve user information for the specified account. You can use the following endpoint to access
                    this information:
                    Endpoint: https://api.Wrathcode Exchange.com/exchange/v1/users/info
                    The API response will provide the following details in JSON format:
                  </p>
                  <p>

                    [
                    <br />
                    "Wrathcode Exchange _id": "fda259ce-22fc-11e9-ba72-ef9b29b5db2b",<br />
                    "first_name": "First name",<br />
                    "last_name": "Last name",<br />
                    "mobile_number": "000000000",<br />
                    "email": "test@Wrathcode Exchange.com"<br />
                    ]
                  </p>
                  <table className='table' >
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Wrathcode Exchange _id</td>
                        <td>Indicates the unique id associated with your TAXBIYS account.</td>
                      </tr>
                      <tr>
                        <td>first_name</td>
                        <td>Indicates the first name of the user..</td>
                      </tr>
                      <tr>
                        <td>last_name</td>
                        <td>Indicates the last name of the user.</td>
                      </tr>
                      <tr>
                        <td>mobile_number</td>
                        <td>Indicates the mobile number associated with the account.</td>
                      </tr>
                      <tr>
                        <td>email</td>
                        <td>Indicates the email id associated with the account.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}


      {/* Market Data on Wrathcode ExchangeAPI Tab */}
      {changeScreen === "Market Data on Wrathcode ExchangeAPI" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                Ticker
              </button>
            </h2>

            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>Ticker data in the Crypto market is a real-time, streaming information used to monitor the prices of
                    different tokens. This data is continuously updated and offers valuable insights into the asset's
                    performance.
                    The ticker data includes various details such as bid price, highest and lowest values within the past 24
                    hours, and the timestamp of the last trade. Utilizing this data, one can analyze the asset's performance
                    over time and identify potential market opportunities.
                    To pull Ticker data using Wrathcode ExchangeAPI, you can use the following endpoint:
                    Endpoint: https://api.Wrathcode Exchange.com/exchange/ticker
                    The Wrathcode ExchangeTicker API endpoint provides the following information:</p>
                  <table className='table' >
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>market</td>
                        <td>Indicates the market for which the ticker data is generated.</td>
                      </tr>
                      <tr>
                        <td>change_24_hour</td>
                        <td>Indicates the change in rates in the past 24 hours.</td>
                      </tr>
                      <tr>
                        <td>high</td>
                        <td>Highest value in the past 24 hours.</td>
                      </tr>
                      <tr>
                        <td>low</td>
                        <td>Lowest value in the past 24 hours.</td>
                      </tr>
                      <tr>
                        <td>volume</td>
                        <td>Trading volume of the market in the past 24 hours.</td>
                      </tr>
                      <tr>
                        <td>last_price</td>
                        <td>Value of the market when the ticker was generated.</td>
                      </tr>
                      <tr>
                        <td>bid</td>
                        <td>The highest bid offer in the order book.</td>
                      </tr>
                      <tr>
                        <td>ask</td>
                        <td>The highest ask offer in the order book.</td>
                      </tr>
                      <tr>
                        <td>timestamp</td>
                        <td>Time at which the ticker was generated.</td>
                      </tr>
                    </tbody>
                  </table>

                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                Markets
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p>The Market endpoint returns an array of currently active markets. You can use the
                    following endpoint to retrieve the active markets data:</p>
                  <p>https://api.Wrathcode Exchange.com/exchange/v1/markets</p>
                  <p>A sample response for the Markets endpoint looks as follow:</p>
                  <p>

                    [
                    <br />
                    “BTCSDT",<br />
                    “ETHUSDT",<br />
                    “ADAUSDT",<br />
                    “ETHBTC",<br />
                    “XRPUSDT",<br />
                    ]
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                Market Details
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p>The Wrathcode ExchangeMarket Details endpoint offers in-depth information about a particular market or trading pair. Utilizing this endpoint allows you
                    to access comprehensive details about the specified market, such as its current status, recent trading activity, and the order book. This data
                    proves valuable for monitoring market conditions, analyzing trends, and making well-informed trading choices.
                    To retrieve the market details, you can use the following endpoint:https://api.Wrathcode Exchange.com/exchange/v1/market_details</p>
                  <p>The Wrathcode ExchangeMarket Details endpoint, will allow you to get the following information:</p>
                  <img src='images/marketdata.jpg' />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                Trades
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    The Trades data will give you details on executed trades for a specific market. The endpoint will return information about the price of the
                    trade, the quantity, and the time at which the trade took place.
                    You can use the following endpoint to get Trades data:
                  </p>
                  <p>https://public.Wrathcode Exchange.com/market_data/trade_history/?pair={'insert_pair'}&limit={'insert_limit'}
                    To extract trades data, you have to paas two parameters in the API request: </p>
                  <table className='table' >
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Required</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>pair</td>
                        <td>Yes</td>
                        <td>It is a string created by ecode, target_currency_short_name, and base_currency_short name. For
                          example, B-BTC_USDT.</td>
                      </tr>
                      <tr>
                        <td>limit</td>
                        <td>No.</td>
                        <td>Input the number of trades that will be returned in the response. The acceptable values for this
                          parameter range from 1 to 100.</td>
                      </tr>

                    </tbody>
                  </table>
                  <p>NOTE: If the limit parameter is not passed, the default number of trades returned will be 30.</p>
                  <h6>The Wrathcode ExchangeTrades API endpoint, gives you the following information:</h6>

                  <table className='table' >
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>p</td>
                        <td>Indicates the trade price.</td>
                      </tr>
                      <tr>
                        <td>q</td>
                        <td>Indicates the quantity..</td>
                      </tr>
                      <tr>
                        <td>s</td>
                        <td>Denotes the name of the market.</td>
                      </tr>
                      <tr>
                        <td>t</td>
                        <td>Indicates the time at which the trade took place.</td>
                      </tr>
                      <tr>
                        <td>m</td>
                        <td>
                          <ol>
                            Indicates if the buyer is a market maker or not. Values for this parameter are:
                            <li>true: The trader is a market maker.</li>
                            <li>False: The trader is not a market maker.</li>
                          </ol>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                Order book
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    To extract order book data using the Wrathcode ExchangeAPI, use the following endpoint:
                  </p>
                  <p>https://public.Wrathcode Exchange.com/market_data/market_data/orderbook/?pair=B-BTC_USDT</p>
                  <p>You have to pass the pair parameter with the Order book API request:</p>
                  <p>It is a string created by ecode, target_currency_short_name, and base_currency_short name. For example, B- BTC_USDT.</p>
                  <p>The endpoint will return an array of bids and asks in the response. A sample response will be:</p>
                  <p>
                    “””
                    Enter the sample code

                    “””
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placing Orders using Wrathcode ExchangeAPI Tab */}
      {changeScreen === "Placing Orders using Wrathcode ExchangeAPI" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                Spot Trading
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>Spot trading refers to a direct purchase or sale of crypto at the current market price with the aim of
                    generating a trading profit . As the name suggests, the trade is happening on the spot. In spot trading, the
                    delivery of tokens will be almost instantaneous.</p>
                  <p>Below are some of the key terms regarding Spot trading,</p>

                  <table className='table' >
                    <thead>
                      <tr>
                        <th>Term</th>
                        <th>Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Spot Price</td>
                        <td>Spot Price refers to the current market price of the asset. In Crypto, the Spot price fluctuates a lot based on the
                          market conditions</td>
                      </tr>
                      <tr>
                        <td>Trade Date</td>
                        <td>Trade date refers to the date on which the trade took place.</td>
                      </tr>
                      <tr>
                        <td>Settlement Date</td>
                        <td>Settlement date refers to the date on which the transacted assets were actually transferred.</td>
                      </tr>

                    </tbody>
                  </table>
                  <p>The biggest advantage of Spot trading is it is simple and easy to understand. It is a good place to start in
                    the crypto market.</p>
                  <p> The Wrathcode ExchangeAPI provides the following functionalities for Creating and Managing Spot Orders.</p>
                  <p> Placing new Orders</p>
                  <p>Cancelling an Order</p>
                  <p>  Exiting an Order</p>
                  <p>  Editing an Order</p>
                  <p> Getting data for orders placed</p>
                  <p> To know more about how to place spot orders using the Wrathcode ExchangeAPI, refer to the API Documentation..</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default FAQApi
