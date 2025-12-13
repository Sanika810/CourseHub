import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const useCourses = () => useContext(CourseContext);

export const CourseProvider = ({ children }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [savedCourseIds, setSavedCourseIds] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchSavedCourses();
      fetchPendingCourses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/courses');
      setCourses(response.data);
      
      // Fetch stats
      if (user?.role === 'admin') {
        const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedCourses = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/courses/user/saved', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Store only the IDs for quick lookup
      const savedIds = response.data.map(course => course._id);
      setSavedCourseIds(savedIds);
    } catch (error) {
      console.error('Error fetching saved courses:', error);
    }
  };

  const fetchPendingCourses = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/admin/pending-courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPendingCourses(response.data);
    } catch (error) {
      console.error('Error fetching pending courses:', error);
    }
  };

  const toggleSaveCourse = async (courseId) => {
    if (!user) {
      return { success: false, error: 'Please login to save courses' };
    }
    
    try {
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/save`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Update saved course IDs
        setSavedCourseIds(response.data.savedCourses || []);
        return { success: true, saved: response.data.saved };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Error saving course:', error);
      return { success: false, error: 'Failed to save course' };
    }
  };

  const submitCourse = async (courseData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/courses', courseData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Refresh courses list
      await fetchCourses();
      
      return { success: true, course: response.data };
    } catch (error) {
      console.error('Error submitting course:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to submit course' };
    }
  };

  const approveCourse = async (courseId, reason) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/admin/courses/${courseId}/approve`,
        { reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Update course in state
        updateCourseInState(response.data.course);
        // Refresh pending courses
        await fetchPendingCourses();
        // Refresh all courses
        await fetchCourses();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error approving course:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to approve course' };
    }
  };

  const rejectCourse = async (courseId, reason) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/admin/courses/${courseId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Update course in state
        updateCourseInState(response.data.course);
        // Refresh pending courses
        await fetchPendingCourses();
        // Refresh all courses
        await fetchCourses();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error rejecting course:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to reject course' };
    }
  };

  const updateCourseStatus = async (courseId, status, reason) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/courses/${courseId}/status`,
        { status, reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Update course in state
        updateCourseInState(response.data.course);
        // Refresh pending courses if needed
        if (user?.role === 'admin') {
          await fetchPendingCourses();
        }
        // Refresh all courses
        await fetchCourses();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating course status:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to update course status' };
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/admin/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Remove course from state
        setCourses(prev => prev.filter(course => course._id !== courseId));
        setPendingCourses(prev => prev.filter(course => course._id !== courseId));
        // Remove from saved courses if present
        setSavedCourseIds(prev => prev.filter(id => id !== courseId));
        // Refresh all courses
        await fetchCourses();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error deleting course:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete course' };
    }
  };

  const submitReview = async (courseId, reviewData) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/reviews`,
        {
          rating: reviewData.rating,
          contentQuality: reviewData.contentQuality,
          instructorQuality: reviewData.instructorQuality,
          valueForMoney: reviewData.valueForMoney,
          text: reviewData.text,
          pros: reviewData.pros,
          cons: reviewData.cons
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Update the specific course in the courses list
        updateCourseInState(response.data.course);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to submit review' 
      };
    }
  };

  const getCourseById = async (courseId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
      return response.data.course;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  };

  const updateCourseInState = useCallback((updatedCourse) => {
    // Update in courses array
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course._id === updatedCourse._id ? updatedCourse : course
      )
    );
    
    // Update in pending courses array if present
    setPendingCourses(prev => 
      prev.map(course => 
        course._id === updatedCourse._id ? updatedCourse : course
      ).filter(course => course.status === 'pending')
    );
  }, []);

  const refreshCourse = async (courseId) => {
    try {
      const updatedCourse = await getCourseById(courseId);
      if (updatedCourse) {
        updateCourseInState(updatedCourse);
        return updatedCourse;
      }
    } catch (error) {
      console.error('Error refreshing course:', error);
    }
    return null;
  };

  const searchCourses = async (query, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.level) params.append('level', filters.level);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.category) params.append('category', filters.category);
      
      const response = await axios.get(`http://localhost:5000/api/courses/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching courses:', error);
      return [];
    }
  };

  const refreshCourses = async () => {
    await fetchCourses();
    await fetchPendingCourses();
    await fetchSavedCourses();
  };

  const getSavedCoursesList = () => {
    return courses.filter(course => savedCourseIds.includes(course._id));
  };

  // Check if a course is saved
  const isCourseSaved = (courseId) => {
    return savedCourseIds.includes(courseId);
  };

  return (
    <CourseContext.Provider value={{
      courses,
      savedCourses: getSavedCoursesList(),
      savedCourseIds,
      pendingCourses,
      loading,
      stats,
      toggleSaveCourse,
      submitCourse,
      approveCourse,
      rejectCourse,
      updateCourseStatus,
      deleteCourse,
      submitReview,
      getCourseById,
      refreshCourse,
      searchCourses,
      refreshCourses,
      getSavedCoursesList,
      isCourseSaved,
      updateCourseInState,
      fetchPendingCourses,
      fetchCourses
    }}>
      {children}
    </CourseContext.Provider>
  );
};