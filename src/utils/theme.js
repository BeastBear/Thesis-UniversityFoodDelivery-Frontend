/**
 * Dynamic Theme Configuration based on User Roles
 * Maps user roles to their respective color themes
 */

export const themeConfig = {
  // Customer (User) - Orange Theme
  user: {
    primary: "#FF6B35",
    primaryDark: "#ff5a1f",
    primaryLight: "#FF8C42",
    primaryBg: "#fff5f2",
    primaryBgLight: "#ffede8",
    primaryBorder: "#ffd4c4",
    primaryShadow: "rgba(255, 107, 53, 0.2)",
    primaryShadowLight: "rgba(255, 107, 53, 0.1)",
    name: "orange",
  },
  // Restaurant (Shop/Owner) - Green Theme
  owner: {
    primary: "#10B981",
    primaryDark: "#059669",
    primaryLight: "#34D399",
    primaryBg: "#f0fdf4",
    primaryBgLight: "#dcfce7",
    primaryBorder: "#bbf7d0",
    primaryShadow: "rgba(16, 185, 129, 0.2)",
    primaryShadowLight: "rgba(16, 185, 129, 0.1)",
    name: "green",
  },
  // Deliverer (Delivery Boy) - Blue Theme
  deliveryBoy: {
    primary: "#3B82F6",
    primaryDark: "#2563EB",
    primaryLight: "#60A5FA",
    primaryBg: "#eff6ff",
    primaryBgLight: "#dbeafe",
    primaryBorder: "#bfdbfe",
    primaryShadow: "rgba(59, 130, 246, 0.2)",
    primaryShadowLight: "rgba(59, 130, 246, 0.1)",
    name: "blue",
  },
  // Admin - Purple Theme
  admin: {
    primary: "#8B5CF6",
    primaryDark: "#7C3AED",
    primaryLight: "#A78BFA",
    primaryBg: "#faf5ff",
    primaryBgLight: "#f3e8ff",
    primaryBorder: "#e9d5ff",
    primaryShadow: "rgba(139, 92, 246, 0.2)",
    primaryShadowLight: "rgba(139, 92, 246, 0.1)",
    name: "purple",
  },
};

/**
 * Get theme colors based on user role
 * @param {string} role - User role (user, owner, deliveryBoy, admin)
 * @returns {Object} Theme color object
 */
export const getThemeByRole = (role) => {
  // Map role to theme key
  const roleMap = {
    user: "user",
    owner: "owner",
    deliveryBoy: "deliveryBoy",
    admin: "admin",
  };

  const themeKey = roleMap[role] || "user"; // Default to user/orange theme
  return themeConfig[themeKey];
};

/**
 * Apply theme CSS variables to document root
 * @param {string} role - User role
 */
export const applyTheme = (role) => {
  const theme = getThemeByRole(role);
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-primary-dark", theme.primaryDark);
  root.style.setProperty("--color-primary-light", theme.primaryLight);
  root.style.setProperty("--color-primary-bg", theme.primaryBg);
  root.style.setProperty("--color-primary-bg-light", theme.primaryBgLight);
  root.style.setProperty("--color-primary-border", theme.primaryBorder);
  root.style.setProperty("--color-primary-shadow", theme.primaryShadow);
  root.style.setProperty("--color-primary-shadow-light", theme.primaryShadowLight);
  root.style.setProperty("--theme-name", theme.name);
};

/**
 * Reset theme to default (orange/user theme)
 */
export const resetTheme = () => {
  const defaultTheme = themeConfig.user;
  applyTheme("user");
};







