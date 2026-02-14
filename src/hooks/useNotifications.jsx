import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useSelector } from "react-redux";

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { userData, socket } = useSelector((state) => state.user);

  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      if (!userData) return;

      try {
        setLoading(true);
        const res = await axios.get(
          `${serverUrl}/api/notifications?page=${pageNum}&limit=20`,
          {
            withCredentials: true,
          },
        );

        if (append) {
          setNotifications((prev) => [...prev, ...res.data.notifications]);
        } else {
          setNotifications(res.data.notifications);
        }

        setUnreadCount(res.data.unreadCount);
        setHasMore(res.data.currentPage < res.data.totalPages);
        setPage(res.data.currentPage);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    },
    [userData],
  );

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `${serverUrl}/api/notifications/${id}/read`,
        {},
        {
          withCredentials: true,
        },
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {

    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${serverUrl}/api/notifications/read-all`,
        {},
        {
          withCredentials: true,
        },
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {

    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Refetch when user changes or initially
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Socket listener
  useEffect(() => {
    if (!socket) return;

    const handleNotification = () => {
      try {
        const audio = new Audio("/notification1.mp3");
        audio.play().catch(() => {});
      } catch (e) {
        // ignore
      }
      fetchNotifications(1);
    };

    socket.on("newOrder", handleNotification);
    socket.on("update-status", handleNotification);
    socket.on("delivery-assignment", handleNotification);
    socket.on("order-updated", handleNotification);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("newOrder", handleNotification);
      socket.off("update-status", handleNotification);
      socket.off("delivery-assignment", handleNotification);
      socket.off("order-updated", handleNotification);
      socket.off("notification", handleNotification);
    };
  }, [socket, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    fetchNotifications, // Expose to manually refresh
  };
};

export default useNotifications;
