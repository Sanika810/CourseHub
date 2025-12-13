import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, Check, Clock, BookOpen, Award, Play, Users, 
  Heart, ChevronLeft, MessageSquare, DollarSign, BarChart3, 
  Globe, User, ThumbsUp, Flag, ExternalLink, X, RefreshCw, Trash2
} from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    savedCourses: savedCourseIds, 
    toggleSaveCourse, 
    submitReview, 
    getCourseById,
    approveCourse,
    rejectCourse,
    updateCourseStatus,
    deleteCourse,
    refreshCourse 
  } = useCourses();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userReview, setUserReview] = useState({
    rating: 5,
    text: '',
    contentQuality: 5,
    instructorQuality: 5,
    valueForMoney: 5,
    pros: '',
    cons: ''
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Use the context method or direct API call
        const courseData = await getCourseById(id);
        
        if (courseData) {
          setCourse(courseData);
          
          // Fetch reviews separately
          const reviewsResponse = await axios.get(`http://localhost:5000/api/courses/${id}`);
          if (reviewsResponse.data.reviews) {
            setReviews(reviewsResponse.data.reviews);
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const handleReviewSubmit = async () => {
    if (!user) {
      alert('Please login to submit a review');
      return;
    }

    if (!userReview.text.trim()) {
      alert('Please write a review');
      return;
    }

    setReviewLoading(true);
    setReviewSuccess('');

    try {
      const result = await submitReview(id, userReview);
      
      if (result.success) {
        setReviewSuccess('Review submitted successfully!');
        setUserReview({
          rating: 5,
          text: '',
          contentQuality: 5,
          instructorQuality: 5,
          valueForMoney: 5,
          pros: '',
          cons: ''
        });
        
        // Update reviews list
        if (result.reviews) {
          setReviews(result.reviews);
        }
        
        // Update course rating
        if (result.course) {
          setCourse(prev => ({
            ...prev,
            rating: result.course.rating,
            reviews: result.course.reviews,
            ratingBreakdown: result.course.ratingBreakdown,
            contentQuality: result.course.contentQuality,
            instructorQuality: result.course.instructorQuality,
            valueForMoney: result.course.valueForMoney
          }));
        }
      } else {
        alert(result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!user) {
      alert('Please login to save courses');
      return;
    }

    const result = await toggleSaveCourse(id);
    if (result.success) {
      if (result.saved) {
        alert('Course saved to your list!');
      } else {
        alert('Course removed from saved list');
      }
    }
  };

  const handleEnroll = () => {
    if (course?.url) {
      window.open(course.url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Course enrollment link not available');
    }
  };

  const handleAdminAction = async (action, status = null) => {
    if (!user?.role === 'admin') {
      alert('Admin access required');
      return;
    }

    setAdminActionLoading(true);
    try {
      let result;
      
      if (action === 'approve') {
        result = await approveCourse(id);
      } else if (action === 'reject') {
        const reason = prompt('Enter rejection reason (optional):');
        result = await rejectCourse(id, reason || '');
      } else if (action === 'update-status' && status) {
        const reason = status === 'rejected' ? prompt('Enter rejection reason (optional):') : '';
        result = await updateCourseStatus(id, status, reason || '');
      } else if (action === 'delete') {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
          setAdminActionLoading(false);
          return;
        }
        result = await deleteCourse(id);
        if (result.success) {
          alert('Course deleted successfully!');
          navigate('/');
          return;
        }
      }

      if (result?.success) {
        // Refresh the course data
        const updatedCourse = await refreshCourse(id);
        if (updatedCourse) {
          setCourse(updatedCourse);
        }
        alert(result.message || 'Action completed successfully!');
      } else if (result?.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error performing admin action:', error);
      alert('Failed to perform action');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRefreshCourse = async () => {
    const updatedCourse = await refreshCourse(id);
    if (updatedCourse) {
      setCourse(updatedCourse);
      alert('Course data refreshed!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Course not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isSaved = savedCourseIds.includes(course._id);

  return (
    <div className="min-h-screen bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="text-purple-500 hover:text-purple-400 mb-6 flex items-center space-x-2 transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to courses</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2">
            {/* Course Thumbnail */}
            <div className="bg-gray-800 rounded-xl overflow-hidden mb-6">
              <img 
                src={course.thumbnail} 
                alt={course.title} 
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Course Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
                  <p className="text-xl text-gray-300">{course.description}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <button 
                    onClick={handleSaveCourse}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition ${
                      isSaved
                        ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                        : 'border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500' : ''}`} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                  
                  {user?.role === 'admin' && (
                    <button 
                      onClick={handleRefreshCourse}
                      disabled={adminActionLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Refresh</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Instructor Info */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {course.instructor?.charAt(0) || 'I'}
                </div>
                <div>
                  <div className="text-sm text-gray-400">Instructor</div>
                  <div className="text-lg font-semibold text-white">{course.instructor}</div>
                  <div className="text-sm text-gray-400">{course.provider}</div>
                </div>
              </div>

              {/* Submitted By Info */}
              {course.submittedBy && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-gray-400">Submitted by: </span>
                      <span className="text-white font-medium">
                        {course.submittedBy.name} ({course.submittedBy.email})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Status Badge */}
              <div className="mb-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  course.status === 'approved' 
                    ? 'bg-green-900 text-green-300 border border-green-700' 
                    : course.status === 'pending'
                    ? 'bg-yellow-900 text-yellow-300 border border-yellow-700'
                    : 'bg-red-900 text-red-300 border border-red-700'
                }`}>
                  {course.status === 'pending' && <Clock className="w-4 h-4 mr-2" />}
                  {course.status === 'approved' && <Check className="w-4 h-4 mr-2" />}
                  {course.status === 'rejected' && <X className="w-4 h-4 mr-2" />}
                  {course.status?.toUpperCase()}
                </div>
                {course.status === 'pending' && (
                  <p className="text-yellow-300 text-sm mt-2">
                    This course is pending admin approval
                  </p>
                )}
                {course.status === 'rejected' && course.rejectionReason && (
                  <p className="text-red-300 text-sm mt-2">
                    Rejection reason: {course.rejectionReason}
                  </p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700 mb-6">
              <div className="flex space-x-8 overflow-x-auto">
                {['overview', 'reviews', 'syllabus'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-medium capitalize whitespace-nowrap ${
                      activeTab === tab 
                        ? 'text-purple-500 border-b-2 border-purple-500' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-gray-800 rounded-xl p-6">
              {activeTab === 'overview' && (
                <>
                  <h3 className="text-2xl font-bold text-white mb-4">What you'll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {course.skills?.map((skill, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{skill}</span>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4 mt-8">Course Details</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3 text-gray-300">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-400">Duration</div>
                        <div className="font-medium">{course.duration}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-400">Level</div>
                        <div className="font-medium">{course.level}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <Globe className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-400">Language</div>
                        <div className="font-medium">{course.language || 'English'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-400">Provider</div>
                        <div className="font-medium">{course.provider}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-white mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.tags?.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Course Description */}
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-white mb-3">Full Description</h4>
                    <p className="text-gray-300 whitespace-pre-line">{course.description}</p>
                  </div>
                </>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Rating Overview */}
                  <div className="bg-gray-750 rounded-lg p-6">
                    <h3 className="text-2xl font-bold text-white mb-6">Student Feedback</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {/* Overall Rating */}
                      <div className="text-center">
                        <div className="text-6xl font-bold text-white mb-2">
                          {course.rating?.toFixed(1) || '0.0'}
                        </div>
                        <div className="flex justify-center mb-2">
                          {[1,2,3,4,5].map(star => (
                            <Star 
                              key={star} 
                              className={`w-6 h-6 ${
                                star <= Math.round(course.rating || 0) 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-600'
                              }`} 
                            />
                          ))}
                        </div>
                        <div className="text-gray-400">
                          {course.reviews?.toLocaleString() || 0} ratings
                        </div>
                      </div>

                      {/* Rating Distribution */}
                      <div className="space-y-3">
                        {[5,4,3,2,1].map(stars => (
                          <div key={stars} className="flex items-center space-x-3">
                            <span className="text-sm text-gray-400 w-12">
                              {stars} stars
                            </span>
                            <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 rounded-full transition-all"
                                style={{ 
                                  width: `${course.ratingBreakdown?.[stars] || 0}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-400 w-12 text-right">
                              {course.ratingBreakdown?.[stars] || 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-700">
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Content Quality</div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{width: `${((course.contentQuality || 0)/5)*100}%`}} 
                            />
                          </div>
                          <span className="text-white font-semibold">
                            {(course.contentQuality || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Instructor Quality</div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{width: `${((course.instructorQuality || 0)/5)*100}%`}} 
                            />
                          </div>
                          <span className="text-white font-semibold">
                            {(course.instructorQuality || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Value for Money</div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full" 
                              style={{width: `${((course.valueForMoney || 0)/5)*100}%`}} 
                            />
                          </div>
                          <span className="text-white font-semibold">
                            {(course.valueForMoney || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Write Review */}
                  <div className="bg-gray-750 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Write a Review
                    </h3>
                    
                    {reviewSuccess && (
                      <div className="mb-4 bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
                        {reviewSuccess}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Overall Rating
                        </label>
                        <div className="flex space-x-2">
                          {[1,2,3,4,5].map(star => (
                            <button 
                              key={star} 
                              type="button"
                              onClick={() => setUserReview({...userReview, rating: star})}
                              className="hover:scale-110 transition-transform"
                            >
                              <Star 
                                className={`w-8 h-8 cursor-pointer ${
                                  star <= userReview.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-600'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Content Quality
                          </label>
                          <select 
                            value={userReview.contentQuality}
                            onChange={(e) => setUserReview({
                              ...userReview, 
                              contentQuality: Number(e.target.value)
                            })}
                            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {[1,2,3,4,5].map(n => (
                              <option key={n} value={n}>{n} Star{n>1?'s':''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Instructor Quality
                          </label>
                          <select 
                            value={userReview.instructorQuality}
                            onChange={(e) => setUserReview({
                              ...userReview, 
                              instructorQuality: Number(e.target.value)
                            })}
                            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {[1,2,3,4,5].map(n => (
                              <option key={n} value={n}>{n} Star{n>1?'s':''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Value for Money
                          </label>
                          <select 
                            value={userReview.valueForMoney}
                            onChange={(e) => setUserReview({
                              ...userReview, 
                              valueForMoney: Number(e.target.value)
                            })}
                            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {[1,2,3,4,5].map(n => (
                              <option key={n} value={n}>{n} Star{n>1?'s':''}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Pros (What you liked)
                          </label>
                          <textarea
                            value={userReview.pros}
                            onChange={(e) => setUserReview({...userReview, pros: e.target.value})}
                            placeholder="What did you like about this course?"
                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-20"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">
                            Cons (What could be improved)
                          </label>
                          <textarea
                            value={userReview.cons}
                            onChange={(e) => setUserReview({...userReview, cons: e.target.value})}
                            placeholder="What could be improved?"
                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                          Your Review *
                        </label>
                        <textarea
                          value={userReview.text}
                          onChange={(e) => setUserReview({...userReview, text: e.target.value})}
                          placeholder="Share your detailed experience with this course..."
                          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-32"
                          required
                        />
                      </div>

                      <button 
                        onClick={handleReviewSubmit}
                        disabled={reviewLoading || !user}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {reviewLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                      
                      {!user && (
                        <p className="text-yellow-400 text-sm">
                          Please login to submit a review
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Existing Reviews */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">
                      Student Reviews ({reviews.length})
                    </h3>
                    
                    {reviews.length === 0 ? (
                      <div className="text-center py-8 bg-gray-750 rounded-lg">
                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No reviews yet. Be the first to review!</p>
                      </div>
                    ) : (
                      reviews.map(review => (
                        <div key={review._id} className="bg-gray-750 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {review.userId?.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="text-white font-medium">
                                  {review.userId?.name || 'Anonymous'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-white font-semibold">{review.rating}</span>
                            </div>
                          </div>
                          
                          {review.text && (
                            <p className="text-gray-300 mb-3">{review.text}</p>
                          )}
                          
                          {(review.pros || review.cons) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              {review.pros && (
                                <div>
                                  <div className="text-sm text-green-400 font-medium mb-1">Pros</div>
                                  <p className="text-sm text-gray-300">{review.pros}</p>
                                </div>
                              )}
                              {review.cons && (
                                <div>
                                  <div className="text-sm text-red-400 font-medium mb-1">Cons</div>
                                  <p className="text-sm text-gray-300">{review.cons}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 pt-3 border-t border-gray-700">
                            <div className="flex items-center space-x-2">
                              <ThumbsUp className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {review.helpfulCount || 0} helpful
                              </span>
                            </div>
                            <button className="text-xs text-gray-400 hover:text-gray-300">
                              <Flag className="w-4 h-4 inline mr-1" />
                              Report
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'syllabus' && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Course Curriculum</h3>
                  <div className="space-y-4">
                    {course.syllabus?.length > 0 ? (
                      course.syllabus.map((section, idx) => (
                        <div key={idx} className="bg-gray-750 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {idx + 1}
                              </div>
                              <span className="text-white font-medium">{section.title}</span>
                            </div>
                            <span className="text-gray-400 text-sm">
                              {section.topics?.length || 0} topics
                            </span>
                          </div>
                          {section.topics && section.topics.length > 0 && (
                            <div className="pl-11 space-y-2">
                              {section.topics.map((topic, topicIdx) => (
                                <div key={topicIdx} className="flex items-start space-x-3">
                                  <Play className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-300">{topic}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-gray-750 rounded-lg">
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Syllabus not available for this course</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-20">
              {/* Price and Enrollment */}
              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  ${course.price?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  {course.provider === 'Udemy' ? 'Frequently on sale' : 'One-time payment'}
                </div>
                
                <button 
                  onClick={handleEnroll}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg mb-3 transition flex items-center justify-center"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Enroll Now on {course.provider}
                </button>
                
                <div className="text-center text-sm text-gray-400">
                  30-day money-back guarantee
                </div>
              </div>

              {/* Course Features */}
              <div className="mb-6 pt-6 border-t border-gray-700">
                <h4 className="font-semibold text-white mb-4">This course includes:</h4>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-purple-500" />
                    <span>{course.duration} on-demand video</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    <span>Downloadable resources</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-purple-500" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Play className="w-5 h-5 text-purple-500" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-purple-500" />
                    <span>Access on mobile and TV</span>
                  </div>
                </div>
              </div>

              {/* Course Stats */}
              <div className="pt-6 border-t border-gray-700">
                <h4 className="font-semibold text-white mb-4">Course Statistics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Last Updated</div>
                    <div className="text-white">
                      {new Date(course.lastUpdated || course.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Language</div>
                    <div className="text-white">{course.language || 'English'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Level</div>
                    <div className="text-white">{course.level}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Provider</div>
                    <div className="text-white">{course.provider}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      course.status === 'approved' 
                        ? 'bg-green-900 text-green-300' 
                        : course.status === 'pending'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {course.status?.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Enrollment URL</div>
                    <a 
                      href={course.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm truncate block"
                    >
                      {course.url ? 'Click to enroll' : 'Not available'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {user?.role === 'admin' && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="font-semibold text-white mb-4">Admin Actions</h4>
                  <div className="space-y-3">
                    {course.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAdminAction('approve')}
                          disabled={adminActionLoading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Approve Course
                        </button>
                        <button 
                          onClick={() => handleAdminAction('reject')}
                          disabled={adminActionLoading}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                        >
                          <X className="w-5 h-5 mr-2" />
                          Reject Course
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => {
                        const newStatus = prompt('Enter new status (approved/rejected/pending):');
                        if (newStatus && ['approved', 'rejected', 'pending'].includes(newStatus)) {
                          handleAdminAction('update-status', newStatus);
                        } else if (newStatus) {
                          alert('Invalid status. Please enter: approved, rejected, or pending');
                        }
                      }}
                      disabled={adminActionLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Update Status
                    </button>
                    
                    <button 
                      onClick={() => handleAdminAction('delete')}
                      disabled={adminActionLoading}
                      className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete Course
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;