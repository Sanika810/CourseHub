import React, { useEffect, useState } from 'react';
import { Check, Trash2, AlertCircle, Users, BookOpen, Award, TrendingUp, X, Bell, RefreshCw } from 'lucide-react';
import { useCourses } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminPage = () => {
  const { 
    pendingCourses, 
    courses, 
    stats, 
    loading,
    approveCourse, 
    rejectCourse, 
    deleteCourse,
    refreshCourses,
    fetchPendingCourses,
    fetchCourses
  } = useCourses();
  
  const { user } = useAuth();
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleApprove = async (courseId) => {
    setActionLoading(true);
    const success = await approveCourse(courseId);
    setActionLoading(false);
    
    if (success.success) {
      alert('Course approved successfully!');
      // Refresh notifications after action
      await fetchNotifications();
    } else {
      alert(success.error || 'Failed to approve course');
    }
  };

  const handleReject = async (courseId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setActionLoading(true);
    const success = await rejectCourse(courseId, reason);
    setActionLoading(false);
    
    if (success.success) {
      alert('Course rejected successfully!');
      // Refresh notifications after action
      await fetchNotifications();
    } else {
      alert(success.error || 'Failed to reject course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    
    setActionLoading(true);
    const success = await deleteCourse(courseId);
    setActionLoading(false);
    
    if (success.success) {
      alert('Course deleted successfully!');
      // Refresh notifications after action
      await fetchNotifications();
    } else {
      alert(success.error || 'Failed to delete course');
    }
  };

  const handleRefreshAll = async () => {
    setActionLoading(true);
    await refreshCourses();
    await fetchNotifications();
    setActionLoading(false);
    alert('Data refreshed successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage courses, users, and platform content</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleRefreshAll}
              disabled={actionLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Refresh All</span>
            </button>
            <div className="flex items-center space-x-2 bg-purple-600 px-4 py-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {pendingCourses.length} Pending
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {notifications.length} Notifications
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Total Courses</div>
                  <div className="text-3xl font-bold text-white">{stats.totalCourses}</div>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Pending Approval</div>
                  <div className="text-3xl font-bold text-yellow-500">{stats.pendingCourses}</div>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Total Users</div>
                  <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Total Reviews</div>
                  <div className="text-3xl font-bold text-white">{stats.totalReviews}</div>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Approved</div>
                  <div className="text-3xl font-bold text-white">{stats.approvedCourses}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Pending Courses */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Pending Course Approvals ({pendingCourses.length})
            </h2>
            <button 
              onClick={fetchPendingCourses}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          {pendingCourses.length === 0 ? (
            <div className="text-center py-12">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-400">All caught up! No pending courses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCourses.map(course => (
                <div key={course._id} className="bg-gray-700 rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                        <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full font-semibold">
                          PENDING
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                        <div>
                          <span className="text-gray-400">Instructor:</span>{' '}
                          {course.instructor}
                        </div>
                        <div>
                          <span className="text-gray-400">Provider:</span>{' '}
                          {course.provider}
                        </div>
                        <div>
                          <span className="text-gray-400">Price:</span> ${course.price}
                        </div>
                        <div>
                          <span className="text-gray-400">Duration:</span>{' '}
                          {course.duration}
                        </div>
                        <div>
                          <span className="text-gray-400">Level:</span> {course.level}
                        </div>
                        <div>
                          <span className="text-gray-400">Submitted by:</span>{' '}
                          {course.submittedBy?.name || course.submittedBy?.email || 'Unknown'}
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm line-clamp-2">{course.description}</p>
                    </div>
                    
                    <div className="flex flex-col space-y-3 lg:w-48">
                      <button 
                        onClick={() => handleApprove(course._id)}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Check className="w-5 h-5" />
                        <span>Approve</span>
                      </button>
                      <button 
                        onClick={() => handleReject(course._id)}
                        disabled={actionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)}
                        disabled={actionLoading}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Courses */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              All Courses ({courses.length})
            </h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={fetchCourses}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <div className="text-sm text-gray-400">
                Sorted by: Rating (Highest First)
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                <tr>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Instructor</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course._id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div>
                          <div className="text-white font-medium line-clamp-1">{course.title}</div>
                          <div className="text-xs text-gray-500">{course.level}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{course.instructor}</td>
                    <td className="px-6 py-4">{course.provider}</td>
                    <td className="px-6 py-4">${course.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-yellow-400 font-semibold mr-2">{course.rating}</span>
                        <span className="text-gray-500 text-xs">({course.reviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        course.status === 'approved' 
                          ? 'bg-green-900 text-green-300' 
                          : course.status === 'pending'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {course.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => window.location.href = `/course/${course._id}`}
                          className="text-blue-400 hover:text-blue-300 transition"
                          title="View Course"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(course._id)}
                          className="text-red-400 hover:text-red-300 transition"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No courses found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;