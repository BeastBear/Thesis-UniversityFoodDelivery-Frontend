import { useState } from "react";
import axios from "axios";
import { urlBase64ToUint8Array } from "../utils/urlBase64ToUint8Array";
import { toast } from "react-toastify";
import { serverUrl } from "../App";

export const usePushNotification = () => {
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported by your browser");
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permission denied for push notifications");
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // If a subscription already exists on this device, reuse it.
      // This prevents InvalidStateError and ensures backend always has the latest subscription.
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          toast.error("Missing VAPID public key in frontend env");
          setLoading(false);
          return;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      await axios.post(
        `${serverUrl}/api/user/subscribe-push`,
        { subscription },
        { withCredentials: true }
      );

      setIsSubscribed(true);
      toast.success("Successfully subscribed to notifications!");
    } catch (error) {

      toast.error(
        error.response?.data?.message || "Failed to subscribe to notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/user/send-test-notification`,
        {},
        {
          withCredentials: true,
        }
      );
      toast.success("Test notification sent!");
    } catch (error) {

      toast.error(
        error.response?.data?.message || "Failed to send test notification"
      );
    } finally {
      setLoading(false);
    }
  };

  return { subscribeToPush, sendTestNotification, loading, isSubscribed };
};
