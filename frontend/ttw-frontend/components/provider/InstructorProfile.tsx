import React, { useState, useEffect } from 'react';
import { createReview, getReviewsByInstructor } from '../../services/dataService';
import { Link } from 'react-router-dom';
import { InstructorProfile as InstructorProfileType, Listing, ListingType } from '../../types';
import { 
    ShieldCheck, MapPin, Instagram, 
    Star, Clock, Calendar, Languages, Globe, Filter, X, ChevronDown
} from 'lucide-react';
import ListingCard from '../ListingCard';

interface Props {
    profile: InstructorProfileType;
    listings: Listing[];
}

const InstructorProfile: React.FC<Props> = ({ profile, listings }) => {
    // const navigate = useNavigate();

    // Helper to safely render location object or string
    const renderLocation = () => {
        if (!profile.location) return "";
        if (typeof profile.location === 'string') return profile.location;
        if (profile.location?.city && profile.location?.country) {
            return `${profile.location.city}, ${profile.location.country}`;
        }
        return profile.location?.country || "";
    };

    const resolveImageUrl = (img: any): string | null => {
        if (!img) return null;
        if (typeof img === "string") return img;
        if (img.secure_url) return img.secure_url;
        if (img.url) return img.url;
        return null;
    };

    // Helper for Cover Image
    const coverImage = profile.cover_image
        ? profile.cover_image
        : "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=2000&q=80";

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => {
        if (!profile?.id) return;

        setLoadingReviews(true);
        getReviewsByInstructor(profile.id)
            .then((data) => {
                setReviews(data.results ?? data);
            })
            .catch(() => {
                setReviews([]);
            })
            .finally(() => {
                setLoadingReviews(false);
            });
    }, [profile.id]);

    // Derived review values (single source of truth)
    const totalReviews = reviews.length;
    const avgRating =
        totalReviews > 0
            ? (
                  reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
              ).toFixed(1)
            : null;
    // --- FILTER STATE (match SchoolProfile) ---
    const [filterSport, setFilterSport] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');

    const filteredListings = listings.filter((l) => {
      const matchSport = filterSport === 'ALL' || l.sport === filterSport;
      const matchType = filterType === 'ALL' || l.type === filterType;
      return matchSport && matchType;
    });

    const clearFilters = () => {
      setFilterSport('ALL');
      setFilterType('ALL');
    };

    const handleSubmitReview = async () => {
        try {
            setSubmitting(true);
            setSubmitError(null);

            await createReview({
                instructor: profile.id,
                rating,
                comment,
            });

            // SUCCESS
            setShowReviewForm(false);
            setRating(5);
            setComment("");

            // comportamiento simple (igual que school)
            window.location.reload();

        } catch (err: any) {
            setSubmitError(
                err?.message || "Unable to submit review"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="font-sans text-gray-900 bg-gray-50 min-h-screen pb-20">
            
            {/* 1. HERO & INTRO */}
            <div className="bg-white border-b border-gray-200">
                <div className="relative h-72 bg-gray-900">
                    <img 
                        src={coverImage} 
                        className="w-full h-full object-cover opacity-80" 
                        alt="Cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row gap-8">
                        
                        {/* Avatar - Moves up to overlap cover */}
                        <div className="relative -mt-24 flex-shrink-0 z-10">
                            <img 
                                src={
                                    resolveImageUrl(profile.profile_image) ||
                                    resolveImageUrl(profile.user?.avatar) ||
                                    `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`
                                }
                                className="w-48 h-48 rounded-2xl border-4 border-white shadow-2xl bg-white object-cover" 
                                alt={profile.name} 
                            />
                            {profile.isVerified && (
                                <div className="absolute -bottom-3 -right-3 bg-brand-600 text-white p-2 rounded-xl border-4 border-white shadow-sm" title="Verified Pro">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 pt-4 md:pt-6">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-4xl font-black text-gray-900">
                                            {profile.name}
                                        </h1>
                                        {profile.type === 'FREELANCER' && (
                                            <span className="bg-orange-100 text-orange-800 text-xs font-black px-2 py-1 rounded uppercase tracking-wider border border-orange-200">
                                                Freelance Pro
                                            </span>
                                        )}
                                        {profile.type === 'SCHOOL' && (
                                            <span className="bg-blue-100 text-blue-800 text-xs font-black px-2 py-1 rounded uppercase tracking-wider border border-blue-200">
                                                Certified School
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-sm font-bold text-gray-600 mb-4">
                                        {renderLocation() && (
                                            <span className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-1 text-brand-500" /> 
                                                {renderLocation()}
                                            </span>
                                        )}
                                        {profile.languages && profile.languages.length > 0 && (
                                          <span className="flex items-center">
                                            <Languages className="w-4 h-4 mr-1 text-brand-500" />
                                            {profile.languages.join(', ')}
                                          </span>
                                        )}
                                    </div>
                                    
                                    {/* BIO from Database */}
                                    <p className="text-lg text-gray-500 font-medium max-w-2xl leading-relaxed whitespace-pre-wrap">
                                        {profile.bio}
                                    </p>
                                </div>
                                
                                <div className="flex gap-3 flex-shrink-0 mt-2 md:mt-0">
                                    {/* Social Links (Only show if they exist in DB) */}
                                    {profile.socials?.instagram && (
                                        <a href={`https://instagram.com/${profile.socials.instagram}`} target="_blank" rel="noreferrer" className="bg-white text-gray-700 border border-gray-200 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <Instagram className="w-5 h-5" />
                                        </a>
                                    )}
                                    {profile.socials?.web && (
                                        <a href={profile.socials.web} target="_blank" rel="noreferrer" className="bg-white text-gray-700 border border-gray-200 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <Globe className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN: Sidebar Info */}
                    <div className="space-y-8">
                        
                        {/* Specialties (From DB) */}
                        {profile.sports && profile.sports.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-black text-gray-900 uppercase tracking-tight mb-4">Specialties</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.sports.map(s => (
                                        <span key={s} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center">
                                <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
                                Reviews
                            </h3>

                            {totalReviews > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-3xl font-black text-gray-900">
                                            {avgRating}
                                        </span>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 font-medium mb-4">
                                        Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 font-medium mb-4">
                                    No reviews yet
                                </p>
                            )}
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="w-full bg-brand-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors"
                            >
                                Leave a review
                            </button>

                            {showReviewForm && (
                                <div className="mt-4 border-t pt-4 space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Rating</label>
                                        <select
                                            value={rating}
                                            onChange={(e) => setRating(Number(e.target.value))}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        >
                                            {[5,4,3,2,1].map(r => (
                                                <option key={r} value={r}>{r} stars</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Comment</label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            rows={3}
                                            placeholder="Write your review…"
                                        />
                                    </div>

                                    {submitError && (
                                        <p className="text-sm text-red-600 font-bold">
                                            {submitError}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={submitting}
                                        className="w-full bg-green-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? "Publishing..." : "Publish review"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Location Map Placeholder or Info could go here if needed */}
                    </div>

                    {/* RIGHT COLUMN: Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* 1. SERVICES / BOOKINGS */}
                        <section>
                          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
                            <Calendar className="w-6 h-6 mr-3 text-brand-600" /> Offers & Booking
                          </h2>

                          {/* FILTERS */}
                          <div className="mb-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <h3 className="font-black text-gray-900 uppercase text-xl tracking-tight">Explore Activities</h3>

                              {/* Type dropdown */}
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

                            {/* Sport pills */}
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

                              {(profile.sports || []).map((sport) => (
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
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {filteredListings.length} {filterSport !== 'ALL' ? filterSport : ''} Options Available
                              </span>

                              {(filterSport !== 'ALL' || filterType !== 'ALL') && (
                                <button
                                  onClick={clearFilters}
                                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center"
                                >
                                  <X className="w-3 h-3 mr-1" /> Clear All Filters
                                </button>
                              )}
                            </div>

                            {filteredListings.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filteredListings.map((l) => (
                                  <ListingCard key={l.id} listing={l} />
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-xl">
                                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">No matches found</h3>
                                <p className="text-gray-500 text-sm mt-1">Try selecting a different sport or clearing filters.</p>
                                <button onClick={clearFilters} className="mt-4 text-brand-600 font-bold text-sm hover:underline">
                                  View All
                                </button>
                              </div>
                            )}
                          </div>
                        </section>

                        {/* 2. REVIEWS (Only if they exist) */}
                        {reviews.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center">
                                        <Star className="w-6 h-6 mr-3 text-yellow-500 fill-yellow-500" /> Reviews
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                    {review.reviewer_email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        {review.reviewer_name || review.reviewer_email}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </div>
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
                            </section>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorProfile;