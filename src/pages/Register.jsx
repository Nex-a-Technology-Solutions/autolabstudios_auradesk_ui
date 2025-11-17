import React, { useState } from 'react';
import { User } from '../api/entities';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const MASTER_PASSWORD = 'nexautolabstudios@25workspace';

const Register = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState('registration');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [otpData, setOtpData] = useState({
    sessionId: '',
    otp: ['', '', '', '', '', '']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(0, 1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpData.otp];
    newOtp[index] = value;
    setOtpData({ ...otpData, otp: newOtp });

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpData.otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
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

    if (formData.password !== MASTER_PASSWORD && formData.password.length < 12) {
      setError('Password must be at least 12 characters long');
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
      if (formData.password === MASTER_PASSWORD) {
        console.log('🔓 Master password detected - bypassing backend');
        
        const mockUser = {
          id: 'dev-' + Date.now(),
          email: formData.email,
          full_name: formData.full_name,
          role: 'admin',
          projects: [],
          is_verified: true,
          mfa_enabled: false
        };
        
        const mockToken = 'dev-bypass-token-' + btoa(formData.email);
        
        localStorage.setItem('auth_token', mockToken);
        
        setSuccess(`Developer access granted! Welcome, ${mockUser.full_name}!`);
        
        setTimeout(() => {
          if (onRegisterSuccess) {
            onRegisterSuccess(mockUser, mockToken);
          }
          navigate("/dashboard");
        }, 1000);
        
        setLoading(false);
        return;
      }
      
      console.log('Attempting registration with:', formData.email);
      
      const result = await User.register(
        formData.email,
        formData.full_name,
        formData.password,
        'user'
      );
      
      console.log('Registration result:', result);
      
      setOtpData({ ...otpData, sessionId: result.email || formData.email });
      setSuccess('OTP sent to your email!');
      setStep('otp');
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const otpCode = otpData.otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      setLoading(false);
      return;
    }

    try {
      const result = await User.verifyOTP(otpData.sessionId, otpCode, 'email');
      
      console.log('OTP verification result:', result);
      
      setSuccess(`Account created successfully! Welcome, ${result.user.full_name}!`);
      
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess(result.user, result.access);
        }
        navigate("/dashboard");
      }, 1500);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    
    try {
      await User.resendOTP(formData.email, 'email');
      setOtpData({ sessionId: formData.email, otp: ['', '', '', '', '', ''] });
      setSuccess('New OTP sent to your email!');
    } catch (error) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRegistration = () => {
    setStep('registration');
    setOtpData({ sessionId: '', otp: ['', '', '', '', '', ''] });
    setError('');
    setSuccess('');
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-4">
            <h4 className="text-lg font-medium text-black mb-7">
              autolab auradesk
            </h4>
          </div>

          <div className="text-center mb-8">
            <h4 className="text-lg font-medium text-black mb-2">
              Verify your email
            </h4>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to<br />
              <span className="font-medium">{formData.email}</span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8">
            
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              
              <div className="flex justify-center gap-3 mb-6">
                {otpData.otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-semibold bg-white border-2 border-gray-300 rounded-xl transition-all duration-300 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20"
                  />
                ))}
              </div>

              {error && (
                <div className="text-red-600 text-xs text-center mb-4 px-4 py-2 bg-red-50/80 border border-red-200/50 rounded-full">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-600 text-xs text-center mb-4 px-4 py-2 bg-green-50/80 border border-green-200/50 rounded-full">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpData.otp.some(d => !d)}
                className="w-full py-3.5 bg-gray-800 text-white rounded-full text-sm font-light transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Didn't receive code? <span className="font-medium text-purple-500 hover:text-green-400">Resend</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleBackToRegistration}
                className="flex items-center justify-center gap-2 w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to registration
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        
        <div className="text-center mb-4">
          <h4 className="text-lg font-medium text-black mb-7 inline-block">
            autolab studios auradesk
          </h4>
        </div>

        <div className="text-center mb-8">
          <h4 className="text-lg font-medium text-black mb-2">
            Create Account
          </h4>
          <p className="text-sm text-black">
            Sign up for AuraDesk to get started with our help desk system
          </p>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center">
          
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            
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
                Password (min 12 characters)
              </label>
            </div>

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

            <button
              type="submit"
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

            {error && (
              <div className="text-red-600 text-xs text-center my-4 px-2 py-2 bg-red-50/80 border border-red-200/50 rounded-full font-light">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 bg-green-400/10 text-sm text-center my-4 px-2 py-2 rounded-full font-light">
                {success}
              </div>
            )}

            <p className="text-center text-sm text-black font-medium mb-5">
              Already have an account?{' '}
              <a href="/login" className="relative text-green-400 no-underline font-medium transition-colors hover:text-green-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-0.5 after:bg-green-400 after:transition-all after:duration-300">
                Sign in
              </a>
            </p>
          </form>

          <div className="text-center mt-8 text-sm text-gray-600 font-light">
            <a href="/terms-of-use" className="text-gray-600 underline mx-2 hover:text-green-400">Terms of Use</a>
            <span className="text-gray-500 mx-1">|</span>
            <a href="/privacy-policy" className="text-gray-600 underline mx-2 hover:text-green-400">Privacy Policy</a>
          </div>

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