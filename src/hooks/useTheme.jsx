import { useSelector } from "react-redux";
import { getThemeByRole } from "../utils/theme";

/**
 * Custom hook to get current theme colors based on logged-in user's role
 * @returns {Object} Current theme color object
 */
const useTheme = () => {
  const { userData } = useSelector((state) => state.user);
  const role = userData?.role || "user";
  return getThemeByRole(role);
};

export default useTheme;







