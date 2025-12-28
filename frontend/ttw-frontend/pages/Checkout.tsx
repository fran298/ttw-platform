import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getListingById, createBooking } from '../services/dataService';
import { Listing } from '../types';
import { Lock, CheckCircle } from 'lucide-react';

const Checkout: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const listingId = params.get('listingId');
  const date = params.get('date');
  const guests = Number(params.get('guests')) || 1;
  const size = params.get('size');

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if(listingId) {
        const data = await getListingById(listingId);
        setListing(data || null);
      }
      setLoading(false);
    };
    fetch();
  }, [listingId]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if(!listing) return;
    
    setProcessing(true);

    const token = localStorage.getItem("access");

    // If user is not logged in, redirect to login with return URL
    if (!token) {
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?redirect=${redirectUrl}`);
        setProcessing(false);
        return;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-session/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
            listing_id: listing.id,
            date: date,
            guests: guests,
            size: size,
            first_name: firstName,
            last_name: lastName,
            email: userEmail
        })
    });

    if (!response.ok) {
        console.error("Payment session failed:", await response.text());
        setProcessing(false);
        return;
    }

    const data = await response.json();

    setProcessing(false);

    // Redirect user to Stripe Checkout
    if (data.url) {
        window.location.href = data.url;
    } else {
        console.error("Stripe session creation failed:", data);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (completed) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h2>
                  <p className="text-gray-600 mb-6">Your adventure is secured. Check your email for the receipt and instructor details.</p>
                  <button onClick={() => navigate('/dashboard')} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-colors">
                      Go to My Trips
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Order Summary */}
        <div className="lg:order-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="text-lg font-black text-gray-900 mb-4 uppercase">Order Summary</h3>
                {listing && (
                    <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                        <img src={listing.images[0]} alt="Listing" className="w-20 h-20 rounded-lg object-cover" />
                        <div>
                            <p className="font-bold text-gray-900 line-clamp-2">{listing.title}</p>
                            <p className="text-sm text-gray-500 mt-1">{listing.type}</p>
                            <div className="flex items-center text-xs text-brand-600 font-bold mt-1">
                                4.9 (120 reviews)
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                        <span>Date</span>
                        <span className="font-medium text-gray-900">{date || 'Select date'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Guests</span>
                        <span className="font-medium text-gray-900">{guests}</span>
                    </div>
                    {size && (
                        <div className="flex justify-between">
                            <span>Size</span>
                            <span className="font-medium text-gray-900">{size}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Price per person</span>
                        <span>{listing?.currency} {listing?.price}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-lg">Total</span>
                        <span className="font-bold text-gray-900 text-lg">
                            {listing?.currency} {listing ? Math.round(listing.price * guests * 1.1) : 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Checkout Form */}
        <div className="lg:order-1">
            <div className="flex items-center mb-8">
                 <Lock className="w-5 h-5 text-green-600 mr-2" />
                 <h1 className="text-2xl font-black text-gray-900 uppercase">Secure Checkout</h1>
            </div>

            <form onSubmit={handlePayment} className="space-y-8">
                
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name</label>
                            <input type="text" className="w-full border-gray-300 rounded-lg text-sm p-3" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name</label>
                            <input type="text" className="w-full border-gray-300 rounded-lg text-sm p-3" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                            <input type="email" className="w-full border-gray-300 rounded-lg text-sm p-3" placeholder="john@example.com" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">Payment</h3>
                    <p className="text-sm text-gray-600">
                        You will be redirected to Stripe to complete your secure payment.
                    </p>
                </div>

                <button 
                    type="submit" 
                    disabled={processing}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {processing ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        `Confirm & Pay ${listing?.currency} ${listing ? Math.round(listing.price * guests * 1.1) : 0}`
                    )}
                </button>

            </form>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
