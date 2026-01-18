'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from './Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'sign-in' | 'sign-up';
  redirectAfterSignup?: string; // URL to redirect to after successful signup
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'sign-in',
  redirectAfterSignup,
}: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(defaultMode);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const toast = useToast();

  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setCode('');
      setError(null);
      setPendingVerification(false);
    }
  }, [isOpen]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!signInLoaded || !signUpLoaded) {
      setLoading(false);
      return;
    }

    try {
      if (mode === 'sign-in') {
        // Start sign-in flow with email code
        const result = await signIn.create({
          identifier: email,
        });

        // Get the email address ID from the supported first factors
        const emailFactor = result.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );

        if (emailFactor && 'emailAddressId' in emailFactor) {
          // Prepare email code verification
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
        }

        setPendingVerification(true);
        toast.info('Check your email for a verification code');
      } else {
        // Sign up - create account and send verification code
        const _result = await signUp.create({
          emailAddress: email,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        });

        // Prepare email code verification
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });

        setPendingVerification(true);
        toast.info('Check your email for a verification code');
      }
    } catch (err: any) {
      const errorMessage =
        err?.errors?.[0]?.message || err?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'sign-in') {
        if (!signInLoaded) {
          setLoading(false);
          return;
        }

        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          toast.success('Welcome back!');
          onClose();
        } else {
          setError('Verification failed. Please try again.');
        }
      } else {
        if (!signUpLoaded) {
          setLoading(false);
          return;
        }

        const result = await signUp.attemptEmailAddressVerification({
          code,
        });

        if (result.status === 'complete') {
          // Update user with firstName and lastName if provided
          if (firstName.trim() || lastName.trim()) {
            try {
              await signUp.update({
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
              });
            } catch (err) {
              // Non-critical error, continue with signup
              console.warn('Failed to update user name:', err);
            }
          }

          if (setActive) {
            await setActive({ session: result.createdSessionId });
          }
          toast.success('Account created! Welcome!');
          onClose();
          // Redirect to specified URL or default to create-group
          if (redirectAfterSignup) {
            router.push(redirectAfterSignup);
          } else {
            router.push('/create-group');
          }
        } else {
          setError('Invalid verification code. Please try again.');
        }
      }
    } catch (err: any) {
      const errorMessage =
        err?.errors?.[0]?.message || err?.message || 'Verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#02182c]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#fcfcfa] rounded-2xl shadow-2xl border-2 border-[#02182c]/10 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#02182c] transition-colors"
          aria-label="Close"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Let's Vamos" width={120} height={60} priority />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-[#02182c] mb-2">
              {pendingVerification
                ? 'Verify Your Email'
                : mode === 'sign-in'
                  ? 'Welcome Back'
                  : 'Get Started'}
            </h2>
            <p className="text-gray-600">
              {pendingVerification
                ? 'Enter the code we sent to your email'
                : mode === 'sign-in'
                  ? 'Sign in to continue to your training groups'
                  : 'Create your account to start training together'}
            </p>
          </div>

          {/* Form */}
          {!pendingVerification ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#02182c] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2888fb] transition-colors bg-white text-[#02182c] placeholder-gray-400"
                  placeholder="you@example.com"
                />
                <p className="mt-2 text-xs text-gray-500">
                  We'll send you a verification code to sign {mode === 'sign-in' ? 'in' : 'up'}
                </p>
              </div>

              {/* First Name and Last Name - only for sign-up */}
              {mode === 'sign-up' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-semibold text-[#02182c] mb-2"
                    >
                      First Name <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2888fb] transition-colors bg-white text-[#02182c] placeholder-gray-400"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-semibold text-[#02182c] mb-2"
                    >
                      Last Name <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2888fb] transition-colors bg-white text-[#02182c] placeholder-gray-400"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !signInLoaded || !signUpLoaded}
                className="w-full bg-[#02182c] text-[#fcfcfa] py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-[#010f1a] hover:scale-[1.02] active:scale-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending code...' : mode === 'sign-in' ? 'Send Code' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-[#02182c] mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#2888fb] transition-colors bg-white text-[#02182c] text-center text-2xl font-mono tracking-widest placeholder-gray-400"
                  placeholder="000000"
                />
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Code sent to <span className="font-semibold">{email}</span>
                  <br />
                  Didn't receive a code?{' '}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (mode === 'sign-in' && signIn) {
                          // Get the email address ID from supported first factors
                          const emailFactor = signIn.supportedFirstFactors?.find(
                            (factor) => factor.strategy === 'email_code'
                          );
                          if (emailFactor && 'emailAddressId' in emailFactor) {
                            await signIn.prepareFirstFactor({
                              strategy: 'email_code',
                              emailAddressId: emailFactor.emailAddressId,
                            });
                          }
                        } else if (mode === 'sign-up' && signUp) {
                          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                        }
                        toast.info('Verification code resent!');
                      } catch (_err) {
                        toast.error('Failed to resend code');
                      }
                    }}
                    className="text-[#2888fb] hover:text-[#1e6fd9] font-semibold"
                  >
                    Resend
                  </button>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPendingVerification(false);
                    setCode('');
                    setError(null);
                  }}
                  className="flex-1 bg-gray-100 text-[#02182c] py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 bg-[#02182c] text-[#fcfcfa] py-3 rounded-xl font-bold shadow-lg hover:bg-[#010f1a] hover:scale-[1.02] active:scale-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {/* Toggle Mode */}
          {!pendingVerification && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {mode === 'sign-in' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
                    setError(null);
                  }}
                  className="text-[#2888fb] hover:text-[#1e6fd9] font-semibold"
                >
                  {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
