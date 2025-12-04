import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Invitations } from '../api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, User, Shield, Calendar, CheckCircle } from "lucide-react";

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Page state
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Multi-step flow: 'create' | 'verify' | 'success'
  const [step, setStep] = useState('create');
  
  // Step 1: Create account
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Step 2: OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);

  useEffect(() => {
    loadInvitationDetails();
  }, [token]);

  const loadInvitationDetails = async () => {
    try {
      setLoading(true);
      
      if (!token || token === 'undefined') {
        throw new Error('No valid invitation token found in URL');
      }
      
      console.log('Loading invitation with token:', token);
      const invitationData = await Invitations.getByToken(token);
      setInvitation(invitationData);
      setUserEmail(invitationData.email);
      console.log('Invitation loaded:', invitationData);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError(err.message || 'Invalid or expired invitation link');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const response = await Invitations.accept(
        token, 
        formData.password, 
        formData.confirmPassword
      );
      
      console.log('Account creation response:', response);
      
      if (response.requires_verification) {
        // Move to OTP verification step
        setStep('verify');
        setUserEmail(response.email);
      } else {
        // Old flow - direct success (shouldn't happen with new backend)
        setStep('success');
        setTimeout(() => navigate('/login'), 3000);
      }
      
    } catch (err) {
      console.error('Error creating account:', err);
      setFormError(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      setFormError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setFormError('');

    try {
      const response = await Invitations.verifyOTP(userEmail, otpCode);
      
      console.log('OTP verification response:', response);

      if (response.success) {
        // Success - show success message
        setStep('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        throw new Error(response.error || 'Verification failed');
      }
      
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setFormError(err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setFormError('');

    try {
      const response = await Invitations.resendOTP(userEmail);
      
      if (response.success) {
        // Show success message
        alert('Verification code resent! Please check your email.');
      } else {
        throw new Error(response.error || 'Failed to resend code');
      }
      
    } catch (err) {
      console.error('Error resending OTP:', err);
      setFormError(err.message || 'Failed to resend code');
    } finally {
      setResendingOtp(false);
    }
  };

  // ========================================================================
  // RENDER: Loading State
  // ========================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Error State
  // ========================================================================
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/login')} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Success State
  // ========================================================================
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-4">
                Your account has been verified successfully. You can now log in with your email and password.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login page in 3 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Step 2 - OTP Verification
  // ========================================================================
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 text-sm">
                We've sent a 6-digit verification code to:
              </p>
              <p className="font-medium text-gray-900 mt-1">{userEmail}</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otpCode">Verification Code</Label>
                <Input
                  id="otpCode"
                  name="otpCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (formError) setFormError('');
                  }}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              {formError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {formError}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full"
                style={{ background: 'linear-gradient(to right, #db2777, #e11d48)' }}
                disabled={verifying || otpCode.length !== 6}
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  {resendingOtp ? 'Sending...' : "Didn't receive code? Resend"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // RENDER: Step 1 - Create Account
  // ========================================================================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Registration</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Invitation Details */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-900 mb-2">
              You've been invited by {invitation.invited_by}
            </h3>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Name: {invitation.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Email: {invitation.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Role: {invitation.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Expires: {new Date(invitation.expires_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {formError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full py-2.5 rounded-xl font-normal text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(to right, #db2777, #e11d48)',
                opacity: submitting ? 0.9 : 1
              }}
              disabled={submitting || !formData.password || !formData.confirmPassword}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            By creating an account, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}