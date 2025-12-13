// frontend/src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, Users, Award, TrendingUp, Filter, ChevronDown, Star, Clock, DollarSign, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { useCourses } from '../context/CourseContext';
import axios from 'axios';
import config from "../config";

const HomePage = () => {
  const { courses, loading } = useCourses();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    provider: '',
    level: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'rating',
    sortOrder: 'desc'
  });
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    approvedCourses: 0,
    pendingCourses: 0,
    totalUsers: 0,
    totalReviews: 0,
    avgCourseRating: 0,
    totalProviders: 0,
    totalInstructors: 0
  });

  const applyFilters = useCallback(() => {
    let result = [...courses];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        course.instructor.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      );
    }

    // Apply provider filter
    if (filters.provider) {
      result = result.filter(course => course.provider === filters.provider);
    }

    // Apply level filter
    if (filters.level) {
      result = result.filter(course => course.level === filters.level);
    }

    // Apply price filter
    if (filters.minPrice) {
      result = result.filter(course => course.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(course => course.price <= parseFloat(filters.maxPrice));
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'reviews':
          aValue = a.reviews || 0;
          bValue = b.reviews || 0;
          break;
        case 'newest':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.rating || 0;
          bValue = b.rating || 0;
      }

      if (filters.sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    setFilteredCourses(result);
  }, [courses, searchQuery, filters]);

  const fetchRealStats = useCallback(async () => {
    try {
      // Use public stats endpoint
      const statsResponse = await axios.get(`${config.API_BASE_URL}/api/admin/public-stats`);
      
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      
      // Fallback to calculated stats from context
      const approvedCourses = courses.filter(c => c.status === 'approved');
      const pendingCourses = courses.filter(c => c.status === 'pending');
      
      const approvedWithRatings = approvedCourses.filter(c => c.rating > 0);
      const avgRating = approvedWithRatings.length > 0 
        ? (approvedWithRatings.reduce((sum, c) => sum + c.rating, 0) / approvedWithRatings.length).toFixed(1)
        : 0;
      
      const uniqueProviders = [...new Set(approvedCourses.map(c => c.provider))];
      const uniqueInstructors = [...new Set(approvedCourses.map(c => c.instructor))];
      const totalReviews = approvedCourses.reduce((sum, c) => sum + (c.reviews || 0), 0);
      
      // Get unique user count from courses
      const uniqueSubmitters = [...new Set(courses.map(c => c.submittedBy?._id || c.submittedBy))].filter(id => id);
      
      setStats({
        totalCourses: courses.length,
        approvedCourses: approvedCourses.length,
        pendingCourses: pendingCourses.length,
        totalUsers: uniqueSubmitters.length || Math.floor(approvedCourses.length * 1.5),
        totalReviews: totalReviews,
        avgCourseRating: parseFloat(avgRating),
        totalProviders: uniqueProviders.length,
        totalInstructors: uniqueInstructors.length
      });
    }
  }, [courses]);

  useEffect(() => {
    fetchRealStats();
    applyFilters();
  }, [fetchRealStats, applyFilters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      provider: '',
      level: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'rating',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  };

  const providers = [...new Set(courses.map(course => course.provider))];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="min-h-screen bg-gray-900 pb-12">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-900 to-indigo-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                Learn Without Limits
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                Discover courses from top platforms. Compare, track, and master your skills.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-3xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for courses, skills, or instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg shadow-lg"
                />
              </div>
              
              {/* Quick Filters */}
              <div className="mt-6 flex flex-wrap gap-3">
                {['Web Development', 'Data Science', 'Python', 'React', 'AWS', 'Marketing'].map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => setSearchQuery(tag)} 
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Real Statistics Cards */}
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700">
                <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.approvedCourses}</div>
                <div className="text-xs text-gray-300">Approved Courses</div>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-xs text-gray-300">Registered Users</div>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700">
                <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalProviders}</div>
                <div className="text-xs text-gray-300">Course Providers</div>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalReviews.toLocaleString()}</div>
                <div className="text-xs text-gray-300">Total Reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-750 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Avg. Course Rating</div>
                <div className="text-lg font-bold text-white flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  {stats.avgCourseRating.toFixed(1)}/5.0
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-750 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Unique Instructors</div>
                <div className="text-lg font-bold text-white">{stats.totalInstructors}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-750 rounded-lg">
              <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Pending Review</div>
                <div className="text-lg font-bold text-white">{stats.pendingCourses}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-750 rounded-lg">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Courses</div>
                <div className="text-lg font-bold text-white">{stats.totalCourses}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Section */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="ml-4 text-sm text-gray-400">
                Showing {filteredCourses.length} of {courses.length} courses
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="rating">Sort by: Highest Rated</option>
                <option value="price">Sort by: Price</option>
                <option value="reviews">Sort by: Most Reviews</option>
                <option value="newest">Sort by: Newest</option>
              </select>
              
              <button
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition"
              >
                {filters.sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </button>
              
              {(filters.provider || filters.level || filters.minPrice || filters.maxPrice || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                  <select
                    value={filters.provider}
                    onChange={(e) => handleFilterChange('provider', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Providers</option>
                    {providers.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Levels</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="Min"
                      className="w-full pl-10 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="Max"
                      className="w-full pl-10 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
            <button 
              onClick={clearFilters}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
            
            {/* Real Statistics Summary */}
            <div className="mt-8 bg-gray-800 rounded-xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Average Course Price</div>
                  <div className="text-2xl font-bold text-white">
                    ${filteredCourses.length > 0 ? 
                      (filteredCourses.reduce((sum, c) => sum + (c.price || 0), 0) / filteredCourses.length).toFixed(2) 
                      : '0.00'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Average Rating</div>
                  <div className="text-2xl font-bold text-white flex items-center justify-center">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                    {filteredCourses.length > 0 ? 
                      (filteredCourses.reduce((sum, c) => sum + (c.rating || 0), 0) / filteredCourses.length).toFixed(1)
                      : '0.0'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Total Instructors</div>
                  <div className="text-2xl font-bold text-white">
                    {[...new Set(filteredCourses.map(c => c.instructor))].length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Approval Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {courses.length > 0 ? 
                      Math.round((stats.approvedCourses / courses.length) * 100) 
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;