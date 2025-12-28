import React, { useState, useEffect } from 'react';
import { createReview, getReviewsByProvider } from '../../services/dataService';
import { ProviderProfile, Listing, ListingType, UniversalLevel } from '../../types';
import ListingCard from '../ListingCard';
import { 
    ShieldCheck, MapPin, Instagram, Globe, Youtube,
    Star, Users, MessageCircle, CheckCircle, Award,
    ShoppingBag, Clock, Filter, X, ChevronDown, LayoutGrid, Calendar
} from 'lucide-react';

interface Props {
    profile: ProviderProfile;
    listings: Listing[];
}

const SchoolProfile: React.FC<Props> = ({ profile, listings }) => {
    const [activeTab, setActiveTab] = useState<'SHOP' | 'REVIEWS'>('SHOP');
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

    useEffect(() => {
        if (!profile?.id) return;

        setLoadingReviews(true);
        getReviewsByProvider(profile.id)
            .then((data) => setReviews(data.results ?? data))
            .catch((err) => console.error("Failed to load reviews", err))
            .finally(() => setLoadingReviews(false));
    }, [profile.id]);

    const totalReviews = reviews.length;
    const avgRating =
        totalReviews > 0
            ? (
                  reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
              ).toFixed(1)
            : null;

    // --- FILTER STATE ---
    const [filterSport, setFilterSport] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterDiff, setFilterDiff] = useState<string>('ALL');

    // --- AUTH (lightweight) ---
    // We avoid AuthContext here because this project doesn't have `context/AuthContext`.
    const storedUserRaw =
      localStorage.getItem("user") ||
      localStorage.getItem("authUser") ||
      localStorage.getItem("me");

    let storedRole: string | undefined;
    try {
      const parsed = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      storedRole = parsed?.role;
    } catch {
      storedRole = undefined;
    }

    const hasToken = Boolean(
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );

    const canLeaveReview = Boolean(hasToken);

    // --- REVIEW STATE ---
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    // --- REVIEW SUBMIT HANDLER ---
    const handleSubmitReview = async () => {
        try {
            setSubmitting(true);
            setError(null);

            await createReview({
                provider: profile.id,
                rating,
                comment,
            });

            setSuccess(true);
            getReviewsByProvider(profile.id).then((data) => setReviews(data.results ?? data));
            setComment('');
            setRating(5);
        } catch (err: any) {
            setError(err?.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    // Extract unique options for filters
    const uniqueSports = Array.from(new Set(profile.sports ?? [])).sort();
    const uniqueDiffs = Array.from(
      new Set(
        listings
          .map((l) => l.universalLevel)
          .filter((lvl): lvl is UniversalLevel => Boolean(lvl))
      )
    ) as UniversalLevel[];

    // --- FILTER LOGIC ---
    const filteredListings = (listings ?? [])
      .filter((l) => (profile.sports ?? []).includes(l.sport))
      .filter((l) => {
        const matchSport = filterSport === 'ALL' || l.sport === filterSport;
        const matchType = filterType === 'ALL' || l.type === filterType;
        const matchDiff = filterDiff === 'ALL' || l.universalLevel === filterDiff;
        return matchSport && matchType && matchDiff;
      });

    const clearFilters = () => {
        setFilterSport('ALL');
        setFilterType('ALL');
        setFilterDiff('ALL');
    };

    return (
        <div className="font-sans text-gray-900 bg-white min-h-screen">
            
            {/* 1. COVER HEADER */}
            <div className="relative h-64 md:h-96 w-full overflow-hidden">
                <img 
                    src={profile.cover_image || "https://images.unsplash.com/photo-1520116468816-95b69f847357?auto=format&fit=crop&w=2000&q=80"} 
                    className="w-full h-full object-cover" 
                    alt="Cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* 2. LEFT SIDEBAR (PROFILE CARD) */}
                    <div className="w-full lg:w-1/4 flex-shrink-0 relative -mt-24 z-10">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
                            {/* Identity */}
                            <div className="relative -mt-16 mb-4 text-center">
                                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                    <img 
                                        src={profile.profile_image || "https://api.dicebear.com/7.x/initials/svg?seed=School"} 
                                        className="w-full h-full object-cover" 
                                        alt={profile.company_name} 
                                    />
                                </div>
                            </div>
                            
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1 flex items-center justify-center gap-2">
                                    {profile.company_name || profile.name || "School"}
                                </h1>
                                <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {profile.city_name || profile.city || profile.address || "Location not specified"}
                                    {profile.country_name ? `, ${profile.country_name}` : ""}
                                </div>
                            </div>

                            {/* About */}

                            {/* About */}
                            <div className="mb-6">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">About Us</h3>
                                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                                    {profile.bio || "This provider has not added a description yet."}
                                </p>
                            </div>

                            {avgRating && (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        <span className="text-lg font-black text-gray-900">
                                            {avgRating}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            )}

                            {/* Links */}
                            <div className="flex gap-4 justify-center pt-4 border-t border-gray-100">
                                <a href="#" className="text-gray-400 hover:text-brand-600"><Globe className="w-5 h-5"/></a>
                                <a href="#" className="text-gray-400 hover:text-pink-600"><Instagram className="w-5 h-5"/></a>
                                <a href="#" className="text-gray-400 hover:text-red-600"><Youtube className="w-5 h-5"/></a>
                            </div>
                        </div>
                    </div>

                    {/* 3. MAIN CONTENT AREA */}
                    <div className="w-full lg:w-3/4 pt-8">
                        
                        {/* Main Tabs */}
                        <div className="bg-white border-b border-gray-200 mb-8 sticky top-20 z-20">
                            <div className="flex items-center overflow-x-auto scrollbar-hide">
                                <button onClick={() => setActiveTab('SHOP')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === 'SHOP' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>Offers & Booking</button>
                                <button onClick={() => setActiveTab('REVIEWS')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === 'REVIEWS' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>Reviews</button>
                            </div>
                        </div>

                        {/* === SHOP VIEW (Booking) === */}
                        {activeTab === 'SHOP' && (
                            <div className="animate-in fade-in duration-300">
                                
                                {/* SMART PILL FILTERS (The Expert Solution) */}
                                <div className="mb-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <h3 className="font-black text-gray-900 uppercase text-xl tracking-tight">Explore Activities</h3>
                                        
                                        {/* Secondary Dropdowns (Type & Level) */}
                                        <div className="flex gap-3">
                                            <div className="relative">
                                                <select 
                                                    value={filterType}
                                                    onChange={(e) => setFilterType(e.target.value)}
                                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-full leading-tight focus:outline-none focus:border-brand-500 text-xs font-bold uppercase shadow-sm"
                                                >
                                                    <option value="ALL">All Types</option>
                                                    <option value={ListingType.SESSION}>Sessions</option>
                                                    <option value={ListingType.COURSE}>Courses</option>
                                                    <option value={ListingType.EXPERIENCE}>Experiences</option>
                                                    <option value={ListingType.RENT}>Rentals</option>
                                                    <option value={ListingType.TRIP}>Trips</option>
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horizontal Scrollable Pills */}
                                    <div className="flex overflow-x-auto pb-4 gap-3 scrollbar-hide">
                                        <button 
                                            onClick={() => setFilterSport('ALL')}
                                            className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all shadow-sm border ${
                                                filterSport === 'ALL' 
                                                ? 'bg-brand-600 text-white border-brand-600' 
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            All Sports
                                        </button>
                                        {(profile.sports ?? []).map((sport) => (
                                            <button 
                                                key={sport}
                                                onClick={() => setFilterSport(sport)}
                                                className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all shadow-sm border ${
                                                    filterSport === sport 
                                                    ? 'bg-brand-600 text-white border-brand-600' 
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {sport}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* LISTINGS GRID */}
                                <div className="mb-12">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            {filteredListings.length} {filterSport !== 'ALL' ? filterSport : ''} Options Available
                                        </span>
                                        {(filterSport !== 'ALL' || filterType !== 'ALL' || filterDiff !== 'ALL') && (
                                            <button onClick={clearFilters} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center">
                                                <X className="w-3 h-3 mr-1"/> Clear All Filters
                                            </button>
                                        )}
                                    </div>

                                    {filteredListings.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                            {filteredListings.map(l => <ListingCard key={l.id} listing={l} />)}
                                        </div>
                                    ) : (
                                        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-xl">
                                            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-gray-900">No matches found</h3>
                                            <p className="text-gray-500 text-sm mt-1">Try selecting a different sport or clearing filters.</p>
                                            <button onClick={clearFilters} className="mt-4 text-brand-600 font-bold text-sm hover:underline">View All</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* === REVIEWS === */}
                        {activeTab === 'REVIEWS' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="mb-8 flex items-center gap-6">
                                    {avgRating && (
                                        <div className="flex items-center gap-2">
                                            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                            <span className="text-2xl font-black text-gray-900">
                                                {avgRating}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                ({totalReviews} reviews)
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* === LEAVE A REVIEW === */}
                                {canLeaveReview && (
                                  <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10">
                                    <h3 className="font-black text-gray-900 mb-4 uppercase">Leave a Review</h3>

                                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                                    {success && <p className="text-green-600 text-sm mb-3">Review submitted successfully!</p>}

                                    <div className="flex gap-1 mb-4">
                                      {[1,2,3,4,5].map(star => (
                                        <Star
                                          key={star}
                                          className={`w-6 h-6 cursor-pointer ${
                                            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                          }`}
                                          onClick={() => setRating(star)}
                                        />
                                      ))}
                                    </div>

                                    <textarea
                                      value={comment}
                                      onChange={(e) => setComment(e.target.value)}
                                      placeholder="Share your experience..."
                                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
                                      rows={4}
                                    />

                                    <button
                                      disabled={submitting}
                                      onClick={handleSubmitReview}
                                      className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50"
                                    >
                                      {submitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((review, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-lg">
                                                    {review.reviewer_email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">
                                                        {review.reviewer_email}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${
                                                            i < review.rating
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>

                                            <p className="text-gray-600 text-sm">
                                                {review.comment}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}



                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolProfile;