import React, { useEffect, useState } from "react";
import { FaPowerOff, FaCog, FaUsers } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { usePushNotification } from "../../hooks/usePushNotification";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(0);
  const [announcementBanner, setAnnouncementBanner] = useState("");

  const {
    subscribeToPush,
    sendTestNotification,
    loading: pushLoading,
    isSubscribed,
  } = usePushNotification();
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const checkExistingSubscription = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          setPushEnabled(false);
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch (e) {
        setPushEnabled(false);
      }
    };

    checkExistingSubscription();
  }, []);

  const handleTogglePushNotifications = async (value) => {
    if (pushLoading) return;

    if (value) {
      await subscribeToPush();
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch (e) {
        setPushEnabled(isSubscribed);
      }
      return;
    }

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushEnabled(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        toast.success("Push notifications disabled");
      }
      setPushEnabled(false);
    } catch (e) {
      toast.error("Unable to disable push notifications on this device");
      setPushEnabled(true);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/admin/settings`, {
        withCredentials: true,
      });
      setSettings(res.data);
      setCommissionPercentage(Number(res.data?.commissionPercentage || 0));
      setBaseDeliveryFee(Number(res.data?.baseDeliveryFee || 0));
      setAnnouncementBanner(String(res.data?.announcementBanner || ""));
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load settings");
      setLoading(false);
    }
  };

  const handleToggleSystem = async () => {
    if (!settings) return;
    try {
      const nextIsOpen = !settings.isSystemOpen;
      const res = await axios.put(
        `${serverUrl}/api/admin/settings`,
        { isSystemOpen: nextIsOpen },
        { withCredentials: true },
      );
      setSettings(res.data);
      setCommissionPercentage(Number(res.data?.commissionPercentage || 0));
      setBaseDeliveryFee(Number(res.data?.baseDeliveryFee || 0));
      setAnnouncementBanner(String(res.data?.announcementBanner || ""));
      toast.success(`System is now ${nextIsOpen ? "OPEN" : "CLOSED"}`);
    } catch (error) {
      toast.error("Failed to update system settings");
    }
  };

  const handleSaveGlobalConfig = async () => {
    if (!settings) return;
    try {
      const res = await axios.put(
        `${serverUrl}/api/admin/settings`,
        {
          commissionPercentage: Number(commissionPercentage) || 0,
          baseDeliveryFee: Number(baseDeliveryFee) || 0,
          announcementBanner: String(announcementBanner || ""),
        },
        { withCredentials: true },
      );
      setSettings(res.data);
      setCommissionPercentage(Number(res.data?.commissionPercentage || 0));
      setBaseDeliveryFee(Number(res.data?.baseDeliveryFee || 0));
      setAnnouncementBanner(String(res.data?.announcementBanner || ""));
      toast.success("Global settings updated");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update settings",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Header removed to reduce redundancy */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Profile Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your account details and preferences.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-primary-bg)] text-[var(--color-primary)]">
                <FaUsers size={24} />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate("/admin/profile")}
                className="w-full px-4 py-3 rounded-xl font-bold text-sm transition-all bg-white text-gray-800 hover:bg-gray-100 border border-gray-200">
                Open Profile
              </button>

              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
                <div>
                  <div className="font-bold text-gray-800">
                    Enable Notifications
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Receive important system and activity updates.
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushEnabled || isSubscribed}
                    onChange={(e) =>
                      handleTogglePushNotifications(e.target.checked)
                    }
                    disabled={pushLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  System Availability
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Control whether users can place orders app-wide.
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  settings.isSystemOpen
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}>
                <FaPowerOff size={24} />
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-4 rounded-2xl">
              <span className="font-bold text-gray-700">Current Status</span>
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${
                  settings.isSystemOpen
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}>
                {settings.isSystemOpen
                  ? "System Open"
                  : "Closed for Maintenance"}
              </span>
            </div>

            <button
              onClick={handleToggleSystem}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                settings.isSystemOpen
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30"
                  : "bg-green-500 text-white hover:bg-green-600 shadow-green-500/30"
              }`}>
              {settings.isSystemOpen
                ? "Close System for Maintenance"
                : "Open System"}
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Global Configuration
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Platform-wide fees and announcement.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-primary-bg)] text-[var(--color-primary)]">
              <FaCog size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Platform Commission Fee (%)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Base Delivery Fee
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                value={baseDeliveryFee}
                onChange={(e) => setBaseDeliveryFee(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                System Announcement Banner
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                value={announcementBanner}
                onChange={(e) => setAnnouncementBanner(e.target.value)}
                placeholder="Message to show users (leave empty to hide)"
              />
              <p className="text-xs text-gray-400 mt-2">
                This will be returned by the public settings API so the app can
                display it.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] active:scale-95 shadow-[var(--color-primary-shadow)]">
              Save Global Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
