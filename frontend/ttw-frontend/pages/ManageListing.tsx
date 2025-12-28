import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, Save, Upload, Activity, Clock, Target, Sun, Trash2, 
    Check, GraduationCap, CloudFog, Tent, Utensils, Bus, Plus, AlertTriangle, 
    Users, Shield, Map, Package, FileText, Globe, MapPin, Anchor, 
    LifeBuoy, Mic, Waves, Car, Umbrella 
} from 'lucide-react';
import { ListingType, CourseScope, UniversalLevel, RentalCategory, TripAccommodation, SchedulingType } from '../types';
import { 
    getMyProviderSports, 
    createListing, 
    getListingById, 
    updateListing,
    searchCities
} from '../services/dataService';

// 👇 YOUR CLOUD NAME
const CLOUDINARY_CLOUD_NAME = "dmvlubzor"; 

// --- HELPER: Fix Broken Images ---
const cleanImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (img.secure_url) return img.secure_url;
    if (img.url) return img.url;
    if (Array.isArray(img) && img.length > 0) return cleanImageUrl(img[0]);
    return '';
};

// --- CONSTANTS ---
const SPOKEN_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Arabic', 'Mandarin'];

const ManageListing: React.FC = () => {
  const navigate = useNavigate();
  const { action } = useParams<{ action: string }>(); 
  
  const isEdit = action !== 'new';
  const listingId = isEdit ? action : null;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [providerSports, setProviderSports] = useState<{ slug: string; name: string }[]>([]);
  
  // --- CITY STATE MANAGEMENT ---
  const [cities, setCities] = useState<{ id: string; name: string; country?: string }[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [showCityResults, setShowCityResults] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{
    id: string;
    name: string;
    country?: string;
  } | null>(null);
  
  // --- ITINERARY STATE ---
  const [newItineraryDay, setNewItineraryDay] = useState({ title: '', description: '' });

  // --- MAIN FORM STATE ---
  const [formData, setFormData] = useState({
    title: '',
    type: ListingType.SESSION, 
    sport: '',
    price: '',
    currency: 'EUR',
    description: '',
    city: '',     
    
    // -- NEW: GLOBAL EXPERT FIELDS --
    languages: [] as string[],
    meetingPoint: '', 
    googleMapsLink: '',
    accessType: 'EASY', // EASY, HIKE, 4x4, BOAT_ONLY
    mustKnowSwimming: false,
    badWeatherAlternative: '', // "Plan B"

    // Difficulty
    universalLevel: UniversalLevel.BEGINNER,
    technicalGrade: '', 
    physicalIntensity: 2,
    
    // -- SESSION / EXPERIENCE --
    sessionDuration: 2, 
    schedulingType: SchedulingType.FIXED_SLOTS,
    timeRangeStart: '11:00',
    timeRangeEnd: '18:00',
    isPrivate: false,
    groupRatio: 4, 
    sessionGear: true,
    // Expert Experience Fields
    minAge: 0,
    maxWeight: 0,
    // Tech Amenities
    techRadio: false,       // BbTalkin
    techVideo: false,       // Video Analysis
    techDrone: false,       // Drone Footage
    techBoat: false,        // Boat Support

    // --- EXPERIENCE: Bragging Rights Metrics ---
    experienceAltitude: '',          // e.g. "4000m / 13000ft"
    experienceDepth: '',             // e.g. "12m"
    totalDurationLabel: '',           // e.g. "3 Hours Total"
    actionDurationLabel: '',          // e.g. "45 Seconds Freefall"

    // --- EXPERIENCE: Media & Souvenirs ---
    mediaPackage: 'NONE' as 'NONE' | 'INCLUDED' | 'HANDCAM_EXTRA' | 'OUTSIDE_CAM_EXTRA',
    mediaDelivery: '',                // e.g. "Edited video in 48h"

    // --- EXPERIENCE: Spectators ---
    spectatorPolicy: 'FREE' as 'FREE' | 'PAID' | 'NOT_ALLOWED',
    spectatorViewAvailable: false,

    // --- EXPERIENCE: Arrival Logistics ---
    arrivalBufferMinutes: 0,          // minutes before slot

    // --- EXPERIENCE: Health & Safety ---
    zeroAlcoholPolicy: false,
    noFlyAfterDive: false,
    excludePregnancy: false,
    excludeEpilepsy: false,
    excludeHeartConditions: false,

    // --- EXPERIENCE: Fear Factor ---
    chickenOutPolicy: 'NO_REFUND' as 'NO_REFUND' | 'PARTIAL_REFUND' | 'FULL_REFUND',

    // -- COURSE --
    courseScope: CourseScope.RECREATIONAL,
    courseDays: 3,
    courseDailyHours: 2,
    courseCert: '',
    courseGear: true,
    
    // -- TRIP --
    // --- TRIP: Risk & Category ---
    tripCategory: 'ADVENTURE' as 'ADVENTURE' | 'EXPEDITION' | 'LUXURY' | 'TECHNICAL',
    riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME',

    // --- TRIP: Equipment ---
    mandatoryEquipment: '',
    recommendedEquipment: '',

   // --- TRIP: Expected Conditions ---
    expectedTempMin: '',
    expectedTempMax: '',
    expectedAltitudeMax: '',
    expectedConditionsNote: '',

    // --- TRIP: Physical Effort ---
    effortHoursPerDay: '',
    effortBackpackWeight: '',
    effortConsecutiveDays: '',
    physicalEffortNote: '',

    // --- TRIP: Participation Policy ---
    participationPolicyExtra: '',
    tripStart: '',
    tripEnd: '',
    tripStartLoc: '', 
    tripEndLoc: '',   
    tripItinerary: [] as { title: string; description: string }[],
    minGuests: 1,
    maxGuests: 8,
    staffRatio: '1:4',
    accommodationStyle: 'HOTEL',
    foodPolicy: 'BREAKFAST', 
    tripTransport: true,
    gearProvided: '',
    gearRequired: '',
    skillPrerequisites: '',

    // --- TRIP: Route & Bases ---
    tripRouteType: 'SINGLE' as 'SINGLE' | 'MULTI',
    tripBases: [] as { location: string; nights?: number }[],
    tripMovementNote: '',

    // -- RENT (EXPERT FIELDS) --
    rentCategory: RentalCategory.FULL_SET,
    rentBilling: 'DAY',
    rentDeposit: 0,
    rentSizes: '', 
    rentBrand: '',
    rentModelYear: new Date().getFullYear(),
    rentCondition: 'EXCELLENT', // NEW, EXCELLENT, FAIR
    rentRescueIncluded: false,  
    rentDamageWaiver: false,
    rentComponentsIncluded: '', 
    
    // -- COMMON --
    images: [] as string[],
    seasonMonths: [] as number[], 
    weeklySchedule: {
        mon: { open: true, start: '09:00', end: '18:00' },
        tue: { open: true, start: '09:00', end: '18:00' },
        wed: { open: true, start: '09:00', end: '18:00' },
        thu: { open: true, start: '09:00', end: '18:00' },
        fri: { open: true, start: '09:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '18:00' },
        sun: { open: false, start: '09:00', end: '18:00' },
    }
  });

  // 1. Load Data
  useEffect(() => {
    const init = async () => {
      let loadedSports: { slug: string; name: string }[] = [];
      try {
        const res = await getMyProviderSports();
        const rawArray = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];

        loadedSports = rawArray.map((item: any) => {
            if (item?.slug && item?.name) return { slug: String(item.slug), name: String(item.name) };
            if (item?.sport?.slug) return { slug: String(item.sport.slug), name: String(item.sport.name || item.sport.slug) };
            if (typeof item === 'string') return { slug: item, name: item };
            return null;
        }).filter(Boolean) as { slug: string; name: string }[];

        setProviderSports(loadedSports);
        
        if (!isEdit && !formData.sport && loadedSports.length > 0) {
          setFormData(prev => ({ ...prev, sport: loadedSports[0].slug }));
        }
      } catch (e) {
        console.error('Failed to load provider sports', e);
      }

      // Load Existing Listing Data
      if (isEdit && listingId) {
        setFetchingData(true);
        try {
            const listing = await getListingById(listingId);
            
            if (listing) {
                const rawData = listing as any; 
                const d = listing.details || {};

                // Rehydrate City
                const listingCity = rawData.city
                  ? { id: rawData.city.id, name: rawData.city.name, country: rawData.city.country?.name || rawData.city.country_name }
                  : null;

                if (listingCity) {
                  setSelectedCity(listingCity);
                  setCityQuery(`${listingCity.name}${listingCity.country ? `, ${listingCity.country}` : ''}`);
                  setCities([listingCity]);
                }

                let sportSlug = listing.sport ? listing.sport.toLowerCase() : ''; 
                const foundSport = loadedSports.find(s => 
                    s.name === listing.sport || 
                    s.slug === listing.sport || 
                    s.slug === listing.sport.toLowerCase()
                );
                if (foundSport) sportSlug = foundSport.slug;

                const rawImages = listing.images || [];
                const safeImages = Array.isArray(rawImages) 
                    ? rawImages.map(cleanImageUrl).filter(url => url !== '') 
                    : [];

                setFormData(prev => ({
                    ...prev,
                    title: listing.title,
                    type: listing.type,
                    sport: sportSlug,
                    price: String(listing.price),
                    currency: listing.currency,
                    description: listing.description || '',
                    city: rawData.city?.id || '', 
                    images: safeImages,
                    
                    // REHYDRATE GLOBAL EXPERT FIELDS
                    languages: d.languages || ['English'],
                    meetingPoint: d.meetingPoint || '',
                    googleMapsLink: d.googleMapsLink || '',
                    accessType: d.accessType || 'EASY',
                    mustKnowSwimming: d.mustKnowSwimming || false,
                    badWeatherAlternative: d.badWeatherAlternative || '',
                    
                    universalLevel: listing.universalLevel || UniversalLevel.BEGINNER,
                    technicalGrade: listing.technicalGrade || '',
                    physicalIntensity: listing.physicalIntensity || 2,

                    // Rehydrate Session/Experience
                    sessionDuration: d.durationHours || 2,
                    schedulingType: d.schedulingType || SchedulingType.FIXED_SLOTS,
                    timeRangeStart: d.timeRangeStart || '11:00',
                    timeRangeEnd: d.timeRangeEnd || '18:00',
                    isPrivate: d.isPrivate || false,
                    groupRatio: d.maxGroupSize || 4,
                    sessionGear: d.gearIncluded || false,
                    minAge: d.minAge || 0,
                    maxWeight: d.maxWeight || 0,
                    techRadio: d.techRadio || false,
                    techVideo: d.techVideo || false,
                    techDrone: d.techDrone || false,
                    techBoat: d.techBoat || false,

                    // --- EXPERIENCE: Bragging Rights Metrics ---
                    experienceAltitude: d.experienceAltitude || '',
                    experienceDepth: d.experienceDepth || '',
                    totalDurationLabel: d.totalDurationLabel || '',
                    actionDurationLabel: d.actionDurationLabel || '',

                    // --- EXPERIENCE: Media & Souvenirs ---
                    mediaPackage: d.mediaPackage || 'NONE',
                    mediaDelivery: d.mediaDelivery || '',

                    // --- EXPERIENCE: Spectators ---
                    spectatorPolicy: d.spectatorPolicy || 'FREE',
                    spectatorViewAvailable: !!d.spectatorViewAvailable,

                    // --- EXPERIENCE: Arrival Logistics ---
                    arrivalBufferMinutes: d.arrivalBufferMinutes || 0,

                    // --- EXPERIENCE: Health & Safety ---
                    zeroAlcoholPolicy: !!d.zeroAlcoholPolicy,
                    noFlyAfterDive: !!d.noFlyAfterDive,
                    excludePregnancy: !!d.excludePregnancy,
                    excludeEpilepsy: !!d.excludeEpilepsy,
                    excludeHeartConditions: !!d.excludeHeartConditions,

                    // --- EXPERIENCE: Fear Factor ---
                    chickenOutPolicy: d.chickenOutPolicy || 'NO_REFUND',

                    // Rehydrate Course
                    courseScope: d.scope || CourseScope.RECREATIONAL,
                    courseDays: d.totalDays || 3,
                    courseDailyHours: d.dailyHours || 2,
                    courseCert: d.certificationName || '',
                    courseGear: d.gearIncluded || false,

                    // Rehydrate Trip
                    tripStart: d.startDate || '',
                    tripEnd: d.endDate || '',
                    tripStartLoc: d.startLocation || '',
                    tripEndLoc: d.endLocation || '',
                    tripItinerary: d.itinerary || [],
                    minGuests: d.minGuests || 1,
                    maxGuests: d.maxGuests || 8,
                    staffRatio: d.staffRatio || '1:4',
                    accommodationStyle: d.accommodationStyle || 'HOTEL',
                    foodPolicy: d.foodPolicy || 'BREAKFAST',
                    tripTransport: d.transportIncluded || false,
                    gearProvided: d.gearProvided || '',
                    gearRequired: d.gearRequired || '',
                    skillPrerequisites: d.skillPrerequisites || '',
                    // --- TRIP: Risk & Safety (NEW) ---
                    tripCategory: d.tripCategory || 'ADVENTURE',
                    riskLevel: d.riskLevel || 'LOW',

                    mandatoryEquipment: d.mandatoryEquipment || '',
                    recommendedEquipment: d.recommendedEquipment || '',

                    expectedTempMin: d.expectedConditions?.tempMin ?? '',
                    expectedTempMax: d.expectedConditions?.tempMax ?? '',
                    expectedAltitudeMax: d.expectedConditions?.altitudeMax ?? '',
                    expectedConditionsNote: d.expectedConditions?.note ?? '',

                    effortHoursPerDay: d.physicalEffort?.hoursPerDay ?? '',
                    effortBackpackWeight: d.physicalEffort?.backpackWeight ?? '',
                    effortConsecutiveDays: d.physicalEffort?.consecutiveDays ?? '',
                    physicalEffortNote: d.physicalEffort?.note ?? '',

                    participationPolicyExtra: d.participationPolicyExtra || '',
                    // --- TRIP: Route & Bases ---
                    tripRouteType: d.tripRouteType || 'SINGLE',
                    tripBases: d.tripBases || [],
                    tripMovementNote: d.tripMovementNote || '',

                    // Rehydrate Rent (Expert)
                    rentCategory: d.category || RentalCategory.FULL_SET,
                    rentBilling: d.billingPeriod || 'DAY',
                    rentDeposit: d.depositAmount || 0,
                    rentSizes: d.sizes ? d.sizes.join(', ') : '',
                    rentBrand: d.brand || '',
                    rentModelYear: d.modelYear || new Date().getFullYear(),
                    rentCondition: d.condition || 'EXCELLENT',
                    rentRescueIncluded: d.rescueIncluded || false,
                    rentDamageWaiver: d.damageWaiver || false,
                    rentComponentsIncluded: d.componentsIncluded || '',

                    seasonMonths: d.seasonMonths || [],
                    weeklySchedule: d.weeklySchedule || prev.weeklySchedule
                }));
            }
        } catch (error) {
            console.error("Error fetching listing details:", error);
        } finally {
            setFetchingData(false);
        }
      }
    };

    init();
  }, [isEdit, listingId]);

  // --- AUTO-ITINERARY GENERATOR ---
  useEffect(() => {
    if (formData.type !== ListingType.TRIP || !formData.tripStart || !formData.tripEnd) return;
    const start = new Date(formData.tripStart);
    const end = new Date(formData.tripEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    if (start > end) return; 

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setFormData(prev => {
        const currentItinerary = prev.tripItinerary || [];
        if (currentItinerary.length === totalDays) return prev;

        let newItinerary = [...currentItinerary];
        if (totalDays > currentItinerary.length) {
            const needed = totalDays - currentItinerary.length;
            const emptyDays = Array(needed).fill(null).map(() => ({ title: '', description: '' }));
            newItinerary = [...newItinerary, ...emptyDays];
        } else {
            newItinerary = newItinerary.slice(0, totalDays);
        }
        return { ...prev, tripItinerary: newItinerary };
    });

  }, [formData.tripStart, formData.tripEnd, formData.type]);

  // --- ACTIONS ---
  const handleCitySearch = async (q: string) => {
      setCityQuery(q);
      if (!q || q.length < 2) return;
      try {
          const res = await searchCities(q);
          const results = Array.isArray(res) ? res : res.results || [];
          setCities(results.map((c: any) => ({
              id: c.id,
              name: c.name,
              country: c.country_name
          })));
      } catch (e) {
          console.error("City search failed", e);
      }
  };

  const addItineraryDay = () => {
    setFormData(prev => ({
      ...prev,
      tripItinerary: [
        ...prev.tripItinerary,
        {
          title: newItineraryDay.title || `Extra Day ${prev.tripItinerary.length + 1}`,
          description: newItineraryDay.description || ''
        }
      ]
    }));
    setNewItineraryDay({ title: '', description: '' });
  };

  const removeItineraryDay = (index: number) => {
      setFormData(prev => ({
          ...prev,
          tripItinerary: prev.tripItinerary.filter((_, i) => i !== index)
      }));
  };

  const updateItineraryDay = (index: number, field: 'title'|'description', value: string) => {
    setFormData(prev => {
        const updated = [...prev.tripItinerary];
        updated[index] = { ...updated[index], [field]: value };
        return { ...prev, tripItinerary: updated };
    });
  };

  const toggleMonth = (m: number) => {
      if (formData.seasonMonths.includes(m)) {
          setFormData({ ...formData, seasonMonths: formData.seasonMonths.filter(x => x !== m) });
      } else {
          setFormData({ ...formData, seasonMonths: [...formData.seasonMonths, m].sort((a,b) => a-b) });
      }
  };

  const toggleLanguage = (lang: string) => {
      if (formData.languages.includes(lang)) {
          setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
      } else {
          setFormData({ ...formData, languages: [...formData.languages, lang] });
      }
  };

  // --- VALIDATION ---
  const validateStep = (currentStep: number) => {
      if (currentStep === 1) {
          if (!formData.title.trim()) { alert("Title is required."); return false; }
          if (!formData.description.trim()) { alert("Description is required."); return false; }
          if (!formData.sport) { alert("Please select a Sport."); return false; }
          if (formData.type === ListingType.TRIP) {
              if (!formData.tripStart || !formData.tripEnd) { alert("Trips require start and end dates."); return false; }
          }
      }
      if (currentStep === 2) {
          if (formData.type !== ListingType.TRIP && formData.seasonMonths.length === 0) {
              alert("Please select at least one operating month.");
              return false;
          }
      }
      // --- TRIP: HARD VALIDATION FOR HIGH / EXTREME RISK ---
      if (
             formData.type === ListingType.TRIP &&
             (formData.riskLevel === 'HIGH' || formData.riskLevel === 'EXTREME')
            ) {
          if (!formData.mandatoryEquipment.trim()) {
             alert("High-risk trips require Mandatory Equipment.");
             return false;
            }

          if (!formData.expectedTempMin || !formData.expectedAltitudeMax) {
            alert("High-risk trips require Expected Conditions (temperature & altitude).");
            return false;
        }

          if (!formData.effortHoursPerDay) {
            alert("High-risk trips require Physical Effort information.");
            return false;
            }
        }
      return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep(s => (s < 3 ? (s + 1) as any : s)); };
  const prevStep = () => setStep(s => (s > 1 ? (s - 1) as any : s));
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // --- SUBMIT: FACTORY LOGIC ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (Number(formData.price) <= 0) { alert("Price must be greater than 0."); setLoading(false); return; }
    if (!formData.city) { alert("City is required."); setLoading(false); return; }
    if (formData.images.length < 5) { alert(`You must upload at least 5 photos. (Currently: ${formData.images.length})`); setLoading(false); return; }

    let details: any = {
        // Global Expert Fields
        languages: formData.languages,
        meetingPoint: formData.meetingPoint,
        googleMapsLink: formData.googleMapsLink,
        seasonMonths: formData.seasonMonths,
        accessType: formData.accessType,
        mustKnowSwimming: formData.mustKnowSwimming,
        badWeatherAlternative: formData.badWeatherAlternative
    };

    switch (formData.type) {
        case ListingType.SESSION:
        case ListingType.EXPERIENCE:
            details = {
                ...details,
                durationHours: Number(formData.sessionDuration),
                schedulingType: formData.schedulingType,
                isPrivate: formData.isPrivate,
                maxGroupSize: formData.isPrivate ? 1 : Number(formData.groupRatio),
                gearIncluded: formData.sessionGear,
                weeklySchedule: formData.weeklySchedule,
                minAge: Number(formData.minAge),
                maxWeight: Number(formData.maxWeight),
                // Tech Amenities
                techRadio: formData.techRadio,
                techVideo: formData.techVideo,
                techDrone: formData.techDrone,
                techBoat: formData.techBoat,
                ...(formData.type === ListingType.EXPERIENCE
                  ? {
                      // Bragging Rights
                      experienceAltitude: formData.experienceAltitude,
                      experienceDepth: formData.experienceDepth,
                      totalDurationLabel: formData.totalDurationLabel,
                      actionDurationLabel: formData.actionDurationLabel,

                      // Media
                      mediaPackage: formData.mediaPackage,
                      mediaDelivery: formData.mediaDelivery,

                      // Spectators
                      spectatorPolicy: formData.spectatorPolicy,
                      spectatorViewAvailable: formData.spectatorViewAvailable,

                      // Arrival logistics
                      arrivalBufferMinutes: Number(formData.arrivalBufferMinutes),

                      // Health & safety
                      zeroAlcoholPolicy: formData.zeroAlcoholPolicy,
                      noFlyAfterDive: formData.noFlyAfterDive,
                      excludePregnancy: formData.excludePregnancy,
                      excludeEpilepsy: formData.excludeEpilepsy,
                      excludeHeartConditions: formData.excludeHeartConditions,

                      // Fear factor
                      chickenOutPolicy: formData.chickenOutPolicy,
                    }
                  : {})
            };
            if (formData.schedulingType === SchedulingType.WIND_DEPENDENT) {
                details.timeRangeStart = formData.timeRangeStart;
                details.timeRangeEnd = formData.timeRangeEnd;
            }
            break;

        case ListingType.COURSE:
            details = {
                ...details,
                scope: formData.courseScope,
                totalDays: Number(formData.courseDays),
                dailyHours: Number(formData.courseDailyHours),
                gearIncluded: formData.courseGear,
                // Tech Amenities
                techRadio: formData.techRadio,
                techVideo: formData.techVideo,
                techDrone: formData.techDrone,
                techBoat: formData.techBoat
            };
            if (formData.courseScope === CourseScope.PROFESSIONAL) {
                details.certificationName = formData.courseCert;
            }
            break;

        case ListingType.TRIP:
                details = {
                    ...details,
                startDate: formData.tripStart,
                 endDate: formData.tripEnd,
                startLocation: formData.tripStartLoc,
                endLocation: formData.tripEndLoc,
                minGuests: Number(formData.minGuests),
                maxGuests: Number(formData.maxGuests),
                staffRatio: formData.staffRatio,
                itinerary: formData.tripItinerary,
                accommodationStyle: formData.accommodationStyle,
                foodPolicy: formData.foodPolicy,
                transportIncluded: formData.tripTransport,

                // --- NEW: Risk & Safety ---
                tripCategory: formData.tripCategory,
                riskLevel: formData.riskLevel,

                mandatoryEquipment: formData.mandatoryEquipment,
                recommendedEquipment: formData.recommendedEquipment,

                expectedConditions: {
                tempMin: formData.expectedTempMin,
                tempMax: formData.expectedTempMax,
                altitudeMax: formData.expectedAltitudeMax,
                note: formData.expectedConditionsNote,
                },

                physicalEffort: {
                hoursPerDay: formData.effortHoursPerDay,
                backpackWeight: formData.effortBackpackWeight,
                consecutiveDays: formData.effortConsecutiveDays,
                note: formData.physicalEffortNote,
                },

                participationPolicyExtra: formData.participationPolicyExtra,

                // --- TRIP: Route & Bases ---
                tripRouteType: formData.tripRouteType,
                tripBases: formData.tripBases,
                tripMovementNote: formData.tripMovementNote,

                // legacy (dejamos por compatibilidad)
                gearProvided: formData.gearProvided,
                gearRequired: formData.gearRequired,
                skillPrerequisites: formData.skillPrerequisites,
            };
            break;

        case ListingType.RENT:
            details = {
                ...details,
                category: formData.rentCategory,
                billingPeriod: formData.rentBilling,
                depositAmount: Number(formData.rentDeposit),
                sizes: formData.rentSizes.split(',').map(s => s.trim()),
                weeklySchedule: formData.weeklySchedule,
                // Expert Rental Fields
                brand: formData.rentBrand,
                modelYear: Number(formData.rentModelYear),
                condition: formData.rentCondition,
                damageWaiver: formData.rentDamageWaiver,
                rescueIncluded: formData.rentRescueIncluded,
                componentsIncluded: formData.rentComponentsIncluded
            };
            break;
    }

    const finalImages = formData.images.map(cleanImageUrl).filter(x => x && typeof x === 'string');
    const payload = {
        title: formData.title,
        type: formData.type,
        sport: formData.sport.toLowerCase(),
        description: formData.description,
        price: Number(formData.price),
        currency: 'EUR', 
        universal_level: formData.universalLevel,
        technical_grade: formData.technicalGrade,
        physical_intensity: formData.physicalIntensity,
        city: formData.city,
        status: 'ACTIVE',
        details: details,
        images: finalImages, 
    };

    console.log("Submitting Expert Payload:", payload);

    try {
        if (isEdit && listingId) {
            const success = await updateListing(listingId, payload);
            if (success) navigate('/dashboard'); else alert("Server rejected the update.");
        } else {
            await createListing(payload);
            navigate('/dashboard');
        }
    } catch (error) {
        console.error("Submission error", error);
        alert("An error occurred during submission.");
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER TYPE FIELDS ---
  const renderTypeSpecificFields = () => {
      switch (formData.type) {
          case ListingType.SESSION:
              return (
                  <div className="space-y-4 animate-in fade-in">
                      <div className="flex gap-4 bg-gray-50 p-4 rounded-xl">
                          <div className="flex-1">
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Class Type</label>
                              <div className="flex gap-2">
                                  <button type="button" onClick={() => setFormData({...formData, isPrivate: false})} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${!formData.isPrivate ? 'bg-white border-brand-500 text-brand-700' : 'border-gray-300 text-gray-500'}`}>Group</button>
                                  <button type="button" onClick={() => setFormData({...formData, isPrivate: true})} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${formData.isPrivate ? 'bg-white border-brand-500 text-brand-700' : 'border-gray-300 text-gray-500'}`}>Private</button>
                              </div>
                          </div>
                          {!formData.isPrivate && (
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Student Ratio</label>
                                  <input type="number" value={formData.groupRatio} onChange={e => setFormData({...formData, groupRatio: Number(e.target.value)})} className="w-full border-gray-300 rounded-lg p-2" placeholder="Students per instructor" />
                              </div>
                          )}
                      </div>

                      {/* TECH AMENITIES (EXPERT FEATURE) */}
                      <div className="bg-white border border-gray-200 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center"><Mic className="w-3 h-3 mr-1"/> Tech & Amenities</label>
                          <div className="grid grid-cols-2 gap-2">
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                 <input type="checkbox" checked={formData.techRadio} onChange={e => setFormData({...formData, techRadio: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Radio (BbTalkin)</span>
                             </label>
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                 <input type="checkbox" checked={formData.techVideo} onChange={e => setFormData({...formData, techVideo: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Video Analysis</span>
                             </label>
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                 <input type="checkbox" checked={formData.techDrone} onChange={e => setFormData({...formData, techDrone: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Drone Footage</span>
                             </label>
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                 <input type="checkbox" checked={formData.techBoat} onChange={e => setFormData({...formData, techBoat: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Boat Support</span>
                             </label>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Duration (Hours)</label>
                            <input type="number" value={formData.sessionDuration} onChange={e => setFormData({...formData, sessionDuration: Number(e.target.value)})} className="w-full border-gray-300 rounded-xl p-3" placeholder="e.g. 2" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Scheduling Mode</label>
                            <select value={formData.schedulingType} onChange={e => setFormData({...formData, schedulingType: e.target.value as any})} className="w-full border-gray-300 rounded-xl p-3 bg-white">
                                <option value={SchedulingType.FIXED_SLOTS}>Fixed Slots (10am, 2pm)</option>
                                <option value={SchedulingType.ON_REQUEST}>On Request</option>
                                <option value={SchedulingType.WIND_DEPENDENT}>Wind Dependent (Flexible)</option>
                            </select>
                          </div>
                      </div>
                      {formData.schedulingType === SchedulingType.WIND_DEPENDENT && (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                              <CloudFog className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                              <div className="w-full">
                                  <h4 className="text-sm font-bold text-blue-900">Flexible Window</h4>
                                  <p className="text-xs text-blue-700 mb-3">Define the operating window. Exact time confirmed 24h prior based on forecast.</p>
                                  <div className="flex gap-4">
                                      <div>
                                          <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Earliest Start</label>
                                          <input type="time" value={formData.timeRangeStart} onChange={e => setFormData({...formData, timeRangeStart: e.target.value})} className="w-full border-blue-200 rounded-lg p-2 text-sm" />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Latest Finish</label>
                                          <input type="time" value={formData.timeRangeEnd} onChange={e => setFormData({...formData, timeRangeEnd: e.target.value})} className="w-full border-blue-200 rounded-lg p-2 text-sm" />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                      <div className="flex items-center pt-2">
                           <input type="checkbox" checked={formData.sessionGear} onChange={e => setFormData({...formData, sessionGear: e.target.checked})} className="w-5 h-5 text-brand-600 rounded mr-2" />
                           <span className="text-sm font-bold text-gray-700">Equipment Included?</span>
                      </div>
                  </div>
              );
          case ListingType.EXPERIENCE:
              return (
                <div className="space-y-6">

                  {/* Bragging Rights */}
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <h4 className="text-xs font-black text-yellow-900 uppercase mb-3">Key Stats (Bragging Rights)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <input type="text" placeholder="Altitude / Height" value={formData.experienceAltitude} onChange={e => setFormData({...formData, experienceAltitude: e.target.value})} className="border rounded-lg p-2 text-xs" />
                      <input type="text" placeholder="Depth (if applicable)" value={formData.experienceDepth} onChange={e => setFormData({...formData, experienceDepth: e.target.value})} className="border rounded-lg p-2 text-xs" />
                      <input type="text" placeholder="Total Duration" value={formData.totalDurationLabel} onChange={e => setFormData({...formData, totalDurationLabel: e.target.value})} className="border rounded-lg p-2 text-xs" />
                      <input type="text" placeholder="Action Duration" value={formData.actionDurationLabel} onChange={e => setFormData({...formData, actionDurationLabel: e.target.value})} className="border rounded-lg p-2 text-xs" />
                    </div>
                  </div>

                  {/* Media */}
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <h4 className="text-xs font-black text-purple-900 uppercase mb-3">Media & Souvenirs</h4>
                    <select value={formData.mediaPackage} onChange={e => setFormData({...formData, mediaPackage: e.target.value as any})} className="w-full border rounded-lg p-2 text-xs mb-2">
                      <option value="NONE">Not Available</option>
                      <option value="INCLUDED">Included in Price</option>
                      <option value="HANDCAM_EXTRA">Extra Cost (Handcam)</option>
                      <option value="OUTSIDE_CAM_EXTRA">Extra Cost (Outside Cameraman)</option>
                    </select>
                    <input type="text" placeholder="Delivery format" value={formData.mediaDelivery} onChange={e => setFormData({...formData, mediaDelivery: e.target.value})} className="w-full border rounded-lg p-2 text-xs" />
                  </div>

                  {/* Spectators */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h4 className="text-xs font-black text-blue-900 uppercase mb-3">Spectators</h4>
                    <select value={formData.spectatorPolicy} onChange={e => setFormData({...formData, spectatorPolicy: e.target.value as any})} className="w-full border rounded-lg p-2 text-xs mb-2">
                      <option value="FREE">Allowed (Free)</option>
                      <option value="PAID">Allowed (Extra Cost)</option>
                      <option value="NOT_ALLOWED">Not Allowed</option>
                    </select>
                    <label className="flex items-center text-xs font-bold text-gray-700">
                      <input type="checkbox" checked={formData.spectatorViewAvailable} onChange={e => setFormData({...formData, spectatorViewAvailable: e.target.checked})} className="mr-2" />
                      Viewing Area / Bar Available
                    </label>
                  </div>

                  {/* Arrival */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-black text-gray-800 uppercase">Arrival Buffer (minutes before)</label>
                    <input type="number" min={0} value={formData.arrivalBufferMinutes} onChange={e => setFormData({...formData, arrivalBufferMinutes: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-xs mt-2" />
                  </div>

                  {/* Health */}
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="text-xs font-black text-red-900 uppercase mb-3">Health & Safety Exclusions</h4>
                    {[
                      ['zeroAlcoholPolicy', 'Zero Alcohol Policy'],
                      ['noFlyAfterDive', 'No flying after diving'],
                      ['excludePregnancy', 'Pregnancy excluded'],
                      ['excludeEpilepsy', 'Epilepsy excluded'],
                      ['excludeHeartConditions', 'Heart conditions excluded'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center text-xs font-bold text-gray-700 mb-1">
                        <input type="checkbox" checked={(formData as any)[key]} onChange={e => setFormData({...formData, [key]: e.target.checked})} className="mr-2" />
                        {label}
                      </label>
                    ))}
                  </div>

                  {/* Fear Factor */}
                  <div className="bg-black text-white p-4 rounded-xl">
                    <h4 className="text-xs font-black uppercase mb-3">Chicken Out Policy</h4>
                    <select value={formData.chickenOutPolicy} onChange={e => setFormData({...formData, chickenOutPolicy: e.target.value as any})} className="w-full text-black rounded-lg p-2 text-xs">
                      <option value="NO_REFUND">No Refund</option>
                      <option value="PARTIAL_REFUND">Partial Refund</option>
                      <option value="FULL_REFUND">Full Refund</option>
                    </select>
                  </div>

                </div>
              );
          case ListingType.COURSE:
              return (
                  <div className="space-y-4 animate-in fade-in">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <label className="block text-xs font-bold text-blue-800 uppercase mb-3">Course Goal</label>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setFormData({...formData, courseScope: CourseScope.RECREATIONAL})} className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${formData.courseScope === CourseScope.RECREATIONAL ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                                    <div className="flex items-center mb-1"><div className="p-1.5 bg-green-100 rounded-lg mr-2 text-green-700"><Check className="w-4 h-4"/></div><span className="font-bold text-gray-900">Learn the Sport</span></div>
                                </button>
                                <button type="button" onClick={() => setFormData({...formData, courseScope: CourseScope.PROFESSIONAL})} className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${formData.courseScope === CourseScope.PROFESSIONAL ? 'border-blue-500 bg-white ring-2 ring-blue-200' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                                    <div className="flex items-center mb-1"><div className="p-1.5 bg-purple-100 rounded-lg mr-2 text-purple-700"><GraduationCap className="w-4 h-4"/></div><span className="font-bold text-gray-900">Become a Pro</span></div>
                                </button>
                            </div>
                        </div>

                        {/* TECH AMENITIES (Copy from Session) */}
                        <div className="bg-white border border-gray-200 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center"><Mic className="w-3 h-3 mr-1"/> Tech & Amenities</label>
                          <div className="grid grid-cols-2 gap-2">
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={formData.techRadio} onChange={e => setFormData({...formData, techRadio: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Radio (BbTalkin)</span></label>
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={formData.techVideo} onChange={e => setFormData({...formData, techVideo: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Video Analysis</span></label>
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={formData.techDrone} onChange={e => setFormData({...formData, techDrone: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Drone Footage</span></label>
                             <label className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={formData.techBoat} onChange={e => setFormData({...formData, techBoat: e.target.checked})} className="rounded text-brand-600 mr-2"/> <span className="text-xs">Boat Support</span></label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Total Days</label>
                                <input type="number" value={formData.courseDays} onChange={e => setFormData({...formData, courseDays: Number(e.target.value)})} className="w-full border-gray-300 rounded-xl p-3" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Hours per Day</label>
                                <input type="number" value={formData.courseDailyHours} onChange={e => setFormData({...formData, courseDailyHours: Number(e.target.value)})} className="w-full border-gray-300 rounded-xl p-3" />
                            </div>
                        </div>
                        {formData.courseScope === CourseScope.PROFESSIONAL && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Certification Name</label>
                                <input type="text" value={formData.courseCert} onChange={e => setFormData({...formData, courseCert: e.target.value})} className="w-full border-gray-300 rounded-xl p-3" placeholder="e.g. IKO Level 1" />
                            </div>
                        )}
                        <div className="flex items-center">
                           <input type="checkbox" checked={formData.courseGear} onChange={e => setFormData({...formData, courseGear: e.target.checked})} className="w-5 h-5 text-brand-600 rounded mr-2" />
                           <span className="text-sm font-bold text-gray-700">Equipment Included?</span>
                        </div>
                  </div>
              );
          case ListingType.TRIP:
              return (
                  <div className="space-y-6 animate-in fade-in">
                       <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                           <h4 className="flex items-center text-sm font-bold text-orange-900 mb-3">
                               <Map className="w-4 h-4 mr-2"/> Dates & Route
                           </h4>
                           <div className="grid grid-cols-2 gap-4 mb-4">
                               <div>
                                   <label className="block text-[10px] font-bold text-orange-800 uppercase mb-1">Start Date</label>
                                   <input type="date" value={formData.tripStart} onChange={e => setFormData({...formData, tripStart: e.target.value})} className="w-full border-orange-200 rounded-lg p-2 text-sm" />
                               </div>
                               <div>
                                   <label className="block text-[10px] font-bold text-orange-800 uppercase mb-1">End Date</label>
                                   <input type="date" value={formData.tripEnd} onChange={e => setFormData({...formData, tripEnd: e.target.value})} className="w-full border-orange-200 rounded-lg p-2 text-sm" />
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-[10px] font-bold text-orange-800 uppercase mb-1">Departure Point</label>
                                   <input type="text" value={formData.tripStartLoc} onChange={e => setFormData({...formData, tripStartLoc: e.target.value})} placeholder="e.g. Geneva" className="w-full border-orange-200 rounded-lg p-2 text-sm" />
                               </div>
                               <div>
                                   <label className="block text-[10px] font-bold text-orange-800 uppercase mb-1">End Point</label>
                                   <input type="text" value={formData.tripEndLoc} onChange={e => setFormData({...formData, tripEndLoc: e.target.value})} placeholder="e.g. Chamonix" className="w-full border-orange-200 rounded-lg p-2 text-sm" />
                               </div>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Min Guests</label>
                               <input type="number" value={formData.minGuests} onChange={e => setFormData({...formData, minGuests: Number(e.target.value)})} className="w-full border-gray-300 rounded-xl p-2.5 text-sm" />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Max Guests</label>
                               <input type="number" value={formData.maxGuests} onChange={e => setFormData({...formData, maxGuests: Number(e.target.value)})} className="w-full border-gray-300 rounded-xl p-2.5 text-sm" />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Staff Ratio</label>
                               <input type="text" value={formData.staffRatio} onChange={e => setFormData({...formData, staffRatio: e.target.value})} placeholder="1:4" className="w-full border-gray-300 rounded-xl p-2.5 text-sm" />
                           </div>
                       </div>
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                    <h4 className="flex items-center text-sm font-bold text-blue-900">
                        <MapPin className="w-4 h-4 mr-2" />
                             Route & Bases
                    </h4>

                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Trip Type</label>
                             <select
                                value={formData.tripRouteType}
                                onChange={e =>
                                setFormData({ ...formData, tripRouteType: e.target.value as any })
                                }
                            className="w-full border rounded-lg p-2 text-sm"
                            >
                                <option value="SINGLE">Single Base</option>
                                <option value="MULTI">Multi-destination</option>
                            </select>
                        </div>

  {formData.tripRouteType === 'MULTI' && (
    <div className="space-y-3">
      {formData.tripBases.map((base, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Location / Zone"
            value={base.location}
            onChange={e => {
              const updated = [...formData.tripBases];
              updated[idx] = { ...updated[idx], location: e.target.value };
              setFormData({ ...formData, tripBases: updated });
            }}
            className="flex-1 border rounded-lg p-2 text-xs"
          />
          <input
            type="number"
            placeholder="Nights"
            value={base.nights ?? ''}
            onChange={e => {
              const updated = [...formData.tripBases];
              updated[idx] = { ...updated[idx], nights: Number(e.target.value) };
              setFormData({ ...formData, tripBases: updated });
            }}
            className="w-20 border rounded-lg p-2 text-xs"
          />
          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                tripBases: formData.tripBases.filter((_, i) => i !== idx),
              })
            }
            className="text-red-500 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setFormData({
            ...formData,
            tripBases: [...formData.tripBases, { location: '' }],
          })
        }
        className="text-xs font-bold text-blue-700"
      >
        + Add Base
      </button>

      <textarea
        rows={2}
        value={formData.tripMovementNote}
        onChange={e =>
          setFormData({ ...formData, tripMovementNote: e.target.value })
        }
        className="w-full border rounded-lg p-2 text-xs"
        placeholder="Route may change depending on weather / conditions."
      />
    </div>
  )}
</div>

                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                           <h4 className="flex items-center text-sm font-bold text-gray-900 mb-3">
                               <Activity className="w-4 h-4 mr-2"/> Itinerary Builder
                           </h4>
                           <div className="space-y-3 mb-3">
                               {formData.tripItinerary.map((day, idx) => (
                                   <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-gray-200">
                                       <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                           {idx + 1}
                                       </div>
                                       <div className="flex-grow space-y-2">
                                           <input 
                                                type="text" 
                                                value={day.title} 
                                                onChange={e => updateItineraryDay(idx, 'title', e.target.value)}
                                                className="w-full border-none p-0 text-sm font-bold placeholder-gray-400 focus:ring-0"
                                                placeholder={`Day ${idx + 1} Title`}
                                           />
                                           <textarea 
                                                rows={2}
                                                value={day.description} 
                                                onChange={e => updateItineraryDay(idx, 'description', e.target.value)}
                                                className="w-full border border-gray-100 rounded bg-gray-50 text-xs p-2 focus:ring-1 focus:ring-brand-500"
                                                placeholder="Describe the day's activities..."
                                           />
                                       </div>
                                       <button type="button" onClick={() => removeItineraryDay(idx)} className="text-gray-400 hover:text-red-500">
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               ))}
                           </div>
                           <div className="bg-white p-3 rounded-lg border border-gray-300 border-dashed">
                               <input 
                                   type="text" 
                                   placeholder="Extra Day Title"
                                   className="w-full text-sm font-bold border-none p-0 mb-2 focus:ring-0 placeholder-gray-400"
                                   value={newItineraryDay.title}
                                   onChange={e => setNewItineraryDay({ ...newItineraryDay, title: e.target.value })}
                               />
                               <button
                                 type="button"
                                 onClick={addItineraryDay}
                                 className="mt-2 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md text-xs font-bold flex items-center justify-center transition-colors"
                               >
                                   <Plus className="w-3 h-3 mr-1" /> Add Extra Day
                               </button>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Accommodation</label>
                               <select value={formData.accommodationStyle} onChange={e => setFormData({...formData, accommodationStyle: e.target.value})} className="w-full border-gray-300 rounded-xl p-2.5 text-sm bg-white">
                                   <option value="HOTEL">Hotel</option>
                                   <option value="BOAT">Boat / Liveaboard</option>
                                   <option value="CAMPING">Camping</option>
                                   <option value="HUT">Mountain Hut</option>
                                   <option value="NONE">None</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Food Policy</label>
                               <select value={formData.foodPolicy} onChange={e => setFormData({...formData, foodPolicy: e.target.value})} className="w-full border-gray-300 rounded-xl p-2.5 text-sm bg-white">
                                   <option value="ALL_INCLUSIVE">All Inclusive</option>
                                   <option value="FULL_BOARD">Full Board</option>
                                   <option value="HALF_BOARD">Half Board</option>
                                   <option value="BREAKFAST">Breakfast Only</option>
                                   <option value="SELF_CATERING">Self Catering</option>
                               </select>
                           </div>
                       </div>
                       <div className="flex items-center">
                           <input type="checkbox" checked={formData.tripTransport} onChange={e => setFormData({...formData, tripTransport: e.target.checked})} className="w-5 h-5 text-brand-600 rounded mr-2" />
                           <span className="text-sm font-bold text-gray-700">Internal Transport Included?</span>
                       </div>
                       <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-4">
  <h4 className="flex items-center text-sm font-bold text-red-900">
    <AlertTriangle className="w-4 h-4 mr-2" />
    Risk & Safety Requirements
  </h4>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-bold uppercase mb-1">Trip Category</label>
      <select value={formData.tripCategory}
        onChange={e => setFormData({ ...formData, tripCategory: e.target.value as any })}
        className="w-full border rounded-lg p-2 text-sm">
        <option value="ADVENTURE">Adventure</option>
        <option value="EXPEDITION">Expedition</option>
        <option value="LUXURY">Luxury</option>
        <option value="TECHNICAL">Technical</option>
      </select>
    </div>

    <div>
      <label className="block text-xs font-bold uppercase mb-1">Risk Level</label>
      <select value={formData.riskLevel}
        onChange={e => setFormData({ ...formData, riskLevel: e.target.value as any })}
        className="w-full border rounded-lg p-2 text-sm">
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="EXTREME">Extreme</option>
      </select>
    </div>
  </div>

  <div>
    <label className="block text-xs font-bold uppercase mb-1">
      Mandatory Equipment *
    </label>
    <textarea
      rows={3}
      value={formData.mandatoryEquipment}
      onChange={e => setFormData({ ...formData, mandatoryEquipment: e.target.value })}
      className="w-full border rounded-lg p-2 text-xs"
      placeholder="Helmet, avalanche transceiver, down jacket -10°C..."
    />
  </div>

  <div>
    <label className="block text-xs font-bold uppercase mb-1">
      Recommended Equipment
    </label>
    <textarea
      rows={2}
      value={formData.recommendedEquipment}
      onChange={e => setFormData({ ...formData, recommendedEquipment: e.target.value })}
      className="w-full border rounded-lg p-2 text-xs"
    />
  </div>
<div>
  <label className="block text-xs font-bold uppercase mb-1">
    Participation Policy (Trip-specific)
  </label>
  <textarea
    rows={2}
    value={formData.participationPolicyExtra}
    onChange={e =>
      setFormData({ ...formData, participationPolicyExtra: e.target.value })
    }
    className="w-full border rounded-lg p-2 text-xs"
    placeholder="e.g. Missing mandatory gear = no participation, no refund."
  />
</div>
</div>
<div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
  <h4 className="flex items-center text-sm font-bold text-gray-900">
    <Shield className="w-4 h-4 mr-2" />
    Conditions & Physical Reality
  </h4>

  <div className="grid grid-cols-2 gap-4">
    <input type="number" placeholder="Min Temp (°C)"
      value={formData.expectedTempMin}
      onChange={e => setFormData({ ...formData, expectedTempMin: e.target.value })}
      className="border rounded-lg p-2 text-xs" />

    <input type="number" placeholder="Max Temp (°C)"
      value={formData.expectedTempMax}
      onChange={e => setFormData({ ...formData, expectedTempMax: e.target.value })}
      className="border rounded-lg p-2 text-xs" />

    <input type="number" placeholder="Max Altitude (m)"
      value={formData.expectedAltitudeMax}
      onChange={e => setFormData({ ...formData, expectedAltitudeMax: e.target.value })}
      className="border rounded-lg p-2 text-xs" />

    <input type="number" placeholder="Hours / Day"
      value={formData.effortHoursPerDay}
      onChange={e => setFormData({ ...formData, effortHoursPerDay: e.target.value })}
      className="border rounded-lg p-2 text-xs" />

    <input type="number" placeholder="Backpack (kg)"
      value={formData.effortBackpackWeight}
      onChange={e => setFormData({ ...formData, effortBackpackWeight: e.target.value })}
      className="border rounded-lg p-2 text-xs" />

    <input type="number" placeholder="Consecutive Days"
      value={formData.effortConsecutiveDays}
      onChange={e => setFormData({ ...formData, effortConsecutiveDays: e.target.value })}
      className="border rounded-lg p-2 text-xs" />
  </div>

  <textarea
    rows={2}
    value={formData.physicalEffortNote}
    onChange={e => setFormData({ ...formData, physicalEffortNote: e.target.value })}
    className="w-full border rounded-lg p-2 text-xs"
    placeholder="This trip involves long days, cold exposure and carrying gear daily."
  />
</div>


                  </div>
              );
          case ListingType.RENT:
              return (
                  <div className="space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-4">
                          <button type="button" onClick={() => setFormData({...formData, rentCategory: RentalCategory.FULL_SET})} className={`p-3 rounded-lg border text-center text-sm font-bold ${formData.rentCategory === RentalCategory.FULL_SET ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200'}`}>Full Pack</button>
                          <button type="button" onClick={() => setFormData({...formData, rentCategory: RentalCategory.SINGLE_ITEM})} className={`p-3 rounded-lg border text-center text-sm font-bold ${formData.rentCategory === RentalCategory.SINGLE_ITEM ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200'}`}>Single Item</button>
                      </div>

                      {/* --- EXPERT RENTAL FIELDS --- */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                          <h4 className="flex items-center text-sm font-bold text-gray-900"><Anchor className="w-4 h-4 mr-2"/> Gear Specifications</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-1">
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Brand</label>
                                  <input type="text" value={formData.rentBrand} onChange={e => setFormData({...formData, rentBrand: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. Duotone" />
                              </div>
                              <div className="col-span-1">
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Year</label>
                                  <input type="number" value={formData.rentModelYear} onChange={e => setFormData({...formData, rentModelYear: Number(e.target.value)})} className="w-full border-gray-300 rounded-lg p-2 text-sm" placeholder="2024" />
                              </div>
                              <div className="col-span-1">
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Condition</label>
                                  <select value={formData.rentCondition} onChange={e => setFormData({...formData, rentCondition: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 text-sm bg-white">
                                      <option value="NEW">New (Unused)</option>
                                      <option value="EXCELLENT">Excellent</option>
                                      <option value="FAIR">Fair / Used</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Items Included (Be Specific)</label>
                              <input type="text" value={formData.rentComponentsIncluded} onChange={e => setFormData({...formData, rentComponentsIncluded: e.target.value})} className="w-full border-gray-300 rounded-lg p-2 text-sm" placeholder="e.g. Kite, Bar, Leash, Pump (No Harness)" />
                          </div>
                          <div className="flex gap-4 pt-2">
                             <label className="flex items-center cursor-pointer">
                                 <input type="checkbox" checked={formData.rentRescueIncluded} onChange={e => setFormData({...formData, rentRescueIncluded: e.target.checked})} className="w-4 h-4 text-brand-600 rounded mr-2" />
                                 <span className="text-xs font-bold text-red-600 flex items-center"><LifeBuoy className="w-3 h-3 mr-1"/> Rescue Service Included</span>
                             </label>
                             <label className="flex items-center cursor-pointer">
                                 <input type="checkbox" checked={formData.rentDamageWaiver} onChange={e => setFormData({...formData, rentDamageWaiver: e.target.checked})} className="w-4 h-4 text-brand-600 rounded mr-2" />
                                 <span className="text-xs font-bold text-gray-700">Damage Waiver (Insurance)</span>
                             </label>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Pricing Unit</label>
                              <select value={formData.rentBilling} onChange={e => setFormData({...formData, rentBilling: e.target.value as any})} className="w-full border-gray-300 rounded-xl p-3 bg-white">
                                  <option value="HOUR">Per Hour</option>
                                  <option value="DAY">Per Day</option>
                                  <option value="WEEK">Per Week</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Security Deposit ($)</label>
                              <input type="number" value={formData.rentDeposit} onChange={e => setFormData({...formData, rentDeposit: Number(e.target.value)})} className="w-full border-gray-300 rounded-xl p-3" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Available Sizes</label>
                          <input type="text" value={formData.rentSizes} onChange={e => setFormData({...formData, rentSizes: e.target.value})} className="w-full border-gray-300 rounded-xl p-3" placeholder="S, M, L, 7m, 9m, 12m" />
                      </div>
                  </div>
              );
          default:
              return null;
      }
  };

  if (fetchingData) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                  <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading listing details...</p>
              </div>
          </div>
      );
  }

  const cityInputValue = selectedCity
    ? `${selectedCity.name}${selectedCity.country ? `, ${selectedCity.country}` : ''}`
    : cityQuery;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/dashboard')} className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">
              {isEdit ? 'Edit Listing' : 'Create New Listing'}
            </h1>
            <span className="ml-4 text-xs font-bold text-gray-400">Step {step} of 3</span>
          </div>
          <div className="text-xs font-bold text-gray-400">
            Step {step} of 3
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                Product Definition <span className="ml-2 text-red-500 text-xs font-normal">(Required)</span>
              </h2>
              
              <div className="space-y-6">
                
                {/* MOVED TO TOP as requested */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Title *</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 font-medium" placeholder="e.g. Private Kitesurf Lesson" required />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Description *</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-gray-300 rounded-xl p-3" placeholder="What is included? What to bring?" required />
                </div>

                {/* GLOBAL EXPERT: Plan B */}
                {formData.type !== ListingType.RENT && (
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center"><Umbrella className="w-3 h-3 mr-1"/> Bad Weather Plan (Plan B)</label>
                        <input type="text" value={formData.badWeatherAlternative} onChange={e => setFormData({...formData, badWeatherAlternative: e.target.value})} className="w-full border-gray-300 rounded-xl p-3" placeholder="e.g. If no wind, we do wakeboarding or theory." />
                    </div>
                )}

                {/* GLOBAL EXPERT: Spoken Languages (Not for RENT) */}
                {formData.type !== ListingType.RENT && (
                  <div>
                     <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center"><Globe className="w-3 h-3 mr-1"/> Instructors speak</label>
                     <div className="flex flex-wrap gap-2">
                         {SPOKEN_LANGUAGES.map(lang => (
                             <button 
                                 key={lang} type="button" 
                                 onClick={() => toggleLanguage(lang)}
                                 className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${formData.languages.includes(lang) ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                             >
                                 {lang}
                             </button>
                         ))}
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Type *</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ListingType})} className="w-full border-gray-300 rounded-xl p-3 bg-white font-medium text-gray-900">
                      {Object.values(ListingType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Sport *</label>
                    <select
                      value={formData.sport}
                      onChange={e => setFormData({ ...formData, sport: e.target.value })}
                      className="w-full border-gray-300 rounded-xl p-3 bg-white"
                      required
                    >
                      <option value="">Select sport</option>
                      {providerSports.map(s => (
                        <option key={s.slug} value={s.slug}>
                          {s.name || s.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div key={formData.type} className="pt-4 border-t border-gray-100">
                    {renderTypeSpecificFields()}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
            {/* KEY-PROP PATTERN: Forces reset when switching Listing Type */}
            <div key={formData.type} className="animate-in fade-in">
                {formData.type !== ListingType.TRIP && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="w-8 h-8 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                        Availability <span className="ml-2 text-red-500 text-xs font-normal">(Required)</span>
                    </h2>
                    
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-3 flex items-center"><Sun className="w-4 h-4 mr-1 text-orange-500"/> Operating Months *</label>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {months.map((m, idx) => (
                                <button 
                                    type="button" 
                                    key={m} 
                                    onClick={() => toggleMonth(idx)}
                                    className={`py-2 text-xs font-bold rounded-lg border ${formData.seasonMonths.includes(idx) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-400 border-gray-200'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-3 flex items-center"><Clock className="w-4 h-4 mr-1 text-blue-500"/> Weekly Schedule</label>
                        <div className="space-y-2 border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                            {days.map(day => (
                                <div key={day} className="grid grid-cols-12 items-center p-3 bg-white">
                                    <div className="col-span-3 flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={(formData.weeklySchedule as any)[day].open}
                                            onChange={e => setFormData({...formData, weeklySchedule: { ...formData.weeklySchedule, [day]: { ...(formData.weeklySchedule as any)[day], open: e.target.checked } }})}
                                            className="mr-3 rounded text-brand-600"
                                        />
                                        <span className="uppercase text-xs font-bold text-gray-600">{day}</span>
                                    </div>
                                    {(formData.weeklySchedule as any)[day].open ? (
                                        <div className="col-span-9 flex items-center gap-2">
                                            <input type="time" value={(formData.weeklySchedule as any)[day].start} onChange={e => setFormData({...formData, weeklySchedule: { ...formData.weeklySchedule, [day]: { ...(formData.weeklySchedule as any)[day], start: e.target.value } }})} className="border-gray-300 rounded-lg text-xs p-1.5" />
                                            <span className="text-gray-400 text-xs">to</span>
                                            <input type="time" value={(formData.weeklySchedule as any)[day].end} onChange={e => setFormData({...formData, weeklySchedule: { ...formData.weeklySchedule, [day]: { ...(formData.weeklySchedule as any)[day], end: e.target.value } }})} className="border-gray-300 rounded-lg text-xs p-1.5" />
                                        </div>
                                    ) : (
                                        <div className="col-span-9 text-xs text-gray-400 italic">Closed</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                )}

                {/* Requirements Section - Not needed for RENT, maybe kept for others */}
                {formData.type !== ListingType.RENT && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center text-sm mr-3">3</span>
                    Requirements & Logistics
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center"><Target className="w-4 h-4 mr-1 text-brand-600"/> Skill Level</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.values(UniversalLevel).map(lvl => (
                                    <button 
                                        type="button" 
                                        key={lvl} 
                                        onClick={() => setFormData({...formData, universalLevel: lvl})}
                                        className={`px-4 py-3 rounded-lg text-[10px] md:text-xs font-bold uppercase border transition-all ${formData.universalLevel === lvl ? 'bg-gray-900 text-white border-gray-900 shadow-lg transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                                    >
                                        {lvl.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* GLOBAL EXPERT: Logistics */}
                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center"><Car className="w-3 h-3 mr-1"/> Spot Access</label>
                                <select value={formData.accessType} onChange={e => setFormData({...formData, accessType: e.target.value})} className="w-full border-gray-300 rounded-xl p-2.5 text-sm bg-white">
                                    <option value="EASY">Easy Access (Car/Walk)</option>
                                    <option value="HIKE">Hike Required</option>
                                    <option value="4x4">4x4 Vehicle Required</option>
                                    <option value="BOAT_ONLY">Boat Access Only</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={formData.mustKnowSwimming} onChange={e => setFormData({...formData, mustKnowSwimming: e.target.checked})} className="w-4 h-4 text-brand-600 rounded mr-2" />
                                    <span className="text-sm font-bold text-gray-700 flex items-center"><Waves className="w-4 h-4 mr-1"/> Must know how to swim</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Technical Grade (Optional)</label>
                                <input 
                                    type="text" 
                                    value={formData.technicalGrade}
                                    onChange={e => setFormData({...formData, technicalGrade: e.target.value})}
                                    className="w-full border-gray-300 rounded-xl p-3 text-sm"
                                    placeholder="e.g. 5.10a, Class IV, Red Slope"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Physical Intensity (1-5)</label>
                                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <Activity className="w-5 h-5 text-orange-500" />
                                    <input 
                                        type="range" 
                                        min="1" max="5" 
                                        value={formData.physicalIntensity}
                                        onChange={e => setFormData({...formData, physicalIntensity: Number(e.target.value)})}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="font-black text-gray-900 w-6 text-center">{formData.physicalIntensity}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
            </>
          )}

          {step === 3 && (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center text-sm mr-3">4</span>
                    Pricing *
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Currency</label>
                          <select value="EUR" disabled className="w-full border-gray-300 rounded-xl p-3 bg-white text-gray-500 cursor-not-allowed">
                            <option value="EUR">EUR (€)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Price</label>
                          <div className="relative">
                              <span className="absolute left-3 top-3 text-gray-400">{formData.currency}</span>
                              <input type="number" className="w-full pl-8 border-gray-300 rounded-xl p-3" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                          </div>
                      </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="w-8 h-8 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center text-sm mr-3">5</span>
                    Location *
                  </h2>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                        City *
                      </label>

                      <input
                        type="text"
                        value={cityInputValue}
                        onChange={e => {
                          const value = e.target.value;
                          setCityQuery(value);
                          setShowCityResults(true);
                          handleCitySearch(value);
                        }}
                        onFocus={() => {
                            setShowCityResults(true);
                            if (!cityQuery && !selectedCity) {
                                handleCitySearch('');
                            }
                        }}
                        onBlur={() => {
                            setTimeout(() => setShowCityResults(false), 200);
                        }}
                        placeholder="Start typing a city..."
                        className="w-full border-gray-300 rounded-xl p-3"
                      />

                      {showCityResults && cities.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                          {cities.map(city => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, city: String(city.id) });
                                setSelectedCity(city);
                                setCityQuery(`${city.name}${city.country ? `, ${city.country}` : ''}`);
                                setShowCityResults(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            >
                              {city.name}{city.country ? `, ${city.country}` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* GLOBAL EXPERT: Exact Meeting Point */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Exact Meeting Point</label>
                        <textarea rows={2} value={formData.meetingPoint} onChange={e => setFormData({...formData, meetingPoint: e.target.value})} className="w-full border-gray-300 rounded-xl p-3 text-sm" placeholder="e.g. Meet at the north entrance of the beach, look for the yellow van." />
                    </div>
                  </div>
                </div>
            </div>

            <div className={`bg-white rounded-2xl shadow-sm border p-6 md:p-8 transition-colors ${formData.images.length < 5 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="w-8 h-8 bg-blue-50 text-brand-600 rounded-full flex items-center justify-center text-sm mr-3">6</span>
                    Photos <span className="ml-2 text-red-600 text-xs font-bold uppercase tracking-wider">(Min 5 Required)</span>
                  </h2>
                  <span className={`text-sm font-bold ${formData.images.length >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.images.length} / 5 Uploaded
                  </span>
              </div>
              
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const target = e.target as HTMLInputElement;
                    const files = target.files;
                    if (!files) return;

                    const uploaded: string[] = [];
                    for (const file of Array.from(files)) {
                      const formDataUpload = new FormData();
                      formDataUpload.append("file", file);
                      formDataUpload.append("upload_preset", "ttw_listings");

                      try {
                        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                            method: "POST",
                            body: formDataUpload
                        });
                        if (!res.ok) {
                            alert("Cloudinary Upload Failed."); continue;
                        }
                        const json = await res.json();
                        uploaded.push(json.secure_url);
                      } catch (err) {
                        console.error("Upload failed", err);
                      }
                    }
                    setFormData((prev: any) => ({
                      ...prev,
                      images: [...(prev.images || []), ...uploaded],
                    }));
                  }}
                  className="hidden"
                  id="listing-photo-upload"
                />

                <label
                  htmlFor="listing-photo-upload"
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer group block bg-white"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-brand-600" />
                  </div>
                  <p className="font-bold text-gray-900">Click to upload photos</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-6">
                  {formData.images.map((img: any, idx: number) => {
                    const srcUrl = cleanImageUrl(img);
                    return (
                        <div key={idx} className="relative group">
                          <img src={srcUrl} className="w-full h-24 object-cover rounded-xl border" alt="Listing preview" />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev: any) => ({
                                ...prev,
                                images: prev.images.filter((_: any, i: number) => i !== idx)
                              }))
                            }
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-red-600 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                    );
                  })}
                </div>
              )}
              {formData.images.length < 5 && (
                  <div className="mt-4 flex items-center text-red-600 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      You need {5 - formData.images.length} more photos to publish.
                  </div>
              )}
            </div>
            </>
          )}

          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 mt-8 -mx-4 sm:mx-0">
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center gap-3 px-4 sm:px-0">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900"
                  >
                    Back
                  </button>
                )}
              </div>

              <div>
                {step < 3 && (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-brand-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-md hover:bg-brand-700 transition-all"
                  >
                    Continue
                  </button>
                )}

                {step === 3 && (
                  <button
                    type="submit"
                    disabled={loading || formData.images.length < 5}
                    className={`px-6 py-2 rounded-full text-xs font-bold shadow-md flex items-center transition-all ${
                        formData.images.length < 5 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {loading ? (isEdit ? 'Updating...' : 'Publishing...') : (<><Save className="w-4 h-4 mr-2" /> {isEdit ? 'Update Listing' : 'Save & Publish'}</>)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageListing;