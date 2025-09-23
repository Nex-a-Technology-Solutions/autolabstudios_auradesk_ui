import React, { useState } from 'react';

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.full_name || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user account via API
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
          role: 'user' // Default role for self-registration
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Registration failed (${response.status})`);
      }

      const result = await response.json();
      
      setSuccess('Account created successfully! You can now log in.');
      
      // Clear form
      setFormData({
        email: '',
        full_name: '',
        password: '',
        confirmPassword: ''
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} registration clicked`);
    // In a real app, this would redirect to OAuth provider
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        
        {/* Logo */}
        <div className="text-center mb-4">
          <h4 className="text-lg font-medium text-black mb-7 inline-block">
            autolab studios auradesk
          </h4>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h4 className="text-lg font-medium text-black mb-2">
            Create Account
          </h4>
          <p className="text-sm text-black">
            Sign up for AuraDesk to get started with our help desk system
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center">
          
          <div className="w-full space-y-6">
            
            {/* Full Name Input */}
            <div className="relative mb-6">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder=" "
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-full text-xs text-gray-700 transition-all duration-300 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20 peer box-border"
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs transition-all duration-300 pointer-events-none bg-gray-50 px-1 peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:font-light peer-focus:rounded-lg peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:font-light peer-[:not(:placeholder-shown)]:rounded-lg">
                Full Name
              </label>
            </div>

            {/* Email Input */}
            <div className="relative mb-6">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder=" "
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-full text-xs text-gray-700 transition-all duration-300 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20 peer box-border"
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs transition-all duration-300 pointer-events-none bg-gray-50 px-1 peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:font-light peer-focus:rounded-lg peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:font-light peer-[:not(:placeholder-shown)]:rounded-lg">
                Email Address
              </label>
            </div>

            {/* Password Input */}
            <div className="relative mb-6">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder=" "
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-full text-xs text-gray-700 transition-all duration-300 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20 peer box-border"
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs transition-all duration-300 pointer-events-none bg-gray-50 px-1 peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:font-light peer-focus:rounded-lg peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:font-light peer-[:not(:placeholder-shown)]:rounded-lg">
                Password (min 8 characters)
              </label>
            </div>

            {/* Confirm Password Input */}
            <div className="relative mb-6">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder=" "
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-full text-xs text-gray-700 transition-all duration-300 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20 peer box-border"
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs transition-all duration-300 pointer-events-none bg-gray-50 px-1 peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:font-light peer-focus:rounded-lg peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:font-light peer-[:not(:placeholder-shown)]:rounded-lg">
                Confirm Password
              </label>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-center mb-6">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-gray-800 text-white border-none rounded-full text-sm font-light cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/40 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Messages */}
            {error && (
              <div className="text-red-600 text-xs text-center my-4 px-2 py-2 bg-red-50/80 border border-red-200/50 rounded-full font-light">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 bg-green-400/10 text-sm text-center my-4 px-2 py-2 rounded-full font-light">
                {success}
                <br />
                <small>Redirecting to login...</small>
              </div>
            )}

            {/* Sign In Link */}
            <p className="text-center text-sm text-black font-medium mb-5">
              Already have an account?{' '}
              <a href="/login" className="relative text-green-400 no-underline font-medium transition-colors hover:text-green-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-0.5 after:bg-green-400 after:transition-all after:duration-300">
                Sign in
              </a>
            </p>

           
          </div>

          {/* Footer Links */}
          <div className="text-center mt-8 text-sm text-gray-600 font-light">
            <a href="/terms-of-use" className="text-gray-600 underline mx-2 hover:text-green-400">Terms of Use</a>
            <span className="text-gray-500 mx-1">|</span>
            <a href="/privacy-policy" className="text-gray-600 underline mx-2 hover:text-green-400">Privacy Policy</a>
          </div>

          {/* Terms Disclaimer */}
          <div className="text-center mt-4 text-xs text-gray-500 font-light">
            <p>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;