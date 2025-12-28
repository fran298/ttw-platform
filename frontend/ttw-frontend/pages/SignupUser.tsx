import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, KeyRound } from 'lucide-react';
import { registerUser, verifyEmail } from '../services/dataService';

const SignupUser: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect');
  const [step, setStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Step 1: Send Email
          await registerUser(email, password, 'USER', firstName, lastName);
          setLoading(false);
          setStep('CODE');
      } catch (e) {
          setLoading(false);
          alert("Signup failed. Email might be taken.");
      }
  };

  const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Step 2: Verify Code
          await verifyEmail(email, code);
          setLoading(false);
          navigate(redirect ? decodeURIComponent(redirect) : '/');
      } catch (e) {
          setLoading(false);
          alert("Invalid code. Please try again.");
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <Link to="/" className="mb-8 block hover:scale-105 transition-transform duration-300">
            <img 
                src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763998121/The-Travel-Wild-_Logo-fondo-transparente_tvxme0.png" 
                alt="The Travel Wild" 
                className="h-32 w-auto object-contain"
            />
        </Link>

        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {step === 'EMAIL' ? 'Create your account' : 'Verify Email'}
            </h2>

            {step === 'EMAIL' ? (
                <>
                    <div className="space-y-3 mb-6">
                        <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-3" alt="Google" />
                            Continue with Google
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First name</label>
                          <input
                            type="text"
                            className="w-full border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2.5"
                            placeholder="John"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last name</label>
                          <input
                            type="text"
                            className="w-full border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2.5"
                            placeholder="Doe"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            required
                          />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input 
                                    type="email" 
                                    className="w-full pl-10 border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2.5" 
                                    placeholder="you@example.com" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                            <input 
                                type="password" 
                                className="w-full border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2.5" 
                                placeholder="Create a strong password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button 
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors"
                        >
                            {loading ? 'Sending Code...' : 'Send Verification Code'}
                        </button>
                    </form>
                </>
            ) : (
                <form onSubmit={handleVerify} className="space-y-4 animate-in fade-in">
                    <p className="text-sm text-gray-600 text-center mb-4">
                        We sent a 6-digit code to <strong>{email}</strong>. <br/>Please enter it below.
                    </p>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Verification Code</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <KeyRound className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                className="w-full pl-10 border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2.5 font-mono text-lg tracking-widest" 
                                placeholder="123456" 
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                maxLength={6}
                                required
                            />
                        </div>
                    </div>
                    
                    <button 
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setStep('EMAIL')}
                        className="w-full text-sm text-gray-500 hover:underline mt-2"
                    >
                        Back to Email
                    </button>
                </form>
            )}

            <p className="mt-6 text-center text-xs text-gray-500">
                By clicking "Create Account", you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
            </p>
        </div>
    </div>
  );
};

export default SignupUser;