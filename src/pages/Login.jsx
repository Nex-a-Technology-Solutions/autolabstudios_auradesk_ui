import React, { useState } from 'react';
import { User } from '../api/entities';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting login with:', formData.email);
      
      const result = await User.login(formData.email, formData.password);
      
      console.log('Login result:', result);
      
      if (result.requires_verification) {
        setOtpData({ ...otpData, sessionId: result.email || formData.email });
        setSuccess('OTP sent to your email!');
        setStep('otp');
      } else {
        setSuccess(`Welcome back, ${result.user.full_name}!`);
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(result.user, result.access);
          }
          navigate("/dashboard");
        }, 1000);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
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
      
      setSuccess(`Welcome back, ${result.user.full_name}!`);
      
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(result.user, result.access);
        }
        navigate("/dashboard");
      }, 1000);
      
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
      setOtpData({ ...otpData, otp: ['', '', '', '', '', ''] });
      setSuccess('New OTP sent to your email!');
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
                  'Verify & Sign in'
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
                onClick={handleBackToCredentials}
                className="flex items-center justify-center gap-2 w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
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
            autolab auradesk
          </h4>
        </div>

        <div className="text-center mb-8">
          <h4 className="text-lg font-medium text-black mb-2">
            Sign in
          </h4>
          <p className="text-sm text-black">
            Sign in to manage your automated workspace
          </p>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 flex flex-col items-center justify-center">
          
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            
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
                Username or Email
              </label>
            </div>

            <div className="relative mb-6">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder=" "
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-full text-xs text-gray-700 transition-all duration-300 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-400/20 peer box-border"
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs transition-all duration-300 pointer-events-none bg-gray-50 px-1 peer-focus:top-0 peer-focus:left-3 peer-focus:text-xs peer-focus:text-gray-600 peer-focus:font-light peer-focus:rounded-lg peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:font-light peer-[:not(:placeholder-shown)]:rounded-lg">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-800 text-white border-none rounded-full text-sm font-light cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/40 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
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
              Don't have an account?{' '}
              <a href="/register" className="relative text-purple-500 no-underline font-medium transition-colors hover:text-green-300 hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-0.5 after:bg-green-400 after:transition-all after:duration-300">
                Sign up
              </a>
            </p>

            <div className="flex items-center my-5 mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-4 text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          </form>

          <div className="flex flex-col items-center justify-center gap-4 w-full">
            
            <button
              onClick={() => handleSocialLogin('Google')}
              className="w-80 max-w-full text-black border-2 border-gray-300 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 flex items-start justify-start gap-2 no-underline px-6 py-3.5 hover:bg-gray-100 hover:border-gray-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285f4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34a853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fbbc05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ea4335"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleSocialLogin('Microsoft')}
              className="w-80 max-w-full text-black border-2 border-gray-300 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 flex items-start justify-start gap-2 no-underline px-6 py-3.5 hover:bg-gray-100 hover:border-gray-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                <rect x="13" y="1" width="10" height="10" fill="#7fba00"/>
                <rect x="1" y="13" width="10" height="10" fill="#00a4ef"/>
                <rect x="13" y="13" width="10" height="10" fill="#ffb900"/>
              </svg>
              Continue with Microsoft Account
            </button>
              
            <button
              onClick={() => handleSocialLogin('Apple')}
              className="w-80 max-w-full text-black border-2 border-gray-300 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 flex items-start justify-start gap-2 no-underline px-6 py-3.5 hover:bg-gray-100 hover:border-gray-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </button>

            <button
              onClick={() => handleSocialLogin('Phone')}
              className="w-80 max-w-full text-black border-2 border-gray-300 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 flex items-start justify-start gap-2 no-underline px-6 py-3.5 hover:bg-gray-100 hover:border-gray-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Continue with phone
            </button>
          </div>

          <div className="text-center mt-8 text-sm text-gray-600 font-light">
            <a href="/terms-of-use" className="text-gray-600 underline mx-2 hover:text-green-400">Terms of Use</a>
            <span className="text-gray-500 mx-1">|</span>
            <a href="/privacy-policy" className="text-gray-600 underline mx-2 hover:text-green-400">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;