"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { baseURL, company} from "@/config/api";

const  Company = company;

// Blog categories
const blogCategories = [
  "All",
  "ABM",
  "Advertising",
  "Content Creation",
  "Demand Generation",
  "Intent Data",
  "Sales",
];


const BlogCard = ({ blog }) => {
  const { title, description = "", category, image, _id, slug } = blog;

  const handleClick = () => {
    window.location.href = `/blogs/${slug || _id}`;
  };

  const calculateReadingTime = (text) => {
    if (!text) return 1;
    const wordsPerMinute = 200;
    const words = text.replace(/<[^>]+>/g, "").split(" ").length;
    return Math.ceil(words / wordsPerMinute);
  };

  const readingTime = calculateReadingTime(description);

  return (
    <motion.div
      onClick={handleClick}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative cursor-pointer"
    >
      {/* Main Card Container */}
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(56,104,97,0.3)] transition-all duration-500 border-l-4 border-[#F7D270] hover:border-l-8">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={image || "/default-blog.jpg"} // ✅ fallback image
            alt={title || "Blog"}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#294944]/80 via-[#294944]/40 to-transparent"></div>

          {/* Category */}
          {category && (
            <div className="absolute top-4 right-4">
              <span className="inline-block px-3 py-1 bg-[#F7D270] text-[#294944] text-xs font-bold rounded-full shadow-lg">
                {category}
              </span>
            </div>
          )}

          {/* Reading Time */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-white">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">{readingTime} min</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#294944] mb-3 line-clamp-2 group-hover:text-[#386861] transition-colors duration-300">
            {title}
          </h3>

          <div
            className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4"
            dangerouslySetInnerHTML={{
              __html:
                description.replace(/<[^>]+>/g, "").slice(0, 150) + "...",
            }}
          />

          {/* Read More */}
          <div className="flex items-center justify-between">
            <button className="flex items-center space-x-2 text-[#386861] hover:text-[#294944] font-semibold transition-colors duration-200">
              <span>Read More</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>

            {/* Share Icon */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg
                className="w-5 h-5 text-[#F7D270]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Hover Border */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#F7D270]/50 rounded-3xl transition-all duration-300"></div>
      </div>
    </motion.div>
  );
};


const BlogList = () => {
  const [menu, setMenu] = useState("All");
  const [blogs, setBlogs] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [company, setCompany] = useState("");

 
  useEffect(() => {
    if (typeof window !== "undefined") {
   
      setCompany(Company);
      console.log(company);
    }
  }, []);

 

  const fetchBlogs = async () => {
    if (!company) return; 
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${baseURL}/api/admin/blogs?company=${company}`
      );
      const filteredBlogs =
        response.data?.blogs?.filter((blog) => blog.company === company) || [];
      setBlogs(filteredBlogs);
      setSearchResults(filteredBlogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [company]);

  const handleSearch = (searchTerm) => {
    setInput(searchTerm);
    if (!searchTerm.trim()) {
      setSearchResults(blogs);
      return;
    }
    const filtered = blogs.filter(
      (blog) =>
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filtered);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(input);
    }, 300);
    return () => clearTimeout(timer);
  }, [input, blogs]);

  const getFilteredBlogs = () => {
    let filtered = searchResults;
    if (menu !== "All") {
      filtered = filtered.filter((item) => item.category === menu);
    }
    return filtered;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#F7D270]/5 to-[#386861]/10">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#294944] via-[#386861] to-[#294944] text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-[#F7D270]">Explore</span> Our <br />
              <span className="text-white">Knowledge Hub</span>
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Dive into a curated collection of insights, trends, and expert
              knowledge designed to elevate your understanding and inspire
              action.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-[#294944] text-lg font-medium">
              Loading amazing content...
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                  : "space-y-6"
              }
            >
              {getFilteredBlogs().length > 0 ? (
                getFilteredBlogs().map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <BlogCard blog={item} />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-20"
                >
                  <h3 className="text-2xl font-bold text-[#294944] mb-3">
                    No Articles Found
                  </h3>
                  <p className="text-[#386861] text-lg">
                    {input
                      ? `No results match "${input}". Try adjusting your search.`
                      : "No articles available in this category."}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default BlogList;
