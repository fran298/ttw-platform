import React, { useState, useEffect } from 'react';
import { 
    DollarSign, Plus, Edit3, Eye, AlertCircle, Wallet, 
    MessageSquare, Search, Send, Check, Trash2, ImageOff,
    Camera, User, MapPin, Globe, Phone
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    getProviderBookings, 
    getMyListings, 
    getProviderPayouts, 
    deleteListing, 
    updateUserProfile,
    updateInstructorProfile,
    getInstructorMe,
    getProviderMe,
    updateProviderProfile,
    createPremiumCheckout
} from '../../services/dataService';
import { getProviderChats, getChatRoom, getMessages, sendMessage, markMessagesAsSeen } from '../../services/chatService';
import { Listing, Booking } from '../../types';
import { StatCard } from './SharedComponents'; 

const API_BASE_URL = import.meta.env.VITE_API_URL;
// 👇 YOUR CLOUD NAME
const CLOUDINARY_CLOUD_NAME = "dmvlubzor"; 
const PLACEHOLDER_COVER = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
const PLACEHOLDER_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=Provider";

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" }
];

// --- INSTRUCTOR VIEW ---
function InstructorView() {
    const navigate = useNavigate();
    const location = useLocation();
    // --- 1. STATE MANAGEMENT ---
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [bookingView, setBookingView] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING');

    // Profile State (Instructor)
    const [profile, setProfile] = useState<null | {
        name: string;
        email: string;
        phone: string;
        bio: string;
        website: string;
        profile_image: string;
        cover_image: string;
        languages: string[];
        is_premium: boolean;
        commission_rate: number;
    }>(null);
    const [stripeConnected, setStripeConnected] = useState(false);

    // Payouts state for OVERVIEW
    const [payouts, setPayouts] = useState([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalPending, setTotalPending] = useState(0);

    // Messaging
    const [chatRooms, setChatRooms] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

    // --- FINALIZE ACTIVITY STATE ---
    const [finalizeBookingId, setFinalizeBookingId] = useState<string | null>(null);
    const [completionPercentage, setCompletionPercentage] = useState(100);
    const [finalizeReason, setFinalizeReason] = useState('');

    // --- 2. DATA FETCHING ---
    // --- FINALIZE BOOKING HELPER ---
    const finalizeBooking = async () => {
        if (!finalizeBookingId) return;

        try {
            const res = await fetch(
                `${API_BASE_URL}/bookings/${finalizeBookingId}/finalize/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access")}`,
                    },
                    body: JSON.stringify({
                        completion_percentage: completionPercentage,
                        reason: finalizeReason,
                    }),
                }
            );

            if (!res.ok) throw new Error("Finalize failed");

            alert("Activity finalized successfully");
            setFinalizeBookingId(null);
            setFinalizeReason('');
            setCompletionPercentage(100);

            // Refresh bookings
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const providerId = storedUser.id;
            const b = await getProviderBookings(providerId);
            setBookings(b);

        } catch (err) {
            console.error(err);
            alert("Failed to finalize activity");
        }
    };
    // --- Stripe Connect handler for Instructor ---
    const connectStripe = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/payments/stripe/connect/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access")}`,
                },
            });

            if (!res.ok) throw new Error("Stripe connect failed");

            const data = await res.json();
            window.location.href = data.url;
        } catch (err) {
            console.error(err);
            alert("Failed to connect with Stripe");
        }
    };

    useEffect(() => {
        const fetch = async () => {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const providerId = storedUser.id;

            // Instructor profile: fetch from API, not localStorage
            try {
                const instructor = await getInstructorMe();
                setProfile({
                    name: instructor.display_name || "",
                    email: instructor.user?.email || "",
                    phone: instructor.phone || "",
                    bio: instructor.bio || "",
                    website: instructor.website || "",
                    profile_image: instructor.profile_image || "",
                    cover_image: instructor.cover_image || "",
                    languages: instructor.languages || [],
                    is_premium: Boolean(instructor.is_premium),
                    commission_rate: instructor.commission_rate,
                });
                setStripeConnected(
                  Boolean(
                    instructor.is_stripe_connected ??
                    instructor.stripe_connect_id
                  )
                );
                if (location.search.includes("stripe=success")) {
                    window.history.replaceState({}, "", location.pathname);
                }
            } catch (err) {
                console.error("Failed to load instructor profile", err);
            }

            // 1. Fetch Bookings
            try {
                const b = await getProviderBookings(providerId);
                setBookings(b.map(x => ({
                    ...x,
                    customerName: x.userName || x.userEmail || "Customer"
                })));
            } catch (e) { console.error("Bookings load error", e); }

            // 2. Fetch Listings
            try {
                const l = await getMyListings();
                setMyListings(l);
            } catch (e) { console.error("Listings load error", e); }

            // 3. Fetch Payouts
            try {
                const payoutData = await getProviderPayouts().catch(() => ({
                    payouts: [],
                    totalPaid: 0,
                    totalPending: 0,
                }));
                setPayouts(payoutData.payouts);
                setTotalPaid(payoutData.totalPaid || 0);
                setTotalPending(payoutData.totalPending || 0);
            } catch(e) { console.error("Payout load error", e); }

            // 4. Fetch Chat Rooms
            try {
                const chats = await getProviderChats();
                const formattedChats = chats.map((c: any) => ({
                    bookingId: c.booking_id,
                    roomId: c.booking_id,
                    title: c.title || "Booking Chat",
                    customerName: c.customer, 
                    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${c.customer}`,
                    lastMessage: c.last_message,
                    timestamp: c.timestamp,
                    unreadCount: c.unread_count 
                }));
                setChatRooms(formattedChats);
            } catch (err) {
                console.error("Error loading chats", err);
            }
        };
        fetch();
    }, [location.search]);

    // --- 3. PHOTO UPLOAD LOGIC ---
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profile_image' | 'cover_image') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ttw_listings");

        try {
            // Optimistic UI update
            const reader = new FileReader();
            reader.onload = (ev) => {
                setProfile(prev => ({ ...prev, [field]: ev.target?.result as string }));
            };
            reader.readAsDataURL(file);

            // Upload to Cloudinary
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Cloudinary upload failed");
            const json = await res.json();
            const secureUrl = json.secure_url;

            // Update State with real URL
            setProfile(prev => ({ ...prev, [field]: secureUrl }));
            console.log(`Updated ${field} to:`, secureUrl);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image. Check your Cloudinary settings.");
        }
    };

    // --- WEBSOCKET ---
    useEffect(() => {
        if (!activeBookingId) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; 
        const wsUrl = `${protocol}//${host}/ws/chat/${activeBookingId}/`;
        const chatSocket = new WebSocket(wsUrl);

        chatSocket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.message) {
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        text: data.message,
                        sender: data.sender_id,
                        created_at: data.created_at,
                        sender_name: "Customer", 
                        seen_by: []
                    }]);
                }
            } catch (err) { console.error(err); }
        };
        return () => chatSocket.close();
    }, [activeBookingId]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleDeleteListing = async (id: number | string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
        if (confirmDelete) {
            try {
                const success = await deleteListing(String(id));
                if (success) {
                    setMyListings(prev => prev.filter(l => l.id !== id));
                } else {
                    alert("Could not delete. Please try again.");
                }
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    // Show bookings filtered by bookingView
    const upcomingBookings = bookings
        .filter(b => {
            const status = (b.status || '').toUpperCase();

            if (bookingView === 'UPCOMING') {
                return status === 'AUTHORIZED';
            }

            if (bookingView === 'COMPLETED') {
                return ['COMPLETED', 'CANCELLED'].includes(status);
            }

            return false;
        })
        .sort(
            (a, b) =>
                new Date(b.created_at || b.date).getTime() -
                new Date(a.created_at || a.date).getTime()
        );


    // Loading guard for profile
    if (!profile) {
      return <div className="p-8 text-gray-500">Loading dashboard…</div>;
    }
    return (
        <div>
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <span className="text-xl font-black text-gray-900 mr-8 hidden md:block">Partner Portal</span>
                            <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                                {['OVERVIEW', 'LISTINGS', 'MESSAGES', 'PROFILE'].map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gray-100 text-brand-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                                        {tab}
                                        {tab === 'MESSAGES' && <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1 rounded-full">1</span>}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center border border-brand-200 text-brand-700 font-bold text-xs overflow-hidden">
                        {profile.profile_image ? <img src={profile.profile_image} alt="Me" className="w-full h-full object-cover" /> : profile.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'OVERVIEW' && (
                    <div className="animate-in fade-in duration-500">
                        {/* STRIPE STATUS BANNER */}
                        <div className="mb-6">
                          {!stripeConnected ? (
                            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4">
                              <div>
                                <p className="font-black text-red-700">Payments not connected</p>
                                <p className="text-sm text-red-600">
                                  Connect Stripe to receive your earnings.
                                </p>
                              </div>
                              <button
                                onClick={connectStripe}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                              >
                                Connect Stripe
                              </button>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                              <p className="font-black text-green-700">Payments connected</p>
                              <p className="text-sm text-green-600">
                                Earnings will be transferred automatically to your bank account.
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Platform fee info (InstructorView) */}
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="font-bold text-blue-900 text-sm">
                            Platform fee
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            The Travel Wild retains a <strong>{profile.commission_rate}%</strong> service fee on each completed booking.
                            This covers payments processing, customer support, insurance, and platform maintenance.
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            Payouts are released automatically via Stripe after an activity is finalized.
                          </p>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8">
                            <div><h2 className="text-2xl font-black text-gray-900">Financial Health</h2><p className="text-gray-500 text-sm mt-1">Your growth metrics.</p></div>
                        </div>
                        {stripeConnected && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                              <StatCard title="Total Paid" value={`${totalPaid.toFixed(2)} EUR`} subtext="Amount already received" icon={DollarSign} colorClass="bg-green-500" />
                              <StatCard title="Pending Payouts" value={`${totalPending.toFixed(2)} EUR`} subtext="Awaiting transfer" icon={Wallet} colorClass="bg-blue-500" />
                          </div>
                        )}
                        <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-black text-gray-900">
                                {bookingView === 'UPCOMING' ? 'Upcoming Bookings' : 'Completed Bookings'}
                              </h3>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setBookingView('UPCOMING')}
                                  className={`px-3 py-1 text-xs font-bold rounded ${
                                    bookingView === 'UPCOMING'
                                      ? 'bg-brand-600 text-white'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  Upcoming
                                </button>
                                <button
                                  onClick={() => setBookingView('COMPLETED')}
                                  className={`px-3 py-1 text-xs font-bold rounded ${
                                    bookingView === 'COMPLETED'
                                      ? 'bg-brand-600 text-white'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  Completed
                                </button>
                              </div>
                            </div>
                            {upcomingBookings.length === 0 ? (
                                <p className="text-gray-500 text-sm">
                                    No bookings available for this status.
                                </p>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {upcomingBookings.map(b => (
                                        <li key={b.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-900">{b.listingTitle}</div>
                                                <div className="text-sm text-gray-500">{new Date(b.date).toLocaleDateString()} • {b.guests} guests</div>
                                                <div className="text-sm text-gray-500">Client: {b.customerName}</div>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-700">{b.status}</span>
                                            {b.status?.toUpperCase() === 'AUTHORIZED' && stripeConnected && (
                                                <button
                                                    onClick={() => setFinalizeBookingId(b.id)}
                                                    className="ml-3 text-xs font-bold px-3 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                >
                                                    Finalize
                                                </button>
                                            )}
                                            {b.status?.toUpperCase() === 'AUTHORIZED' && !stripeConnected && (
                                              <span className="ml-3 text-xs font-bold px-3 py-1 rounded bg-gray-100 text-gray-400 cursor-not-allowed">
                                                Connect Stripe to finalize
                                              </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {/* PREMIUM UPGRADE CTA */}
                        {profile.commission_rate !== 15 && (
                          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                            <p className="font-black text-yellow-900 text-sm">
                              Reduce your platform fee to 15%
                            </p>
                            <p className="text-sm text-yellow-800 mt-1">
                              Upgrade to <strong>Premium</strong> and pay only <strong>15%</strong> commission per booking instead of 25%.
                              Premium members get priority payouts and lower fees.
                            </p>
                            <button
                              onClick={() => alert("Premium upgrade payment flow coming next")}
                              className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600"
                            >
                              Upgrade to Premium
                            </button>
                          </div>
                        )}
                    </div>
                )}
                {/* --- LISTINGS TAB --- */}
                {activeTab === 'LISTINGS' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900">My Inventory</h2>
                            <button onClick={() => navigate('/manage-listing/new')} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md hover:bg-brand-700">
                                <Plus className="w-4 h-4 mr-2" /> Add New Listing
                            </button>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {myListings.map((listing) => {
                                        const displayImage = (listing.images && listing.images.length > 0) 
                                            ? listing.images[0] 
                                            : "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=200&q=80";

                                        return (
                                            <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <img 
                                                            src={displayImage} 
                                                            alt={listing.title} 
                                                            className="w-12 h-12 rounded-lg object-cover mr-4 bg-gray-100"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=200&q=80";
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="font-bold text-gray-900">{listing.title}</div>
                                                            <div className="text-xs text-gray-500">{listing.sport} • {listing.type}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900">{listing.currency} {listing.price}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Active</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => navigate(`/manage-listing/${listing.id}`)} className="text-gray-400 hover:text-brand-600 mx-2" title="Edit">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => navigate(`/activity/${listing.id}`)} className="text-gray-400 hover:text-gray-900 mx-2" title="View">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteListing(listing.id)} className="text-gray-400 hover:text-red-600 mx-2" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {myListings.length === 0 && (
                                <div className="p-8 text-center text-gray-400">
                                    <ImageOff className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No listings found. Create your first activity!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* --- MESSAGES TAB --- */}
                {activeTab === 'MESSAGES' && (
                    <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <div className="relative">
                                    <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                {chatRooms.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No conversations yet.</div>}
                                {chatRooms.map((chat) => (
                                    <div 
                                        key={chat.roomId}
                                        onClick={async () => {
                                            setActiveChatId(chat.roomId);
                                            setActiveBookingId(chat.bookingId);
                                            try {
                                                let msgs = await getMessages(chat.bookingId);
                                                setMessages(msgs);
                                                if (chat.unreadCount > 0) {
                                                    await markMessagesAsSeen(chat.bookingId);
                                                    setChatRooms(prev => prev.map(r => r.bookingId === chat.bookingId ? {...r, unreadCount: 0} : r));
                                                }
                                            } catch (err) { console.error(err); }
                                        }}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 ${activeChatId === chat.roomId ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="relative">
                                            <img src={chat.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
                                            {chat.unreadCount > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>{chat.title}</h4>
                                                <span className="text-[10px] text-gray-400">{chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                            </div>
                                            <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{chat.customerName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                            {activeChatId && activeBookingId ? (
                                <>
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={chatRooms.find((c) => c.roomId === activeChatId)?.avatar} className="w-8 h-8 rounded-full" alt="" />
                                            <div>
                                                <div className="font-bold text-gray-900">{chatRooms.find((c) => c.roomId === activeChatId)?.customerName}</div>
                                                <div className="text-xs text-gray-400">{chatRooms.find((c) => c.roomId === activeChatId)?.title}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow p-6 bg-gray-50 space-y-4 overflow-y-auto">
                                        {messages.map((msg, index) => {
                                            const providerId = localStorage.getItem('userId');
                                            const isMe = String(msg.sender) === String(providerId);
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="max-w-[75%]">
                                                        <div className={`px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-bl-none'}`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="p-4 border-t border-gray-100 bg-white">
                                        <div className="flex gap-2">
                                            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-grow border-none bg-gray-100 rounded-full px-4 py-2 focus:ring-0 text-sm" />
                                            <button onClick={async () => {
                                                if (!activeBookingId || !chatInput.trim()) return;
                                                try {
                                                    const newMsg = await sendMessage(activeBookingId, chatInput);
                                                    setMessages((prev) => [...prev, newMsg]);
                                                    setChatInput('');
                                                    await markMessagesAsSeen(activeBookingId);
                                                } catch (err) { console.error(err); }
                                            }} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm"><Send className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Select a conversation</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* --- PROFILE TAB (INSTRUCTOR) --- */}
                {activeTab === 'PROFILE' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* COVER PHOTO */}
                            <div className="h-48 w-full bg-gray-100 relative group">
                                <img 
                                    src={profile.cover_image || PLACEHOLDER_COVER} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer flex items-center bg-white/90 px-4 py-2 rounded-lg text-sm font-bold text-gray-900 shadow-lg hover:bg-white transition-all">
                                        <Camera className="w-4 h-4 mr-2" /> Change Cover
                                        <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'cover_image')} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                            {/* PROFILE CONTENT */}
                            <div className="px-8 pb-8">
                                <div className="flex justify-between items-start">
                                    {/* AVATAR UPLOAD */}
                                    <div className="-mt-12 relative group">
                                        <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md relative">
                                            <img 
                                                src={profile.profile_image || PLACEHOLDER_AVATAR} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="cursor-pointer p-2 rounded-full bg-white/20 text-white hover:bg-white/40">
                                                    <Camera className="w-5 h-5" />
                                                    <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'profile_image')} accept="image/*" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    {/* CONNECTED SAVE BUTTON */}
                                    <div className="pt-4">
                                        <div className="mb-4">
                                            {stripeConnected ? (
                                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                                    <Check className="w-4 h-4" />
                                                    Payments connected with Stripe
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={connectStripe}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                                                >
                                                    Connect payments with Stripe
                                                </button>
                                            )}
                                        </div>

                                        <button 
                                            onClick={async () => {
                                                const okUser = await updateUserProfile(profile);
                                                const okInstructor = await updateInstructorProfile({
                                                    ...profile,
                                                    display_name: profile.name,
                                                });
                                                if (okUser && okInstructor) {
                                                    alert("Profile updated successfully!");
                                                } else {
                                                    alert("Failed to update profile.");
                                                }
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50"
                                        >
                                            Save Profile Info
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Display Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full pl-9 border-gray-300 rounded-lg text-sm p-2.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address</label>
                                        <input type="email" value={profile.email} disabled className="w-full border-gray-200 bg-gray-50 rounded-lg text-sm p-2.5 text-gray-500 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Bio / Description</label>
                                        <textarea rows={4} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full border-gray-300 rounded-lg text-sm p-2.5" placeholder="Tell us about your school..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Phone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full pl-9 border-gray-300 rounded-lg text-sm p-2.5" />
                                        </div>
                                   </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                        Languages Spoken
                                      </label>

                                      <div className="flex flex-wrap gap-2">
                                        {LANGUAGE_OPTIONS.map((lang) => {
                                          const isActive = profile.languages.includes(lang.code);

                                          return (
                                            <button
                                              key={lang.code}
                                              type="button"
                                              onClick={() =>
                                                setProfile(prev => ({
                                                  ...prev,
                                                  languages: isActive
                                                    ? prev.languages.filter(l => l !== lang.code)
                                                    : [...prev.languages, lang.code]
                                                }))
                                              }
                                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                                                isActive
                                                  ? 'bg-brand-600 text-white border-brand-600'
                                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                              }`}
                                            >
                                              {lang.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          {/* FINALIZE ACTIVITY MODAL */}
          {finalizeBookingId && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-black text-gray-900 mb-4">
                  Finalize Activity
                </h3>

                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Completion Percentage
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={completionPercentage}
                  onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 mb-4"
                />

                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Reason
                </label>
                <textarea
                  value={finalizeReason}
                  onChange={(e) => setFinalizeReason(e.target.value)}
                  className="w-full border rounded-lg p-2 mb-4"
                  placeholder="Weather, safety, logistics..."
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setFinalizeBookingId(null)}
                    className="px-4 py-2 text-sm font-bold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={finalizeBooking}
                    className="px-4 py-2 text-sm font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    );
}

// --- PROVIDER VIEW ---
function ProviderView() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [bookingView, setBookingView] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING');
    const [payouts, setPayouts] = useState([]);
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalPending, setTotalPending] = useState(0);
    const [chatRooms, setChatRooms] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
    const [providerProfile, setProviderProfile] = useState<null | {
        id: string;
        company_name: string;
        description: string;
        website: string;
        phone: string;
        email: string;
        profile_image: string;
        cover_image: string;
        is_premium: boolean;
        commission_rate: number;
    }>(null);
    // --- Stripe Connect state ---
    const [stripeConnected, setStripeConnected] = useState(false);
    // --- FINALIZE ACTIVITY STATE ---
    const [finalizeBookingId, setFinalizeBookingId] = useState<string | null>(null);
    const [completionPercentage, setCompletionPercentage] = useState(100);
    const [finalizeReason, setFinalizeReason] = useState('');
    // --- Premium loading state ---
    const [premiumLoading, setPremiumLoading] = useState(false);

    // --- FINALIZE BOOKING HELPER ---
    // --- HANDLE PREMIUM UPGRADE ---
    const handleGoPremium = async () => {
        try {
            setPremiumLoading(true);
            const res = await createPremiumCheckout({});
            if (res?.checkout_url || res?.url) {
                window.location.href = res.checkout_url || res.url;
            } else {
                alert("Unable to start premium payment. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Premium payment could not be started.");
        } finally {
            setPremiumLoading(false);
        }
    };
    const finalizeBooking = async () => {
        if (!finalizeBookingId) return;

        try {
            const res = await fetch(
                `${API_BASE_URL}/bookings/${finalizeBookingId}/finalize/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access")}`,
                    },
                    body: JSON.stringify({
                        completion_percentage: completionPercentage,
                        reason: finalizeReason,
                    }),
                }
            );

            if (!res.ok) throw new Error("Finalize failed");

            alert("Activity finalized successfully");
            setFinalizeBookingId(null);
            setFinalizeReason('');
            setCompletionPercentage(100);

            // Refresh bookings
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const providerId = storedUser.id;
            const b = await getProviderBookings(providerId);
            setBookings(b);

        } catch (err) {
            console.error(err);
            alert("Failed to finalize activity");
        }
    };

    useEffect(() => {
        const fetch = async () => {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const providerId = storedUser.id;
            // Provider profile
            try {
                const provider = await getProviderMe();
                setProviderProfile({
                    id: provider.id,
                    company_name: provider.company_name || "",
                    description: provider.description || "",
                    website: provider.website || "",
                    phone: provider.phone || "",
                    email: provider.user?.email || "",
                    profile_image: provider.profile_image || "",
                    cover_image: provider.cover_image || "",
                    is_premium: Boolean(provider.is_premium),
                    commission_rate: provider.commission_rate,
                });
                // --- Stripe connection status ---
                setStripeConnected(
                  Boolean(
                    provider.is_stripe_connected ??
                    provider.stripe_connect_id
                  )
                );
                if (location.search.includes("stripe=success")) {
                    window.history.replaceState({}, "", location.pathname);
                }
            } catch (err) {
                console.error("Failed to load provider profile", err);
            }
            // 1. Fetch Bookings
            try {
                const b = await getProviderBookings(providerId);
                setBookings(b.map(x => ({
                    ...x,
                    customerName: x.userName || x.userEmail || "Customer"
                })));
            } catch (e) { console.error("Bookings load error", e); }
            // 2. Fetch Listings
            try {
                const l = await getMyListings();
                setMyListings(l);
            } catch (e) { console.error("Listings load error", e); }
            // 3. Fetch Payouts
            try {
                const payoutData = await getProviderPayouts().catch(() => ({
                    payouts: [],
                    totalPaid: 0,
                    totalPending: 0,
                }));
                setPayouts(payoutData.payouts);
                setTotalPaid(payoutData.totalPaid || 0);
                setTotalPending(payoutData.totalPending || 0);
            } catch(e) { console.error("Payout load error", e); }
            // 4. Fetch Chat Rooms
            try {
                const chats = await getProviderChats();
                const formattedChats = chats.map((c: any) => ({
                    bookingId: c.booking_id,
                    roomId: c.booking_id,
                    title: c.title || "Booking Chat",
                    customerName: c.customer, 
                    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${c.customer}`,
                    lastMessage: c.last_message,
                    timestamp: c.timestamp,
                    unreadCount: c.unread_count 
                }));
                setChatRooms(formattedChats);
            } catch (err) {
                console.error("Error loading chats", err);
            }
        };
        fetch();
    }, [location.search]);
    // --- Stripe Connect handler ---
    const connectStripe = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/payments/stripe/connect/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access")}`,
                },
            });

            if (!res.ok) throw new Error("Stripe connect failed");

            const data = await res.json();
            window.location.href = data.url;
        } catch (err) {
            alert("Failed to connect with Stripe");
            console.error(err);
        }
    };
    // --- PHOTO UPLOAD LOGIC ---
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profile_image' | 'cover_image') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ttw_listings");
        try {
            // Optimistic UI update
            const reader = new FileReader();
            reader.onload = (ev) => {
                setProviderProfile(prev => ({ ...prev, [field]: ev.target?.result as string }));
            };
            reader.readAsDataURL(file);
            // Upload to Cloudinary
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData
            });
            if (!res.ok) throw new Error("Cloudinary upload failed");
            const json = await res.json();
            const secureUrl = json.secure_url;
            setProviderProfile(prev => ({ ...prev, [field]: secureUrl }));
            console.log(`Updated ${field} to:`, secureUrl);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image. Check your Cloudinary settings.");
        }
    };
    // --- WEBSOCKET ---
    useEffect(() => {
        if (!activeBookingId) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; 
        const wsUrl = `${protocol}//${host}/ws/chat/${activeBookingId}/`;
        const chatSocket = new WebSocket(wsUrl);
        chatSocket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.message) {
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        text: data.message,
                        sender: data.sender_id,
                        created_at: data.created_at,
                        sender_name: "Customer", 
                        seen_by: []
                    }]);
                }
            } catch (err) { console.error(err); }
        };
        return () => chatSocket.close();
    }, [activeBookingId]);
    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleDeleteListing = async (id: number | string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
        if (confirmDelete) {
            try {
                const success = await deleteListing(String(id));
                if (success) {
                    setMyListings(prev => prev.filter(l => l.id !== id));
                } else {
                    alert("Could not delete. Please try again.");
                }
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };
    // Show bookings filtered by bookingView
    const upcomingBookings = bookings
        .filter(b => {
            const status = (b.status || '').toUpperCase();

            if (bookingView === 'UPCOMING') {
                return status === 'AUTHORIZED';
            }

            if (bookingView === 'COMPLETED') {
                return ['COMPLETED', 'CANCELLED'].includes(status);
            }

            return false;
        })
        .sort(
            (a, b) =>
                new Date(b.created_at || b.date).getTime() -
                new Date(a.created_at || a.date).getTime()
        );
    // Loading guard for providerProfile
    if (!providerProfile) {
      return <div className="p-8 text-gray-500">Loading dashboard…</div>;
    }
    return (
        <div>
            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <span className="text-xl font-black text-gray-900 mr-8 hidden md:block">Partner Portal</span>
                            <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                                {['OVERVIEW', 'LISTINGS', 'MESSAGES', 'PROFILE'].map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gray-100 text-brand-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                                        {tab}
                                        {tab === 'MESSAGES' && <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1 rounded-full">1</span>}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center border border-brand-200 text-brand-700 font-bold text-xs overflow-hidden">
                                {providerProfile.profile_image ? <img src={providerProfile.profile_image} alt="Me" className="w-full h-full object-cover" /> : (providerProfile.company_name?.charAt(0) || "P")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'OVERVIEW' && (
                    <div className="animate-in fade-in duration-500">
                        {/* STRIPE STATUS BANNER */}
                        <div className="mb-6">
                          {!stripeConnected ? (
                            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4">
                              <div>
                                <p className="font-black text-red-700">Payments not connected</p>
                                <p className="text-sm text-red-600">
                                  Connect Stripe to receive your earnings.
                                </p>
                              </div>
                              <button
                                onClick={connectStripe}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                              >
                                Connect Stripe
                              </button>
                            </div>
                          ) : (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                              <p className="font-black text-green-700">Payments connected</p>
                              <p className="text-sm text-green-600">
                                Earnings will be transferred automatically to your bank account.
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Platform fee info (ProviderView) */}
                        {providerProfile.commission_rate === null ? null : (
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="font-bold text-blue-900 text-sm">
                            Platform fee
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            The Travel Wild retains a <strong>
                              {providerProfile.commission_rate}%
                            </strong> service fee on each completed booking.
                            This covers payments processing, customer support, insurance, and platform maintenance.
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            Payouts are released automatically via Stripe after an activity is finalized.
                          </p>
                        </div>
                        )}
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8">
                            <div><h2 className="text-2xl font-black text-gray-900">Financial Health</h2><p className="text-gray-500 text-sm mt-1">Your growth metrics.</p></div>
                        </div>
                        {stripeConnected && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                              <StatCard title="Total Paid" value={`${totalPaid.toFixed(2)} EUR`} subtext="Amount already received" icon={DollarSign} colorClass="bg-green-500" />
                              <StatCard title="Pending Payouts" value={`${totalPending.toFixed(2)} EUR`} subtext="Awaiting transfer" icon={Wallet} colorClass="bg-blue-500" />
                          </div>
                        )}
                        <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-black text-gray-900">
                                {bookingView === 'UPCOMING' ? 'Upcoming Bookings' : 'Completed Bookings'}
                              </h3>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setBookingView('UPCOMING')}
                                  className={`px-3 py-1 text-xs font-bold rounded ${
                                    bookingView === 'UPCOMING'
                                      ? 'bg-brand-600 text-white'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  Upcoming
                                </button>
                                <button
                                  onClick={() => setBookingView('COMPLETED')}
                                  className={`px-3 py-1 text-xs font-bold rounded ${
                                    bookingView === 'COMPLETED'
                                      ? 'bg-brand-600 text-white'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  Completed
                                </button>
                              </div>
                            </div>
                            {upcomingBookings.length === 0 ? (
                                <p className="text-gray-500 text-sm">
                                    No bookings available for this status.
                                </p>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {upcomingBookings.map(b => (
                                        <li key={b.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-900">{b.listingTitle}</div>
                                                <div className="text-sm text-gray-500">{new Date(b.date).toLocaleDateString()} • {b.guests} guests</div>
                                                <div className="text-sm text-gray-500">Client: {b.customerName}</div>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-700">{b.status}</span>
                                            {b.status?.toUpperCase() === 'AUTHORIZED' && stripeConnected && (
                                                <button
                                                    onClick={() => setFinalizeBookingId(b.id)}
                                                    className="ml-3 text-xs font-bold px-3 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                >
                                                    Finalize
                                                </button>
                                            )}
                                            {b.status?.toUpperCase() === 'AUTHORIZED' && !stripeConnected && (
                                              <span className="ml-3 text-xs font-bold px-3 py-1 rounded bg-gray-100 text-gray-400 cursor-not-allowed">
                                                Connect Stripe to finalize
                                              </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {/* PREMIUM UPGRADE CTA */}
                        {providerProfile.commission_rate !== 15 && (
                          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                            <p className="font-black text-yellow-900 text-sm">
                              Reduce your platform fee to 15%
                            </p>
                            <p className="text-sm text-yellow-800 mt-1">
                              Upgrade to <strong>Premium</strong> and pay only <strong>15%</strong> commission per booking instead of 25%.
                              Premium members get lower fees, priority payouts and increased visibility.
                            </p>
                            <button
                              onClick={handleGoPremium}
                              disabled={premiumLoading || providerProfile.commission_rate === 15}
                              className={`mt-4 px-4 py-2 rounded-lg text-sm font-bold text-white ${
                                premiumLoading
                                  ? 'bg-yellow-300 cursor-not-allowed'
                                  : 'bg-yellow-500 hover:bg-yellow-600'
                              }`}
                            >
                              {premiumLoading ? 'Redirecting to Stripe…' : 'Upgrade to Premium'}
                            </button>
                          </div>
                        )}
                    </div>
                )}
                {/* --- LISTINGS TAB --- */}
                {activeTab === 'LISTINGS' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900">My Inventory</h2>
                            <button onClick={() => navigate('/manage-listing/new')} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md hover:bg-brand-700">
                                <Plus className="w-4 h-4 mr-2" /> Add New Listing
                            </button>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {myListings.map((listing) => {
                                        const displayImage = (listing.images && listing.images.length > 0) 
                                            ? listing.images[0] 
                                            : "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=200&q=80";
                                        return (
                                            <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <img 
                                                            src={displayImage} 
                                                            alt={listing.title} 
                                                            className="w-12 h-12 rounded-lg object-cover mr-4 bg-gray-100"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=200&q=80";
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="font-bold text-gray-900">{listing.title}</div>
                                                            <div className="text-xs text-gray-500">{listing.sport} • {listing.type}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900">{listing.currency} {listing.price}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Active</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => navigate(`/manage-listing/${listing.id}`)} className="text-gray-400 hover:text-brand-600 mx-2" title="Edit">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => navigate(`/activity/${listing.id}`)} className="text-gray-400 hover:text-gray-900 mx-2" title="View">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteListing(listing.id)} className="text-gray-400 hover:text-red-600 mx-2" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {myListings.length === 0 && (
                                <div className="p-8 text-center text-gray-400">
                                    <ImageOff className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No listings found. Create your first activity!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* --- MESSAGES TAB --- */}
                {activeTab === 'MESSAGES' && (
                    <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <div className="relative">
                                    <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                {chatRooms.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No conversations yet.</div>}
                                {chatRooms.map((chat) => (
                                    <div 
                                        key={chat.roomId}
                                        onClick={async () => {
                                            setActiveChatId(chat.roomId);
                                            setActiveBookingId(chat.bookingId);
                                            try {
                                                let msgs = await getMessages(chat.bookingId);
                                                setMessages(msgs);
                                                if (chat.unreadCount > 0) {
                                                    await markMessagesAsSeen(chat.bookingId);
                                                    setChatRooms(prev => prev.map(r => r.bookingId === chat.bookingId ? {...r, unreadCount: 0} : r));
                                                }
                                            } catch (err) { console.error(err); }
                                        }}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 ${activeChatId === chat.roomId ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="relative">
                                            <img src={chat.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
                                            {chat.unreadCount > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>{chat.title}</h4>
                                                <span className="text-[10px] text-gray-400">{chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                            </div>
                                            <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{chat.customerName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                            {activeChatId && activeBookingId ? (
                                <>
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={chatRooms.find((c) => c.roomId === activeChatId)?.avatar} className="w-8 h-8 rounded-full" alt="" />
                                            <div>
                                                <div className="font-bold text-gray-900">{chatRooms.find((c) => c.roomId === activeChatId)?.customerName}</div>
                                                <div className="text-xs text-gray-400">{chatRooms.find((c) => c.roomId === activeChatId)?.title}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow p-6 bg-gray-50 space-y-4 overflow-y-auto">
                                        {messages.map((msg, index) => {
                                            const providerId = localStorage.getItem('userId');
                                            const isMe = String(msg.sender) === String(providerId);
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="max-w-[75%]">
                                                        <div className={`px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' : 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-bl-none'}`}>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="p-4 border-t border-gray-100 bg-white">
                                        <div className="flex gap-2">
                                            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-grow border-none bg-gray-100 rounded-full px-4 py-2 focus:ring-0 text-sm" />
                                            <button onClick={async () => {
                                                if (!activeBookingId || !chatInput.trim()) return;
                                                try {
                                                    const newMsg = await sendMessage(activeBookingId, chatInput);
                                                    setMessages((prev) => [...prev, newMsg]);
                                                    setChatInput('');
                                                    await markMessagesAsSeen(activeBookingId);
                                                } catch (err) { console.error(err); }
                                            }} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm"><Send className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Select a conversation</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* --- PROFILE TAB (PROVIDER) --- */}
                {activeTab === 'PROFILE' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* COVER PHOTO */}
                            <div className="h-48 w-full bg-gray-100 relative group">
                                <img 
                                    src={providerProfile.cover_image || PLACEHOLDER_COVER} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer flex items-center bg-white/90 px-4 py-2 rounded-lg text-sm font-bold text-gray-900 shadow-lg hover:bg-white transition-all">
                                        <Camera className="w-4 h-4 mr-2" /> Change Cover
                                        <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'cover_image')} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                            {/* PROFILE CONTENT */}
                            <div className="px-8 pb-8">
                                <div className="flex justify-between items-start">
                                    {/* AVATAR */}
                                    <div className="-mt-12 relative group">
                                        <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-md relative">
                                            <img 
                                                src={providerProfile.profile_image || PLACEHOLDER_AVATAR} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="cursor-pointer p-2 rounded-full bg-white/20 text-white hover:bg-white/40">
                                                    <Camera className="w-5 h-5" />
                                                    <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, 'profile_image')} accept="image/*" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    {/* STRIPE CONNECT UI */}
                                    <div className="pt-4">
                                        <div className="mb-4">
                                            {stripeConnected ? (
                                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                                    <Check className="w-4 h-4" />
                                                    Payments connected with Stripe
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={connectStripe}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                                                >
                                                    Connect payments with Stripe
                                                </button>
                                            )}
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                const payload = {
                                                    company_name: providerProfile.company_name,
                                                    description: providerProfile.description,
                                                    profile_image: providerProfile.profile_image,
                                                    cover_image: providerProfile.cover_image,
                                                    phone: providerProfile.phone || null,
                                                    website: providerProfile.website,
                                                };
                                                const okProvider = await updateProviderProfile(payload);
                                                alert(okProvider ? "Profile updated successfully!" : "Failed to update profile.");
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50"
                                        >
                                            Save Profile Info
                                        </button>
                                    </div>
                                </div>
                                {/* FORM */}
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Company Name</label>
                                        <input type="text" value={providerProfile.company_name} onChange={e => setProviderProfile({ ...providerProfile, company_name: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm p-2.5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email</label>
                                        <input type="email" value={providerProfile.email} disabled className="w-full border-gray-200 bg-gray-50 rounded-lg text-sm p-2.5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Description</label>
                                        <textarea rows={4} value={providerProfile.description} onChange={e => setProviderProfile({ ...providerProfile, description: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm p-2.5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Website</label>
                                        <input type="text" value={providerProfile.website} onChange={e => setProviderProfile({ ...providerProfile, website: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm p-2.5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Phone</label>
                                        <input type="text" value={providerProfile.phone} onChange={e => setProviderProfile({ ...providerProfile, phone: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm p-2.5" />
                                    </div>
                                    {/* LANGUAGES - removed for PROVIDER */}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          {/* FINALIZE ACTIVITY MODAL */}
          {finalizeBookingId && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-black text-gray-900 mb-4">
                  Finalize Activity
                </h3>

                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Completion Percentage
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={completionPercentage}
                  onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                  className="w-full border rounded-lg p-2 mb-4"
                />

                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Reason
                </label>
                <textarea
                  value={finalizeReason}
                  onChange={(e) => setFinalizeReason(e.target.value)}
                  className="w-full border rounded-lg p-2 mb-4"
                  placeholder="Weather, safety, logistics..."
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setFinalizeBookingId(null)}
                    className="px-4 py-2 text-sm font-bold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={finalizeBooking}
                    className="px-4 py-2 text-sm font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    );
}

export default function ProviderDashboard() {
    const role = localStorage.getItem('userRole');
    if (role === 'INSTRUCTOR') {
        return <InstructorView />;
    }
    if (role === 'PROVIDER') {
        return <ProviderView />;
    }
    return null;
}