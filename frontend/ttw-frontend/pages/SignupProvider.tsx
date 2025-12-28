

import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Globe, ArrowRight, Check, Briefcase, User, MapPin, ShieldCheck, Camera, Smartphone, Building2, FileText, ChevronLeft, UploadCloud, KeyRound } from 'lucide-react';
import {
  registerUser,
  verifyEmail,
  createProviderProfile,
  createInstructorProfile,
  getSportsDirectory,
  getProviderMe,
  getInstructorMe,
  apiClient
} from '../services/dataService';

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
  { code: "ja", label: "Japanese" },
];

// Cloudinary upload helper
const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ttw_listings");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dmvlubzor/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
};

const SignupProvider: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const premiumIntentId = searchParams.get("premium_intent");
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'SCHOOL' | 'FREELANCER'>('SCHOOL');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
      email: '',
      password: '',
      companyName: '', // For Schools
      fullName: '', // For Freelancers
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      website: '',
      bio: '',
      sports: [] as string[], // will store sport SLUGS
      vatNumber: '', // For Schools
      idNumber: '', // For Freelancers
      languages: [] as string[],
  });

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any | null>(null);

  const [sportsOptions, setSportsOptions] = useState<any[]>([]);

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [documentsFile, setDocumentsFile] = useState<File | null>(null);

  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  useEffect(() => {
      if (profileImageFile) {
          const url = URL.createObjectURL(profileImageFile);
          setProfileImagePreview(url);
          return () => URL.revokeObjectURL(url);
      } else {
          setProfileImagePreview(null);
      }
  }, [profileImageFile]);

  useEffect(() => {
      if (coverImageFile) {
          const url = URL.createObjectURL(coverImageFile);
          setCoverImagePreview(url);
          return () => URL.revokeObjectURL(url);
      } else {
          setCoverImagePreview(null);
      }
  }, [coverImageFile]);

  useEffect(() => {
      const loadSports = async () => {
          try {
              const sports = await getSportsDirectory();
              setSportsOptions(sports); // keep full sport objects with id
          } catch (e) {
              console.error("Failed to load sports directory", e);
          }
      };
      loadSports();
  }, []);

  const toggleSport = (sportSlug: string) => {
    if (formData.sports.includes(sportSlug)) {
      setFormData({ ...formData, sports: formData.sports.filter(s => s !== sportSlug) });
    } else {
      setFormData({ ...formData, sports: [...formData.sports, sportSlug] });
    }
  };

  const toggleLanguage = (code: string) => {
    if (formData.languages.includes(code)) {
      setFormData({
        ...formData,
        languages: formData.languages.filter(l => l !== code),
      });
    } else {
      setFormData({
        ...formData,
        languages: [...formData.languages, code],
      });
    }
  };

  const handleRegister = async () => {
      const nameOk = role === 'SCHOOL' ? !!formData.companyName.trim() : !!formData.fullName.trim();
      if (!nameOk) {
          alert(role === 'SCHOOL' ? "Please enter your school/company name." : "Please enter your full name.");
          return;
      }
      if (!formData.email || !formData.password) {
          alert("Please enter email and password.");
          return;
      }
      setLoading(true);
      try {
          // Map to backend roles: SCHOOL -> PROVIDER, FREELANCER -> INSTRUCTOR
          const apiRole = role === 'SCHOOL' ? 'PROVIDER' : 'INSTRUCTOR';
          // --- REQUIRED NAME LOGIC ---
          let firstName = '';
          let lastName = '';

          if (role === 'FREELANCER') {
              const parts = formData.fullName.trim().split(/\s+/);
              firstName = parts[0] || '';
              lastName = parts.slice(1).join(' ') || '-';
          } else {
              // SCHOOL / PROVIDER
              firstName = formData.companyName.trim();
              lastName = '-';
          }

          // Hard validation before registerUser
          if (!firstName || !lastName) {
              alert("First name and last name are required.");
              setLoading(false);
              return;
          }

          await registerUser(
              formData.email,
              formData.password,
              apiRole,
              firstName,
              lastName,
              premiumIntentId || undefined
          );
          setIsVerifying(true); // switch UI to verify mode
      } catch (e) {
          console.error(e);
          alert("Registration failed. Email might already be used.");
      } finally {
          setLoading(false);
      }
  };

  const handleVerify = async () => {
      if (!verifyCode) {
          alert("Please enter the verification code.");
          return;
      }
      setLoading(true);
      try {
          await verifyEmail(formData.email, verifyCode);
          setStep(2); // go to profile step after successful verification
      } catch (e) {
          console.error(e);
          alert("Invalid code. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  const handleNext = () => {
      // Validate Step 2 before proceeding to Step 3
      if (step === 2) {
          if (!selectedCity) {
              alert('Please select a city from the list before continuing.');
              return;
          }
          if (!profileImageFile) {
              alert('Please upload a profile photo before continuing.');
              return;
          }
          if (!coverImageFile) {
              alert('Please upload a cover photo before continuing.');
              return;
          }
      }
      setStep(prev => prev + 1);
  };
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
      setLoading(true);
      try {
          // 1️⃣ Check if profile already exists, but do not redirect early
          let profileExists: boolean = false;
          try {
              if (role === 'SCHOOL') {
                  await getProviderMe();
              } else {
                  await getInstructorMe();
              }
              profileExists = true;
          } catch (err: any) {
              // 404 means profile does NOT exist
              if (err?.response?.status === 404) {
                  profileExists = false;
              } else {
                  throw err;
              }
          }

          // 2️⃣ Validate required fields
          if (
            !selectedCity ||
            !profileImageFile ||
            !coverImageFile ||
            !documentsFile ||
            !formData.languages.length
          ) {
              alert("Please complete all required fields.");
              return;
          }

          // 3️⃣ Upload images
          const profileImageUrl = await uploadToCloudinary(profileImageFile);
          const coverImageUrl = await uploadToCloudinary(coverImageFile);

          const baseProfile = {
              phone: formData.phone,
              bio: formData.bio,
              sports: formData.sports,
              city: selectedCity.id,
              address: formData.address,
              website: formData.website,
              profile_image: profileImageUrl,
              cover_image: coverImageUrl,
              languages: formData.languages,
          };

          // 4️⃣ Always persist onboarding data: update if exists, create if not
          if (role === 'SCHOOL') {
              if (profileExists) {
                  // PATCH /providers/me/
                  await apiClient.patch('/providers/me/', {
                      ...baseProfile,
                      company_name: formData.companyName,
                      vat_number: formData.vatNumber,
                  });
              } else {
                  // POST /providers/
                  await createProviderProfile({
                      ...baseProfile,
                      company_name: formData.companyName,
                      vat_number: formData.vatNumber,
                  });
              }
          } else {
              if (profileExists) {
                  // PATCH /instructors/me/
                  await apiClient.patch('/instructors/me/', {
                      ...baseProfile,
                      display_name: formData.fullName,
                      id_number: formData.idNumber,
                  });
              } else {
                  // POST /instructors/
                  await createInstructorProfile({
                      ...baseProfile,
                      display_name: formData.fullName,
                      id_number: formData.idNumber,
                  });
              }
          }

          // 4b: Upload documents after profile creation
          const docsForm = new FormData();
          docsForm.append("document", documentsFile);

          if (role === "SCHOOL") {
            await apiClient.post("/providers/me/documents/", docsForm, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } else {
            await apiClient.post("/instructors/me/documents/", docsForm, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }

          // 5️⃣ Navigate only after persistence
          navigate('/dashboard');
      } catch (e) {
          console.error("Provider onboarding failed:", e);
          alert("Failed to complete onboarding. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  const searchCities = async (q: string) => {
      if (!q || q.length < 2) {
          setCityResults([]);
          return;
      }
      try {
          const res = await apiClient.get(`/cities/search/?q=${encodeURIComponent(q)}`);
          const data = res.data;
          const results = Array.isArray(data) ? data : data.results || [];
          setCityResults(results);
      } catch (e) {
          console.error('City search failed', e);
          setCityResults([]);
      }
  };

  // --- STEPS CONTENT ---

  const renderStep1_Account = () => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          {!isVerifying ? (
              <>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Let's get started</h2>
                  <p className="text-gray-500 mb-8">First, tell us how you operate.</p>

                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <button 
                          onClick={() => setRole('SCHOOL')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'SCHOOL' ? 'border-[#132b5b] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                          <Building2 className={`w-6 h-6 mb-2 ${role === 'SCHOOL' ? 'text-[#132b5b]' : 'text-gray-400'}`} />
                          <div className="font-bold text-gray-900">I run a School</div>
                          <div className="text-xs text-gray-500 mt-1">I have a team & physical location.</div>
                      </button>
                      <button 
                          onClick={() => setRole('FREELANCER')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'FREELANCER' ? 'border-[#132b5b] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                          <User className={`w-6 h-6 mb-2 ${role === 'FREELANCER' ? 'text-[#132b5b]' : 'text-gray-400'}`} />
                          <div className="font-bold text-gray-900">I am a Freelancer</div>
                          <div className="text-xs text-gray-500 mt-1">I work independently.</div>
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                              {role === 'SCHOOL' ? 'School / Company Name' : 'Full Name'}
                          </label>
                          <input 
                              type="text" 
                              className="w-full border-gray-300 rounded-lg p-3 focus:ring-[#132b5b] focus:border-[#132b5b]"
                              placeholder={role === 'SCHOOL' ? "e.g. Tarifa Kite Center" : "e.g. Sarah Jenkins"}
                              value={role === 'SCHOOL' ? formData.companyName : formData.fullName}
                              onChange={e => role === 'SCHOOL' ? setFormData({...formData, companyName: e.target.value}) : setFormData({...formData, fullName: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Business Email</label>
                          <input 
                              type="email" 
                              className="w-full border-gray-300 rounded-lg p-3 focus:ring-[#132b5b] focus:border-[#132b5b]"
                              placeholder="contact@business.com"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                          <input 
                              type="password" 
                              className="w-full border-gray-300 rounded-lg p-3 focus:ring-[#132b5b] focus:border-[#132b5b]"
                              placeholder="Create a secure password"
                              value={formData.password}
                              onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                      </div>
                  </div>
              </>
          ) : (
              <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <KeyRound className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Check your email</h2>
                  <p className="text-gray-500 mb-6">
                      We sent a 6-digit verification code to <strong>{formData.email}</strong>.
                  </p>
                  <input
                      type="text"
                      maxLength={6}
                      className="w-full text-center text-2xl tracking-widest border-gray-300 rounded-lg p-3 mb-4"
                      placeholder="000000"
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mb-6">Enter the code to continue creating your provider profile.</p>
              </div>
          )}
      </div>
  );

  const renderStep2_Profile = () => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Your Base Camp</h2>
          <p className="text-gray-500 mb-8">Where are your activities located?</p>

          <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Profile Photo <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-4">
                          <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {profileImagePreview ? (
                                  <img src={profileImagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                              ) : (
                                  <Camera className="w-6 h-6 text-gray-400" />
                              )}
                          </div>
                          <div className="flex-1">
                              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#132b5b] text-white text-sm font-bold cursor-pointer hover:bg-[#0f234b]">
                                  <UploadCloud className="w-4 h-4" />
                                  Upload
                                  <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                                  />
                              </label>
                              <p className="text-xs text-gray-400 mt-2">Required. JPG/PNG recommended.</p>
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Cover Photo <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-4">
                          <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {coverImagePreview ? (
                                  <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                              ) : (
                                  <Camera className="w-6 h-6 text-gray-400" />
                              )}
                          </div>
                          <div className="flex-1">
                              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#132b5b] text-white text-sm font-bold cursor-pointer hover:bg-[#0f234b]">
                                  <UploadCloud className="w-4 h-4" />
                                  Upload
                                  <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
                                  />
                              </label>
                              <p className="text-xs text-gray-400 mt-2">Required. Wide images look best.</p>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
                  <input
                      type="text"
                      className="w-full border-gray-300 rounded-lg p-3"
                      placeholder="Start typing your city"
                      value={selectedCity ? `${selectedCity.name}, ${selectedCity.country_name}` : cityQuery}
                      onChange={e => {
                          setCityQuery(e.target.value);
                          setSelectedCity(null);
                          searchCities(e.target.value);
                      }}
                  />

                  {cityResults.length > 0 && (
                      <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow mt-1 max-h-60 overflow-y-auto">
                          {cityResults.map(city => (
                              <li
                                  key={city.id}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                      setSelectedCity(city);
                                      setCityQuery('');
                                      setCityResults([]);
                                  }}
                              >
                                  {city.name}, {city.country_name}
                              </li>
                          ))}
                      </ul>
                  )}
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Physical Address</label>
                  <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input 
                          type="text" 
                          className="w-full border-gray-300 rounded-lg p-3 pl-10"
                          placeholder="Street, Number, Zip Code"
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Used to pin your location on our map.</p>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp / Phone</label>
                  <div className="relative">
                      <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input 
                          type="tel" 
                          className="w-full border-gray-300 rounded-lg p-3 pl-10"
                          placeholder="+34 600 000 000"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Vital for communicating with guests.</p>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Short Bio</label>
                  <textarea 
                      rows={3}
                      className="w-full border-gray-300 rounded-lg p-3"
                      placeholder={role === 'SCHOOL' ? "Tell us about your school's history..." : "Tell us about your experience..."}
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                  />
              </div>
          </div>
      </div>
  );

  const renderStep3_Expertise = () => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Your Expertise</h2>
          <p className="text-gray-500 mb-8">What disciplines do you teach?</p>

          <div className="mb-10">
            <h3 className="font-bold text-gray-900 mb-2">Languages Spoken <span className="text-red-500">*</span></h3>
            <p className="text-sm text-gray-500 mb-4">
              Select all languages you can teach in.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGUAGE_OPTIONS.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLanguage(lang.code)}
                  className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${
                    formData.languages.includes(lang.code)
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-2">
              At least one language is required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
              {sportsOptions.map(sport => (
                  <button 
                      key={sport.slug}
                      onClick={() => toggleSport(sport.slug)}
                      className={`py-3 px-4 rounded-lg border text-sm font-bold transition-all flex items-center justify-between ${
                          formData.sports.includes(sport.slug) 
                          ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' 
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                      {sport.name}
                      {formData.sports.includes(sport.slug) && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
              ))}
          </div>

          <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-green-600" /> 
                  verification Documents
              </h3>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700 mb-1">
                  Upload Certificates & Insurance
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  PDF, JPG or PNG (Max 5MB)
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#132b5b] text-white text-sm font-bold cursor-pointer hover:bg-[#0f234b]">
                  <UploadCloud className="w-4 h-4" />
                  Choose file
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => setDocumentsFile(e.target.files?.[0] || null)}
                  />
                </label>

                {documentsFile && (
                  <p className="text-xs text-green-600 mt-3 font-semibold">
                    ✓ {documentsFile.name}
                  </p>
                )}
              </div>
              <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      {role === 'SCHOOL' ? 'VAT / Business ID' : 'Passport / ID Number'}
                  </label>
                  <input 
                      type="text" 
                      className="w-full border-gray-300 rounded-lg p-3"
                      placeholder="Required for verification"
                      value={role === 'SCHOOL' ? formData.vatNumber : formData.idNumber}
                      onChange={e => role === 'SCHOOL' ? setFormData({...formData, vatNumber: e.target.value}) : setFormData({...formData, idNumber: e.target.value})}
                  />
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-white flex">
        
        {/* LEFT SIDE: VISUALS */}
        <div className="hidden lg:flex w-1/2 bg-[#132b5b] relative flex-col justify-between p-12 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <img 
                src="https://images.unsplash.com/photo-1520116468816-95b69f847357?q=80&w=1000&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                alt="Background"
            />
            
            <div className="relative z-10">
                <Link to="/" className="block w-fit group">
                    <img 
                        src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763998121/The-Travel-Wild-_Logo-fondo-transparente_tvxme0.png" 
                        alt="The Travel Wild" 
                        className="h-24 w-auto object-contain brightness-0 invert"
                    />
                </Link>
            </div>

            <div className="relative z-10 max-w-md">
                <h1 className="text-5xl font-black mb-6 leading-tight">
                    Grow your <br/>
                    <span className="text-brand-400">Wild Business</span> <br/>
                    with us.
                </h1>
                <ul className="space-y-4 text-lg font-medium text-blue-100">
                    <li className="flex items-center"><Check className="w-6 h-6 text-green-400 mr-3"/> Automated Booking Management</li>
                    <li className="flex items-center"><Check className="w-6 h-6 text-green-400 mr-3"/> Global Marketing Reach</li>
                    <li className="flex items-center"><Check className="w-6 h-6 text-green-400 mr-3"/> Secure Payments via Stripe</li>
                </ul>
            </div>

            <div className="relative z-10 text-sm text-blue-300 font-medium">
                © 2025 The Travel Wild. Partners Program.
            </div>
        </div>

        {/* RIGHT SIDE: WIZARD */}
        <div className="w-full lg:w-1/2 flex flex-col">
            
            {/* Mobile Header */}
            <div className="lg:hidden p-6 flex justify-between items-center border-b border-gray-100">
                <Link to="/">
                    <img 
                        src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763998121/The-Travel-Wild-_Logo-fondo-transparente_tvxme0.png" 
                        alt="The Travel Wild" 
                        className="h-10 w-auto object-contain"
                    />
                </Link>
                <div className="text-xs font-bold text-gray-400">Step {step} of 3</div>
            </div>

            {/* Wizard Content */}
            <div className="flex-grow flex flex-col justify-center max-w-xl mx-auto w-full p-8">
                
                {/* Progress Bar */}
                <div className="mb-10 flex gap-2">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-[#132b5b]' : 'bg-gray-200'}`}></div>
                    ))}
                </div>

                {/* Render Step */}
                {step === 1 && renderStep1_Account()}
                {step === 2 && renderStep2_Profile()}
                {step === 3 && renderStep3_Expertise()}

                {/* Navigation Buttons */}
                <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100">
                    {step > 1 ? (
                        <button 
                            onClick={handleBack}
                            className="text-gray-500 font-bold hover:text-gray-900 flex items-center px-4 py-2"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </button>
                    ) : (
                        <Link to="/signup" className="text-gray-500 font-bold hover:text-gray-900 text-sm">
                            Cancel
                        </Link>
                    )}

                    {step === 1 ? (
                        !isVerifying ? (
                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="bg-[#132b5b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0f234b] transition-colors flex items-center shadow-xl shadow-blue-900/10"
                            >
                                {loading ? "Registering..." : "Continue"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleVerify}
                                disabled={loading}
                                className="bg-[#132b5b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0f234b] transition-colors flex items-center shadow-xl shadow-blue-900/10"
                            >
                                {loading ? "Verifying..." : "Verify"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        )
                    ) : step < 3 ? (
                        <button 
                            onClick={handleNext}
                            className="bg-[#132b5b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0f234b] transition-colors flex items-center shadow-xl shadow-blue-900/10"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center shadow-xl shadow-orange-500/20"
                        >
                            {loading ? 'Creating Profile...' : 'Submit Application'}
                            {!loading && <Check className="w-4 h-4 ml-2" />}
                        </button>
                    )}
                </div>

            </div>
        </div>

    </div>
  );
};

export default SignupProvider;
