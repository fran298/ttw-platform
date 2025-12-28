import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { confirmPasswordReset } from '../services/authService';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const emailFromQuery = params.get('email') || '';

  const [email] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Reset code is required');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await confirmPasswordReset(email, code, password);
      navigate('/login');
    } catch (err) {
      setError('Invalid or expired reset code');
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
          Reset your password
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Enter the code you received and choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Reset code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 text-sm"
              placeholder="123456"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              New password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-2 text-sm"
              placeholder="••••••••"
              required
            />
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
              'Reset password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;