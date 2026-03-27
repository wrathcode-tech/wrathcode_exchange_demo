import React, { useState } from 'react'

const FAQCryptoDeposit = () => {
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
            FAQ about Deposit and Withdrawal
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
              setChangeScreen("Deposit and Withdrawal");
            }}
          >
            <h5 className="mb-0"> FAQ about Deposit and Withdrawal</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}



      {/* Deposit and Withdrawal Tab */}
      {changeScreen === "Deposit and Withdrawal" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                How to Deposit Digital Assets to Wrathcode Exchange 【PC】
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>You can deposit digital assets from external platforms or wallets to Wrathcode Exchangevia a deposit address on the platform. How to
                    find the address?</p>
                  <p>1. Visit the Wrathcode Exchangeofficial website.</p>
                  <p>2. Click on [My Asset] - [Cash Account].</p>
                  <h6> 3. Click on [Deposit], and select the token you want to deposit. Take USDT as an example:</h6>
                  <ol>
                    <li> 1) Select USDT </li>
                    <li>  2) Select Public Chain Type (fees are different for different chain type)</li>
                    <li>  3) Click [Copy] to copy the deposit address and paste it into the withdrawal address field on the external platform
                      or wallet. You can also scan the QR Code to deposit</li>
                  </ol>
                  <br />
                  <p>
                    <br />4. For some tokens, a Tag is required for deposit. In this case, please enter both Tag and Deposit Address when you
                    deposit. Any missing info will lead to potential asset loss.</p>

                  <p>5. Copy both the Tag and Deposit Address and paste them into the withdrawal address field on the external platform or
                    wallet.</p>
                  <p>6. Check the deposit under [Deposit History].</p>

                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                How to Deposit Digital Assets on Wrathcode Exchange 【APP】
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p>You can deposit digital assets from external platforms or wallets to Wrathcode Exchangevia a deposit address on the platform.
                    How to find the address?</p>

                  <p>1. Open Wrathcode ExchangeApp and click on [Balance].</p>
                  <p >2. Click on [Deposit].</p>
                  <p> 3. Select the token you want to deposit. Take USDT as an example:</p>
                  <ol>
                    <li> A. Select USDT</li>
                    <li>B. Select Public Chain Type (fees are different for different chain type) </li>
                    <li>C. Click [COPY ADDRESS] to copy the deposit address and paste it into the withdrawal address field on the external
                      platform or wallet. You can also scan the QR Code to deposit</li>
                  </ol>
                  <p>4. For some tokens, a Tag is required for deposit. In this case, please enter both the Tag and Deposit Address when you
                    deposit. Any missing info will lead to potential asset loss. Take a deposit of XRP as an example. Click on [Confirm] to
                    proceed</p>
                  <p>5. Copy both the Tag and Deposit Address and paste them into the withdrawal address field on the external platform or
                    wallet.</p>
                  <p>6. Check the deposit under [History].</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                How to Withdraw Digital Assets from Wrathcode Exchange 【PC】
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >You can withdraw your digital assets to external platforms or wallets via their address. Copy the address from the external
                    platform or wallet, and paste it into the withdrawal address field on Wrathcode Exchangeto complete the withdrawal.</p>
                  <ol>
                    <li> 1. Visit Wrathcode Exchangeofficial website. </li>
                    <li>  2. Click on [My Asset] - [Cash Account].</li>
                    <li>  3. Click on [Withdrawal], and select the token you want to withdraw. Take USDT as an example.
                      <ol>
                        <li>1) Select USDT</li>
                        <li>2) Select Public Chain Type (fees are different for different chain type)</li>
                        <li>3) Copy the withdrawal address from an external platform or wallet, and paste it into the withdrawal address field
                          on Wrathcode Exchange. You can also scan the QR Code on the external platform or wallet to withdraw</li>
                        <li>4) Click on [Confirm]</li>
                      </ol>
                    </li>
                    <li>4. Confirm withdrawal info, click on [Send] to get the email/SMS verification code. Enter the code that you receive and the
                      latest Google 2FA code, then click on [Confirm].</li>
                    <li>5. For some tokens (XRP, for example), a Tag is required for withdrawal on certain platforms or wallets. In this case, please
                      enter both the Tag and Deposit Address when you withdraw. Any missing info will lead to potential asset loss. If the
                      external platform or wallet doesn't require Tag, please tick [No Tag].
                      Then click on [Confirm] to proceed.</li>
                    <li>6. Check the withdrawal under [Withdrawal History].</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                How to Withdraw Digital Assets on Wrathcode Exchange 【APP】
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    You can withdraw your digital assets to external platforms or wallets via their address. Copy the address from the external
                    platform or wallet, and paste it into the withdrawal address field on Wrathcode Exchangeto complete the withdrawal.
                  </p>
                  <ol>
                    <li>1. Open Wrathcode ExchangeApp, click on [Balance].</li>
                    <li>2. 2. Click on [Withdrawal].</li>
                    <li>3. Search the token you want to withdraw.</li>
                    <li>4. Take USDT as an example.
                      <ol>
                        <li>1) Select USDT</li>
                        <li>2) Select Public Chain Type (fees are different for different chain type)</li>
                        <li>3) Copy the withdrawal address from an external platform or wallet, and paste it into the withdrawal address field
                          on Wrathcode Exchange. You can also scan the QR Code on the external platform or wallet to withdraw</li>
                        <li>4) Click on [Confirm]</li>
                      </ol>
                      <li>5. Confirm withdrawal info, click on [Send] to get the email/SMS verification code. Enter the code that you receive and the
                        latest Google 2FA code, and then click on [Confirm].</li>
                      <li>6. For some tokens (XRP, for example), a Tag is required for withdrawal on certain platforms or wallets. In this case, please
                        enter both the Tag and Deposit Address when you withdraw. Any missing info will lead to potential asset loss. If the
                        external platform or wallet doesn't require a tag, please tick [No Tag].
                        Click on [Confirm] to proceed.</li>
                      <li>7. Check the withdrawal under [Withdrawal History].</li>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                Deposit to a Non-Wrathcode Exchangeaddress
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Wrathcode Exchangecan NOT receive your crypto assets if they are deposited to a non-Wrathcode Exchangeaddresses. We cannot help to retrieve
                    those assets due to anonymous feature of transactions via blockchain.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                Deposited Wrong Coins or Missing Memo/Tag
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    If you sent the wrong coins or missing memo/tag to your Wrathcode Exchange X coin address:
                  </p>
                  <ol>
                    <li>1. Wrathcode Exchangegenerally does not offer a token/coin recovery service.</li>
                    <li>2. If you have suffered a significant loss as a result of incorrectly deposited tokens/coins, Wrathcode Exchangemay, solely at our
                      discretion, assist you in recovering your tokens/coins. This process is extremely complicated and may result in
                      significant cost, time and risk.</li>
                    <li>3. You can contact Support Team, We will review your request for an asset recovery upon the collected necessary
                      information you provided and reply to you as soon as possible.</li>
                    <li>4. If it was possible to recover your coins, we may need to install or upgrade the wallet software, export/ import private
                      keys etc. These operations can only be conducted by authorized staff under carefully security audit. Please be patient
                      as it may take over 1 month to retrieve wrong coins.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_7">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_7" aria-expanded="false" aria-controls="collapse_7">
                How to Deal with Deposit That Has Not Been Credited
              </button>
            </h2>
            <div id="collapse_7" className="accordion-collapse collapse" aria-labelledby="headingcollapse_7" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Assets being deposited on Wrathcode Exchangego through the following steps:
                  </p>
                  <ol>
                    <li>1. Initiate a withdrawal request on the trading platform from which you want to transfer your assets. The withdrawal will be verified on the trading platform.</li>
                    <li>2. The transaction will be confirmed on the blockchain. You can track the confirmation process on a blockchain browser using your transaction ID (TXID) for the specific token.</li>
                    <li>3. Once the deposit is confirmed on the blockchain and credited to your Wrathcode Exchangeaccount, it will be considered a complete deposit.
                      Please be aware that network congestion can extend the transaction process. If your deposit is not yet credited to your Wrathcode Exchangeaccount, follow these steps to check its status:
                      <ol>
                        <li>1. Obtain the Transaction ID (TXID) from the platform you withdrew the assets from or ask the platform for the TXID if you cannot find it. The TXID confirms that the withdrawal is completed,
                          and the assets are transferred to the blockchain.</li>
                        <li>2. Check the block confirmation status with the TXID using the appropriate blockchain browser. If the number of block confirmations is lower than Wrathcode Exchangerequirement, please be patient.
                          Your deposit will be credited when the required number of confirmations is met.</li>
                        <li>3. If the number of block confirmations meets the Wrathcode Exchangerequirement but the deposit is still not credited to your account, email customer support at (support@wrathcode.com.) and provide the
                          following information: your Wrathcode Exchangeaccount, token name, deposit amount, and Transaction ID (TXID).
                          <ol>Please note the following:
                            <li>1. If the TXID is not generated, check the withdrawal process with the withdrawal platform.</li>
                            <li>2. Network congestion may cause delays. If the block confirmation is still processing or the number of confirmations is lower than Wrathcode Exchange 's requirement, please be patient.</li>
                            <li>3. Always confirm the transaction information, especially the deposit address copied from Wrathcode Exchangeduring asset transfers, to avoid unnecessary asset loss. Keep in mind that blockchain
                              transactions are irreversible.</li>
                          </ol>
                        </li>
                      </ol>
                    </li>
                  </ol>
                  <ol>Useful Links:
                    <li>BTC Blockchain Browser: <a href='https://btc.com/' target='_blank'>https://btc.com/</a></li>
                    <li>ETH and ERC 20 Tokens Blockchain Browser: <a href=' https://etherscan.io/' target='_blank'> https://etherscan.io/</a></li>
                    <li>LTC Blockchain Browser:  <a href='https://chainz.cryptoid.info/ltc/' target='_blank'>https://chainz.cryptoid.info/ltc/</a></li>
                    <li>ETC Blockchain Browser:  <a href='http://gastracker.io/' target='_blank'>http://gastracker.io/</a></li>
                    <li>BCH Blockchain Browser:  <a href='https://bch.btc.com/' target='_blank'>https://bch.btc.com/</a></li>
                    <li>XRP Blockchain Browser:  <a href='https://bithomp.com/explorer/' target='_blank'>https://bithomp.com/explorer/</a></li>
                    <li>DOT Blockchain Browser:  <a href='https://polkascan.io/polkadot' target='_blank'>https://polkascan.io/polkadot</a></li>
                    <li>TRX Blockchain Browser:  <a href='https://tronscan.org/#/' target='_blank'>https://tronscan.org/#/</a></li>
                    <li>EOS Blockchain Browser:  <a href='https://eosflare.io/' target='_blank'>https://eosflare.io/</a></li>
                    <li>DASH Blockchain Browser:  <a href='https://chainz.cryptoid.info/dash/' target='_blank'>https://chainz.cryptoid.info/dash/</a></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_8">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_8" aria-expanded="false" aria-controls="collapse_8">
                What is the number of block confirmations?
              </button>
            </h2>
            <div id="collapse_8" className="accordion-collapse collapse" aria-labelledby="headingcollapse_8" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <h6>Confirmation:</h6>
                  <p className="">
                    After a transaction is broadcast to the Bitcoin network, it may be included in a block that is published to
                    the network. When that happens, it is said that the transaction has been mined at a depth of one block.
                    With each subsequent block that is found, the number of blocks deep is increased by one. To be secure
                    against double spending, a transaction should not be considered as confirmed until it is a certain number
                    of blocks deep.
                  </p>
                  <h6>Number of Confirmations:</h6>
                  <p>The className bitcoin client will show a transaction as "n/unconfirmed" until the transaction is 6 blocks
                    deep. Merchants and exchanges who accept Bitcoins as payment can and should set their threshold as to
                    how many blocks are required until funds are considered confirmed. Most trading platforms that bear the
                    risk from double spending require 6 or more blocks.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_9">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_9" aria-expanded="false" aria-controls="collapse_8">
                What is a destination Tag/Memo/Message?
              </button>
            </h2>
            <div id="collapse_9" className="accordion-collapse collapse" aria-labelledby="headingcollapse_9" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className='row' >
                  <div className='col-lg-8' >
                    <div className="faq_text" >
                      <p className="">
                        A Destination Tag/Memo/Message is an additional address feature built up of numbers
                        necessary for identifying a transaction recipient beyond a wallet address.
                      </p>
                      <h6>Here is why this is needed:</h6>
                      <p>To facilitate the management, most trading platforms (like Wrathcode Exchange ) give one address for
                        all crypto traders to deposit or withdraw all types of digital assets. Therefore, a
                        Tag/Memo is used to determine what actual individual account a given transaction
                        should be assigned and credited to. To make it simple, the address users send one of
                        these cryptocurrencies to can be equated to an apartment building address. The
                        Tag/Memo identifies which specific apartment users live in, in the apartment building.
                        Note: If the deposit page requires the Tag/Memo/Message information, users must
                        enter a Tag/Memo/Message when depositing on Wrathcode Exchangeto ensure that the deposit can
                        be credited. Users need to follow the tag rules of the target address when withdrawing
                        assets from Wrathcode Exchange .</p>
                      <h6>Which cryptocurrencies use Destination Tag technology?</h6>
                      <p>The following cryptocurrencies available on Wrathcode Exchangeutilize destination tag technology:
                        When users deposit or withdraw those assets, they must provide a correct address along
                        with a corresponding Tag/Memo/Message. A missed, incorrect or mismatched
                        Tag/Memo/Message may lead to failed transactions and the assets cannot be retrieved.</p>
                    </div>
                  </div>
                  <div className='col-lg-4' >
                    <table className='table  table ' >
                      <thead>
                        <tr>
                          <th>
                            Cryptocurrency
                          </th>
                          <th>Feature Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>XRP</td>
                          <td>Tag</td>
                        </tr>
                        <tr>
                          <td>XEM</td>
                          <td>Message</td>
                        </tr>
                        <tr>
                          <td>EOS</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>BNB</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>ATOM</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>IOST</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>XLM</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>ABBC</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>ANKR</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>CHZ</td>
                          <td>Memo</td>
                        </tr>
                        <tr>
                          <td>RUNE</td>
                          <td>Memo</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_10">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_10" aria-expanded="false" aria-controls="collapse_8">
                Why can tokens be deposited and withdrawn over more than one network?
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
                Does a deposit or withdrawal require fees?
              </button>
            </h2>
            <div id="collapse_11" className="accordion-collapse collapse" aria-labelledby="headingcollapse_11" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    There are no fees for a deposit. However, users need to pay fees when withdrawing assets from Wrathcode Exchange .
                    The fees will reward miners or block nodes who confirm transactions. The fee of each transaction is
                    subject to the real-time network status of different tokens. Please take note of the reminder on the
                    withdrawal page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_12">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_12" aria-expanded="false" aria-controls="collapse_8">
                Is there a deposit limit?
              </button>
            </h2>
            <div id="collapse_12" className="accordion-collapse collapse" aria-labelledby="headingcollapse_12" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Yes, there is. For specific digital assets, Wrathcode Exchangesets the minimum deposit amount. Users need to make
                    sure the deposit amount is higher than the minimum requirement.
                    <br />
                    Users will see a popup reminder if the amount is lower than the requirement. Please note, a deposit
                    with an amount lower than the requirement will never be credited even the deposit order shows a
                    complete status.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_13">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_13" aria-expanded="false" aria-controls="collapse_8">
                Is there a withdrawal limit?
              </button>
            </h2>
            <div id="collapse_13" className="accordion-collapse collapse" aria-labelledby="headingcollapse_13" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Yes, there is. Wrathcode Exchangesets the minimum withdrawal amount.
                    <br />
                    Users need to make sure the withdrawal amount meets the requirement. The daily withdrawal quota is
                    capped at 1 BTC for an unverified account. A verified account will have an enhanced withdrawal quota of
                    100 BTC.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_14">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_14" aria-expanded="false" aria-controls="collapse_8">
                Is there a time limit for deposits and withdrawals?
              </button>
            </h2>
            <div id="collapse_14" className="accordion-collapse collapse" aria-labelledby="headingcollapse_14" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    No. Users can deposit and withdraw assets on Wrathcode Exchangeanytime. If the deposit and withdrawal functions are
                    suspended because of block network breakdown, platform upgrade, etc., Wrathcode Exchangewill inform users via an
                    official announcement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_15">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_15" aria-expanded="false" aria-controls="collapse_15">
                How soon will a withdrawal be credited to a target address?
              </button>
            </h2>
            <div id="collapse_15" className="accordion-collapse collapse" aria-labelledby="headingcollapse_15" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    The withdrawal process is as follows:
                    Assets transfer out from Wrathcode Exchange , block confirmation, and receiver accreditation. When users request a
                    withdrawal, the withdrawal will be verified immediately on Wrathcode Exchange . However, it will take a little longer to
                    verify large-amount withdrawals. Then, the transaction will be confirmed on the blockchain. Users can
                    check for the confirmation process on blockchain browsers of different tokens using the transaction ID.
                    <br />
                    A withdrawal confirmed on the blockchain and credited to the receiver will be deemed as a complete
                    withdrawal. Potential network congestion could extend the transaction process. Please note, users can
                    always turn to Wrathcode Exchangecustomer support when having issues with deposits or withdrawals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_16">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_16" aria-expanded="false" aria-controls="collapse_16">
                Can I modify the address of an ongoing withdrawal?
              </button>
            </h2>
            <div id="collapse_16" className="accordion-collapse collapse" aria-labelledby="headingcollapse_16" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    No. Wrathcode Exchangestrongly suggests that users should make sure the withdrawal address is correct by the copy-
                    paste clicks or scanning the QR code.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_17">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_17" aria-expanded="false" aria-controls="collapse_17">
                Can I cancel an ongoing withdrawal?
              </button>
            </h2>
            <div id="collapse_17" className="accordion-collapse collapse" aria-labelledby="headingcollapse_17" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    No. Users cannot cancel a withdrawal request once they issue the request. Users need to check the
                    withdrawal information carefully, such as an address, tag, etc. in case of asset loss.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_18">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_18" aria-expanded="false" aria-controls="collapse_18">
                Can I withdraw assets to several addresses through one withdrawal order?
              </button>
            </h2>
            <div id="collapse_18" className="accordion-collapse collapse" aria-labelledby="headingcollapse_18" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    No. Users can only transfer assets from Wrathcode Exchangeto one address via one withdrawal order. To transfer assets
                    to several addresses, users need to issue separate requests.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_19">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_19" aria-expanded="false" aria-controls="collapse_19">
                Can I transfer assets to a smart contract on Wrathcode Exchange ?
              </button>
            </h2>
            <div id="collapse_19" className="accordion-collapse collapse" aria-labelledby="headingcollapse_19" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Yes. Wrathcode Exchangewithdrawal supports a transfer to smart contracts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_20">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_20" aria-expanded="false" aria-controls="collapse_20">
                Does an asset transfer among Wrathcode Exchangeaccounts require fees?
              </button>
            </h2>
            <div id="collapse_20" className="accordion-collapse collapse" aria-labelledby="headingcollapse_20" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    No. The Wrathcode Exchange X system can automatically distinguish the internal addresses out and charges no fees for
                    assets transfers among those addresses.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      )}

    </div>
  );
}

export default FAQCryptoDeposit
