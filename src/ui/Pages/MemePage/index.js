import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const MemePage = () => {
  const navigate = useNavigate();
  const [pairsList, setPairsList] = useState([]);
  const [search, setSearch] = useState("");
  const [allData, setAllData] = useState([]);



  // ********* Funds Data ********** //
  const getBuySellHistory = async () => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.getMemePairs()
      if (result?.success) {
        setPairsList(result?.data);
        setAllData(result?.data);
      }
    } finally { LoaderHelper.loaderStatus(false); }
  };


  const nextPage = (data) => {
    localStorage.setItem('RecentPair', JSON.stringify(data))
    navigate(`/trade/${data?.base_currency}_${data?.quote_currency}`);
  };


  useEffect(() => {
    getBuySellHistory()

  }, []);

  useEffect(() => {
    if (search) {
      let filteredPair = allData?.filter((item) => item?.base_currency?.toLowerCase()?.includes(search?.toLowerCase()))
      setPairsList(filteredPair)
    } else {
      setPairsList(allData)
    }

  }, [search]);


  return (
    <>
      <Helmet>
        <title>Crypto Meme Platform – Create, Share & Win on URG-X</title>

        <meta
          name="description"
          content="Join the URG-X Meme Hub to share viral crypto memes, join weekly contests, and connect with the global Web3 meme community."
        />

        <meta
          name="keywords"
          content="crypto meme hub, meme crypto platform, URG-X community, meme rewards, web3 memes"
        />
      </Helmet>

      <div className="meme_hero_s">
        <div className="container">


          <div className="meme_coin_top">
            <div className="meme_coin_cnt">
              <h1>Meme+</h1>
              <p>Your easiest way to early on-chain investment opportunities! </p>
            </div>

            <div className="meme_right_img">

              <div className="banner_images banner_hotCoin">
                <img src="images/robot_img.png" alt="banner" />
              </div>
              {/* <!-- 

                <div className="banner_hotCoinContainer">

                <div className="banner_hotCoin left_img">
                  <div className="rounded_img"><img src="images/cv_trade_banner_img.png" alt="banner"></div>

                <div className="banner_coinMask_animation">
                  <img src="images/coin_mask.png" alt="coin">
                </div>   

                </div>

                <div className="banner_hotCoin center_img">
                  <div className="rounded_img"><img src="images/cv_trade_banner_img.png" alt="banner"></div>

                <div className="banner_coinMask_animation">
                  <img src="images/coin_mask.png" alt="coin">
                </div>   

                </div>


                <div className="banner_hotCoin right_img">
                  <div className="rounded_img"><img src="images/cv_trade_banner_img.png" alt="banner"></div>

                <div className="banner_coinMask_animation">
                  <img src="images/coin_mask.png" alt="coin">
                </div>   

                </div>


              </div>

             <div className="banner_bottom_img">
              <img src="images/banner_logo_bg.png" alt="banner">
            </div> -->    */}

            </div>

          </div>
        </div>


      </div>

      <div className="meme_listing_section">
        <div className="container">

          <div className="top_heading">
            <h4>Markets Listed</h4>

            <form>
              <div className="search_items">
                <i className="ri-search-line"></i>
                <input type="text" placeholder="Enter token name" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </form>

          </div>


          <div className="dashboard_summary">


            <ul className="nav nav-tabs" id="myTab" role="tablist">
              {/* <li className="nav-item" role="presentation">
        <button className="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home" type="button" role="tab" aria-controls="home" aria-selected="true">All</button>
      </li> */}
              {/* <li className="nav-item" role="presentation">
        <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false" tabIndex="-1">SOL</button>
      </li>
      <li className="nav-item" role="presentation">
        <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#contact" type="button" role="tab" aria-controls="contact" aria-selected="false" tabIndex="-1">BASE</button>
      </li>
      <li className="nav-item" role="presentation">
        <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#favorite" type="button" role="tab" aria-controls="favorite" aria-selected="false" tabIndex="-1">BSC</button>
      </li>
      <li className="nav-item" role="presentation">
        <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#gainers" type="button" role="tab" aria-controls="gainers" aria-selected="false" tabIndex="-1">ETH</button>
      </li> */}
            </ul>
            <div className="tab-content" id="myTabContent">
              <div className="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="home-tab">

                <div className="crypto_list">


                  <ul>
                    {pairsList?.map((item, index) => {
                      return (
                        <li key={item?._id || index} onClick={() => nextPage(item)} className='cursor' >
                          <div className="crypto_icon">
                            <img src={ApiConfig?.baseImage + item?.icon_path} alt="icon" height="250px" />
                          </div>

                          <div className="coin-card_cardItemWrapper">

                            <div className="coin-card_itemcnt">
                              <h6>{item?.base_currency}<span>/{item?.quote_currency}</span></h6>
                              <div>{item?.base_currency_fullname}</div>
                            </div>
                            <div className="coin-card_itemcnt">
                              <h6>Volume</h6>
                              <div>{item?.volume?.toFixed(1)}</div>
                            </div>
                            <div className="coin-card_itemcnt">
                              <h6>Price</h6>
                              <div>{item?.buy_price}</div>
                            </div>
                            <div className="coin-card_itemcnt">
                              <h6>Change</h6>
                              <div className={item?.change_percentage > 0 ? "green" : "red"}>{item?.change_percentage}%</div>
                            </div>

                          </div>

                        </li>
                      )
                    })}


                  </ul>


                </div>

                {/* <div className="pagination_list">

          <nav aria-label="Page navigation example">
            <ul className="pagination">
              <li className="page-item">
                <a className="page-link" href="#" aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                </a>
              </li>
              <li className="page-item"><a className="page-link" href="#">1</a></li>
              <li className="page-item"><a className="page-link" href="#">2</a></li>
              <li className="page-item"><a className="page-link" href="#">3</a></li>
              <li className="page-item">
                <a className="page-link" href="#" aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                </a>
              </li>
            </ul>
          </nav>  
          
        </div>           */}

              </div>


            </div>


          </div>



          <div className="what_coin_s">
            <h2>What are Meme Coins?</h2>

            <p>Meme coins are like the entertainment of the cryptocurrency world. Born from internet culture, jokes, and memes,
              they often start as playful, unassuming tokens inspired by almost anything. For example, a viral dog picture became DOGE,
              the hottest memecoin, as well as some trending internet memes like CHILLGUY.
            </p>

            <p>Despite their comedic roots, meme coins are famous for their price swings and excitement. While they may not offer the
              same utility or long-term vision as established cryptocurrencies like BTC, their appeal lies in the community and the wild
              ride they offer. Whether you're here for the memes or to catch the next big thing, meme coins are a fun and unpredictable part
              of the crypto landscape.
            </p>

          </div>



        </div>


      </div>
    </>
  )
}

export default MemePage
