import React, { useState, useEffect } from 'react';
import { 
    Users, MapPin, Clock, Search, Send, MessageSquare, Heart, LogOut, Calendar as CalendarIcon, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings, getListings, getMe } from '../../services/dataService';
import { Booking, Listing } from '../../types';
import { getChatRoom, getMessages, sendMessage, markMessagesAsSeen } from "../../services/chatService";

const UserDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [userTab, setUserTab] = useState<'TRIPS' | 'MESSAGES' | 'PROFILE'>('TRIPS');
    type DashboardBooking = Booking & {
        reference?: string;
        listingType?: string;
        listingImage?: string;
        providerName?: string;
        providerRole?: string;
        city?: string;
        country?: string;
    };

    const [bookings, setBookings] = useState<DashboardBooking[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [chatInput, setChatInput] = useState('');
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    const [userProfile, setUserProfile] = useState({
        id: "",
        firstName: "",
        lastName: "",
        email: ""
    });

    const [chatRooms, setChatRooms] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = React.useRef<any>(null);
    const userIdForMessages = localStorage.getItem("userId");
    const lastUserMessageId =
        messages.filter(m => String(m.sender) === String(userIdForMessages)).slice(-1)[0]?.id;

    useEffect(() => {
        const fetch = async () => {
            const ub = await getUserBookings();
            // Fetch profile from backend before bookings
            const me = await getMe();
            setUserProfile({
                id: me.id,
                firstName: me.first_name || "",
                lastName: me.last_name || "",
                email: me.email
            });
            const normalizedBookings = ub.map((b: any) => ({
                id: b.id,
                status: b.status,
                reference: b.id?.slice(0, 8) || "",

                // ACTIVITY
                listingTitle: b.listingTitle,

                listingImage: b.listingImage || b.images?.[0] || "",

                // PROVIDER / INSTRUCTOR
                providerName: b.providerName,

                providerRole: b.provider ? "Provider" : "Instructor",

                // LOCATION
                city:
                    b.city?.name ||
                    b.listing?.city?.name ||
                    b.city_name ||
                    "",

                country:
                    b.city?.country_name ||
                    b.listing?.city?.country_name ||
                    b.country_name ||
                    "",

                // BOOKING CORE DATA
                date: b.date || null,
                guests: b.guests ?? 1,

                // PRICE (FIXED)
                totalPrice: Number(b.totalPrice ?? 0),

                currency: b.currency || "EUR",
            }));
            setBookings(normalizedBookings);
            // Wishlist removed

            if (normalizedBookings && normalizedBookings.length > 0) {
                const rooms = [];
                for (const b of normalizedBookings) {
                    try {
                        const room = await getChatRoom(b.id);
                        rooms.push({
                            bookingId: b.id,
                            roomId: room.id,
                            title: b.listingTitle,
                            provider: b.providerName || "Provider",
                            avatar: "https://api.dicebear.com/7.x/initials/svg?seed=" + b.listingTitle,
                            unread: room.unread_count || 0,
                        });
                    } catch (err) {
                        console.error("Chat room error:", err);
                    }
                }
                setChatRooms(rooms);
                const totalUnread = rooms.reduce((sum, r) => sum + (r.unread || 0), 0);
                setUnreadCount(totalUnread);
            }
        };
        fetch();
    }, []);

    // --- WEBSOCKET CONNECTION FIX ---
    useEffect(() => {
        if (!activeBookingId) return;

        // 1. Construct WebSocket URL dynamically
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; 
        const wsUrl = `${protocol}//${host}/ws/chat/${activeBookingId}/`;
        
        console.log("Connecting to WebSocket:", wsUrl);
        const chatSocket = new WebSocket(wsUrl);

        chatSocket.onopen = () => {
            console.log("WebSocket Connected ✅");
        };

        chatSocket.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                
                // The backend sends: { message: "text", sender_id: "1", created_at: "..." }
                if (data.message) {
                    const incomingMessage = {
                        id: Date.now(), // Use temp ID for display
                        text: data.message,
                        sender: data.sender_id,
                        created_at: data.created_at,
                        sender_name: "New Message", // Fallback name
                        sender_role: "Unknown"      // Fallback role
                    };

                    setMessages(prevMessages => {
                        // PREVENT DUPLICATES:
                        // If we just sent this message via API, it might already be in the list.
                        // We check if the last message has the same text and is very recent.
                        const lastMsg = prevMessages[prevMessages.length - 1];
                        const isDuplicate = lastMsg && 
                                            lastMsg.text === incomingMessage.text && 
                                            String(lastMsg.sender) === String(incomingMessage.sender);

                        if (isDuplicate) return prevMessages;
                        
                        return [...prevMessages, incomingMessage];
                    });
                }
            } catch (err) {
                console.error("WebSocket message parse error:", err);
            }
        };

        chatSocket.onclose = (e) => {
            console.log("WebSocket Disconnected ❌");
        };

        return () => {
            chatSocket.close();
        };
    }, [activeBookingId]);
    // --------------------------------

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div>
            {/* User Nav */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <span className="text-xl font-black text-gray-900 mr-8 hidden md:block">Traveler Hub</span>
                            <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
                                {['TRIPS', 'MESSAGES', 'PROFILE'].map((tab) => (
                                    <button key={tab} onClick={() => setUserTab(tab as any)} className={`px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${userTab === tab ? 'bg-gray-100 text-brand-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                                        {tab === 'TRIPS' ? 'My Trips' : tab}
                                        {tab === 'MESSAGES' && unreadCount > 0 && (
                                          <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1 rounded-full">
                                            {unreadCount}
                                          </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center border border-brand-200 text-brand-700 font-bold text-xs">DU</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {userTab === 'TRIPS' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-black text-gray-900">Your Adventures</h2><button onClick={() => navigate('/explore')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700">Book New Trip</button></div>
                        <div className="space-y-4">
                            {bookings.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300"><MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-bold text-gray-900">No bookings yet</h3><p className="text-gray-500 mb-6">Time to find your next thrill.</p><button onClick={() => navigate('/explore')} className="text-brand-600 font-bold hover:underline">Explore Activities</button></div>
                            ) : (
                                bookings.map(b => (
                                    <div key={b.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                        <div className="relative w-full md:w-40 h-40 flex-shrink-0 overflow-hidden rounded-xl"><img src={b.listingImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Thumb" /><div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase">{b.status}</div></div>
                                        <div className="flex-grow w-full">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{b.listingTitle}</h3>
                                                    <p className="text-sm text-gray-500">
                                                      {b.city && b.country && `${b.city}, ${b.country}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-gray-900 text-lg">
                                                      {b.currency} {Number(b.totalPrice).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-4 bg-gray-50 p-3 rounded-lg">
                                              <span className="flex items-center font-medium">
                                                <CalendarIcon className="w-4 h-4 mr-1.5 text-brand-500"/>
                                                {b.date ? new Date(b.date).toLocaleDateString() : "Date TBD"}
                                              </span>
                                              <span className="flex items-center font-medium">
                                                <Users className="w-4 h-4 mr-1.5 text-brand-500"/>
                                                {b.guests} Guests
                                              </span>
                                              <span className="flex items-center font-medium">
                                                <ClipboardList className="w-4 h-4 mr-1.5 text-brand-500"/>
                                                Ref: {b.reference.slice(0, 8)}
                                              </span>
                                            </div>
                                            <div className="mt-6 flex gap-3">
                                              <button onClick={() => setUserTab('MESSAGES')} className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 text-gray-700 flex items-center"><MessageSquare className="w-4 h-4 mr-2" /> Message</button>
                                            </div>
                                            <p className="mt-3 text-xs text-gray-400">
                                              To cancel this booking, please contact support via Messages or email
                                              <span className="font-medium"> support@thetravelwild.com </span>
                                              with subject <span className="font-medium">Cancellation</span> and your booking reference.
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}


                {userTab === 'MESSAGES' && (
                    <div className="animate-in fade-in duration-500 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50"><div className="relative"><input type="text" placeholder="Search messages..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-brand-500" /><Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" /></div></div>
                            <div className="flex-grow overflow-y-auto">
                                {chatRooms.map(chat => (
                                    <div 
                                        key={chat.roomId}
                                        onClick={async () => {
                                            setActiveChatId(chat.roomId);
                                            setActiveBookingId(chat.bookingId);

                                            let msgs = await getMessages(chat.bookingId);
                                            setMessages(msgs);

                                            try {
                                                await markMessagesAsSeen(chat.bookingId);
                                                msgs = await getMessages(chat.bookingId);
                                                setMessages(msgs);
                                                setChatRooms(prev =>
                                                  prev.map(r =>
                                                    r.bookingId === chat.bookingId ? { ...r, unread: 0 } : r
                                                  )
                                                );
                                                setUnreadCount(prev => Math.max(prev - (chat.unread || 0), 0));
                                            } catch (err) {
                                                console.error("Mark seen failed:", err);
                                            }
                                        }}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex gap-3 transition-colors ${activeChatId === chat.roomId ? 'bg-blue-50' : ''}`}
                                    >
                                        <img src={chat.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{chat.title}</h4>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{chat.provider}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                            {activeChatId ? (
                                <>
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={chatRooms.find(c => c.roomId === activeChatId)?.avatar} className="w-8 h-8 rounded-full" alt="" />
                                            <span className="font-bold text-gray-900">{chatRooms.find(c => c.roomId === activeChatId)?.title}</span>
                                        </div>
                                    </div>
                                    <div className="flex-grow p-6 bg-gray-50 space-y-4 overflow-y-auto">
                                        {messages.map(msg => {
                                            const userId = localStorage.getItem("userId");
                                            const isUser = String(msg.sender) === String(userId);
                                            const senderLabel = isUser
                                                ? "You"
                                                : msg.sender_role === "PROVIDER"
                                                    ? "Provider"
                                                    : msg.sender_role === "INSTRUCTOR"
                                                        ? "Instructor"
                                                        : "User";

                                            return (
                                                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="max-w-[75%]">
                                                        <div className={`text-xs text-gray-400 mb-1 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
                                                            {senderLabel} — {msg.sender_name}
                                                        </div>

                                                        <div
                                                            className={`${isUser
                                                                ? 'bg-blue-600 text-white rounded-2xl rounded-br-none'
                                                                : 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-bl-none'
                                                            } px-4 py-2 text-sm shadow-sm`}
                                                        >
                                                            {msg.text}
                                                        </div>
                                                        {isUser && msg.id === lastUserMessageId && (
                                                            <div className="text-[10px] text-gray-400 mt-0.5 text-right">
                                                                Sent
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="p-4 border-t border-gray-100 bg-white">
                                        {isTyping && (
                                            <div className="text-xs text-gray-400 mb-1">
                                                You are typing...
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={e => {
                                                    setChatInput(e.target.value);
                                                    setIsTyping(true);
                                                    if (typingTimeoutRef.current) {
                                                        clearTimeout(typingTimeoutRef.current);
                                                    }
                                                    typingTimeoutRef.current = setTimeout(() => {
                                                        setIsTyping(false);
                                                    }, 1000);
                                                }}
                                                placeholder="Type a message..."
                                                className="flex-grow border-none bg-gray-100 rounded-full px-4 py-2 focus:ring-0 text-sm"
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (!activeBookingId || !chatInput.trim()) return;

                                                    // Optimistic update (adding locally)
                                                    const newMsg = await sendMessage(activeBookingId, chatInput);
                                                    setMessages(prev => {
                                                        // Safety check against duplicates if socket is super fast
                                                        if (prev.some(m => m.id === newMsg.id)) return prev;
                                                        return [...prev, newMsg]
                                                    });
                                                    setChatInput('');

                                                    try {
                                                        await markMessagesAsSeen(activeBookingId);
                                                    } catch (err) {
                                                        console.error("Seen after send failed:", err);
                                                    }
                                                }}
                                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center text-gray-400"><MessageSquare className="w-12 h-12 mb-3 opacity-20" /><p>Select a conversation</p></div>
                            )}
                        </div>
                    </div>
                )}

                {userTab === 'PROFILE' && (
                    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Account Settings</h2>
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-6 mb-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500 border-4 border-white shadow-sm">DU</div>
                                <button className="text-sm font-bold text-brand-600 hover:underline">Change Avatar</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={userProfile.firstName}
                                        onChange={e => setUserProfile({ ...userProfile, firstName: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={userProfile.lastName}
                                        onChange={e => setUserProfile({ ...userProfile, lastName: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={userProfile.email}
                                        disabled
                                        className="w-full border-gray-200 bg-gray-100 rounded-lg p-2 text-sm cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
                                <button className="text-red-500 text-sm font-bold flex items-center hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                </button>
                                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;