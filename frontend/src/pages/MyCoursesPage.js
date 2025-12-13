import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, Clock, Star, DollarSign, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '../context/CourseContext';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const { savedCourses: savedCoursesList, toggleSaveCourse } = useCourses();
  const [savedCourses, setSavedCourses] = useState([]);

  useEffect(() => {
    setSavedCourses(savedCoursesList);
  }, [savedCoursesList]);

  const handleUnsave = async (courseId) => {
    const result = await toggleSaveCourse(courseId);
    if (result.success) {
      setSavedCourses(prev => prev.filter(c => c._id !== courseId));
    }
  };

  const handleEnroll = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Saved Courses</h1>
        <p className="text-gray-400 mb-8">Your personal learning collection</p>

        {savedCourses.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No saved courses yet
            </h3>
            <p className="text-gray-400 mb-6">
              Browse courses and click the heart icon to save them here
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-400">
                You have {savedCourses.length} saved course{savedCourses.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCourses.map(course => (
                <div key={course._id} className="bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition">
                  <div className="relative">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <button 
                        onClick={() => handleUnsave(course._id)}
                        className="bg-gray-900 bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-purple-600 px-3 py-1 rounded-full text-xs font-semibold text-white">
                      {course.provider}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <p className="text-sm text-gray-400 mb-3">{course.instructor}</p>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-white">{course.rating || 0}</span>
                        <span className="text-xs text-gray-400">
                          ({course.reviews?.toLocaleString() || 0})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">{course.duration}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {course.tags?.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">${course.price || 0}</span>
                      <span className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                        {course.level}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <button 
                        onClick={() => navigate(`/course/${course._id}`)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleEnroll(course.url)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition flex items-center justify-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Enroll
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;