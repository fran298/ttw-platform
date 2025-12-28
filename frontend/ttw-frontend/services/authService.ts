
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

type Json = Record<string, any>;

const handleResponse = async (res: Response): Promise<Json> => {
  if (!res.ok) {
    let errorMessage = 'Request failed';
    try {
      const data = await res.json();
      errorMessage = data?.message || errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

/**
 * Request password reset code to be sent by email
 */
export const requestPasswordReset = async (email: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return handleResponse(res);
};

/**
 * Confirm password reset using code and new password
 */
export const confirmPasswordReset = async (
  email: string,
  code: string,
  newPassword: string
) => {
  const res = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      code,
      newPassword,
    }),
  });

  return handleResponse(res);
};

/**
 * Login (optional, for future consolidation)
 */
export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(res);
};
