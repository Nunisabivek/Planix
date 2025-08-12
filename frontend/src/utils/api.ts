// API configuration utility
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const apiEndpoints = {
  // Auth endpoints
  register: `${API_BASE_URL}/api/auth/register`,
  login: `${API_BASE_URL}/api/auth/login`,
  forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  me: `${API_BASE_URL}/api/me`,
  
  // Floor plan endpoints
  generatePlan: `${API_BASE_URL}/api/generate-plan`,
  analyzePlan: `${API_BASE_URL}/api/analyze-plan`,
  
  // Project endpoints
  projects: `${API_BASE_URL}/api/projects`,
  projectById: (id: string) => `${API_BASE_URL}/api/projects/${id}`,
  projectVersions: (id: string) => `${API_BASE_URL}/api/projects/${id}/versions`,
  restoreProject: (id: string, versionId: string) => `${API_BASE_URL}/api/projects/${id}/restore/${versionId}`,
  
  // Payment endpoints
  createOrder: `${API_BASE_URL}/api/payment/create-order`,
  verifyPayment: `${API_BASE_URL}/api/payment/verify`,
  createOrderCredits: `${API_BASE_URL}/api/payment/create-order-credits`,
  verifyCredits: `${API_BASE_URL}/api/payment/verify-credits`,
  
  // Usage endpoints
  usageHistory: `${API_BASE_URL}/api/usage-history`,
  
  // Health check
  health: `${API_BASE_URL}/api/health`,
};

// Helper function for making API requests with proper error handling
export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// Helper function for authenticated requests
export async function authenticatedRequest(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  return apiRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
