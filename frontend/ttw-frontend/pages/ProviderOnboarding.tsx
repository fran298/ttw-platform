
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, DollarSign, Layout, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { updateProviderOnboarding, createListing } from '../services/dataService';

const ProviderOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
      bio: '',
      website: '',
      logo: null as File | null,
      cover: null as File | null
  });
  const [tags, setTags] = useState<string[]>([]);
  const [firstListing, setFirstListing] = useState({
      title: '',
      price: 0,
      duration: '',
      desc: ''
  });

  const handleNext = async () => {
      if (step < 4) {
          setStep(step + 1);
      } else {
          // Final Submit
          setLoading(true);
          // 1. Update Profile
          await updateProviderOnboarding('temp-id', { ...profile, tags });
          // 2. Create First Listing
          await createListing({
              title: firstListing.title,
              price: firstListing.price,
              description: firstListing.desc,
              type: 'ACTIVITY' as any,
              sport: tags[0] || 'Generic',
              location: { continent: 'Europe', country: 'Spain', city: 'Mock City', lat: 0, lng: 0 },
              providerName: 'My New School',
              providerId: 'temp-id',
              currency: 'USD'
          });
          setLoading(false);
          navigate('/dashboard'); // Go to dashboard after success
      }
  };

  const handleBack = () => {
      if (step > 1) setStep(step - 1);
  };

  const toggleTag = (tag: string) => {
      if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
      else setTags([...tags, tag]);
  };

  const sportsOptions = ['Kitesurf', 'Surf', 'Windsurf', 'Wingfoil', 'Diving', 'Climbing', 'MTB', 'Skiing', 'Snowboard'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Progress Header */}
        <div className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between sticky top-0 z-20">
            <span className="font-bold text-gray-900">Partner Setup</span>
            <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-2 w-10 rounded-full transition-colors ${step >= s ? 'bg-brand-600' : 'bg-gray-200'}`}></div>
                ))}
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-900 font-medium">Save & Exit</button>
        </div>

        <div className="flex-grow flex justify-center py-12 px-4">
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                
                {/* STEP 1: BRANDING */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Build your Profile</h2>
                        <p className="text-gray-500 mb-8">This is how customers will see your school or business.</p>

                        <div className="space-y-6">
                            {/* Logo Upload Mock */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-brand-500 cursor-pointer">
                                        <Camera className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className="text-xs text-gray-500">Recommended 200x200px</span>
                                </div>
                            </div>

                             {/* Cover Upload Mock */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cover Photo</label>
                                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-brand-500 cursor-pointer">
                                        <span className="text-sm text-gray-500 flex items-center"><Camera className="w-4 h-4 mr-2"/> Upload Cover Image</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Bio / Description</label>
                                <textarea 
                                    rows={4} 
                                    className="w-full border-gray-300 rounded-lg"
                                    placeholder="Tell us about your school, your philosophy, and what makes you unique..."
                                    value={profile.bio}
                                    onChange={e => setProfile({...profile, bio: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Website (Optional)</label>
                                <input 
                                    type="url" 
                                    className="w-full border-gray-300 rounded-lg"
                                    placeholder="https://"
                                    value={profile.website}
                                    onChange={e => setProfile({...profile, website: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: EXPERTISE */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Expertise</h2>
                        <p className="text-gray-500 mb-8">Select the disciplines you teach or offer.</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            {sportsOptions.map(sport => (
                                <button 
                                    key={sport}
                                    onClick={() => toggleTag(sport)}
                                    className={`py-3 px-4 rounded-lg border text-sm font-bold transition-all ${
                                        tags.includes(sport) 
                                        ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' 
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {sport}
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                             <MapPin className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                             <div>
                                 <h4 className="font-bold text-blue-900 text-sm">Location Verification</h4>
                                 <p className="text-xs text-blue-800 mt-1">We will use your address from the previous step to verify your spot on Google Maps.</p>
                             </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: FIRST LISTING */}
                {step === 3 && (
                    <div className="animate-fade-in">
                         <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your first Activity</h2>
                         <p className="text-gray-500 mb-8">Let's get something on the marketplace right away.</p>
                         
                         <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Activity Title</label>
                                <input 
                                    type="text" 
                                    className="w-full border-gray-300 rounded-lg"
                                    placeholder="e.g. 2 Hour Beginner Group Lesson"
                                    value={firstListing.title}
                                    onChange={e => setFirstListing({...firstListing, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input 
                                            type="number" 
                                            className="w-full pl-8 border-gray-300 rounded-lg"
                                            value={firstListing.price}
                                            onChange={e => setFirstListing({...firstListing, price: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                                    <input 
                                        type="text" 
                                        className="w-full border-gray-300 rounded-lg"
                                        placeholder="e.g. 2 hours"
                                        value={firstListing.duration}
                                        onChange={e => setFirstListing({...firstListing, duration: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea 
                                    rows={3} 
                                    className="w-full border-gray-300 rounded-lg"
                                    placeholder="Describe what students will learn..."
                                    value={firstListing.desc}
                                    onChange={e => setFirstListing({...firstListing, desc: e.target.value})}
                                />
                            </div>
                         </div>
                    </div>
                )}

                {/* STEP 4: REVIEW */}
                {step === 4 && (
                    <div className="animate-fade-in text-center py-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">You're ready to go!</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Your profile is set up. Once you click Finish, you'll be taken to your dashboard where you can add more listings, manage calendar, and connect Stripe for payments.
                        </p>
                        
                        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto border border-gray-200 mb-8">
                            <div className="flex items-center mb-2">
                                <Layout className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm font-bold text-gray-700">Profile Completeness</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{width: '90%'}}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between">
                    {step > 1 ? (
                        <button 
                            onClick={handleBack}
                            className="flex items-center text-gray-600 font-bold hover:text-gray-900"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </button>
                    ) : <div></div>}
                    
                    <button 
                        onClick={handleNext}
                        disabled={loading}
                        className="bg-brand-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-700 transition-colors flex items-center shadow-lg"
                    >
                        {loading ? 'Setting up...' : step === 4 ? 'Finish Setup' : 'Continue'} 
                        {step < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
};

export default ProviderOnboarding;
