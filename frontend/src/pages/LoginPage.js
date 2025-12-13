import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login
        if (!formData.email || !formData.password) {
          throw new Error('Please fill in all fields');
        }

        const result = await login(formData.email, formData.password);
        
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // Register
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
          throw new Error('Please fill in all fields');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const result = await register(formData.name, formData.email, formData.password);
        
        if (result.success) {
          setSuccess('Registration successful! You are now logged in.');
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12 text-purple-500 mr-3" />
          <h1 className="text-4xl font-bold text-white">CourseHub</h1>
        </div>
        
        <p className="text-gray-400 text-center mb-8">
          {isLogin ? 'Sign in to continue your learning journey' : 'Create your account to start learning'}
        </p>
        
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-3 text-center font-medium ${
              isLogin 
                ? 'text-purple-500 border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-5 h-5 inline mr-2" />
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-3 text-center font-medium ${
              !isLogin 
                ? 'text-purple-500 border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-5 h-5 inline mr-2" />
            Register
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isLogin ? "Enter your password" : "Create a password (min. 6 characters)"}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
              required
              minLength="6"
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                required
                minLength="6"
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: ''
              });
            }}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            {isLogin 
              ? "Don't have an account? Register here" 
              : "Already have an account? Sign in here"}
          </button>
        </div>
        
        {isLogin && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;