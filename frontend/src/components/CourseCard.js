import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Clock, User } from 'lucide-react';
import { useCourses } from '../context/CourseContext';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const { savedCourses, toggleSaveCourse } = useCourses();
  const isSaved = savedCourses.includes(course._id);

  const handleCardClick = () => {
    navigate(`/course/${course._id}`);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    toggleSaveCourse(course._id);
  };

  return (
    <div 
      className="bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <button 
            onClick={handleSaveClick}
            className="bg-gray-900 bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition"
          >
            <Heart 
              className={`w-5 h-5 ${
                isSaved ? 'fill-red-500 text-red-500' : 'text-white'
              }`} 
            />
          </button>
        </div>
        <div className="absolute top-2 left-2 bg-purple-600 px-3 py-1 rounded-full text-xs font-semibold text-white">
          {course.provider}
        </div>
        {course.status === 'pending' && (
          <div className="absolute bottom-2 left-2 bg-yellow-500 px-3 py-1 rounded-full text-xs font-semibold text-yellow-900">
            Pending Approval
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        {/* Submitted by info */}
        {course.submittedBy && (
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">
              Added by {course.submittedBy?.name || 'User'}
            </span>
          </div>
        )}
        
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
          {course.tags?.length > 3 && (
            <span className="text-xs text-gray-500">+{course.tags.length - 3}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">${course.price || 0}</span>
          <span className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
            {course.level}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;