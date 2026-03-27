import React, { useState } from 'react'

const FAQEarn = () => {
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
            Earn
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
              setChangeScreen("Earn");
            }}
          >
            <h5 className="mb-0">Earn</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}



      {/* Deposit and Withdrawal Tab */}
      {changeScreen === "Earn" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                What is the Earn?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>Wrathcode Exchangeoffers an exclusive product called "Earn," allowing users to place requests and earn interest on
                    their investments.</p>
                  <p>For further information regarding the Terms & Conditions, please click here.</p>

                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                How to place a Earn request?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p>Steps to Earn on Wrathcode Exchange </p>
                  <ol>
                    <li>1. Go to Earn (On the home page)</li>
                    <li>2. Select the earn program you want to participate</li>
                    <li>3. Follow the required steps</li>
                    <li>4. You will start earning crypto as per the Earn program you have selected</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                How do I avail Earn?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p>Users who have successfully registered on the platform gain access to the Earn tab, where they can explore
                    various opportunities to deploy their crypto assets and earn passive returns based on the agreed tenure.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                Is Earn available on all the virtual digital assets/ tokens listed on Wrathcode Exchangeplatform(s)?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    Certainly. Earn functionality will solely be accessible for virtual digital assets or tokens that have been
                    officially listed under the Earn tab on the Wrathcode Exchangewebsite and/or mobile applications.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                How many tokens are available under Earn?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Wrathcode Exchangeconsistently expands its selection of tokens. Stay vigilant in monitoring this space for the latest and
                    updated information.
                    Any newly introduced earn programs will be announced exclusively through the Announcement page,
                    featuring comprehensive details such as the commencement date, participation guidelines, and the
                    expected returns for users.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                Is the passive return guaranteed?
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    The passive return guaranteed for the stipulated token during the agreed tenure is determined by the
                    published rate applicable at the time of initiating the transaction. However, this guarantee is subject to the
                    terms and conditions of the exchange, including the minimum and/or agreed tenure, as well as the risk
                    disclosure associated with crypto assets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_7">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_7" aria-expanded="false" aria-controls="collapse_7">
                What is the form of earnings and when is the payout?
              </button>
            </h2>
            <div id="collapse_7" className="accordion-collapse collapse" aria-labelledby="headingcollapse_7" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    In the Refer and Earn program the earnings are in Wrathcode Exchangenative token The payout will be processed upon
                    the successful completion of the agreed Refer and Earn tenure.
                  </p>
                  <p>In the Stake and Earn the Earning rate represents the Annual Percentage Yield (APY) and is denominated in
                    the same token as the one deployed by the user., or the native token of Wrathcode Exchange.</p>
                  <p>The payout will be processed upon the successful completion of the agreed Stake and Earn tenure.</p>

                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_8">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_8" aria-expanded="false" aria-controls="collapse_8">
                How is the return computed?
              </button>
            </h2>
            <div id="collapse_8" className="accordion-collapse collapse" aria-labelledby="headingcollapse_8" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Exactly, when a virtual digital asset/token is deployed for a duration that meets or exceeds the
                    minimum tenure requirement, it becomes eligible for potential returns. These returns are
                    based on the prescribed rate, expressed as an Annual Percentage Yield (APY), and are earned
                    in the same virtual digital asset/token that was initially deployed.
                  </p>
                  <p>For instance, if you deploy an ABC token under the Earn program, the returns generated
                    would be a portion of the ABC token you initially deployed. These returns will be added to
                    your existing ABC holdings after the payout is processed. This way, your ABC token balance
                    grows as a result of participating in the Earn program.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_9">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_9" aria-expanded="false" aria-controls="collapse_8">
                How is the return computed?
              </button>
            </h2>
            <div id="collapse_9" className="accordion-collapse collapse" aria-labelledby="headingcollapse_9" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className='row' >
                  <div className='col-lg-8' >
                    <div className="faq_text" >
                      <p className="">
                        Exactly, when a virtual digital asset/token is deployed for a duration that meets or exceeds the
                        minimum tenure requirement, it becomes eligible for potential returns. These returns are
                        based on the prescribed rate, expressed as an Annual Percentage Yield (APY), and are earned
                        in the same virtual digital asset/token that was initially deployed.
                      </p>
                      <p>For instance, if you deploy an ABC token under the Earn program, the returns generated
                        would be a portion of the ABC token you initially deployed. These returns will be added to
                        your existing ABC holdings after the payout is processed. This way, your ABC token balance
                        grows as a result of participating in the Earn program..</p>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_10">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_10" aria-expanded="false" aria-controls="collapse_8">
                How safe are my assets?
              </button>
            </h2>
            <div id="collapse_10" className="accordion-collapse collapse" aria-labelledby="headingcollapse_10" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    One type of asset can circulate over different chains; however, it cannot transfer between those chains.
                    Take Tether (USDT) for example. USDT can circulate over the following networks: Omni, ERC20, and
                    TRC20. But USDT cannot transfer between those networks, for example, USDT on the ERC20 chain cannot
                    be transferred to the TRC20 chain and vice versa. Please make sure you select the right network for
                    deposits and withdrawals to avoid any potential settlement issues.
                  </p>
                  <h6>What’s the difference between deposits and withdrawals over various networks?</h6>
                  <p>The main differences are that the transaction fees and transaction speeds differ based on the individual
                    network’s status.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_11">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_11" aria-expanded="false" aria-controls="collapse_8">
                How is the Annual Percentage Yield (APY) calculated?
              </button>
            </h2>
            <div id="collapse_11" className="accordion-collapse collapse" aria-labelledby="headingcollapse_11" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Indeed, the Annual Percentage Yield (APY) applicable to a virtual digital asset/token
                    represents a percentage of return on the token deployed by the user. However, it's essential
                    to note that the APY is subject to the yield or returns generated by third-party staking or DeFi
                    protocols where Wrathcode Exchangedeploys these virtual digital assets.
                  </p>
                  <p>It's crucial for users to understand that the APY is not guaranteed, and the actual returns
                    depend on the performance of the underlying third-party protocols. Users will only receive
                    returns if and when they are received by Wrathcode Exchangefrom these protocols.</p>
                  <p>Due to the dynamic and unpredictable nature of the crypto market and associated protocols,
                    returns can vary over time, and there might be instances where returns are lower or higher
                    than initially expected. It's advisable for users to carefully consider the risks and potential
                    rewards before participating in the Earn program or any other yield-generating opportunities..</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_12">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_12" aria-expanded="false" aria-controls="collapse_8">
                What are the terms & conditions for Earn?
              </button>
            </h2>
            <div id="collapse_12" className="accordion-collapse collapse" aria-labelledby="headingcollapse_12" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <ol>
                    <li>1. The Earn product's terms should be read together with the Terms of Use of the Online Platform(s). By opting
                      in, users acknowledge that Earn is offered on an 'opt-in' basis, and Wrathcode Exchangemay deploy their virtual digital
                      assets/tokens with third parties like exchanges, custodial service providers, or staking/DeFi protocols. Users
                      accept the risks associated with such deployments, including the risk of total loss of the deployed assets.</li>
                    <li>2. Wrathcode Exchangedoes not guarantee the credit of any virtual digital assets/tokens received as Marketing Payout or
                      through re-denomination by an issuer. Users must complete KYC and other required procedures to be eligible
                      for Earn. Any modification to the selected tenure after deployment is not permitted.</li>
                    <li>3. The list of virtual digital assets/tokens offered under Earn is at Wrathcode Exchange 's sole discretion. The minimum
                      prescribed tenure applies, and no APY will be payable if assets are redeemed or closed before the minimum
                      tenure.</li>
                    <li>4. Wrathcode Exchangehas the right to modify or withdraw the Earn product or any part thereof, and virtual digital
                      assets/tokens may be removed from Earn, resulting in APY disbursement on a pro-rata basis.</li>
                    <li>5. If virtual digital assets/tokens deployed are delisted, users will be given time to take action; otherwise,
                      Wrathcode Exchangemay close, liquidate, or convert them at its discretion.</li>
                    <li>6.APY is calculated as a percentage of returns in the deployed virtual digital assets/tokens and is dependent on
                      factors such as third-party yield offerings, making it non-guaranteed.</li>
                    <li>7. The APY may be updated periodically or daily by Wrathcode Exchange . If eligible for a payout, returns will be calculated
                      based on the daily APY percentage during the Earn tenure.</li>
                    <li>8. Wrathcode Exchangereserves the right to impose fees/charges for Earn. In cases of erroneous or incomplete KYC
                      formalities, Wrathcode Exchangemay delay, block, or nullify any APY credited to a user's account at its sole discretion
                      across its Online Platform(s).</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_13">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_13" aria-expanded="false" aria-controls="collapse_8">
                How can I redeem my virtual digital assets?
              </button>
            </h2>
            <div id="collapse_13" className="accordion-collapse collapse" aria-labelledby="headingcollapse_13" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Users have the flexibility to place an order for redemption of their virtual digital assets at any
                    time, considering the Terms of Use of Wrathcode Exchange . However, it's essential to note that if the
                    redemption event occurs before the minimum tenure specified, the user will not be eligible to
                    receive any returns under the Earn program. In such cases, the user may forfeit the potential
                    earnings associated with the initial deployment of the virtual digital assets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_14">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_14" aria-expanded="false" aria-controls="collapse_8">
                How can I track my returns?
              </button>
            </h2>
            <div id="collapse_14" className="accordion-collapse collapse" aria-labelledby="headingcollapse_14" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    You can track your returns on a daily basis under the ‘Your Earnings’ section of the Earn tab on Wrathcode Exchange .
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_15">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_15" aria-expanded="false" aria-controls="collapse_15">
                Why is my balance locked under Earn?
              </button>
            </h2>
            <div id="collapse_15" className="accordion-collapse collapse" aria-labelledby="headingcollapse_15" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Since you have raised a request for Stake and Earn, the balance for that particular coin will be locked till
                    the expiry.
                    As soon as request expires the balance will be locked automatically.
                    <br />
                    <ol>
                      To unlock the balance before expiry please follow the below steps -
                      <li>1. Click on Earn</li>
                      <li>2. Click on your earnings</li>
                      <li>3. Select the Earn to cancel</li>
                      <li>4. Confirm cancellation</li>
                    </ol>
                  </p>
                  <p>For Refer and Earn user’s the balance will be unlocked as per the terms and conditioned mentioned in refer
                    and earn program.</p>
                </div>
              </div>
            </div>
          </div>


        </div>

      )}

    </div>
  );
}

export default FAQEarn
