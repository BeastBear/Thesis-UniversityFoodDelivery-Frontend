import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setUserData, setAuthLoading, setCurrentCafeteria, setShopsInMyCity, setItemsInMyCity } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetCurrentUser() {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user.userData);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        dispatch(setAuthLoading(true));
        const res = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        });

        // Only clear cafeteria selection if we got a valid user response
        if (res.data) {
        // Clear cafeteria selection when user logs in so they must select it again
        dispatch(setCurrentCafeteria(null));
        dispatch(setShopsInMyCity(null));
        dispatch(setItemsInMyCity(null));
        
        dispatch(setUserData(res.data));
        } else {
          // No user data, only clear if we don't already have userData
          // This prevents clearing userData that was just set by signin
          if (!userData) {
            dispatch(setUserData(null));
            dispatch(setCurrentCafeteria(null));
            dispatch(setShopsInMyCity(null));
            dispatch(setItemsInMyCity(null));
          }
        }
      } catch (error) {

        // Only clear user data on auth failure if we get a 401/403
        // AND we don't already have userData (to prevent clearing after signin)
        if ((error.response?.status === 401 || error.response?.status === 403) && !userData) {
        dispatch(setUserData(null));
        dispatch(setCurrentCafeteria(null));
        dispatch(setShopsInMyCity(null));
        dispatch(setItemsInMyCity(null));
        }
      } finally {
        // Always set loading to false
        dispatch(setAuthLoading(false));
      }
    };

    fetchUser();
  }, [dispatch]); // Only run on mount
}

export default useGetCurrentUser;
