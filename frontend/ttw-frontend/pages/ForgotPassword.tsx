import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { requestPasswordReset } from '../services/authService.ts';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email);
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError('Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login
        </Link>

        <h1 className="text-2xl font-black text-gray-900 mb-2">
          Forgot your password?
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Enter your email and we’ll send you a reset code.
        </p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            Check your email. We’ve sent you a code to reset your password.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send reset code'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;