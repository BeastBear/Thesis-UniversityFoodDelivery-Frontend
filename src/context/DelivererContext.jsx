import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { serverUrl } from "../App";

const DelivererContext = createContext({
  isOnline: false,
  loading: false,
  toggleOnlineStatus: () => Promise.resolve(false),
  setOnlineStatus: () => Promise.resolve(false),
});

export const DelivererProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const persistStatus = useCallback((nextStatus) => {
    try {
      localStorage.setItem(
        "delivererStatus",
        nextStatus ? "online" : "offline",
      );
      localStorage.setItem("delivery_isOnDuty", nextStatus ? "1" : "0");
      localStorage.setItem("deliveryBoyOnDuty", nextStatus ? "true" : "false");
    } catch {
      // ignore storage errors
    }
    // keep compatibility with legacy listeners
    window.dispatchEvent(new Event("delivery:duty"));
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem("delivererStatus");
      if (cached === "online" || cached === "offline") {
        const cachedValue = cached === "online";
        setIsOnline(cachedValue);
        return cachedValue;
      }

      const res = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });
      const backendStatus = Boolean(res?.data?.isOnline);
      setIsOnline(backendStatus);
      persistStatus(backendStatus);
      return backendStatus;
    } catch (error) {
      setIsOnline(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [persistStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const setOnlineStatus = useCallback(
    async (nextStatus) => {
      setLoading(true);
      try {
        await axios.patch(
          `${serverUrl}/api/delivery/status`,
          { isOnline: !!nextStatus },
          { withCredentials: true },
        );
        setIsOnline(!!nextStatus);
        persistStatus(!!nextStatus);
        return !!nextStatus;
      } catch (error) {
        // surface minimal feedback
        return isOnline;
      } finally {
        setLoading(false);
      }
    },
    [persistStatus, isOnline],
  );

  const toggleOnlineStatus = useCallback(async () => {
    const desired = !isOnline;
    if (desired && typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        try {
          Notification.requestPermission().then((permission) => {
            console.log("Notification permission:", permission);
          });
        } catch (e) {
          // ignore
        }
      }
    }
    return setOnlineStatus(desired);
  }, [isOnline, setOnlineStatus]);

  const value = useMemo(
    () => ({ isOnline, loading, toggleOnlineStatus, setOnlineStatus }),
    [isOnline, loading, toggleOnlineStatus, setOnlineStatus],
  );

  return (
    <DelivererContext.Provider value={value}>
      {children}
    </DelivererContext.Provider>
  );
};

export const useDeliverer = () => useContext(DelivererContext);
