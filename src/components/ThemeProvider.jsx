import { useEffect } from "react";
import { useSelector } from "react-redux";
import { applyTheme, resetTheme } from "../utils/theme";

/**
 * ThemeProvider Component
 * Automatically applies theme based on logged-in user's role
 * Should be placed at the root of the app
 */
const ThemeProvider = ({ children }) => {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (userData?.role) {
      // Apply theme based on user role
      applyTheme(userData.role);
    } else {
      // Reset to default theme when user logs out or no user data
      resetTheme();
    }
  }, [userData?.role]);

  return <>{children}</>;
};

export default ThemeProvider;

