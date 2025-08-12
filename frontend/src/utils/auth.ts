// Authentication utilities

/**
 * Logout user by clearing all stored data and redirecting to login
 */
export function logout(): void {
  try {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any other cached data
    localStorage.removeItem('currentProject');
    localStorage.removeItem('recentProjects');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if localStorage fails
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
}

/**
 * Get current user data from localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Update user data in localStorage
 */
export function updateUserData(userData: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user', JSON.stringify(userData));
  } catch (error) {
    console.error('Error updating user data:', error);
  }
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('token');
}
