const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAccessToken = (): string => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }
  return token;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let message = 'Admin request failed';
    try {
      const data = await res.json();
      message = data?.detail || data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json();
};

/**
 * BOOKINGS
 * Mirrors Django Admin > Booking
 */
export const getAdminBookings = async () => {
  const res = await fetch(`${API_BASE_URL}/bookings/admin/bookings/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const data = await handleResponse(res);

  // Normalize DRF pagination → always return an array
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

/**
 * TRANSACTIONS
 * Mirrors Django Admin > Transaction
 */
export const getAdminTransactions = async () => {
  const res = await fetch(`${API_BASE_URL}/payments/admin/transactions/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  return handleResponse(res);
};

/**
 * PAYOUTS
 * Mirrors Django Admin > MerchantPayout
 */
export const getAdminPayouts = async () => {
  const res = await fetch(`${API_BASE_URL}/payments/admin/payouts/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  return handleResponse(res);
};

/**
 * MARK PAYOUT AS PAID (ADMIN)
 */
export const markPayoutAsPaid = async (payoutId: string | number) => {
  const res = await fetch(
    `${API_BASE_URL}/payments/admin/payouts/${payoutId}/mark-as-paid/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );

  return handleResponse(res);
};

/**
 * PARTNERS (Providers / Instructors)
 * Mirrors Admin > Partners
 *
 * IMPORTANT:
 * - Keep return shape as the raw JSON from the endpoint (same as before),
 *   so AdminDashboard doesn't break.
 * - Use the ADMIN endpoints that include commission fields.
 */
export const getAdminProviders = async () => {
  const res = await fetch(`${API_BASE_URL}/providers/admin/providers/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  return handleResponse(res);
};

export const getAdminInstructors = async () => {
  const res = await fetch(`${API_BASE_URL}/instructors/admin/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  return handleResponse(res);
};

/**
 * Backwards-compatible alias used by some AdminDashboard implementations.
 * This returns ONLY providers (same as the original function) to avoid UI regressions.
 */
export const getAdminPartners = async () => {
  return getAdminProviders();
};