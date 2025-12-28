
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Booking } from '../types';
import { getUserBookingById } from '../services/dataService';
import { QrCode, MapPin, CheckSquare, MessageCircle, Phone, Navigation, Clock, Shield, Calendar, ChevronLeft, Download } from 'lucide-react';

const UserBookingDetail: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    // Local state for checking off packing items
    const [packedItems, setPackedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetch = async () => {
            if(bookingId) {
                const data = await getUserBookingById(bookingId);
                setBooking(data || null);
            }
            setLoading(false);
        };
        fetch();
    }, [bookingId]);

    const toggleItem = (item: string) => {
        setPackedItems(prev => ({ ...prev, [item]: !prev[item] }));
    };

    if(loading) return <div className="min-h-screen flex items-center justify-center">Loading Mission Control...</div>;
    if(!booking) return <div className="min-h-screen flex items-center justify-center">Booking not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Status Bar */}
            <div className="bg-gray-900 text-white pt-8 pb-12 px-4 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto">
                    <Link to="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white mb-6 text-sm font-bold">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Trips
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="bg-green-500 text-gray-900 text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                {booking.status}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black mt-2 leading-tight">{booking.listingTitle}</h1>
                            <p className="text-gray-400 mt-1 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        {/* Weather Widget Placeholder */}
                        <div className="hidden md:flex flex-col items-end text-right">
                             <div className="text-2xl font-light">24°C</div>
                             <div className="text-xs text-gray-400">Sunny • Wind 12kts</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-40 space-y-6">
                
                {/* 1. DIGITAL TICKET */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="bg-brand-600 p-6 flex flex-col items-center justify-center text-white md:w-1/3">
                        <div className="bg-white p-3 rounded-lg mb-3">
                            <img src={booking.ticketQr || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DEMO"} alt="QR" className="w-32 h-32 mix-blend-multiply" />
                        </div>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Scan at Check-in</p>
                    </div>
                    <div className="p-6 md:w-2/3 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Order ID</span>
                                <span className="text-gray-900 font-mono font-bold">{booking.id}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Guests</span>
                                <span className="text-gray-900 font-bold">{booking.guests} People</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Provider</span>
                                <span className="text-gray-900 font-bold">Dakhla Spirit</span>
                            </div>
                             <div>
                                <span className="block text-xs font-bold text-gray-400 uppercase">Total Paid</span>
                                <span className="text-gray-900 font-bold">{booking.currency} {booking.totalPrice}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center">
                                <Download className="w-4 h-4 mr-2" /> Save PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 2. MEETING POINT */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-brand-500" /> Meeting Point
                        </h2>
                        {booking.meetingPoint ? (
                            <>
                                <div className="h-40 bg-gray-100 rounded-lg mb-4 relative overflow-hidden group cursor-pointer">
                                     {/* Fake Map */}
                                     <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" className="w-full h-full object-cover opacity-60" alt="Map" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center">
                                             <Navigation className="w-3 h-3 mr-1" /> Open Maps
                                         </div>
                                     </div>
                                </div>
                                <h3 className="font-bold text-gray-900">{booking.meetingPoint.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">{booking.meetingPoint.address}</p>
                                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg leading-relaxed">
                                    <strong>Instructions:</strong> {booking.meetingPoint.instructions}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 text-sm">Details pending provider update.</p>
                        )}
                    </div>

                    {/* 3. INSTRUCTOR INFO */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-brand-500" /> Your Instructor
                        </h2>
                        {booking.instructor ? (
                            <div className="flex items-center gap-4">
                                <img src={booking.instructor.avatar} alt="Instructor" className="w-16 h-16 rounded-full border-2 border-brand-100" />
                                <div>
                                    <h3 className="font-bold text-gray-900">{booking.instructor.name}</h3>
                                    <p className="text-xs text-gray-500 mb-2">Certified IKO Instructor</p>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                                            <Phone className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Instructor will be assigned 24h before trip.</p>
                        )}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                             <p className="text-xs text-gray-400 text-center">Need help? <a href="#" className="text-brand-600 underline">Contact Support</a></p>
                        </div>
                    </div>
                </div>

                {/* 4. PACKING LIST */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <CheckSquare className="w-5 h-5 mr-2 text-brand-500" /> What to Bring
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {booking.packingList?.map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => toggleItem(item.item)}
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                    packedItems[item.item] 
                                    ? 'bg-green-50 border-green-200 opacity-60' 
                                    : 'bg-white border-gray-200 hover:border-brand-300'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                                    packedItems[item.item] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                }`}>
                                    {packedItems[item.item] && <CheckSquare className="w-3 h-3 text-white" />}
                                </div>
                                <span className={`text-sm ${packedItems[item.item] ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {item.item}
                                </span>
                                {!item.required && <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Optional</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. TIMELINE */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-brand-500" /> Schedule
                    </h2>
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                        {booking.timeline?.map((event, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-500 border-2 border-white ring-2 ring-gray-100"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">{event.time}</span>
                                <h3 className="font-bold text-gray-900">{event.activity}</h3>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserBookingDetail;
