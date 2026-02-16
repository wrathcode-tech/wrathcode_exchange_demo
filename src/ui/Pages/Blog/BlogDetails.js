import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BLOG_CONTENT } from "./blogData";

const BlogDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qs = typeof window !== "undefined" ? window.location.search?.slice(1) || "" : "";
  const blogId = searchParams.get("id") || (qs.includes("=") ? "" : qs) || "";

  const currentBlog = BLOG_CONTENT.find((item) => item.index === blogId);

    useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [blogId]);

    return (
        <>
        <div className="blog_detail">
            <section className="inner-page-banner bg-2 bg-image">
                <div className="container">
            <Link to="/blogs" className="mb-3">
              {"<"} Back
            </Link>
                    <div className="inner text-center">
                        <h1 className="title">Wrathcode Blog</h1>
                        <nav className="mt-4">
                            <ol className="breadcrumb justify-content-center">
                  <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/blogs">Blog List</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Blog Details
                  </li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </section>

            <section className="pt-120 pb-90 blog_list">
                <div className="container">
            {currentBlog ? (
              <>
                <Helmet>
                  <title>{currentBlog.title} – Wrathcode Blog</title>
                  <meta
                    name="description"
                    content={
                      currentBlog.shortDescription ||
                      truncateText(currentBlog.title, 160)
                    }
                  />
                  <meta
                    name="og:title"
                    content={`${currentBlog.title} – Wrathcode Blog`}
                  />
                </Helmet>
                <div className="row">
                  <div className="col-xl-8 col-lg-8 blog-details-wrapper">
                    <div className="blog-content">
                      <div className="single_blog_img">
                        <img
                          className="img-fluid"
                          src={currentBlog.image}
                          alt="blog-details"
                        />
                      </div>
                      <h2 className="mb-2">{currentBlog.title}</h2>
                      <ul className="meta" />
                      <p>{currentBlog.description}</p>
                                    </div>
                        </div>

                  <div className="col-xl-4 col-lg-4">
                            <aside className="sidebar">
                      <div className="single-widget recent-post mt-5">
                        <h3 className="title">Recent Posts</h3>
                                    <div className="inner">
                          <ul className="list_with_img">
                            {BLOG_CONTENT.map((item, index) => (
                              <li
                                key={index}
                                className="d-flex mt-3 justify-content-between align-items-start"
                                onClick={() => {
                                  navigate(`/blogdetails?${item?.index}`);
                                }}
                              >
                                                        <div>
                                  <a className="d-block mt-0 cursor-pointer">
                                    {item?.title}
                                  </a>
                                </div>
                                <img
                                  src="/images/authors/1.jpg"
                                  alt=""
                                  className="img-fluid"
                                  width="70"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </aside>
                    </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <h3>Blog not found</h3>
                <p className="mb-4">
                  The blog post you&apos;re looking for doesn&apos;t exist or has
                  been removed.
                </p>
                <Link to="/blogs" className="btn btn-primary">
                  Back to Blog List
                </Link>
              </div>
            )}
                </div>
            </section>
            </div>
        </>
    );
};

function truncateText(str, maxLength) {
  if (!str || typeof str !== "string") return "";
  return str.length > maxLength
    ? `${str.substring(0, maxLength)}...`
    : str;
}

export default BlogDetails;
