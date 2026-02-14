// Application Configuration Constants

// ============================================
// DELIVERY & DISTANCE SETTINGS
// ============================================

export const DELIVERY_CONFIG = {
  // Maximum delivery distance in kilometers
  MAX_DELIVERY_DISTANCE_KM: 5,

  // Free delivery threshold (in currency)
  FREE_DELIVERY_THRESHOLD: 500,

  // Peak hour rate (per km)
  PEAK_HOUR_RATE: 16.111,

  // Normal hour rate (per km)
  NORMAL_HOUR_RATE: 11.111,

  // Maximum distance fee cap
  MAX_DISTANCE_FEE: 30,

  // Peak hours (11 AM - 1 PM)
  PEAK_HOURS: {
    START: 11,
    END: 13,
  },
};

// ============================================
// CAFETERIA ORIGIN (Central Pickup Point)
// Cafeteria location is now fetched dynamically from the API
// based on the selected shop's location
// ============================================

// ============================================
// CREDIT & PAYMENT SETTINGS
// ============================================

export const CREDIT_CONFIG = {
  // Minimum credit required to start work (delivery boy)
  MIN_WORK_CREDIT: 300,
};

// ============================================
// UI SETTINGS
// ============================================

export const UI_CONFIG = {
  // Cart badge max display number
  MAX_CART_BADGE_NUMBER: 99,

  // Skeleton loader count
  DEFAULT_SKELETON_COUNT: 6,
};

// ============================================
// API SETTINGS
// ============================================

export const API_CONFIG = {
  // Timeout for API requests (ms)
  REQUEST_TIMEOUT: 30000,

  // Retry attempts
  MAX_RETRY_ATTEMPTS: 3,
};

// ============================================
// ORDER SETTINGS
// ============================================

export const ORDER_CONFIG = {
  // Default order assignment countdown (seconds)
  ASSIGNMENT_COUNTDOWN: 60,

  // Auto-refresh interval for financial data (ms)
  FINANCIAL_DATA_REFRESH_INTERVAL: 60000,
};

export default {
  DELIVERY_CONFIG,
  CREDIT_CONFIG,
  UI_CONFIG,
  API_CONFIG,
  ORDER_CONFIG,
};
