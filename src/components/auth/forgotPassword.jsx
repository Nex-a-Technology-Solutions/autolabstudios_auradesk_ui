import React, { useState, useEffect } from 'react';
import { User } from '../../api/entities.js';
import { ArrowLeft, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState('email'); // email, otp, newPassword
  const [formData, setFormData] = useState({
    email: '',
    tempToken: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [otpData, setOtpData] = useState({
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
    setOtpData({ otp: newOtp });

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

  // Step 1: Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Requesting password reset for:', formData.email);
      
      await User.requestPasswordReset(formData.email);
      
      setSuccess('Password reset code sent to your email!');
      setStep('otp');
      
    } catch (error) {
      console.error('Password reset request error:', error);
      setError(error.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
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
      console.log('Verifying OTP:', otpCode);
      
      const result = await User.verifyPasswordResetOTP(formData.email, otpCode);
      
      console.log('OTP verification result:', result);
      
      if (result.access) {
        setFormData({ ...formData, tempToken: result.access });
        setSuccess('Code verified! Now set your new password.');
        setStep('newPassword');
      } else {
        setError('Verification failed. Please try again.');
      }
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Setting new password...');
      
      await User.confirmPasswordReset(
        formData.tempToken,
        formData.newPassword,
        formData.confirmPassword
      );
      
      setSuccess('Password updated successfully! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    
    try {
      await User.resendOTP(formData.email, 'recovery');
      setOtpData({ otp: ['', '', '', '', '', ''] });
      setSuccess('New code sent to your email!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtpData({ otp: ['', '', '', '', '', ''] });
    } else if (step === 'newPassword') {
      setStep('otp');
      setFormData({ ...formData, newPassword: '', confirmPassword: '' });
    }
    setError('');
    setSuccess('');
  };

  // Step 1: Email Input
  if (step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10" style={{ background: '#e6e8ef', fontFamily: 'Inter, system-ui' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-gray-500 text-sm mb-8 hover:text-gray-700 transition-all hover:gap-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #db2777, #e11d48)' }}>
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center">Forgot Password?</h1>
            <p className="text-sm text-gray-600 mb-8 text-center px-4">
              Enter your email address and we'll send you<br />
              a code to reset your password.
            </p>

            <form onSubmit={handleRequestReset}>
              <label className="block text-sm text-black mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition mb-6"
              />

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
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>

            {/* Security badge */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure password reset
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: OTP Verification
  if (step === 'otp') {
    const isOtpComplete = otpData.otp.every(digit => digit !== '');

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10" style={{ background: '#e6e8ef', fontFamily: 'Inter, system-ui' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 text-sm mb-8 hover:text-gray-700 transition-all hover:gap-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #db2777, #e11d48)' }}>
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center">Enter Verification Code</h1>
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
                  'Verify Code'
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

  // Step 3: New Password
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10" style={{ background: '#e6e8ef', fontFamily: 'Inter, system-ui' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-500 text-sm mb-8 hover:text-gray-700 transition-all hover:gap-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #db2777, #e11d48)' }}>
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center">Set New Password</h1>
          <p className="text-sm text-gray-600 mb-8 text-center px-4">
            Enter your new password below
          </p>

          <form onSubmit={handleSetNewPassword}>
            <label className="block text-sm text-black mb-1.5">New password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              placeholder="min 8 chars"
              minLength={8}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition mb-4"
            />

            <label className="block text-sm text-black mb-1.5">Confirm password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition mb-6"
            />

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
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          {/* Security badge */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure password reset
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;