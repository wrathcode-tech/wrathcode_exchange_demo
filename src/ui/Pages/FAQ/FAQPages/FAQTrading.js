import React, { useState } from 'react'

const FAQTrading = () => {
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
            Trading with Wrathcode Exchange 
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
              setChangeScreen("Trading on Wrathcode Exchange ");
            }}
          >
            <h5 className="mb-0">Trading on Wrathcode Exchange </h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}


      {/* Deposit and Withdrawal Tab */}
      {changeScreen === "Trading on Wrathcode Exchange " && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                How to Buy crypto on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>To buy crypto instantly, log into the Wrathcode Exchangeand follow the steps below:</p>
                  <p>1. To explore and buy tokens, head to the Markets section and select the token of your choice, like
                    Bitcoin.</p>
                  <p>2.Here, you can observe Bitcoin's performance over the last few days, weeks, or months.</p>
                  <p> 3. Tap on the Buy option located at the bottom of the screen. Based on the current market price, choose
                    the amount of USDT you wish to spend on purchasing the equivalent amount of Bitcoin.</p>
                  <p> 4. Click on Buy Now to place the order.</p>
                  <p>5. Your Buy order is now successfully completed..</p>
                  <p>6. Click on the All Orders tab.</p>
                  <p>7. You can now see your Bitcoins in your Investments section and review all your latest orders in Order
                    Details.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                How to Sell crypto on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p>To sell crypto instantly, log into the Wrathcode Exchangeand follow the steps below:</p>
                  <p>1. Go to the Markets section and tap on the token of your choice. For example, let's choose Bitcoin.</p>
                  <p>2.You can see here how Bitcoin has been performing over the last couple of days/weeks/months.</p>
                  <p> 3.You can then click on the Sell option at the bottom of the screen.</p>
                  <p> 4. Based on the current market price, select the amount of Bitcoin that you would like to sell from your existing
                    portfolio and then click on Sell to place the order.</p>
                  <p>5. Your Sell order is now completed.</p>
                  <p>6. Click on the All Orders tab.</p>
                  <p>7.You can now view your remaining Bitcoins in your Investments and all your past orders in Order Details.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                How to add cryptos to the Favorite on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >To add a crypto token to your Favorite, go to the Markets section and select the token you want to add to
                    your Favorite.</p>
                  <ol>
                    <li>1.Click on the star icon on the top right corner for the selected token.</li>
                    <li>  2. You can now view it under the Favorite tab in the Markets section.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                How to add price alerts for cryptos on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    To add price alerts for a crypto token of your choice:
                  </p>
                  <ol>
                    <li>1. You can tap on the profile icon on the top left corner of the home screen to access the Account
                      Settings.</li>
                    <li>2.In Accounts, go to the Price Alerts tab.</li>
                    <li>3. Provide the required price and click on Create Price Alert.</li>
                    <li>4. Your price alert will be then ready </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                Why do I see Insufficient balance error?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Kindly ensure that you check your wallet balance before proceeding to place any orders. Making sure you
                    have sufficient funds in your wallet will enable successful order execution.
                  </p>
                  <strong>Note:</strong><p>Order value = Price x Qty.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                What cryptos are supported on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Currently, the Wrathcode Exchangeprovides users with the option to buy or sell more than 100 top tokens. These
                    tokens have been carefully selected based on their use cases, demand, and liquidity in the market.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_16">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_16" aria-expanded="false" aria-controls="collapse_6">
                Why are there limited coins on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_16" className="accordion-collapse collapse" aria-labelledby="headingcollapse_16" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Currently, the Wrathcode Exchangeprovides users with the option to buy or sell more than 100 top tokens. These
                    tokens have been carefully selected based on their use cases, demand, and liquidity in the market.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_7">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_7" aria-expanded="false" aria-controls="collapse_7">
                Why are the buying and selling prices different for the cryptos on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_7" className="accordion-collapse collapse" aria-labelledby="headingcollapse_7" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    On Wrathcode Exchange , users can conveniently own cryptocurrencies like Bitcoin and Ethereum without the need to
                    manually enter orders in the order books. With just a few clicks, users can buy and sell cryptocurrencies
                    swiftly. There's no need to be concerned about liquidity in the market because all orders are executed
                    instantaneously.
                  </p>
                  <br />
                  <p className="">
                    To ensure that our users receive the best prices, the buy and sell prices are continuously updated. This
                    process involves considering the bids and asks for the cryptocurrencies as inputs to determine the most
                    suitable buy and sell prices. By doing so, Wrathcode Exchange  strives to offer optimal prices to its users, making the
                    trading experience seamless and efficient.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_9">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_9" aria-expanded="false" aria-controls="collapse_8">
                Why is my token balance locked?
              </button>
            </h2>
            <div id="collapse_9" className="accordion-collapse collapse" aria-labelledby="headingcollapse_9" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className='row' >
                  <div className='col-lg-8' >
                    <div className="faq_text" >
                      <p className="">
                        If you have an open position (Spot/Margin) or there is a pending Landing request or withdrawal request, a
                        corresponding amount of that specific coin will be locked in your account. To unlock these funds, you have
                        two options:
                      </p>
                      <p>1.Cancel the Order: If the locked amount is associated with an open order, you can choose to cancel the
                        order, and the locked funds will be released back into your account.</p>
                      <p>2.Wait for Order Execution: Alternatively, you can wait for the order to be filled or executed. Once the
                        order is completed, the locked amount will be automatically released, and your funds will be available
                        for use again.</p>
                      <p>By canceling the order or waiting for its execution, you can effectively unlock your funds and regain access
                        to them for further trading or withdrawal purposes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      )}


    </div>
  );
}

export default FAQTrading
