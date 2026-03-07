import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { BLOG_CONTENT, BLOG_CATEGORIES } from "./blogData";

const truncateString = (str, maxLength) => {
  if (!str || typeof str !== "string") return "";
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

const BlogList = () => {
  const token = localStorage.getItem("token");
  const [showRecentBlog, setShowRecentBlog] = useState(false);
  const targetRef = useRef(null);
  const navigate = useNavigate();

  const nextPage = (data) => {
    navigate(`/blogdetails?${data}`);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToTarget = () => {
    setShowRecentBlog(true);
    targetRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>Web3 & Crypto Guides – URG-X Blog</title>
        <meta
          name="description"
          content="From beginners to advanced traders: find tutorials, token reviews and market trends on URG-X Blog. Read now and start growing."
        />
        <meta
          name="keywords"
          content="crypto guides, web3 blog, URG-X educational content, token review blog"
        />
      </Helmet>

      <div className="blog_section_b">
        <section className="inner-page-banner bg-2 bg-image">
          <div className="container">
            <div className="inner">
              <div className="top_heading_cnt">
                <h2>URG-X Blog</h2>
                <h1 className="title">Learn About Crypto Casually</h1>
              </div>
              <div className="top_right_img">
                <img src="/images/blog_vector.png" className="img-fluid" alt="vector" />
              </div>
            </div>

            <div className="search_outer_blog">
              <div className="left_hb">
                <ul>
                  {BLOG_CATEGORIES.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="search_right" />
            </div>
          </div>
        </section>

        <section className="mt-3">
          <div className="container">
            <div className="crypto_cta">
              <div className="row">
                <div className="col-sm-9">
                  <h3 className="mb-3">
                    Trade Smarter. Swap Faster. Welcome to the Future of Crypto Exchange.
                  </h3>
                  <Link to="/trade/blog" className="startbtn">
                    Start Here
                  </Link>
                </div>
                <div className="col-sm-3">
                  <div className="cta_img">
                    <img src="/images/crypto_cta_img.png" alt="images" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hot_articles_s">
          <div className="container">
            <h2>Hot Articles</h2>
            <div className="row mt-2">
              {BLOG_CATEGORIES.map((categoryItem) => {
                const featuredPost = BLOG_CONTENT.filter(
                  (blog) => blog.category === categoryItem
                )
                  .reverse()
                  .slice(0, 1)[0];

                return (
                  <div key={categoryItem} className="col-sm-4 mt-2 mb-5">
                    <div className="block_blog">
                      <div className="top_articles_h">
                        <h3>
                          <a href="#">
                            <img src="/images/articel_icon.png" alt="images" />
                            {categoryItem}
                          </a>
                        </h3>
                      </div>
                      {featuredPost && (
                        <div
                          className="articles_blog_bl"
                          onClick={() => nextPage(featuredPost?.index)}
                        >
                          <a className="thumb cursor-pointer">
                            <img src={featuredPost.image} alt="nft blog" />
                          </a>
                          <h4>{truncateString(featuredPost.title, 80)}</h4>
                          <ul className="meta_date">
                            <li>{categoryItem}</li>
                          </ul>
                        </div>
                      )}
                      <div className="view_allbtn">
                        <a href="#/" onClick={scrollToTarget}>
                          View All
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {!token && (
          <section>
            <div className="container">
              <div className="crypto_cta">
                <div className="row">
                  <div className="col-sm-9">
                    <h3>Register On URG-X Now To Begin Trading</h3>
                    <Link to="/signup" className="startbtn mt-2">
                      Register Now
                    </Link>
                  </div>
                  <div className="col-sm-3">
                    <div className="cta_img">
                      <img src="/images/cta_vector2.svg" alt="images" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="hot_articles_s recent_blog">
          <div className="container">
            <div className="recentblog_top">
              <h2 ref={targetRef}>Recent Blogs...</h2>
              {!showRecentBlog && (
                <div className="view_allbtn">
                  <span
                    className="cursor_pointer"
                    onClick={() => setShowRecentBlog(true)}
                  >
                    View All
                  </span>
                </div>
              )}
            </div>

            <div className="row">
              {BLOG_CONTENT.slice(0, showRecentBlog ? BLOG_CONTENT.length : 4).map(
                (item) => (
                  <div
                    key={item.index}
                    className="col-sm-3 mb-3"
                    onClick={() => nextPage(item?.index)}
                  >
                    <div className="block_blog">
                      <div className="articles_blog_bl">
                        <a className="thumb cursor-pointer">
                          <img src={item.image} alt="nft blog" />
                        </a>
                        <h4>{truncateString(item.title, 50)}</h4>
                        <ul className="meta_date">
                          <li>{item.category}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="container">
            <div className="subscribe_form">
              <div className="row">
                <div className="col-sm-2">
                  <div className="email_icon">
                    <img src="/images/email_icon2.png" alt="email" />
                  </div>
                </div>
                <div className="col-sm-10">
                  <h4>Get The Latest News And Updates From URG-X here</h4>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogList;
