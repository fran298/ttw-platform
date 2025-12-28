// ---------------------------
// PRODUCT MATRIX CORE
// ---------------------------

export enum ListingType {
  SESSION = 'SESSION',
  COURSE = 'COURSE',
  TRIP = 'TRIP',
  RENT = 'RENT',
  EXPERIENCE = 'EXPERIENCE'
}

export enum CourseScope {
  RECREATIONAL = 'RECREATIONAL',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum SchedulingType {
  FIXED_SLOTS = 'FIXED_SLOTS',
  ON_REQUEST = 'ON_REQUEST',
  WIND_DEPENDENT = 'WIND_DEPENDENT'
}

export enum UniversalLevel {
  FIRST_TIMER = 'FIRST_TIMER',
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum SportCategory {
  WATER = 'WATER',
  LAND = 'LAND',
  SNOW = 'SNOW',
  AIR = 'AIR'
}

export enum RentalCategory {
  FULL_SET = 'FULL_SET',
  SINGLE_ITEM = 'SINGLE_ITEM'
}

export enum TripAccommodation {
  NONE = 'NONE',
  HOTEL = 'HOTEL',
  HOSTEL = 'HOSTEL',
  BOAT = 'BOAT'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

// ---------------------------
// GEO
// ---------------------------

export interface GeoLocation {
  continent?: string;
  country?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

// ---------------------------
// REVIEWS
// ---------------------------

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  visitedLocation?: string;
}

// ---------------------------
// DETAILS BY PRODUCT TYPE
// ---------------------------

export interface SessionDetails {
  durationMin: number;
  capacity: number;
  groupRatio?: string;
  schedulingType: SchedulingType;
  timeRangeStart?: string;
  timeRangeEnd?: string;
}

export interface CourseDetails {
  scope: CourseScope;
  certificationName?: string;
  daysCount: number;
  syllabus: string[];
}

export interface TripDetails {
  startDate: string;
  endDate: string;
  accommodation: boolean;
  foodIncluded: boolean;
  itinerary: { day: number; title: string; description: string }[];
  includedProducts: string[];
}

export interface RentalDetails {
  brand?: string;
  model?: string;
  sizes: string[];
  stockBySize?: Record<string, number>;
  depositAmount: number;
  billingCycle: 'HOUR' | 'DAY' | 'WEEK';
  insuranceIncluded?: boolean;
}

export interface ExperienceDetails {
  minAge?: number;
  maxWeight?: number;
  photosIncluded: boolean;
  schedulingType?: SchedulingType;
  durationMin?: number;
  capacity?: number;
}

// ---------------------------
// MAIN LISTING MODEL
// ---------------------------

export interface ListingHost {
  id: string;
  name: string;
  type: 'SCHOOL' | 'PROVIDER' | 'INSTRUCTOR';
  profile_image: string | null;
  verified: boolean;
}

export interface Listing {
  id: string;
  title: string;
  type: ListingType;
  sport: string; // sport slug from backend

  // Provided by list endpoints/mappers
  sportName?: string;
  category?: SportCategory;

  // --- PRICING ---
  price: number;
  currency: string;
  // Not all endpoints/mappers provide this yet
  priceMode: 'PER_PERSON' | 'PER_GROUP';

  // --- RATING ---
  rating: number;
  reviewCount: number; // mapped from review_count in dataService

  // --- LOCATION ---
  location: GeoLocation | null;

  // --- MEDIA ---
  images: string[];

  // --- PROVIDER / HOST ---
  host: ListingHost | null;
  // Used by cards/dashboards (list endpoints)
  providerId?: string | null;
  providerName?: string;
  isVerified: boolean;

  // --- STATUS ---
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';

  // --- CONTENT ---
  description: string;

  // --- TRI-LAYER DIFFICULTY ---
  universalLevel?: UniversalLevel;
  technicalGrade?: string;
  physicalIntensity?: number; // 1–5

  // --- DYNAMIC PRODUCT DETAILS ---
  details: any;

  // --- OPTIONAL HELPERS ---
  duration?: string;
  startDate?: string;
  difficulty?: string;
  availableSizes?: string[];
}

// ---------------------------
// BOOKINGS
// ---------------------------

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  providerId: string;
  providerName?: string;
  instructorName?: string;
  date: string;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  guests: number;

  ticketQr?: string;
  meetingPoint?: any;
  packingList?: any[];
  timeline?: any[];
  instructor?: any;
}

// ---------------------------
// PROVIDERS
// ---------------------------

export interface ProviderProfile {
  id: string;
  name: string;
  type: 'SCHOOL' | 'FREELANCER';
  profile_image?: string | null;
  cover_image?: string | null;
  gallery?: string[];
  isVerified: boolean;
  location: GeoLocation;
  city: string;
  country: string;

  // Raw backend location fields (used by Landing / directories)
  city_name?: string;
  country_name?: string;

  sports: string[];
  languages: string[];
  bio: string;
  socials: { web?: string; instagram?: string; youtube?: string };
  stats: { views: number; reviews: number; trips: number };
  stories: any[];
  reviews: Review[];
  jobs: any[];

  // --- Billing / Commission ---
  commission_rate?: number;
  is_subscribed?: boolean;
}

// ---------------------------
// INSTRUCTOR PROFILE (NEW)
// ---------------------------

export interface InstructorProfile {
  id: string;

  // Public identity
  display_name: string;

  // User (auth-related, NOT for public display)
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    cover_image?: string;
    role?: string;
  };

  // Profile info
  bio: string;
  sports: string[];
  experience_years: number;
  certifications: string;
  languages: string[];

  // Media
  profile_image?: string | null;
  cover_image?: string | null;
  gallery?: string[];

  // Location
  city?: string;
  country?: string;
  city_name?: string;
  country_name?: string;
  location?: any;

  // Pricing / status
  hourly_rate: number;
  currency: string;
  is_verified: boolean;

  // Relations
  merchant?: string | null;
  stripe_connect_id?: string | null;

  // --- Billing / Commission ---
  commission_rate?: number;
  is_subscribed?: boolean;
}

// ---------------------------
// SPORTS DIRECTORY
// ---------------------------

export interface SportDirectoryItem {
  slug: string;
  name: string;
  image: string;
  category: SportCategory;
  description?: string;
  listingCount: number;
}