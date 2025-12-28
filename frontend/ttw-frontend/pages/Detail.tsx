import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing, ListingType } from '../types';
import ExperienceDetailSection from '../pages/ExperienceDetailSection'; // Ensure path matches your folder structure
import TripDetailSection from '../pages/TripDetailSection'; // Ensure path matches your folder structure
import { getListingById, getReviewsByListing, createReview } from '../services/dataService';
import { 
    Star, MapPin, Shield, Grid, Share, Heart, 
    Clock, Users, Zap, Calendar, MessageCircle, CheckCircle, 
    Map as MapIcon, ChevronRight, Tent, Utensils, Bus, Flag,
    Activity, Mic, Anchor, LifeBuoy, AlertTriangle, Globe, Wind, 
    Car, Camera, Info
} from 'lucide-react';


const PLACEHOLDER_HERO = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80";


const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [selectedDate, setSelectedDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');

  // Reviews state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        const data = await getListingById(id);
        setListing(data || null);

        if (data?.id) {
          const listingReviews = await getReviewsByListing(data.id);
          setReviews(listingReviews);
        }

        // Auto-select start date for Trips
        if (data && data.type === ListingType.TRIP && data.details?.startDate) {
            setSelectedDate(data.details.startDate);
        }
      } catch (e) {
        console.error("Failed to load listing", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleReserve = () => {
      if(!listing) return;
      const params = new URLSearchParams({
          listingId: listing.id,
          date: selectedDate,
          guests: guests.toString(),
      });
      if(selectedSize) params.append('size', selectedSize);
      navigate(`/checkout?${params.toString()}`);
  };

  const openGoogleMaps = () => {
    if(!listing) return;
    if (listing.details?.googleMapsLink) {
        window.open(listing.details.googleMapsLink, '_blank');
        return;
    }
    const { lat, lng, city, country } = listing.location;
    const query = lat && lng ? `${lat},${lng}` : `${city}, ${country}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  // --- Logic Helpers ---
  const isDateInSeason = (dateStr: string) => {
    if (listing?.type === ListingType.TRIP) {
        return dateStr === listing.details?.startDate;
    }
    if (!listing || !listing.details?.seasonMonths || !dateStr) return true;
    const month = new Date(dateStr).getMonth();
    return listing.details.seasonMonths.includes(month);
  };

  const isSchoolOpenThatDay = (dateStr: string) => {
    if (listing?.type === ListingType.TRIP) return true;
    if (!listing || !listing.details?.weeklySchedule || !dateStr) return true;
    const dayKey = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const dayMap: any = { mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat', sun: 'sun' };
    const schedule = listing.details.weeklySchedule[dayMap[dayKey]];
    return schedule ? schedule.open : false;
  };

  const canReserve = Boolean(selectedDate) && isDateInSeason(selectedDate) && isSchoolOpenThatDay(selectedDate);

  const getDurationDisplay = () => {
      if (!listing) return '';
      if (listing.type === ListingType.TRIP && listing.details?.startDate && listing.details?.endDate) {
          const start = new Date(listing.details.startDate).getTime();
          const end = new Date(listing.details.endDate).getTime();
          const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          return `${diffDays + 1} Days`; 
      }
      return listing.details?.durationHours ? `${listing.details.durationHours} Hours` : 'Flexible';
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading experience...</p>
          </div>
      </div>
  );
  
  if (!listing) return <div className="min-h-screen flex items-center justify-center">Listing not found</div>;

  // Host is now provided directly from backend as listing.host

  // Patch: ensure host.url uses correct route
  if (listing?.host && listing.host.id) {
    listing.host.url = `/provider/${listing.host.id}`;
  }

  const images = (listing.images && listing.images.length > 0) ? listing.images : [PLACEHOLDER_HERO];
  const hasMultipleImages = images.length > 1;

  // Derive Highlights based on data
  const highlights = [
    {
        icon: Zap,
        title: listing.universalLevel ? listing.universalLevel.replace('_', ' ') : 'All Levels',
        desc: "Skill Level" 
    },
    {
        icon: listing.type === ListingType.TRIP ? Calendar : Clock,
        title: getDurationDisplay(),
        desc: "Duration"
    },
    {
        icon: Users,
        title: listing.details?.isPrivate ? 'Private Session' : (listing.type === ListingType.TRIP ? 'Fixed Group' : 'Small Group'),
        desc: "Setting"
    },
    {
        icon: Shield,
        title: "Verified Provider",
        desc: "Quality Assured",
        hidden: !listing.isVerified
    }
  ].filter(h => !h.hidden);

  const handleShare = async () => {
    if (!listing) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description?.slice(0, 120),
          url: shareUrl,
        });
      } catch (e) {
        console.error('Share cancelled', e);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard');
    }
  };

  const submitReview = async () => {
    if (!listing || !newComment.trim()) return;
    try {
      setSubmittingReview(true);
      await createReview({
        listing: listing.id,
        rating: newRating,
        comment: newComment,
      });
      const refreshed = await getReviewsByListing(listing.id);
      setReviews(refreshed);
      setNewComment('');
      setNewRating(5);
    } catch (e: any) {
      console.error('Review submit failed', e);
      alert(e?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const goToHostProfile = () => {
    if (listing?.host?.url) {
      navigate(listing.host.url);
      return;
    }

    console.error('No valid host profile route', listing?.host);
  };

  return (
    <div className="bg-white min-h-screen pb-20 font-sans">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-6">
              <div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">{listing.title}</h1>
                  <div className="flex flex-wrap items-center text-gray-500 text-sm gap-4">
                      <button onClick={openGoogleMaps} className="flex items-center hover:text-gray-900 underline decoration-gray-300 underline-offset-4">
                          <MapPin className="w-4 h-4 mr-1 text-gray-900"/> {listing.location.city}, {listing.location.country}
                      </button>
                      {reviews.length > 0 && (
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-brand-500 fill-brand-500" />
                          <span className="font-bold text-gray-900 mr-1">
                            {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                          </span>
                          ({reviews.length} reviews)
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{listing.type}</span>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-bold text-gray-700 transition-colors" onClick={handleShare}>
                      <Share className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
                  </button>
              </div>
          </div>

          {/* 
             2. PHOTO GALLERY (UPDATED HERO) 
             Changed mobile aspect ratio to [4/3] to avoid cutting.
             Changed desktop height to 500px and ensured object-center.
          */}
          <div className="relative">

            {/* MOBILE: horizontal swipe gallery */}
            <div className="md:hidden overflow-x-auto flex gap-2 snap-x snap-mandatory rounded-2xl px-4 sm:px-0">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-[90%] aspect-[4/3] snap-center relative overflow-hidden rounded-xl shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Gallery ${idx}`}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
              ))}
            </div>

            {/* DESKTOP: hero + square grid */}
            <div className="hidden md:grid grid-cols-4 gap-2 h-[500px] rounded-2xl overflow-hidden shadow-sm">
              
              {/* HERO IMAGE (Left Half) */}
              <div className={`col-span-2 h-full relative overflow-hidden group cursor-pointer`}>
                <img
                  src={images[0]}
                  alt="Main"
                  className="absolute inset-0 w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* RIGHT GRID (4 Images) */}
              <div className="col-span-2 grid grid-cols-2 gap-2 h-full">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden h-full group cursor-pointer`}
                  >
                    <img
                      src={images[i] || images[0]}
                      alt={`Detail ${i}`}
                      className="absolute inset-0 w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                    />
                    {i === 4 && hasMultipleImages && (
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-end justify-end p-4">
                           <button className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center hover:bg-white transition-all">
                                <Grid className="w-3 h-3 mr-2"/> Show all photos
                           </button>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
        
        {/* LEFT COLUMN: DETAILS */}
        <div className="lg:col-span-2 space-y-10">
            
            {/* Highlights (Legacy for non-experience/trip) */}
            {listing.type !== ListingType.EXPERIENCE && listing.type !== ListingType.TRIP && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-gray-100 pb-8">
                {highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <h.icon className="w-6 h-6 text-gray-700" />
                        <div>
                            <p className="font-bold text-gray-900 text-sm capitalize">{h.title}</p>
                            <p className="text-xs text-gray-500">{h.desc}</p>
                        </div>
                    </div>
                ))}
              </div>
            )}

            {/* DYNAMIC SECTIONS */}
            {listing.type === ListingType.EXPERIENCE && <ExperienceDetailSection listing={listing} />}
            {listing.type === ListingType.TRIP && <TripDetailSection listing={listing} />}

            {/* Description (Common) */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">About this activity</h2>
                <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-line max-w-none">
                    {listing.description}
                </div>
            </div>

            {/* --- NEW: MISSION LOGISTICS & SPECS (For Session/Course/Rent) --- */}
            {(listing.type === ListingType.SESSION || listing.type === ListingType.COURSE || listing.type === ListingType.RENT) && (
                <div className="border-t border-gray-100 pt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    
                    {/* LEFT: OPERATING WINDOW (Professional Vertical List) */}
                    {listing.details?.weeklySchedule && (
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-5 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-brand-600" /> Operating Window
                            </h2>
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                <div className="space-y-3">
                                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                                        const info = (listing.details.weeklySchedule as any)[day];
                                        const isOpen = info?.open;
                                        return (
                                            <div key={day} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className="font-bold text-gray-700 uppercase w-12">{day}</span>
                                                </div>
                                                <div className="font-mono text-gray-600">
                                                    {isOpen ? (
                                                        <span>{info.start} - {info.end}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Closed</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Season Months visualización */}
                            {listing.details?.seasonMonths?.length > 0 && (
                              <div className="mt-4 text-sm text-gray-600">
                                <strong>Season:</strong>{" "}
                                {listing.details.seasonMonths
                                  .map((m: number) =>
                                    new Date(2024, m).toLocaleString('en-US', { month: 'short' })
                                  )
                                  .join(', ')
                                }
                              </div>
                            )}
                        </div>
                    )}

                    {/* RIGHT: SPECS & LOADOUT (Dynamic Tech/Gear Cards) */}
                    <div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-5 flex items-center">
                            {listing.type === ListingType.RENT ? <Anchor className="w-5 h-5 mr-2 text-blue-600" /> : <Zap className="w-5 h-5 mr-2 text-yellow-500" />}
                            {listing.type === ListingType.RENT ? 'Gear Specifications' : 'Specs & Loadout'}
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-3">
                            
                            {/* RENTAL SPECIFIC CARD */}
                            {listing.type === ListingType.RENT && listing.details?.brand && (
                                <div className="p-4 border border-blue-100 bg-blue-50 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-blue-900 text-lg">{listing.details.brand}</h4>
                                        <span className="bg-white text-blue-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm">{listing.details.modelYear}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-blue-700 mt-2">
                                        <span>Condition: <strong>{listing.details.condition}</strong></span>
                                        <span>{listing.details.rescueIncluded ? '✅ Rescue Inc.' : '❌ No Rescue'}</span>
                                    </div>
                                    {listing.details.componentsIncluded && (
                                        <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-100">
                                            Includes: {listing.details.componentsIncluded}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* SESSION/COURSE: TECH AMENITIES */}
                            {(listing.type === ListingType.SESSION || listing.type === ListingType.COURSE) && 
                             (listing.details?.techRadio || listing.details?.techVideo || listing.details?.techDrone) && (
                                <div className="p-4 border border-purple-100 bg-purple-50 rounded-xl">
                                    <h4 className="font-bold text-purple-900 text-xs uppercase mb-3 flex items-center">
                                        <Mic className="w-3 h-3 mr-2"/> Tech Amenities
                                    </h4>
                                    <div className="space-y-2">
                                        {listing.details.techRadio && <div className="flex items-center text-xs font-bold text-purple-700"><CheckCircle className="w-3 h-3 mr-2 text-purple-500"/> Radio Communication</div>}
                                        {listing.details.techVideo && <div className="flex items-center text-xs font-bold text-purple-700"><CheckCircle className="w-3 h-3 mr-2 text-purple-500"/> Video Analysis</div>}
                                        {listing.details.techDrone && <div className="flex items-center text-xs font-bold text-purple-700"><CheckCircle className="w-3 h-3 mr-2 text-purple-500"/> Drone Footage</div>}
                                    </div>
                                </div>
                            )}

                            {/* GLOBAL: SKILL & INTENSITY */}
                            {listing.universalLevel && (
                                <div className="flex items-center p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg mr-3"><Activity className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Difficulty</p>
                                        <p className="text-sm font-bold text-gray-900">{listing.universalLevel.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            )}

                            {/* GLOBAL: LOGISTICS */}
                            {listing.details?.accessType && (
                                <div className="flex items-center p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                                    <div className="p-2 bg-gray-50 text-gray-600 rounded-lg mr-3"><Car className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Access</p>
                                        <p className="text-sm font-bold text-gray-900">{listing.details.accessType === '4x4' ? '4x4 Required' : listing.details.accessType}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Host Section */}
            {listing.host && (
              <div className="border-t border-gray-100 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Meet your Host</h2>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    goToHostProfile();
                  }}
                  className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl p-6 flex items-center justify-between gap-6 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white border border-gray-200 overflow-hidden shadow-sm">
                      <img
                        src={
                          listing.host.profile_image
                            ? listing.host.profile_image
                            : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                listing.host.name?.replace('@', '') || 'Host'
                              )}`
                        }
                        alt={listing.host.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {listing.host.name?.includes('@')
                          ? 'Verified School'
                          : listing.host.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-brand-600" />
                        {listing.host.type === 'INSTRUCTOR'
                          ? 'Certified Instructor'
                          : 'Verified School'}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-brand-600">
                    View profile →
                  </span>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="border-t border-gray-100 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Where you'll be</h2>
                <div onClick={openGoogleMaps} className="w-full h-64 bg-blue-50 rounded-2xl relative overflow-hidden cursor-pointer group">
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] opacity-10 bg-center bg-cover"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg flex flex-col items-center group-hover:scale-105 transition-transform">
                            <MapPin className="w-8 h-8 text-brand-600 mb-2" />
                            <p className="font-bold text-gray-900">{listing.location.city}, {listing.location.country}</p>
                            {listing.details?.meetingPoint && <p className="text-xs text-gray-500 mt-1 max-w-[200px] text-center truncate">{listing.details.meetingPoint}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* === REVIEWS === */}
            <div className="border-t border-gray-100 pt-10">
              <div className="mb-8 flex items-center gap-6">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    <span className="text-2xl font-black text-gray-900">
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10">
                <h3 className="font-black text-gray-900 mb-4 uppercase">Leave a Review</h3>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-6 h-6 cursor-pointer ${star <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => setNewRating(star)} />
                  ))}
                </div>
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your experience..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4" rows={4} />
                <button disabled={submittingReview} onClick={submitReview} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>

              {reviews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-lg">
                          {review.reviewer_email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{review.reviewer_email}</h4>
                          <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

        </div>

        {/* RIGHT COLUMN: STICKY BOOKING CARD */}
        <div className="lg:col-span-1">
            <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.08)] border border-gray-100 p-6 overflow-hidden">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <span className="text-3xl font-black text-gray-900">{listing.currency} {listing.price}</span>
                            <span className="text-gray-500 text-sm"> / person</span>
                        </div>
                        <div className="flex items-center text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                           <Star className="w-3 h-3 text-brand-500 fill-brand-500 mr-1" /> {listing.rating}
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-0 border border-gray-300 rounded-xl overflow-hidden">
                            <div className={`p-3 border-r border-gray-300 relative ${listing.type === ListingType.TRIP ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'}`}>
                                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Check-in</label>
                                <input 
                                    type="date" 
                                    className={`w-full text-sm outline-none font-bold text-gray-900 bg-transparent p-0 ${listing.type === ListingType.TRIP ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                    value={selectedDate}
                                    readOnly={listing.type === ListingType.TRIP} 
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                {listing.type === ListingType.TRIP && (
                                    <div className="absolute top-0 right-0 p-1">
                                        <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-1 rounded">Fixed Date</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 hover:bg-gray-50 transition-colors relative">
                                 <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Guests</label>
                                 <select 
                                    value={guests}
                                    onChange={(e) => setGuests(Number(e.target.value))}
                                    className="w-full text-sm outline-none bg-transparent font-bold text-gray-900 p-0 cursor-pointer"
                                 >
                                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Guest{n>1?'s':''}</option>)}
                                 </select>
                            </div>
                        </div>
                        
                        {listing.type === ListingType.RENT && listing.details?.sizes && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2">Select Equipment Size</label>
                                <div className="flex flex-wrap gap-2">
                                    {listing.details.sizes.map((size: string) => (
                                        <button 
                                            key={size} 
                                            onClick={() => setSelectedSize(size)}
                                            className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition-all ${selectedSize === size ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleReserve}
                        disabled={!canReserve}
                        className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center ${
                          canReserve
                            ? 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg transform active:scale-[0.98]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {canReserve ? 'Reserve' : 'Check Availability'}
                    </button>
                    
                    {/* Status Feedback */}
                    <div className="mt-3 min-h-[20px] text-center">
                        {selectedDate && !isDateInSeason(selectedDate) && (
                          <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg inline-block">⚠️ Closed during this season.</p>
                        )}
                        {/* Only show "Closed on this day" if it's NOT a trip (Trips operate on fixed days) */}
                        {listing.type !== ListingType.TRIP && selectedDate && isDateInSeason(selectedDate) && !isSchoolOpenThatDay(selectedDate) && (
                          <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg inline-block">⚠️ Closed on this day.</p>
                        )}
                    </div>
                    
                    {/* Price Breakdown */}
                    {canReserve && (
                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                             <div className="flex justify-between text-sm text-gray-600">
                                 <span className="underline decoration-dotted">{listing.currency} {listing.price} x {guests} guests</span>
                                 <span>{listing.currency} {Math.round(listing.price * guests)}</span>
                             </div>
                             <div className="flex justify-between text-sm text-gray-600">
                                 <span className="underline decoration-dotted">Service fee</span>
                                 <span>{listing.currency} 0</span>
                             </div>
                             <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                 <span className="font-bold text-gray-900">Total</span>
                                 <span className="font-black text-gray-900 text-xl">
                                    {listing.currency} {Math.round(listing.price * guests)}
                                 </span>
                             </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400 flex items-center justify-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Free cancellation up to 48 hours before.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Detail;