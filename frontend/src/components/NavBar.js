import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Bell, User, LogOut, Menu, X, Home, BookOpen, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import axios from 'axios';
import config from "../config";

const NavBar = ({ onAddCourse, onCourseAction = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { savedCourses } = useCourses();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshingNotifications, setRefreshingNotifications] = useState(false);
  
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    // Calculate unread count whenever notifications change
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    // Close menus when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;
    
    setRefreshingNotifications(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${config.API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post(
        `${config.API_BASE_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/my-courses', label: 'My Courses', icon: BookOpen, badge: savedCourses.length },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: Shield }] : [])
  ];

  return (
    <>
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white mr-3"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <h1 
                className="text-2xl font-bold text-purple-500 cursor-pointer" 
                onClick={() => navigate('/')}
              >
                CourseHub
              </h1>
              
              <div className="hidden md:flex ml-8 space-x-4">
                {menuItems.map((item) => (
                  <button 
                    key={item.path}
                    onClick={() => navigate(item.path)} 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center relative ${isActive(item.path) ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge > 0 && (
                      <span className="ml-2 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={onAddCourse}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center space-x-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Course</span>
              </button>
              
              <div className="relative" ref={notificationsRef}>
                <div className="flex items-center">
                  <button 
                    onClick={refreshNotifications}
                    disabled={refreshingNotifications}
                    className="text-gray-300 hover:text-white transition p-1 mr-1"
                    title="Refresh notifications"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshingNotifications ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative text-gray-300 hover:text-white transition p-2"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-700 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      <div className="flex items-center space-x-3">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button 
                          onClick={refreshNotifications}
                          disabled={refreshingNotifications}
                          className="text-xs text-gray-400 hover:text-gray-300"
                          title="Refresh"
                        >
                          <RefreshCw className={`w-3 h-3 ${refreshingNotifications ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {notifications.map(notification => (
                          <div 
                            key={notification._id}
                            className={`px-4 py-3 hover:bg-gray-750 cursor-pointer transition ${!notification.read ? 'bg-gray-750' : ''}`}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification._id);
                              }
                              if (notification.data?.courseId) {
                                navigate(`/course/${notification.data.courseId}`);
                                setNotificationsOpen(false);
                              }
                            }}
                          >
                            <div className="flex items-start">
                              <div className={`w-3 h-3 rounded-full mt-1 mr-3 flex-shrink-0 ${
                                notification.type === 'course_approved' ? 'bg-green-500' : 
                                notification.type === 'course_pending' ? 'bg-yellow-500' : 
                                notification.type === 'course_rejected' ? 'bg-red-500' : 
                                'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm">{user?.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${user?.role === 'admin' ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
                    {user?.role}
                  </span>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      <div className="mt-2 flex items-center">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(user?.xp || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 ml-2">Level {Math.floor((user?.xp || 0) / 100) + 1}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        navigate('/my-courses');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                    >
                      <BookOpen className="w-4 h-4 mr-3" />
                      My Courses
                      {savedCourses.length > 0 && (
                        <span className="ml-auto bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {savedCourses.length}
                        </span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => {
                        onAddCourse();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      Add Course
                    </button>
                    
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          navigate('/admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                      >
                        <Shield className="w-4 h-4 mr-3" />
                        Admin Panel
                      </button>
                    )}
                    
                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-900 hover:text-red-100 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 border-b border-gray-700">
          <div className="px-4 py-3 space-y-1">
            {menuItems.map((item) => (
              <button 
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-3 rounded-md text-base font-medium flex items-center ${isActive(item.path) ? 'text-white bg-gray-900' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
                {item.badge > 0 && (
                  <span className="ml-auto bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            
            <div className="border-t border-gray-700 pt-3 mt-3">
              <button 
                onClick={() => {
                  onAddCourse();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-3" />
                Add Course
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-300 hover:text-red-100 hover:bg-red-900 flex items-center"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;