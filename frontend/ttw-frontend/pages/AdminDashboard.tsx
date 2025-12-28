import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, DollarSign, ShoppingBag, CheckCircle, XCircle, 
    AlertTriangle, Search, MoreHorizontal, Shield, Ban, 
    Eye, Trash2, Filter, ChevronRight, TrendingUp, Building2, User,
    FileText, Settings, Plus, CreditCard, Calendar, Layers, Image, PenTool, Save, LayoutGrid
} from 'lucide-react';
import { StatCard, Modal } from '../components/dashboard/SharedComponents';
import {
  getAllProvidersAdmin,
  getAllUsersAdmin,
  getTravelers,
  getSportsDirectory,
  getListings,
  createSport,
  updateSport,
  deleteSportAPI,
  getInstructors,
  getAllInstructorsAdmin
} from '../services/dataService';
import { getAdminBookings, getAdminTransactions, getAdminPayouts, markPayoutAsPaid } from '../services/adminService';
import { SportCategory } from '../types';


const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PARTNERS' | 'SPORTS' | 'TRAVELERS' | 'BOOKINGS' | 'FINANCE'>('OVERVIEW');
    
    // Data States
    const [partners, setPartners] = useState<any[]>([]);
    const [sports, setSports] = useState<any[]>([]);
    const [travelers, setTravelers] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);

    // Listings State for Drilling Down
    const [partnerListings, setPartnerListings] = useState<any[]>([]);

    // Modal States
    const [modalType, setModalType] = useState<'NONE' | 'EDIT_PARTNER' | 'REVIEW_DOCS' | 'CREATE_ENTITY' | 'MANAGE_SPORT' | 'MANAGE_LISTINGS'>('NONE');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    
    // Edit Form State
    const [editForm, setEditForm] = useState<any>({});
    const [sportForm, setSportForm] = useState<any>({});

    // --- DERIVED METRICS (FINANCE OVERVIEW | CEO SAFE) ---
    const {
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        totalPaidOut,
        totalPendingPayout,
        platformEarned,
        platformProjected,
    } = useMemo(() => {
        const safeBookings = Array.isArray(bookings) ? bookings : [];
        const safeTransactions = Array.isArray(transactions) ? transactions : [];
        const safePayouts = Array.isArray(payouts) ? payouts : [];

        const normalize = (v: any) => String(v || '').toUpperCase();

        const pending = safeBookings.filter(b =>
            normalize(b.status) === 'PENDING'
        ).length;

        const completed = safeBookings.filter(b =>
            ['CONFIRMED', 'COMPLETED'].includes(normalize(b.status))
        ).length;

        const revenue = safeTransactions
            .filter(t =>
                normalize(t.type) === 'PAYMENT' &&
                normalize(t.status) === 'SUCCEEDED'
            )
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const paidOut = safePayouts
            .filter(p => normalize(p.status) === 'PAID')
            .reduce((sum, p) => sum + Number(p.amount_due || 0), 0);

        const pendingPayout = safePayouts
            .filter(p => normalize(p.status) !== 'PAID')
            .reduce((sum, p) => sum + Number(p.amount_due || 0), 0);

        const earned = safePayouts
            .filter(p => normalize(p.status) === 'PAID')
            .reduce((sum, p) => sum + Number(p.platform_fee ?? p.ttw_fee ?? 0), 0);

        const projected = safePayouts
            .filter(p => normalize(p.status) !== 'PAID')
            .reduce((sum, p) => sum + Number(p.platform_fee ?? p.ttw_fee ?? 0), 0);

        return {
            totalBookings: safeBookings.length,
            pendingBookings: pending,
            completedBookings: completed,
            totalRevenue: revenue,
            totalPaidOut: paidOut,
            totalPendingPayout: pendingPayout,
            platformEarned: earned,
            platformProjected: projected,
        };
    }, [bookings, transactions, payouts]);

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const providers = await getAllProvidersAdmin();
                const instructorsResponse =
                  typeof getAllInstructorsAdmin === 'function'
                    ? await getAllInstructorsAdmin()
                    : [];

                const normalizedProviders = Array.isArray(providers)
                  ? providers
                  : Array.isArray((providers as any)?.results)
                  ? (providers as any).results
                  : [];

                const mappedProviders = normalizedProviders.map((prov: any) => {
                  const city = prov?.city_name || '-';
                  const country = prov?.country_name || '-';

                  const name =
                    prov?.company_name ||
                    prov?.name ||
                    prov?.user_info?.email?.split('@')[0] ||
                    'School';

                  return {
                    ...prov,
                    id: prov.id,
                    name,
                    type: prov.type || 'SCHOOL',
                    city,
                    country,
                    city_name: prov?.city_name,
                    country_name: prov?.country_name,
                    status: prov.status || 'ACTIVE',
                    commission:
                      prov.commission_rate !== null && prov.commission_rate !== undefined
                        ? Number(prov.commission_rate)
                        : null,
                  };
                });

                const normalizedInstructors = Array.isArray(instructorsResponse?.results)
                  ? instructorsResponse.results
                  : Array.isArray(instructorsResponse)
                  ? instructorsResponse
                  : [];

                const mappedInstructors = normalizedInstructors.map((inst: any) => {
                  const city = inst?.city_name || '-';
                  const country = inst?.country_name || '-';

                  const name =
                    inst?.full_name?.trim() ||
                    inst?.user_info?.name ||
                    (inst?.user_info?.email
                      ? inst.user_info.email.split('@')[0]
                      : `Instructor #${inst.id}`);

                  return {
                    ...inst,
                    id: inst.id,
                    name,
                    type: 'INSTRUCTOR',
                    city,
                    country,
                    city_name: inst?.city_name,
                    country_name: inst?.country_name,
                    status: inst.status || 'ACTIVE',
                    commission:
                      inst.commission_rate !== null && inst.commission_rate !== undefined
                        ? Number(inst.commission_rate)
                        : null,
                  };
                });

                const mergedPartners = [
                  ...mappedProviders,
                  ...mappedInstructors,
                ];

                setPartners(mergedPartners);

                const travelersData = await getTravelers();
                console.log("RAW travelers API response:", travelersData);

                const normalizedTravelers = Array.isArray(travelersData)
                  ? travelersData
                  : Array.isArray(travelersData?.results)
                  ? travelersData.results
                  : Array.isArray(travelersData?.data)
                  ? travelersData.data
                  : [];

                // Si tu backend devuelve todos los usuarios, filtramos solo los Travelers
                const onlyTravelers = normalizedTravelers.filter((u: any) =>
                  u.role === 'USER'
                );

                setTravelers(onlyTravelers);

                const sportsData = await getSportsDirectory();
                setSports(Array.isArray(sportsData) ? sportsData : []);

                // --- FETCH BOOKINGS ---
                const bookingsData = await getAdminBookings();
                const normalizedBookings = Array.isArray(bookingsData)
                  ? bookingsData
                  : Array.isArray(bookingsData?.results)
                  ? bookingsData.results
                  : [];

                setBookings(normalizedBookings);

                // --- FETCH TRANSACTIONS ---
                const transactionsData = await getAdminTransactions();
                const normalizedTransactions = Array.isArray(transactionsData)
                  ? transactionsData
                  : Array.isArray((transactionsData as any)?.results)
                  ? (transactionsData as any).results
                  : [];

                setTransactions(normalizedTransactions);

                // --- FETCH PAYOUTS ---
                const payoutsData = await getAdminPayouts();

                const normalizedPayouts = Array.isArray((payoutsData as any)?.payouts)
                  ? (payoutsData as any).payouts
                  : Array.isArray(payoutsData)
                  ? payoutsData
                  : Array.isArray((payoutsData as any)?.results)
                  ? (payoutsData as any).results
                  : [];

                setPayouts(normalizedPayouts);
            } catch (error) {
                console.error("Admin load error:", error);
                setTravelers([]);
            }
        };

        loadData();
    }, []);

    // --- ACTIONS ---

    const handleMarkPayoutPaid = async (payoutId: string) => {
        if (!window.confirm('Mark this payout as PAID?')) return;

        try {
            await markPayoutAsPaid(payoutId);
            setPayouts(prev =>
                prev.map(p =>
                    p.id === payoutId
                        ? { ...p, status: 'PAID', paid_at: new Date().toISOString() }
                        : p
                )
            );
        } catch (err) {
            console.error(err);
            alert('Failed to mark payout as paid');
        }
    };

    const handleOpenEdit = (partner: any) => {
        setSelectedItem(partner);
        setEditForm({ ...partner });
        setModalType('EDIT_PARTNER');
    };

    const handleOpenDocs = (partner: any) => {
        setSelectedItem(partner);
        setModalType('REVIEW_DOCS');
    };

    const handleOpenInventory = async (partner: any) => {
        setSelectedItem(partner);
        // Simulate fetching listings for this specific provider
        const listings = await getListings({ providerId: partner.id });
        setPartnerListings(listings); // In real app, this would fetch by providerId
        setModalType('MANAGE_LISTINGS');
    }

    const handleUpdatePrice = (listingId: string, newPrice: string) => {
        setPartnerListings(prev => prev.map(l => l.id === listingId ? { ...l, price: Number(newPrice) } : l));
    };

    const handleDeleteListing = (listingId: string) => {
        if(window.confirm("Delete this listing permanently?")) {
            setPartnerListings(prev => prev.filter(l => l.id !== listingId));
        }
    };

    const handleOpenSport = (sport?: any) => {
        if (sport) {
            setSportForm({ ...sport });
        } else {
            setSportForm({ name: '', category: 'WATER', description: '', image: '' });
        }
        setModalType('MANAGE_SPORT');
    };

    const handleSavePartner = () => {
        setPartners(prev => prev.map(p => p.id === editForm.id ? editForm : p));
        setModalType('NONE');
        alert("Partner profile updated. Content quality improved.");
    };

    const handleSaveSport = async () => {
        try {
            if (sportForm.slug) {
                await updateSport(sportForm.slug, {
                    name: sportForm.name,
                    category: sportForm.category,
                    image: sportForm.image,
                    description: sportForm.description,
                });
            } else {
                await createSport({
                    name: sportForm.name,
                    category: sportForm.category,
                    image: sportForm.image,
                    description: sportForm.description,
                });
            }

            const refreshedSports = await getSportsDirectory();
            setSports(refreshedSports);
            setModalType('NONE');
            alert("Sport saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Error saving sport");
        }
    };

    const handleDelete = async (id: string, type: 'PARTNER' | 'USER' | 'SPORT') => {
        if(window.confirm("Are you sure you want to DELETE this record? This is permanent.")) {
            if (type === 'PARTNER') {
                alert("Partner deletion must be handled via backend.");
                return;
            }
            if (type === 'USER') {
                setTravelers(prev => Array.isArray(prev) ? prev.filter(t => t.id !== id) : []);
            }
            if (type === 'SPORT') {
                try {
                    await deleteSportAPI(id);
                    const refreshedSports = await getSportsDirectory();
                    setSports(refreshedSports);
                    alert("Sport deleted successfully");
                } catch (err) {
                    console.error(err);
                    alert("Error deleting sport");
                }
            }
        }
    };

    const handleApprove = (id: string) => {
        alert("Approve must be connected to backend API.");
    };

    const handleReject = (id: string) => {
        alert("Reject must be connected to backend API.");
    };

    const handleCreate = (type: 'SCHOOL' | 'FREELANCER' | 'TRAVELER') => {
        const newId = Math.random().toString(36).substr(2, 9);
        const base = { id: newId, status: 'ACTIVE', joined: new Date().toISOString().split('T')[0] };
        
        if (type === 'TRAVELER') {
            alert("Travelers must be created via public signup.");
            return;
        } else {
            setPartners([...partners, { 
                ...base, 
                name: type === 'SCHOOL' ? 'New School' : 'New Instructor', 
                type, 
                city: 'Location', 
                country: 'Country',
                sports: [],
                commission: type === 'SCHOOL' ? 15 : 20 
            }]);
        }
        setModalType('NONE');
    };


    return (
        <div className="min-h-screen bg-gray-100 font-sans flex">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="w-64 bg-[#111827] text-gray-300 flex flex-col fixed h-full z-50">
                <div className="p-6 border-b border-gray-800">
                    <p className="text-xs text-gray-500 mt-1">TTW Superadmin</p>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'OVERVIEW' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50'}`}>
                        <TrendingUp className="w-5 h-5 mr-3" /> Overview
                    </button>
                    <button onClick={() => setActiveTab('PARTNERS')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'PARTNERS' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50'}`}>
                        <Building2 className="w-5 h-5 mr-3" /> Partners
                    </button>
                    <button onClick={() => setActiveTab('SPORTS')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'SPORTS' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50'}`}>
                        <Layers className="w-5 h-5 mr-3" /> Sports & Content
                    </button>
                    <button onClick={() => setActiveTab('TRAVELERS')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'TRAVELERS' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50'}`}>
                        <Users className="w-5 h-5 mr-3" /> Travelers
                    </button>
                    <button onClick={() => setActiveTab('BOOKINGS')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'BOOKINGS' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50'}`}>
                        <Calendar className="w-5 h-5 mr-3" /> Bookings
                    </button>
                    <button onClick={() => setActiveTab('FINANCE')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'FINANCE' ? 'bg-gray-800 text-white' : 'hover:bg-gray-800/50'}`}>
                        <DollarSign className="w-5 h-5 mr-3" /> Finance
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button className="w-full flex items-center px-4 py-3 text-gray-500 hover:text-white transition-colors">
                        <Settings className="w-5 h-5 mr-3" /> Settings
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 ml-64 p-8">
                
                {/* HEADER ACTIONS */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                        {activeTab === 'SPORTS' ? 'Sports Taxonomy' : activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
                    </h1>
                    <button 
                        onClick={() => activeTab === 'SPORTS' ? handleOpenSport() : setModalType('CREATE_ENTITY')}
                        className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg hover:bg-black flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" /> 
                        {activeTab === 'SPORTS' ? 'Add New Sport' : 'Create Entity'}
                    </button>
                </div>

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-6">
                            <StatCard
                                title="Total Bookings"
                                value={totalBookings}
                                subtext={`${pendingBookings} pending • ${completedBookings} completed`}
                                icon={Calendar}
                                colorClass="bg-blue-600"
                            />
                            <StatCard
                                title="Gross Revenue"
                                value={`€${totalRevenue.toLocaleString()}`}
                                subtext="Customer payments received"
                                icon={DollarSign}
                                colorClass="bg-green-600"
                            />
                            <StatCard
                                title="Pending Payouts"
                                value={`€${totalPendingPayout.toLocaleString()}`}
                                subtext="Owed to merchants"
                                icon={AlertTriangle}
                                colorClass="bg-orange-500"
                            />
                            <StatCard
                                title="Platform Revenue"
                                value={`€${platformEarned.toLocaleString()}`}
                                subtext={`€${platformProjected.toLocaleString()} projected`}
                                icon={TrendingUp}
                                colorClass="bg-gray-900"
                            />
                        </div>

                        {/* Pending Approvals */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2 text-orange-500" /> 
                                    Pending Approvals ({partners.filter(p => p.status === 'PENDING').length})
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {partners.filter(p => p.status === 'PENDING').length > 0 ? partners.filter(p => p.status === 'PENDING').map(p => (
                                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{p.name}</h4>
                                                <p className="text-xs text-gray-500">{p.type} • {p.city}, {p.country}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleOpenDocs(p)}
                                            className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-200"
                                        >
                                            Review Docs
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-400 italic">No pending approvals.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PARTNERS TAB (Schools & Instructors) --- */}
                {activeTab === 'PARTNERS' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-4 border-b border-gray-100 flex gap-4">
                            <div className="relative flex-grow max-w-md">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search schools or instructors..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" />
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select className="text-sm border-none bg-transparent font-bold text-gray-600">
                                    <option>All Status</option>
                                    <option>Active</option>
                                    <option>Pending</option>
                                    <option>Banned</option>
                                </select>
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Location</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Commission</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {partners.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                                        <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">{p.type}</span></td>
                                        <td className="px-6 py-4 text-gray-600">
                                          {p.city || p.city_name || '-'}, {p.country || p.country_name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : p.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-bold">
                                          {typeof p.commission === 'number' ? `${Math.round(p.commission * 100)}%` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenInventory(p)} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded bg-brand-50" title="View Listings"><LayoutGrid className="w-4 h-4" /></button>
                                            <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit Details"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(p.id, 'PARTNER')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- NEW: SPORTS TAB (CMS) --- */}
                {activeTab === 'SPORTS' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Sports Directory</h3>
                            <p className="text-xs text-gray-500">Manage categories, descriptions, and home page card images.</p>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Card Image</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Listing Count</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {sports.map((s) => (
                                    <tr key={s.slug} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4">
                                            <img src={s.image} alt={s.name} className="w-16 h-10 object-cover rounded-md border border-gray-200" />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                s.category === 'WATER' ? 'bg-blue-100 text-blue-700' : 
                                                s.category === 'SNOW' ? 'bg-cyan-100 text-cyan-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {s.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{s.listingCount || 0}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleOpenSport(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><PenTool className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(s.slug, 'SPORT')} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- TRAVELERS TAB --- */}
                {activeTab === 'TRAVELERS' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
                         <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Joined</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {Array.isArray(travelers) && travelers.length > 0 && travelers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {u.name || u.username || u.email?.split('@')[0] || 'User'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{u.email || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {u.date_joined ? u.date_joined.split('T')[0] : u.created_at ? u.created_at.split('T')[0] : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                              onClick={() => handleDelete(u.id, 'USER')}
                                              className="text-red-600 hover:underline font-bold text-xs"
                                            >
                                              Delete User
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {Array.isArray(travelers) && travelers.length === 0 && (
                              <tbody>
                                <tr>
                                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                                    No travelers found from API.
                                  </td>
                                </tr>
                              </tbody>
                            )}
                        </table>
                    </div>
                )}

                {/* --- BOOKINGS TAB --- */}
                {activeTab === 'BOOKINGS' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3">ID</th>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Listing</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Completion</th>
                          <th className="px-6 py-3">Captured</th>
                          <th className="px-6 py-3">Platform Fee</th>
                          <th className="px-6 py-3">Provider</th>
                          <th className="px-6 py-3">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {Array.isArray(bookings) && bookings.length > 0 ? (
                          bookings.map((b: any) => (
                            <tr key={b.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-mono text-xs">{b.id}</td>
                              <td className="px-6 py-4">
                                {b.user_email || b.user?.email || '-'}
                              </td>
                              <td className="px-6 py-4">
                                {b.listing_title || b.listing?.title || '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    ['CONFIRMED', 'COMPLETED', 'FINALIZED'].includes(b.status)
                                      ? 'bg-green-100 text-green-700'
                                      : b.status === 'AUTHORIZED'
                                      ? 'bg-blue-100 text-blue-700'
                                      : b.status === 'PENDING'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold">
                                {b.completion_percentage !== undefined && b.completion_percentage !== null
                                  ? `${b.completion_percentage}%`
                                  : '—'}
                              </td>
                              <td className="px-6 py-4 font-bold text-green-700">
                                €{b.amount_captured ?? 0}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                €{b.platform_fee ?? b.service_fee ?? 0}
                              </td>
                              <td className="px-6 py-4 text-gray-900 font-bold">
                                €{b.provider_amount ?? b.provider_payout ?? 0}
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                {b.created_at
                                  ? b.created_at.split('T')[0]
                                  : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="px-6 py-10 text-center text-gray-400 text-sm">
                              No bookings found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* --- FINANCE TAB --- */}
                {activeTab === 'FINANCE' && (
                  <div className="space-y-8 animate-in fade-in duration-500">

                    {/* TRANSACTIONS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b font-bold text-gray-700">Transactions</div>
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                          <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Booking</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Currency</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {transactions.map((t: any) => (
                            <tr key={t.id}>
                              <td className="px-6 py-4 text-xs font-mono">{t.id}</td>
                              <td className="px-6 py-4">{t.booking_id || '-'}</td>
                              <td className="px-6 py-4">{t.type}</td>
                              <td className="px-6 py-4 font-bold">€{t.amount}</td>
                              <td className="px-6 py-4">{t.currency}</td>
                              <td className="px-6 py-4">{t.status}</td>
                              <td className="px-6 py-4 text-gray-500">{t.created_at?.split('T')[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* PAYOUTS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b font-bold text-gray-700">Merchant Payouts</div>
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                          <tr>
                            <th className="px-6 py-3">Booking</th>
                            <th className="px-6 py-3">Listing</th>
                            <th className="px-6 py-3">Recipient</th>
                            <th className="px-6 py-3">TTW Fee</th>
                            <th className="px-6 py-3">Amount Due</th>
                            <th className="px-6 py-3">Currency</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {payouts.map((p: any) => (
                            <tr key={p.id}>
                              <td className="px-6 py-4">{p.booking_id}</td>
                              <td className="px-6 py-4">{p.listing_title}</td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">
                                  {p.recipient_email || p.provider_display_name || '—'}
                                </div>
                                {p.recipient_user_id && (
                                  <div className="text-xs text-gray-400 font-mono">
                                    {p.recipient_user_id}
                                  </div>
                                )}
                                <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                  Stripe Connect Payout
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                €{p.platform_fee ?? p.ttw_fee ?? 0}
                              </td>
                              <td className="px-6 py-4 font-bold">€{p.amount_due}</td>
                              <td className="px-6 py-4">{p.currency}</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {p.status === 'PAID' ? (
                                  <span className="text-xs text-gray-400">Paid</span>
                                ) : (
                                  <button
                                    onClick={() => handleMarkPayoutPaid(p.id)}
                                    className="px-3 py-1 text-xs font-bold bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Mark as Paid
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

            </div>

            {/* --- MODALS --- */}

            {/* 1. CREATE ENTITY MODAL */}
            {modalType === 'CREATE_ENTITY' && (
                <Modal title="Create New Record" onClose={() => setModalType('NONE')}>
                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => handleCreate('SCHOOL')} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-left transition-all group">
                            <Building2 className="w-6 h-6 mb-2 text-gray-400 group-hover:text-blue-600" />
                            <span className="block font-bold text-gray-900">New School Partner</span>
                            <span className="text-xs text-gray-500">Create a business profile manually.</span>
                        </button>
                        <button onClick={() => handleCreate('FREELANCER')} className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 text-left transition-all group">
                            <User className="w-6 h-6 mb-2 text-gray-400 group-hover:text-orange-600" />
                            <span className="block font-bold text-gray-900">New Instructor</span>
                            <span className="text-xs text-gray-500">Create a freelancer profile manually.</span>
                        </button>
                        <button onClick={() => handleCreate('TRAVELER')} className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 text-left transition-all group">
                            <Users className="w-6 h-6 mb-2 text-gray-400 group-hover:text-green-600" />
                            <span className="block font-bold text-gray-900">New User</span>
                            <span className="text-xs text-gray-500">Create a standard user account.</span>
                        </button>
                    </div>
                </Modal>
            )}

            {/* 2. EDIT PARTNER MODAL (Basic) */}
            {modalType === 'EDIT_PARTNER' && (
                <Modal title="Edit Partner (Superuser)" onClose={() => setModalType('NONE')}>
                    <div className="space-y-4">
                        <div className="bg-red-50 p-3 rounded text-xs text-red-800 mb-4">
                            <strong>Warning:</strong> You are editing live data. Fix typos, bad photos, or reset commissions here.
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name</label>
                            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border-gray-300 rounded-lg p-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
                                <input
                                  type="text"
                                  value={editForm.city || editForm.city_name || ''}
                                  onChange={e =>
                                    setEditForm({
                                      ...editForm,
                                      city: e.target.value,
                                      city_name: e.target.value,
                                    })
                                  }
                                  className="w-full border-gray-300 rounded-lg p-2"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Country</label>
                                <input
                                  type="text"
                                  value={editForm.country || editForm.country_name || ''}
                                  onChange={e =>
                                    setEditForm({
                                      ...editForm,
                                      country: e.target.value,
                                      country_name: e.target.value,
                                    })
                                  }
                                  className="w-full border-gray-300 rounded-lg p-2"
                                />
                             </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Profile Image URL (Fix Bad Photos)</label>
                            <input type="text" value={editForm.logo} onChange={e => setEditForm({...editForm, logo: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 text-xs" placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bio / Description (Fix Typos)</label>
                            <textarea rows={3} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Platform Commission (%)</label>
                            <input
                              type="number"
                              value={editForm.commission ?? ''}
                              onChange={e =>
                                setEditForm({
                                  ...editForm,
                                  commission:
                                    e.target.value === '' ? null : Number(e.target.value),
                                })
                              }
                              className="w-full border-gray-300 rounded-lg p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Account Status</label>
                            <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 bg-white">
                                <option value="ACTIVE">Active</option>
                                <option value="PENDING">Pending</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <button onClick={() => setModalType('NONE')} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button>
                            <button onClick={handleSavePartner} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm">Save Changes</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* 2.5. INVENTORY MANAGER (Drill Down) */}
            {modalType === 'MANAGE_LISTINGS' && selectedItem && (
                 <Modal title={`Inventory: ${selectedItem.name}`} onClose={() => setModalType('NONE')} maxWidth="max-w-2xl">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-900">{partnerListings.length} Active Listings</h4>
                                <p className="text-xs text-gray-500">Edit prices or remove inappropriate content.</p>
                            </div>
                            <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-100">
                                Add Listing for Partner
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto max-h-[400px]">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Image</th>
                                        <th className="px-4 py-2">Title</th>
                                        <th className="px-4 py-2">Price Override</th>
                                        <th className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {partnerListings.length > 0 ? partnerListings.map(l => (
                                        <tr key={l.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <img src={l.images[0]} className="w-10 h-10 rounded object-cover bg-gray-200" alt="" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-gray-900 text-xs line-clamp-1">{l.title}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{l.type}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <span className="text-gray-500 mr-1">{l.currency}</span>
                                                    <input 
                                                        type="number" 
                                                        value={l.price} 
                                                        onChange={(e) => handleUpdatePrice(l.id, e.target.value)}
                                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button 
                                                    onClick={() => handleDeleteListing(l.id)}
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                    title="Delete Listing"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-xs">No listings found for this provider.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                            <button onClick={() => setModalType('NONE')} className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm">Done</button>
                        </div>
                    </div>
                 </Modal>
            )}

            {/* 3. MANAGE SPORT MODAL */}
            {modalType === 'MANAGE_SPORT' && (
                <Modal title={sportForm.slug ? "Edit Sport" : "Add New Sport"} onClose={() => setModalType('NONE')}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sport Name</label>
                            <input type="text" value={sportForm.name} onChange={e => setSportForm({...sportForm, name: e.target.value})} className="w-full border-gray-300 rounded-lg p-2" placeholder="e.g. Pickleball" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                            <select value={sportForm.category} onChange={e => setSportForm({...sportForm, category: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 bg-white">
                                {Object.values(SportCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Card Image URL (Directory Card)</label>
                            <input type="text" value={sportForm.image} onChange={e => setSportForm({...sportForm, image: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 text-xs" placeholder="https://..." />
                            <p className="text-[10px] text-gray-400 mt-1">This image appears on the home page and sports directory cards.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                            <textarea rows={3} value={sportForm.description} onChange={e => setSportForm({...sportForm, description: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 text-sm" placeholder="SEO description for landing page..." />
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <button onClick={() => setModalType('NONE')} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancel</button>
                            <button onClick={handleSaveSport} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm">Save Sport</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* 4. REVIEW DOCS MODAL */}
            {modalType === 'REVIEW_DOCS' && selectedItem && (
                <Modal title={`Review: ${selectedItem.name}`} onClose={() => setModalType('NONE')} maxWidth="max-w-2xl">
                    <div className="space-y-6">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800 mb-4">
                            <strong>Action Required:</strong> Check if the certificates are valid and match the provider's details.
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-xl p-4 text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="font-bold text-gray-700">Business Registration</p>
                                <button className="text-blue-600 text-xs font-bold hover:underline mt-2">View PDF</button>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-4 text-center">
                                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="font-bold text-gray-700">Insurance Policy</p>
                                <button className="text-blue-600 text-xs font-bold hover:underline mt-2">View PDF</button>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            <button onClick={() => handleReject(selectedItem.id)} className="flex-1 py-3 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">
                                Reject Application
                            </button>
                            <button onClick={() => handleApprove(selectedItem.id)} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg">
                                Approve & Go Live
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
};

// Helper for missing icon in this file
const Edit3 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
);

export default AdminDashboard;