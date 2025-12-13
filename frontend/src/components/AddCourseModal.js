import React, { useState } from 'react';
import { X, Upload, DollarSign, Clock, BookOpen, Star, Link, Check } from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';

const AddCourseModal = ({ onClose }) => {
  const { submitCourse } = useCourses();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    provider: '',
    price: '',
    duration: '',
    level: 'Beginner',
    description: '',
    thumbnail: '',
    tags: '',
    category: '',
    url: '',
    skills: '',
    rating: 5
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.title.trim()) newErrors.title = 'Course title is required';
    if (!formData.instructor.trim()) newErrors.instructor = 'Instructor name is required';
    if (!formData.provider.trim()) newErrors.provider = 'Provider is required';
    if (formData.price && formData.price < 0) newErrors.price = 'Price cannot be negative';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.tags.trim()) newErrors.tags = 'Tags are required (comma separated)';
    if (!formData.url.trim()) newErrors.url = 'Course enrollment URL is required';
    if (!isValidUrl(formData.url)) newErrors.url = 'Please enter a valid URL';
    
    return newErrors;
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setLoading(false);
      return;
    }

    try {
      const courseData = {
        title: formData.title,
        instructor: formData.instructor,
        provider: formData.provider,
        price: Number(formData.price),
        duration: formData.duration,
        level: formData.level,
        description: formData.description,
        thumbnail: formData.thumbnail || '',
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        category: formData.category,
        url: formData.url,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        rating: Number(formData.rating),
        submittedBy: user._id || user.id,
        status: user.role === 'admin' ? 'approved' : 'pending'
      };

      const result = await submitCourse(courseData);
      
      if (result.success) {
        setSuccess(user.role === 'admin' 
          ? 'Course published successfully!' 
          : 'Course submitted successfully! It will be reviewed by admin.');
        
        // Reset form
        setFormData({
          title: '',
          instructor: '',
          provider: '',
          price: '',
          duration: '',
          level: 'Beginner',
          description: '',
          thumbnail: '',
          tags: '',
          category: '',
          url: '',
          skills: '',
          rating: 5
        });
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrors({ submit: result.error || 'Failed to submit course' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Web Development', 'Data Science', 'Machine Learning', 'Cloud Computing',
    'Mobile Development', 'Design', 'Marketing', 'Business', 'Finance',
    'Health & Fitness', 'Music', 'Photography', 'Language', 'Other'
  ];

  const providers = [
    'Udemy', 'Coursera', 'edX', 'Pluralsight', 'LinkedIn Learning', 
    'Skillshare', 'YouTube', 'Codecademy', 'Udacity', 'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">Submit New Course</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          
          {errors.submit && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Course Basic Info */}
            <div className="bg-gray-750 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Complete Python Bootcamp"
                    className={`w-full px-4 py-3 bg-gray-700 border ${errors.title ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    disabled={loading}
                  />
                  {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instructor Name *
                  </label>
                  <input
                    type="text"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleChange}
                    placeholder="e.g., Dr. Angela Yu"
                    className={`w-full px-4 py-3 bg-gray-700 border ${errors.instructor ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    disabled={loading}
                  />
                  {errors.instructor && <p className="text-red-400 text-sm mt-1">{errors.instructor}</p>}
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="bg-gray-750 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Course Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Provider/Platform *
                  </label>
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-700 border ${errors.provider ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    disabled={loading}
                  >
                    <option value="">Select Provider</option>
                    {providers.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                  {errors.provider && <p className="text-red-400 text-sm mt-1">{errors.provider}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enrollment URL *
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      placeholder="https://www.udemy.com/course/..."
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border ${errors.url ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      disabled={loading}
                    />
                  </div>
                  {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
                  <p className="text-xs text-gray-400 mt-1">Link where users can enroll in the course</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="99.99"
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border ${errors.price ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      disabled={loading}
                    />
                  </div>
                  {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g., 65 hours, 8 weeks, Self-paced"
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border ${errors.duration ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      disabled={loading}
                    />
                  </div>
                  {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Level *
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={loading}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-700 border ${errors.category ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    disabled={loading}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-gray-750 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Course Content</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description * (Minimum 50 characters)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what students will learn, course content, target audience, prerequisites..."
                    className={`w-full px-4 py-3 bg-gray-700 border ${errors.description ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-32`}
                    disabled={loading}
                    rows={6}
                  />
                  {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                  <div className="text-xs text-gray-400 mt-1 flex justify-between">
                    <span>Minimum 50 characters</span>
                    <span>{formData.description.length}/50</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tags * (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="Python, Web Development, Data Science, Machine Learning"
                      className={`w-full px-4 py-3 bg-gray-700 border ${errors.tags ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      disabled={loading}
                    />
                    {errors.tags && <p className="text-red-400 text-sm mt-1">{errors.tags}</p>}
                    <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Skills Learned (Optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="React, Node.js, MongoDB, Express, REST API"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-400 mt-1">What skills will students gain? (Optional)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Thumbnail URL (Optional)
                  </label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="thumbnail"
                      value={formData.thumbnail}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty for automatic thumbnail based on category
                  </p>
                </div>
              </div>
            </div>

            {/* Initial Rating Section */}
            <div className="bg-gray-750 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Initial Course Rating (Optional)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Your Rating (1-5)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleChange({ target: { name: 'rating', value: star } })}
                        className="text-2xl"
                      >
                        <Star 
                          className={`w-8 h-8 cursor-pointer ${
                            star <= formData.rating 
                              ? 'fill-yellow-500 text-yellow-500' 
                              : 'text-gray-600'
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="text-white font-bold ml-2">{formData.rating}/5</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    This is your personal rating. Other users can add their own ratings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6 border-t border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                user?.role === 'admin' ? 'Publish Course' : 'Submit for Review'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              {user.role === 'admin' 
                ? 'As an admin, your course will be published immediately.'
                : 'Your course will be reviewed by an admin before being published.'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Fields marked with * are required
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourseModal;