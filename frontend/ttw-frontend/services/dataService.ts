import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL!;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

import { Listing, Booking, ProviderProfile, ListingType, SportCategory, BookingStatus, GeoLocation } from "../types";

// --- HELPER: AUTH HEADERS ---
const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// --- AUTH FETCH (REFRESH TOKEN AUTOMÁTICO) ---
const authFetch = async (url: string, options: any = {}) => {
  let access = localStorage.getItem("accessToken");
  let refresh = localStorage.getItem("refreshToken");

  // Inyectar token automáticamente, but do NOT force Content-Type for FormData
  const isFormData = options.body instanceof FormData;

  options.headers = {
    ...options.headers,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  let res = await fetch(url, options);

  // Si NO es un 401, devolver normal
  if (res.status !== 401) return res;

  // Si no hay refresh token → usuario fuera
  if (!refresh) {
    logout();
    throw new Error("Unauthorized");
  }

  console.log("[authFetch] Token expirado, refrescando…");

  // Intentar refrescar
  const refreshRes = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!refreshRes.ok) {
    console.log("Refresh token inválido → logout");
    logout();
    throw new Error("Unauthorized");
  }

  const refreshData = await refreshRes.json();
  localStorage.setItem("accessToken", refreshData.access);
  access = refreshData.access;

  // Reintentar request original
  options.headers.Authorization = `Bearer ${access}`;
  return fetch(url, options);
};

// --- TYPES ---
export interface SportLandingData {
    name: string;
    description: string;
    heroImage: string;
    category: string;
    stats: {
        listingCount: number;
        avgPrice: number;
    };
    topDestinations: {
        name: string;
        image: string;
        count: number;
        continent: string;
    }[];
}

export interface CountryData {
    name: string;
    continent: string;
    count: number;
    image: string;
    categories: SportCategory[];
    topSports: string[];
    bestMonths: number[]; // 0-11 index
    startingPrice: number;
}

export interface Destination {
  id: number;
  name: string;
  slug: string;
  country: string;
  continent: string | null;
  hero_image?: string | null;
}


// --- AUTHENTICATION ---

export const registerUser = async (
  email: string,
  password: string,
  role: string,
  first_name: string,
  last_name: string,
  premium_intent_id?: string
) => {
  const res = await fetch(`${API_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password: password.trim(),
      role,
      first_name: first_name?.trim() || "",
      last_name: last_name?.trim() || "",
      premium_intent_id,
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Registration failed');
  return data; // { message, email }
};

export const registerProvider = async (email: string, password: string) => {
  return registerUser(email, password, 'PROVIDER', '', '');
};

export const verifyEmail = async (email: string, code: string) => {
  const res = await fetch(`${API_URL}/auth/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Verification failed');

  localStorage.setItem('accessToken', data.access);
  localStorage.setItem('refreshToken', data.refresh);
  localStorage.setItem('userRole', data.user.role);
  localStorage.setItem('userName', data.user.email.split('@')[0]);

  window.dispatchEvent(new Event('auth-change'));

  return data.user;
}

export const login = async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      email: email.trim(),
      password: password.trim()
})
    });

    if (!res.ok) throw new Error('Login failed');

    const data = await res.json();

    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);

    const meRes = await fetch(`${API_URL}/auth/me/`, {
      headers: { 'Authorization': `Bearer ${data.access}` }
    });

    const me = await meRes.json();

    const user = {
      id: me.id,
      name: me.email.split('@')[0],
      role: me.role,
      avatar: me.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
    };

    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userId', user.id);

    window.dispatchEvent(new Event('auth-change'));

    return user;
  } catch (e) {
    console.error("Login Error:", e);
    throw e;
  }
};

export const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.dispatchEvent(new Event('auth-change'));
};

// --- LISTINGS ---

export const getListings = async (filters: any = {}): Promise<Listing[]> => {
  const params = new URLSearchParams();
  // 🔒 Ownership filters (CRITICAL FIX)
  if (filters.instructorId) {
    params.append('instructor', filters.instructorId);
  }
  if (filters.providerId) {
    params.append('provider', filters.providerId);
  }
  if (filters.sport) params.append('sport', filters.sport); // backend expects sport slug
  if (filters.country) params.append('country', filters.country);
  if (filters.type && filters.type !== 'ALL') params.append('type', filters.type);
  if (filters.continent) params.append('continent', filters.continent); 
  // Correct filter for FK City model
  if (filters.city) params.append('city__name__iexact', filters.city);

  try {
    const query = params.toString();
    const url = query ? `${API_URL}/listings/?${query}` : `${API_URL}/listings/`;

    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Network error');

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];

    return results.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type as ListingType,

      // ✅ FIXED SPORT MAPPING (BACKEND RETURNS STRING + sport_name)
      category: item.sport_category as SportCategory,
      sport: item.sport,           // "surf", "kitesurf"
      sportName: item.sport_name,  // "Surf", "Kitesurf"

      price: parseFloat(item.price),
      currency: item.currency,
      rating: parseFloat(item.rating),
      reviewCount: item.review_count,

      // ✅ FIXED LOCATION MAPPING (USE city from backend)
      location: {
        country: item.city?.country_name || 'Unknown',
        city: item.city?.name || 'Unknown',
        lat: 0,
        lng: 0,
        continent: item.city?.continent_name || 'Europe'
      } as GeoLocation,

      images: item.images || [],

      // ✅ FIXED PROVIDER MAPPING (BACKEND USES `provider`)
      providerId: item.provider?.id,
      providerName: item.provider?.name || 'Provider',

      isVerified: item.is_verified,
      description: item.description,
      status: item.status || 'ACTIVE',

      // ✅ FIXED DIFFICULTY FIELDS
      universalLevel: item.universal_level,
      technicalGrade: item.technical_grade,
      physicalIntensity: item.physical_intensity,

      // ✅ JSON DETAILS
      details: item.details || {}
    }));
  } catch (error) {
    console.error("getListings error:", error);
    return [];
  }
};


export const getListingsByProvider = async (providerId: string): Promise<Listing[]> => {
  try {
    const res = await authFetch(`${API_URL}/listings/provider_listings/?providerId=${providerId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (e) {
    console.error("getListingsByProvider error:", e);
    return [];
  }
};

export const getListingsByInstructor = async (instructorUserId: string): Promise<Listing[]> => {
  try {
    // IMPORTANT:
    // Instructors must ONLY see listings they OWN (owner=user)
    const res = await authFetch(`${API_URL}/listings/?owner=${instructorUserId}`);
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];

    return results.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type as ListingType,

      category: item.sport_category as SportCategory,
      sport: item.sport,
      sportName: item.sport_name,

      price: parseFloat(item.price),
      currency: item.currency,
      rating: parseFloat(item.rating),
      reviewCount: item.review_count,

      location: {
        country: item.city?.country_name || 'Unknown',
        city: item.city?.name || 'Unknown',
        lat: 0,
        lng: 0,
        continent: item.city?.continent_name || 'Europe'
      } as GeoLocation,

      images: item.images || [],

      providerId: item.provider?.id,
      providerName: item.provider?.name || 'Provider',

      isVerified: item.is_verified,
      description: item.description,
      status: item.status || 'ACTIVE',

      universalLevel: item.universal_level,
      technicalGrade: item.technical_grade,
      physicalIntensity: item.physical_intensity,

      details: item.details || {}
    }));
  } catch (e) {
    console.error("getListingsByInstructor error:", e);
    return [];
  }
};

export const getListingById = async (id: string): Promise<Listing | null> => {
  try {
    const res = await fetch(`${API_URL}/listings/${id}/`);
    if (!res.ok) return null;

    const item = await res.json();

    return {
      id: item.id,
      title: item.title,
      type: item.type as ListingType,

      category: item.sport_category as SportCategory,
      sport: item.sport,
      sportName: item.sport_name,

      price: parseFloat(item.price),
      currency: item.currency,
      rating: parseFloat(item.rating),
      reviewCount: item.review_count,

      location: {
        country: item.city?.country_name || "Unknown",
        city: item.city?.name || "Unknown",
        lat: 0,
        lng: 0,
        continent: item.city?.continent_name || "Europe",
      } as GeoLocation,

      images: item.images || [],

      host: item.host ?? null,

      isVerified: item.is_verified,
      description: item.description,
      status: item.status || "ACTIVE",

      universalLevel: item.universal_level,
      technicalGrade: item.technical_grade,
      physicalIntensity: item.physical_intensity,

      details: item.details || {},
    } as Listing;

  } catch (e) {
    return null;
  }
};

export const createListing = async (listingData: any): Promise<boolean> => {
  try {
    const payload = {
      // CORE
      title: listingData.title,
      type: listingData.type,

      // ✅ SPORT MUST ALWAYS BE A SLUG (FK)
      sport:
        typeof listingData.sport === "object"
          ? listingData.sport.slug || listingData.sport.name
          : String(listingData.sport).toLowerCase(),

      description: listingData.description,

      // ✅ CITY MUST BE UUID (OR NULL)
      city:
        typeof listingData.city === "object"
          ? listingData.city.id || listingData.city.uuid
          : listingData.city || null,

      // Optional free-text meeting point
      location: listingData.location || "",

      // PRICING
      price: Number(listingData.price),
      currency: listingData.currency || "USD",

      // DIFFICULTY
      universal_level:
        listingData.universalLevel ||
        listingData.universal_level ||
        "BEGINNER",
      technical_grade: listingData.technicalGrade || "",
      physical_intensity: Number(listingData.physicalIntensity || 1),

      // MEDIA
      images: Array.isArray(listingData.images) ? listingData.images : [],

      // STATUS
      status: listingData.status || "ACTIVE",

      // ✅ DYNAMIC JSON DETAILS
      details: listingData.details || {},
    };

    if (!payload.universal_level) {
      console.error("universal_level is missing in createListing payload", listingData);
    }

    console.log("FINAL CREATE LISTING PAYLOAD (NORMALIZED):", payload);

    const res = await fetch(`${API_URL}/listings/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Error creating listing:", res.status, responseData);
      throw new Error(
        responseData.detail ||
          JSON.stringify(responseData) ||
          "Failed to create listing"
      );
    }

    return true;
  } catch (e) {
    console.error("createListing network/unexpected error:", e);
    return false;
  }
};

// --- PROVIDERS ---

export const getInstructorsDirectory = async () => {
  try {
    const [schoolsRes, instructorsRes] = await Promise.all([
      authFetch(`${API_URL}/providers/`),
      authFetch(`${API_URL}/instructors/`)
    ]);

    const schoolsRaw = schoolsRes.ok ? await schoolsRes.json() : [];
    const instructorsRaw = instructorsRes.ok ? await instructorsRes.json() : [];

    const schoolsData = Array.isArray(schoolsRaw) ? schoolsRaw : schoolsRaw.results || [];
    const instructorsData = Array.isArray(instructorsRaw) ? instructorsRaw : instructorsRaw.results || [];

    const schools = schoolsData.map(mapSchoolToFrontend);
    const freelancers = instructorsData.map(mapInstructorToFrontend);

    return { schools, freelancers };
  } catch (e) {
    console.error('getInstructorsDirectory error:', e);
    return { schools: [], freelancers: [] };
  }
};

export const getProvidersDirectory = async () => {
  try {
      const [schoolsRes, instructorsRes] = await Promise.all([
        authFetch(`${API_URL}/providers/`),
        authFetch(`${API_URL}/instructors/`)
      ]);

      const schoolsRaw = schoolsRes.ok ? await schoolsRes.json() : [];
      const instructorsRaw = instructorsRes.ok ? await instructorsRes.json() : [];

      const schoolsData = Array.isArray(schoolsRaw) ? schoolsRaw : schoolsRaw.results || [];
      const instructorsData = Array.isArray(instructorsRaw) ? instructorsRaw : instructorsRaw.results || [];

      const schools = schoolsData.map(mapSchoolToFrontend);
      const freelancers = instructorsData.map(mapInstructorToFrontend);

      return { schools, freelancers };
  } catch (e) {
      console.error('getProvidersDirectory error:', e);
      return { schools: [], freelancers: [] };
  }
};

export const getProviderProfile = async (
  profileId: string,
  type?: 'PROVIDER' | 'INSTRUCTOR'
): Promise<ProviderProfile | null> => {
  try {
    // If type is explicitly INSTRUCTOR, do NOT try providers
    if (type === 'INSTRUCTOR') {
      const res = await fetch(`${API_URL}/instructors/${profileId}/`);
      if (!res.ok) return null;
      const data = await res.json();
      return mapInstructorToFrontend(data);
    }

    // If type is explicitly PROVIDER, do NOT try instructors
    if (type === 'PROVIDER') {
      const res = await fetch(`${API_URL}/providers/${profileId}/`);
      if (!res.ok) return null;
      const data = await res.json();
      return mapSchoolToFrontend(data);
    }

    // Fallback (legacy): try provider first, then instructor
    let res = await fetch(`${API_URL}/providers/${profileId}/`);
    if (res.ok) {
      const data = await res.json();
      return mapSchoolToFrontend(data);
    }

    res = await fetch(`${API_URL}/instructors/${profileId}/`);
    if (res.ok) {
      const data = await res.json();
      return mapInstructorToFrontend(data);
    }

    return null;
  } catch (e) {
    console.error("getProviderProfile network error:", e);
    return null;
  }
};

export const createProviderProfile = async (data: any) => {
  try {
    const payload: any = {
      company_name: data.company_name || "",
      phone: data.phone || " ", // 🔥 backend NOT NULL safeguard
      description: data.description || "",
      address: data.address || "",
      website: data.website || "",
      instagram: data.instagram || "",
      vat_number: data.vat_number || null,
      profile_image: data.profile_image || null,
      cover_image: data.cover_image || null,
    };

    if (data.city) {
      payload.city =
        typeof data.city === "object"
          ? data.city.id || data.city.uuid
          : data.city;
    }

    if (Array.isArray(data.sports)) {
      payload.sports = data.sports.map((s: any) =>
        typeof s === "string" ? s : s?.slug || s?.name
      );
    }

    const res = await authFetch(`${API_URL}/providers/me/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Provider profile update failed");
    }

    return await res.json();
  } catch (e) {
    console.error("createProviderProfile failed:", e);
    throw e;
  }
};

export const createInstructorProfile = async (data: any) => {
  try {
    const payload: any = {};

    // OPTIONAL
    if (data.display_name || data.name) payload.display_name = data.display_name || data.name;
    if (data.bio) payload.bio = data.bio;
    if (data.phone) payload.phone = data.phone;
    if (data.website) payload.website = data.website;

    // CITY
    if (data.city) {
      payload.city =
        typeof data.city === "object"
          ? data.city.id || data.city.uuid
          : data.city;
    }

    // SPORTS
    if (Array.isArray(data.sports) && data.sports.length > 0) {
      payload.sports = data.sports.map((s: any) =>
        typeof s === "string" ? s : s?.slug || s?.name
      );
    }

    // LANGUAGES
    if (Array.isArray(data.languages) && data.languages.length > 0) {
      payload.languages = data.languages;
    }

    // CLOUDINARY
    if (data.profile_image) payload.profile_image = data.profile_image;
    if (data.cover_image) payload.cover_image = data.cover_image;

    const res = await fetch(`${API_URL}/instructors/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (
        res.status === 400 &&
        typeof responseData?.detail === "string" &&
        responseData.detail.includes("already exists")
      ) {
        console.warn("Instructor profile already exists — continuing signup flow.");
        return responseData;
      }

      console.error("Error creating instructor profile:", res.status, responseData);
      throw new Error(
        responseData.detail ||
          JSON.stringify(responseData) ||
          "Failed to create instructor profile"
      );
    }

    return responseData;
  } catch (e) {
    console.error("createInstructorProfile failed:", e);
    throw e;
  }
};

export const updateProviderOnboarding = async (id: string, data: any): Promise<boolean> => {
  try {
    const res = await authFetch(`${API_URL}/providers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.error('updateProviderOnboarding error:', e);
    return false;
  }
};

// --- BOOKINGS ---

export const createBooking = async (bookingData: any): Promise<string> => {
    const res = await authFetch(`${API_URL}/bookings/`, {
        method: 'POST',
        body: JSON.stringify({
            listing: bookingData.listingId,
            start_date: bookingData.date,
            guests: bookingData.guests
        })
    });
    if (!res.ok) throw new Error("Booking failed");
    const data = await res.json();
    return data.id;
};

export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    // Backend expects traveler-scoped bookings
    const res = await authFetch(`${API_URL}/bookings/?mine=true`);
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];

    return results.map(mapBookingToFrontend);
  } catch (e) {
    console.error("getUserBookings error:", e);
    return [];
  }
};

export const getProviderBookings = async (providerId: string): Promise<Booking[]> => {
  try {
    const res = await authFetch(`${API_URL}/bookings/?provider=${providerId}`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];
    return results.map(mapBookingToFrontend);
  } catch (e) {
    console.error('getProviderBookings error:', e);
    return [];
  }
};

const PAYMENTS_BASE = `${API_URL}/payments`;

// --- PREMIUM PARTNER (STRIPE) ---
// NOTE: This endpoint MUST NOT require authentication.
// Premium checkout can be paid BEFORE user creation.

export const createPremiumCheckout = async (payload: any = {}) => {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${PAYMENTS_BASE}/premium/checkout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create premium checkout");
  }

  return res.json(); // expects { checkout_url | url }
};

// Validate Stripe premium checkout session after redirect
export const validatePremiumSession = async (sessionId: string) => {
  const res = await fetch(
    `${PAYMENTS_BASE}/premium/validate/?session_id=${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Invalid premium session");
  }

  return res.json() as Promise<{
    intent_id: string;
    role: "PROVIDER" | "INSTRUCTOR";
    email: string;
  }>;
};

// --- REVIEWS ---

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_email: string;
  created_at: string;
}

export interface ReviewPayload {
  provider?: string;
  instructor?: string;
  listing?: string;
  rating: number;
  comment: string;
}

export const createReview = async (payload: ReviewPayload) => {
  const res = await authFetch(`${API_URL}/reviews/`, {
    method: "POST",
    body: JSON.stringify({
      ...(payload.provider ? { provider: payload.provider } : {}),
      ...(payload.instructor ? { instructor: payload.instructor } : {}),
      ...(payload.listing ? { listing: payload.listing } : {}),
      rating: payload.rating,
      comment: payload.comment,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("createReview error:", data);
    throw new Error(
      data?.detail ||
      data?.non_field_errors?.[0] ||
      "Failed to create review"
    );
  }

  return data;
};

export const getReviewsByListing = async (listingId: string): Promise<Review[]> => {
  try {
    const res = await fetch(`${API_URL}/reviews/?listing=${listingId}`);
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];

    return results.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reviewer_name: r.reviewer_name,
      reviewer_email: r.reviewer_email,
      created_at: r.created_at,
    }));
  } catch (e) {
    console.error("getReviewsByListing error:", e);
    return [];
  }
};

export const getReviewsByProvider = async (providerId: string) => {
  try {
    const res = await fetch(`${API_URL}/reviews/?provider=${providerId}`);
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (e) {
    console.error("getReviewsByProvider error:", e);
    return [];
  }
};

export const getReviewsByInstructor = async (instructorId: string) => {
  try {
    const res = await fetch(`${API_URL}/reviews/?instructor=${instructorId}`);
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (e) {
    console.error("getReviewsByInstructor error:", e);
    return [];
  }
};

export const getProviderPayouts = async () => {
  try {
    const res = await authFetch(`${PAYMENTS_BASE}/merchant-payouts/`);
    if (!res.ok) return { totalPending: 0, totalPaid: 0, payouts: [] };

    const data = await res.json();

    return {
      totalPending: data.total_pending || 0,
      totalPaid: data.total_paid || 0,
      payouts: Array.isArray(data.payouts)
        ? data.payouts.map((p: any) => ({
            id: p.id,
            bookingId: p.booking_id,
            listingTitle: p.booking_title || "",
            amount: parseFloat(p.amount_to_pay),
            currency: "EUR",
            status: p.status,
            createdAt: p.created_at,
            paidAt: p.paid_at
          }))
        : []
    };
  } catch (e) {
    console.error("getProviderPayouts error:", e);
    return { totalPending: 0, totalPaid: 0, payouts: [] };
  }
};

export const getUserBookingById = async (bookingId: string): Promise<Booking | null> => {
    try {
        const res = await authFetch(`${API_URL}/bookings/${bookingId}/`);
        if (!res.ok) return null;
        const data = await res.json();
        return mapBookingToFrontend(data);
    } catch (e) {
        return null;
    }
};

// --- GEO & SPORTS ---

export const getMySports = async () => {
  try {
    const res = await authFetch(`${API_URL}/me/sports/`);

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (e) {
    console.error("getMySports error:", e);
    return [];
  }
};

// Alias for provider sports (used in ManageListing)
export const getMyProviderSports = async () => {
  try {
    // 1. Try as SCHOOL (provider)
    const providerRes = await authFetch(`${API_URL}/providers/me/`);

    if (providerRes.ok) {
      const provider = await providerRes.json();
      return Array.isArray(provider.sports) ? provider.sports : [];
    }

    // 2. Try as INSTRUCTOR
    const instructorRes = await authFetch(`${API_URL}/instructors/me/`);

    if (instructorRes.ok) {
      const instructor = await instructorRes.json();
      return Array.isArray(instructor.sports) ? instructor.sports : [];
    }

    return [];
  } catch (e) {
    console.error("getMyProviderSports error:", e);
    return [];
  }
};


export const searchCities = async (query: string) => {
  try {
    const res = await apiClient.get(`/cities/search/?q=${encodeURIComponent(query)}`);
    return res.data;
  } catch (e) {
    console.error('searchCities error:', e);
    return [];
  }
};

export const getCities = async (): Promise<any[]> => {
  try {
    // Use search endpoint with empty query to get initial city list
    const res = await apiClient.get(`/cities/search/?q=`);
    const data = res.data;
    const results = Array.isArray(data) ? data : data.results || [];
    return results.map((c: any) => ({
      id: c.id,
      name: c.name,
      country: c.country_name,
      continent: c.continent_name
    }));
  } catch (e) {
    console.error("getCities error:", e);
    return [];
  }
}

export const getAvailableCountries = async (): Promise<CountryData[]> => {
    try {
        const res = await fetch(`${API_URL}/countries/`);
        if (!res.ok) return [];
        const data = await res.json();
        const results = Array.isArray(data) ? data : data.results || [];
        return results.map((c: any) => ({
            name: c.name,
            continent: c.continent_name,
            count: c.listing_count,
            image: c.image,
            categories: [], 
            topSports: [],
            bestMonths: [],
            startingPrice: 0
        }));
    } catch (e) {
        return [];
    }
};

export const getCountriesByContinent = async (continent: string): Promise<CountryData[]> => {
    try {
        const res = await fetch(`${API_URL}/countries/?continent__slug=${continent.toLowerCase()}`);
        if (!res.ok) return [];
        const data = await res.json();
        const results = Array.isArray(data) ? data : data.results || [];
        return results.map((c: any) => ({
            name: c.name,
            continent: c.continent_name,
            count: c.listing_count,
            image: c.image,
            categories: [],
            topSports: [],
            bestMonths: [],
            startingPrice: 0
        }));
    } catch (e) {
        return [];
    }
};

export const getSignatureTrips = async (continent: string): Promise<Listing[]> => {
    return getListings({ type: ListingType.TRIP, continent });
};

export const getSportsDirectory = async () => {
  try {
      const res = await authFetch(`${API_URL}/sports/`); 
      if (!res.ok) return [];
      const data = await res.json();
      return data.results.map((s: any) => ({
          slug: s.slug,
          name: s.name,
          image: s.image,
          category: s.category,
          description: s.description,
          listingCount: s.listing_count
      }));
  } catch (e) {
      return [];
  }
};

export const getCityDetails = async (cityId: string) => {
  try {
    const res = await apiClient.get(`/cities/search/?q=${encodeURIComponent(cityId)}`);
    const data = res.data;
    const results = Array.isArray(data) ? data : data.results || [];
    if (results.length > 0) {
      const city = results[0];
      return {
        id: city.id,
        name: city.name,
        country: city.country_name,
        continent: city.continent_name,
        description: `Explore ${city.name}.`,
        heroImage: city.image,
        spots: []
      };
    }
    return null;
  } catch (e) {
    console.error('getCityDetails error:', e);
    return null;
  }
};

export const getSportLandingDetails = async (slug:string): Promise<SportLandingData> => {
    return {
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        description: `Explore the best ${slug} locations and schools.`,
        heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Water',
        stats: { listingCount: 24, avgPrice: 85 },
        topDestinations: [
            { name: 'Tarifa', continent: 'Europe', count: 12, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600' },
            { name: 'Maui', continent: 'North America', count: 8, image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600' },
        ]
    };
};

export const createSport = async (data: any) => {
  const res = await fetch(`${API_URL}/sports/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error creating sport");
  return res.json();
};

export const updateSport = async (slug: string, data: any) => {
  const res = await fetch(`${API_URL}/sports/${slug}/`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error updating sport");
  return res.json();
};

export const deleteSportAPI = async (slug: string) => {
  const res = await fetch(`${API_URL}/sports/${slug}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Error deleting sport");
};

// --- HELPER MAPPERS ---

const mapSchoolToFrontend = (p: any): ProviderProfile => {
  return {
    id: p.id,
    name: p.company_name,
    type: "SCHOOL",
    city: p.city_name || "",
    country: p.country_name || "",

    // 🔥 KEEP RAW LOCATION FIELDS FOR LANDING
    city_name: p.city_name || "",
    country_name: p.country_name || "",

    profile_image: p.profile_image || "https://api.dicebear.com/7.x/initials/svg?seed=S",
    cover_image: p.cover_image || null,
    gallery: p.gallery || [],
    isVerified: p.is_verified || false,
    commission_rate: p.commission_rate,
    is_subscribed: Boolean(p.is_subscribed),

    // 🧭 Normalized location object (used elsewhere)
    location: {
      city: p.city_name || "Unknown",
      country: p.country_name || "Unknown",
      continent: p.continent_name || "Unknown",
      lat: p.lat || 0,
      lng: p.lng || 0
    },

    sports: Array.isArray(p.sports)
      ? p.sports.map((s: any) =>
          typeof s === "string" ? s : s?.slug || s?.name || ""
        )
      : [],
    languages: Array.isArray(p.languages) ? p.languages : [],
    bio: p.description || "",
    socials: { web: p.website, instagram: p.instagram, youtube: p.youtube },
    stats: p.stats || { views: 0, reviews: 0, trips: 0 },
    stories: [],
    reviews: [],
    jobs: [],
  };
};

const mapInstructorToFrontend = (p: any): ProviderProfile => {
  return {
    id: p.id,

    // ✅ NORMALIZED NAME (CRITICAL FIX)
    name:
      p.display_name ||
      `${p.user?.first_name ?? ''} ${p.user?.last_name ?? ''}`.trim() ||
      p.user?.email ||
      'Instructor',

    type: "FREELANCER",

    profile_image:
      p.profile_image ||
      p.avatar ||
      "https://api.dicebear.com/7.x/initials/svg?seed=I",

    cover_image: p.cover_image || null,
    gallery: p.gallery || [],
    isVerified: p.is_verified || false,
    commission_rate: p.commission_rate,
    is_subscribed: Boolean(p.is_subscribed),

    // 🔥 KEEP RAW LOCATION FIELDS FOR LANDING
    city: p.city_name || "",
    country: p.country_name || "",

    location: {
      city: p.city_name || "Unknown",
      country: p.country_name || "Unknown",
      continent: p.continent_name || "Unknown",
      lat: p.lat || 0,
      lng: p.lng || 0
    },

    sports: Array.isArray(p.sports)
      ? p.sports.map((s: any) =>
          typeof s === "string" ? s : s?.slug || s?.name || ""
        )
      : [],
    languages: Array.isArray(p.languages) ? p.languages : [],
    bio: p.bio || "",
    socials: {
      web: p.website,
      instagram: p.instagram,
      youtube: p.youtube
    },

    stats: { views: 0, reviews: 0, trips: 0 },
    stories: [],
    reviews: [],
    jobs: [],
  };
};

// --- ADMIN ---


export const getAllProvidersAdmin = async () => {
  try {
    const res = await authFetch(`${API_URL}/providers/`);
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];

    // IMPORTANT: Return RAW backend objects so AdminDashboard can use city_name & country_name
    return results;
  } catch (e) {
    console.error('getAllProvidersAdmin error:', e);
    return [];
  }
};

export const updateProviderCommissionAdmin = async (
  providerId: string,
  commissionRate: number
) => {
  const res = await apiClient.patch(
    `/providers/admin/providers/${providerId}/commission/`,
    { commission_rate: commissionRate }
  );
  return res.data;
};


export const getAllInstructorsAdmin = async () => {
  try {
    const res = await authFetch(`${API_URL}/instructors/`);
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];

    // IMPORTANT: Return RAW backend objects so AdminDashboard can render city_name & country_name
    return results;
  } catch (e) {
    console.error('getAllInstructorsAdmin error:', e);
    return [];
  }
};

export const updateInstructorCommissionAdmin = async (
  instructorId: string,
  commissionRate: number
) => {
  const res = await apiClient.patch(
    `/instructors/admin/instructors/${instructorId}/commission/`,
    { commission_rate: commissionRate }
  );
  return res.data;
};

// Alias for AdminDashboard
export const getInstructors = async () => {
  return await getAllInstructorsAdmin();
};


export const getAllUsersAdmin = async () => {
  try {
    const res = await authFetch(`${API_URL}/users/`);
    if (!res.ok) return [];

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;

    return [];
  } catch (e) {
    console.error('getAllUsersAdmin error:', e);
    return [];
  }
};

// --- COMPATIBILITY HELPERS FOR ADMIN DASHBOARD ---

// Alias to keep AdminDashboard imports working
export const getProviders = async () => {
  return await getAllProvidersAdmin();
};

export const getTravelers = async () => {
  try {
    const res = await authFetch(`${API_URL}/auth/travelers/`, {
      method: "GET",
    });

    if (res.status === 401) {
      console.error("Unauthorized - token inválido o expirado");
      return [];
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("Travelers request failed:", res.status, text);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (e) {
    console.error("getTravelers error:", e);
    return [];
  }
};

const mapBookingToFrontend = (b: any): Booking => {
  const listing = b.listing || {};

  const resolvedPrice =
    b.total_price !== undefined && b.total_price !== null
      ? Number(b.total_price)
      : listing.price
        ? Number(listing.price)
        : 0;

  const resolvedProvider =
    listing.provider?.company_name ||
    listing.provider?.name ||
    listing.instructor?.display_name ||
    listing.instructor?.name ||
    "Provider";

  const resolvedTitle = listing.title || "Activity";

  return {
    id: b.id,

    // --- LISTING ---
    listingId: listing.id,
    listingTitle: resolvedTitle,
    // activity: resolvedTitle,          // 🔥 alias for dashboard (removed)
    listingImage:
      Array.isArray(listing.images) && listing.images.length > 0
        ? listing.images[0]
        : "",

    // --- USER ---
    userId: b.user?.id,
    userName:
      b.user?.first_name ||
      b.user?.name ||
      b.user?.email ||
      "",
    userEmail: b.user?.email || "",

    // --- PROVIDER / INSTRUCTOR ---
    providerId: listing.provider?.id || listing.instructor?.id || null,
    providerName: resolvedProvider,
    // provider: resolvedProvider,       // 🔥 alias for dashboard (removed)

    // --- BOOKING DATA ---
    date: b.start_date,
    guests: b.guests || 1,
    status: b.status,

    // --- PRICING ---
    totalPrice: resolvedPrice,
    // price: resolvedPrice,             // 🔥 alias for dashboard (removed)
    currency: b.currency || listing.currency || "EUR",

    // --- TICKET ---
    ticketQr: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${b.id}`,
  };
};

export const getMe = async () => {
  const res = await authFetch(`${API_URL}/auth/me/`);

  if (!res.ok) throw new Error("No autorizado");

  return res.json();
};


// --- OWNERSHIP FILTERED LISTINGS ---
export const getMyListings = async (): Promise<Listing[]> => {
  try {
    const res = await authFetch(`${API_URL}/listings/my/`);
    if (!res.ok) return [];

    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || [];

    return results.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type as ListingType,

      category: item.sport_category as SportCategory,
      sport: item.sport,
      sportName: item.sport_name,

      price: parseFloat(item.price),
      currency: item.currency,
      rating: parseFloat(item.rating),
      reviewCount: item.review_count,

      location: {
        country: item.city?.country_name || 'Unknown',
        city: item.city?.name || 'Unknown',
        lat: 0,
        lng: 0,
        continent: item.city?.continent_name || 'Europe'
      } as GeoLocation,

      images: item.images || [],

      providerId: item.provider?.id,
      providerName: item.provider?.name || 'Provider',

      isVerified: item.is_verified,
      description: item.description,
      status: item.status || 'ACTIVE',

      universalLevel: item.universal_level,
      technicalGrade: item.technical_grade,
      physicalIntensity: item.physical_intensity,

      details: item.details || {}
    }));
  } catch (e) {
    console.error("getMyListings error:", e);
    return [];
  }
};

export const deleteListing = async (id: string | number): Promise<boolean> => {
  try {
    // We use authFetch to ensure the user is logged in and has permission
    const res = await authFetch(`${API_URL}/listings/${id}/`, {
      method: 'DELETE',
    });
    
    // Check for success (204 No Content is common for DELETE, or 200 OK)
    if (!res.ok) {
        console.error(`Failed to delete listing ${id}. Status: ${res.status}`);
        return false;
    }
    
    return true;
  } catch (e) {
    console.error("deleteListing network error:", e);
    return false;
  }
};

export const uploadListingImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch(`${API_URL}/listings/upload_image/`, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    console.error("uploadListingImage failed");
    return "";
  }
  const data = await res.json();
  return data.url;
};

export const updateListing = async (id: string, data: any): Promise<boolean> => {
    try {
        const res = await authFetch(`${API_URL}/listings/${id}/`, {
            method: 'PATCH', // or PUT depending on your backend
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) {
        console.error("updateListing error:", e);
        return false;
    }
};

// --- USER PROFILE UPDATE ---

// --- USER PROFILE UPDATE ---

export const updateUserProfile = async (userData: any): Promise<boolean> => {
    try {
        // HELPER: Convert empty strings to null for URL fields to avoid 400 Errors
        const cleanUrl = (url: string) => (url && url.trim() !== "" ? url : null);

        const payload = {
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image: cleanUrl(userData.profile_image),
            cover_image: cleanUrl(userData.cover_image),
            bio: userData.bio,
            phone: userData.phone,
        };

        console.log("Sending Profile Update:", payload); // Debugging

        const res = await authFetch(`${API_URL}/auth/me/`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            // 🔥 CAPTURE THE SERVER ERROR MESSAGE
            const errorData = await res.json();
            console.error("Server Validation Error:", errorData);
            alert(`Update Failed: ${JSON.stringify(errorData)}`);
            return false;
        }
        
        // Update local storage
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
            ...currentUser,
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image: userData.profile_image,
            cover_image: userData.cover_image
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        window.dispatchEvent(new Event('auth-change'));

        return true;
    } catch (e) {
        console.error("updateUserProfile network error:", e);
        return false;
    }
};

export const updateInstructorProfile = async (data: any): Promise<boolean> => {
    try {
        const payload = {
            display_name: data.display_name || data.name || "",
            bio: data.bio,
            website: data.website,
            phone: data.phone,
            profile_image: data.profile_image,
            cover_image: data.cover_image,
            languages: data.languages,
        };

        const res = await authFetch(`${API_URL}/instructors/me/`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("InstructorProfile update error:", errorData);
            return false;
        }

        return true;
    } catch (error) {
        console.error("updateInstructorProfile failed:", error);
        return false;
    }
};
// --- INSTRUCTOR: GET OWN PROFILE ---
export const getInstructorMe = async () => {
  try {
    const res = await authFetch(`${API_URL}/instructors/me/`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch instructor profile");
    }
    return await res.json();
  } catch (e) {
    console.error("getInstructorMe error:", e);
    throw e;
  }
}

/**
 * PROVIDER (SCHOOL): GET OWN PROFILE
 * Used by ProviderDashboard / School Dashboard
 */
export const getProviderMe = async () => {
  try {
    const res = await authFetch(`${API_URL}/providers/me/`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch provider profile");
    }
    return await res.json();
  } catch (e) {
    console.error("getProviderMe error:", e);
    throw e;
  }
}

export const updateProviderProfile = async (
  data: any
): Promise<boolean> => {
  try {
    const payload = {
      company_name: data.company_name,
      description: data.description,
      website: data.website,
      phone: data.phone,
      languages: Array.isArray(data.languages) ? data.languages : [],

      // 🔥 URLs DE CLOUDINARY
      profile_image: data.profile_image,
      cover_image: data.cover_image,
    };

    const res = await authFetch(`${API_URL}/providers/me/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("ProviderProfile update error:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("updateProviderProfile failed:", error);
    return false;
  }
};
// --- DESTINATIONS ---
export const getDestinations = async (): Promise<Destination[]> => {
  try {
    const res = await fetch(`${API_URL}/destinations/`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (e) {
    console.error("getDestinations error:", e);
    return [];
  }
};

export const getDestinationBySlug = async (
  slug: string
): Promise<Destination | null> => {
  try {
    const res = await fetch(`${API_URL}/destinations/${slug}/`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("getDestinationBySlug error:", e);
    return null;
  }
};