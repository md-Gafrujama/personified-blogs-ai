"use client";
import { assets } from '@/Assets/assets';
import Footer from '@/Components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Head from 'next/head';
import BlogItem from '@/Components/BlogItem';
import { motion } from 'framer-motion';
import NavbarNew from "@/Components/Navbar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faTwitter, faGooglePlusG, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { baseURL , company} from '@/config/api';

const BlogClient = ({ slug }) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Email subscription state variables
  const [email, setEmail] = useState('');
  const inputRef = useRef(null);
  // Related blogs state
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  // Generate structured data for SEO
  const generateStructuredData = (blog) => {
    if (!blog) return null;
    
    const blogUrl = `${baseURL}/blogs/${blog.slug}`;
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": blog.description?.replace(/<[^>]+>/g, '').slice(0, 160),
      "image": blog.image,
      "author": {
        "@type": "Person",
        "name": blog.author || "Admin"
      },
      "publisher": {
        "@type": "Organization",
        "name": "AI Blog",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseURL}/logo.png`
        }
      },
      "datePublished": blog.date || blog.createdAt,
      "dateModified": blog.updatedAt || blog.date || blog.createdAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": blogUrl
      },
      "url": blogUrl,
      "articleSection": blog.category,
      "keywords": [blog.category, "blog", "article", "technology", "startup", "lifestyle"],
      "wordCount": blog.description?.replace(/<[^>]+>/g, '').split(' ').length || 0,
      "commentCount": comments.length,
      "comment": comments.map(comment => ({
        "@type": "Comment",
        "author": {
          "@type": "Person",
          "name": comment.name
        },
        "text": comment.content,
        "dateCreated": comment.createdAt
      }))
    };
  };

  // Fetch blog data
  const fetchBlogData = async () => {
    if (!slug) return;
    try {
      const response = await axios.get(`${baseURL}/api/blog/slug/${slug}`);
      if (response.data.success && response.data.blog && response.data.blog.company === company) {
        setData(response.data.blog);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error('Error fetching blog data:', error);
      setData(null);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    if (!slug) return;
    try {
      const res = await axios.post(`${baseURL}/api/blog/comments`, { blogSlug: slug });
      if (res.data.success) setComments(res.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Add comment
  const addComment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${baseURL}/api/blog/add-comment`, {
        blog: data._id,
        name,
        content,
      });
      if (res.data.success) {
        setName('');
        setContent('');
        fetchComments();
        toast.success('Comment added successfully!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error adding comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Social share handler with enhanced metadata
  const handleSocialShare = (platform) => {
    if (!data) return;
    const url = encodeURIComponent(`${baseURL}/blogs/${slug}`);
    const title = encodeURIComponent(data.title);
    const description = encodeURIComponent(
      data.description?.replace(/<[^>]+>/g, '').slice(0, 160) || ''
    );
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}&hashtags=blog,article`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'googleplus':
        shareUrl = `https://plus.google.com/share?url=${url}`;
        break;
      default:
        return;
    }
    window.open(
      shareUrl,
      'share-dialog',
      'width=600,height=500,resizable=yes,scrollbars=yes'
    );
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const trimmed = (email || '').trim();

    if (!trimmed) {
      toast.error('Please enter your email');
      return;
    }

    setIsSubscribing(true);

    try {
      const { data } = await axios.post(`${baseURL}/api/blog/subscribe`, {
        email: trimmed,
        company: company
      }, {
        headers: { "Content-Type": "application/json" }
      });

      if (data?.success) {
        toast.success(data.msg || 'Subscribed successfully');
        setEmail('');
        if (inputRef.current) inputRef.current.value = '';
      } else {
        toast.error(data?.message || 'Subscription failed');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || error.message || 'Error occurred while subscribing');
      console.error('Subscribe error:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const onClear = () => {
    setEmail('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (slug) {
      fetchBlogData();
      fetchComments();
    }
  }, [slug]);

  // Fetch related blogs after main blog is loaded
  useEffect(() => {
    if (data && data.category) {
      const fetchRelated = async () => {
        try {
          const response = await axios.get(`${baseURL}/api/blog/all`);
          if (response.data.success) {
            const related = response.data.blogs.filter(
              (b) => b.category === data.category && b.slug !== data.slug && b.isPublished !== false && b.company === company
            ).slice(0, 3);
            setRelatedBlogs(related);
          }
        } catch (err) {
          setRelatedBlogs([]);
        }
      };
      fetchRelated();
    }
  }, [data]);

  return (data ? (
    <>
      <NavbarNew/>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateStructuredData(data)) }}
        />
      </Head>
      
      {/* Hero Section with Enhanced Design */}
      <div className='relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-20 px-5 md:px-12 lg:px-28 overflow-hidden'>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}></div>
        </div>
        
        <div className='relative z-10'>
          <div className='text-center my-20 max-w-4xl mx-auto'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className='inline-block bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-6'
            >
              <span className='text-blue-300 text-sm font-medium'>{data.category}</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='text-4xl md:text-6xl font-bold max-w-[900px] mx-auto leading-tight text-white mb-8 tracking-tight'
            >
              {data.title}
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='flex flex-col md:flex-row items-center justify-center gap-6 text-blue-100'
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold'>
                  {data.author?.charAt(0) || 'A'}
                </div>
                <span className='text-lg font-medium'>By {data.author}</span>
              </div>
              
              <div className='flex items-center gap-2 text-blue-200'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className='text-lg'>
                  {new Date(data.createdAt || data.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Blog Content Section */}
      <div className='relative -mt-20 z-20'>
        <div className='mx-5 max-w-4xl md:mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className='relative'
          >
            <Image 
              className='rounded-2xl w-full shadow-2xl' 
              src={data.image} 
              width={1200} 
              height={600} 
              alt={data.title}
              style={{ aspectRatio: '2/1', objectFit: 'cover' }}
            />
          </motion.div>
          
          {/* Blog Content - Plain Format */}
          <motion.article 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className='mt-12 mb-16 bg-white'
          >
            <div 
              className='prose prose-xl prose-gray max-w-none leading-relaxed'
              style={{
                '--tw-prose-body': '#374151',
                '--tw-prose-headings': '#111827',
                '--tw-prose-lead': '#4B5563',
                '--tw-prose-links': '#2563eb',
                '--tw-prose-bold': '#111827',
                '--tw-prose-counters': '#6B7280',
                '--tw-prose-bullets': '#D1D5DB',
                '--tw-prose-hr': '#E5E7EB',
                '--tw-prose-quotes': '#111827',
                '--tw-prose-quote-borders': '#E5E7EB',
                '--tw-prose-captions': '#6B7280',
                '--tw-prose-code': '#111827',
                '--tw-prose-pre-code': '#E5E7EB',
                '--tw-prose-pre-bg': '#1F2937',
                '--tw-prose-th-borders': '#D1D5DB',
                '--tw-prose-td-borders': '#E5E7EB',
                lineHeight: '1.8',
                fontSize: '18px',
              }}
              dangerouslySetInnerHTML={{__html: data.description}} 
            />
          </motion.article>

          {/* Comments Section with Enhanced Design */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 my-16"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Comments ({comments.length})</h2>
            </div>
            
            <div className="space-y-6 mb-12">
              {comments.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg">Be the first to share your thoughts!</p>
                </div>
              )}
              {comments.map((c) => (
                <div key={c._id} className="bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">{c.name}</div>
                      <div className="text-gray-700 mt-2 leading-relaxed">{c.content}</div>
                      <div className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(c.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Comment Form */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-100">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">Join the conversation</h3>
              <form onSubmit={addComment} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-900 placeholder-gray-400"
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                  <textarea
                    rows={5}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Share your thoughts..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Post Comment
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Newsletter Subscription with Enhanced Design */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 my-16 text-white relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 2px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}></div>
            </div>
            
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-4">Stay in the loop</h3>
              <p className="text-blue-100 mb-8 text-lg">Get the latest insights and updates delivered straight to your inbox.</p>
              
              <form onSubmit={onSubmitHandler} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input 
                  ref={inputRef}
                  onChange={(e) => setEmail(e.target.value)} 
                  value={email} 
                  type="email" 
                  name="email"
                  placeholder='Enter your email address' 
                  required 
                  className='flex-1 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 placeholder-white/70 text-white outline-none focus:ring-4 focus:ring-white/30 focus:border-white/50 transition-all duration-300'
                />
                <button 
                  type="submit" 
                  disabled={isSubscribing}
                  className='bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl'
                >
                  {isSubscribing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
              
              {email && (
                <button 
                  onClick={onClear} 
                  className='inline-flex items-center text-white/70 hover:text-white transition-colors duration-200 mt-4 text-sm'
                >
                  Clear email
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>

          {/* Enhanced Share Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className='bg-white rounded-2xl shadow-xl p-8 my-16 text-center'
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>Share this article</h3>
            <p className='text-gray-600 mb-8'>Spread the knowledge with your network</p>
            
            <div className='flex justify-center gap-4 flex-wrap'>
              <button
                onClick={() => handleSocialShare('facebook')}
                className="group bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                title="Share on Facebook"
              >
                <FontAwesomeIcon icon={faFacebookF} className="text-xl group-hover:scale-110 transition-transform duration-300" />
              </button>

              <button
                onClick={() => handleSocialShare('twitter')}
                className="group bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                title="Share on Twitter"
              >
                <FontAwesomeIcon icon={faTwitter} className="text-xl group-hover:scale-110 transition-transform duration-300" />
              </button>

              <button
                onClick={() => handleSocialShare('googleplus')}
                className="group bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                title="Share on Google Plus"
              >
                <FontAwesomeIcon icon={faGooglePlusG} className="text-xl group-hover:scale-110 transition-transform duration-300" />
              </button>

              <button
                onClick={() => handleSocialShare('linkedin')}
                className="group bg-blue-800 hover:bg-blue-900 text-white p-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                title="Share on LinkedIn"
              >
                <FontAwesomeIcon icon={faLinkedinIn} className="text-xl group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>

          {/* Enhanced Related Blogs Section */}
          {relatedBlogs.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="my-24"
            >
              <div className="text-center mb-16">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Continue Reading
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Discover more insights and stories that might interest you
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedBlogs.map((blog, index) => (
                  <motion.article
                    key={blog.slug}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.8 + (index * 0.1) }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group cursor-pointer"
                    onClick={() => window.location.href = `/blogs/${blog.slug}`}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
                      <div className="relative overflow-hidden">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {blog.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                          {blog.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                          {blog.description?.replace(/<[^>]+>/g, '').slice(0, 120)}...
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(blog.createdAt || blog.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          
                          <div className="flex items-center text-blue-600 group-hover:text-purple-600 transition-colors duration-300">
                            <span className="text-sm font-medium">Read more</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>
      
      <Footer />
    </>
  ) : data === null ? (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50'>
      <div className='text-center max-w-md mx-auto p-8'>
        <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>Blog Not Found</h1>
        <p className='text-gray-600 mb-8 leading-relaxed'>
          The blog post you're looking for doesn't exist or has been unpublished.
        </p>
        <Link href='/' className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl'>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  ) : (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50'>
      <div className='text-center max-w-md mx-auto p-8'>
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-ping opacity-20"></div>
          <div className="relative w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Loading your content</h2>
        <p className='text-gray-600'>Please wait while we prepare your reading experience...</p>
      </div>
    </div>
  ));
};

export default BlogClient;