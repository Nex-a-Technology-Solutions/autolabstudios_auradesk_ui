import React, { useState, useEffect } from 'react';
import { User } from '../api/entities';
import { Eye, EyeOff, ArrowLeft, Mail, Phone, Chrome, Smartphone, Loader2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  console.log('Current auth_token:', localStorage.getItem('auth_token'));
  console.log('Current refresh_token:', localStorage.getItem('refresh_token'));
  
  const [step, setStep] = useState('credentials');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [otpData, setOtpData] = useState({
    sessionId: '',
    otp: ['', '', '', '', '', '']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  // Auto-submit OTP when all 6 digits are entered
  useEffect(() => {
    const otpCode = otpData.otp.join('');
    if (otpCode.length === 6 && step === 'otp' && !loading) {
      handleVerifyOtp(new Event('submit'));
    }
  }, [otpData.otp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await User.login(formData.email, formData.password);
      
      if (result.requires_otp) {
        setOtpData({ ...otpData, sessionId: result.email || formData.email });
        setSuccess('OTP sent to your email! Please check your inbox.');
        setStep('otp');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      
      if (result.access && result.user) {
        setSuccess(`Welcome back, ${result.user.full_name}!`);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(result.user, result.access);
          }
          window.location.href = "/dashboard"; // Full page reload
        }, 1000);
      } else {
        setError('Login verification failed. Please try again.');
      }
    } catch (error) {
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
      setOtpData({ ...otpData, otp: ['', '', '', '', '', ''] });
      setSuccess('New OTP sent to your email!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtpData({ sessionId: '', otp: ['', '', '', '', '', ''] });
    setError('');
    setSuccess('');
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login clicked`);
  };

  // OTP Step - Enhanced Design
  // OTP Step - Enhanced Design
  if (step === 'otp') {
    const isOtpComplete = otpData.otp.every(digit => digit !== '');

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10" style={{ background: '#e6e8ef', fontFamily: 'Inter, system-ui' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
            <button
              onClick={handleBackToCredentials}
              className="flex items-center gap-2 text-gray-500 text-sm mb-8 hover:text-gray-700 transition-all hover:gap-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #db2777, #e11d48)' }}>
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center">Verify Your Email</h1>
            <p className="text-sm text-gray-600 mb-8 text-center px-4">
              Enter the 6-digit code we sent to<br />
              <strong className="text-gray-900">{formData.email}</strong>
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="flex justify-center gap-2 sm:gap-3 mb-6">
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
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold bg-gray-50 border rounded-xl focus:outline-none transition-all ${
                      digit 
                        ? 'border-pink-500 bg-pink-50' 
                        : 'border-gray-300 focus:border-pink-500'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-600 text-xs">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isOtpComplete}
                className="w-full py-2.5 rounded-xl font-normal text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                style={{ 
                  background: 'linear-gradient(to right, #db2777, #e11d48)',
                  opacity: loading ? 0.9 : 1
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <div className="text-center mt-5">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Didn't receive the code?{' '}
                  <span className="font-semibold" style={{ color: '#db2777' }}>
                    Resend OTP
                  </span>
                </button>
              </div>
            </form>

            {/* Security badge */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure verification
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Login - Enterprise Grade Responsive Design
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10" style={{ background: '#e6e8ef', fontFamily: 'Inter, system-ui' }}>
      <div className="w-full max-w-7xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ minHeight: '600px' }}>
          <div className="grid lg:grid-cols-2 gap-0">
            
            {/* Left Form Section - Centered Content */}
            <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
              <div className="w-full max-w-md">
                {/* Logo */}
                <div className="w-5 h-5 rounded-lg mb-4" style={{ background: 'black' }} />
                
                <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 mb-2">Get Started Now</h1>
                <p className="text-sm text-gray-600 mb-8">Enter your credentials to access your account</p>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => handleSocialLogin('Google')}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl font-normal text-sm hover:bg-gray-50 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285f4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34a853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fbbc05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ea4335"/>
                    </svg>
                    <span className="hidden sm:inline">Log in with Google</span>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('Apple')}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl font-normal text-sm hover:bg-gray-50 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <span className="hidden sm:inline">Log in with Apple</span> 
                  </button>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <label className="block text-sm text-black mb-1.5">Email address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition mb-4"
                  />

                  <label className="block text-sm text-black mb-1.5">Password</label>
                  <div className="relative mb-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="min 8 chars"
                      className="w-full px-3.5 py-2.5 pr-12 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    />
                    {formData.password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  
                  <div className="text-right mb-4">
                    <a href="/forgot-password" className="text-sm hover:underline" style={{ color: 'black' }}>
                      Forgot password?
                    </a>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      id="terms" 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                      I agree to the <a href="/terms" className="underline" style={{ color: 'black' }}>Terms & Privacy</a>
                    </label>
                  </div>

                  {error && (
                    <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-600 text-xs">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-normal text-sm text-white disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(to right, #db2777, #e11d48)',
                      opacity: loading ? 0.9 : 1
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                  <div className="text-xs text-gray-500 mt-5 text-center">
                    Don't have an account? <a href="/register" className="font-medium" style={{ color: 'black' }}>Sign up</a>
                  </div>
                </form>

                <div className="absolute bottom-6 left-8 text-xs text-gray-400 hidden lg:block">
                  2025 Autolabstudios, All rights Reserved
                </div>
              </div>
            </div>

            {/* Right Purple Modal Section - Hidden on mobile, modal on desktop */}
            <div className="hidden lg:flex items-center justify-center p-8 relative">
              <div className="absolute inset-8 text-white p-10 flex flex-col justify-center items-center rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(to right, #db2777, #e11d48)' }}>
                <div className="w-full max-w-sm">
                  <h2 className="text-2xl font-bold mb-2">The simplest way to manage your workforce</h2>
                  <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Enter your credentials to access your account
                  </p>

                  {/* Dashboard Preview */}
                  <div className="bg-white bg-opacity-95 rounded-xl p-4 shadow-xl">
                    <div className="w-full h-56 rounded-lg flex items-center justify-center text-sm font-medium" style={{ background: 'white' }}>
                      Dashboard Preview
                    </div>
                  </div>

                  <div className="flex gap-6 items-center justify-center mt-8">
                    <div className="text-white text-opacity-75 text-xs font-medium">Trusted by leading companies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile copyright */}
          <div className="lg:hidden text-center text-xs text-gray-400 pb-6">
            2025 Autolabstudios, All rights Reserved
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;