import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTimes, FaBullhorn } from "react-icons/fa";

const serverUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/settings?t=${Date.now()}`,
        );
        const msg = String(res.data?.announcementBanner || "").trim();

        if (msg) {
          // Hide if it's the specific test message
          if (msg === "System Announcement Test") {
            return;
          }

          // Check if this specific announcement has been dismissed
          // We use a simple hash or just the string itself as the key to detect changes
          // If the message changes, the key changes, so it reappears.
          const dismissalKey = `dismissed_banner_${btoa(encodeURIComponent(msg))}`;
          const isDismissed = sessionStorage.getItem(dismissalKey);

          if (!isDismissed) {
            setAnnouncement(msg);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcement:", error);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (announcement) {
      const dismissalKey = `dismissed_banner_${btoa(encodeURIComponent(announcement))}`;
      sessionStorage.setItem(dismissalKey, "true");
    }
  };

  if (!isVisible || !announcement) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-200 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0 bg-amber-200 rounded-full p-2 text-amber-700">
            <FaBullhorn />
          </div>
          <p className="text-sm font-medium text-amber-900 break-words">
            {announcement}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 -mr-1 p-2 rounded-full hover:bg-amber-200 text-amber-500 hover:text-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Dismiss announcement">
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
