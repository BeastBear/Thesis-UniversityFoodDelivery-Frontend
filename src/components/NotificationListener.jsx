import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation, matchPath } from "react-router-dom";
import useNotification from "../hooks/useNotification";
import axios from "axios";
import { serverUrl } from "../App";

const NotificationListener = () => {
  const { socket, userData } = useSelector((state) => state.user);
  const { notify } = useNotification();
  const location = useLocation();
  const isInitializedRef = useRef(false);

  // State to track unviewed new orders for the owner
  const [pendingOrderIds, setPendingOrderIds] = useState(new Set());
  const loopIntervalRef = useRef(null);

  // State to track available assignments for Delivery Boy (to keep sound looping)
  const [availableAssignments, setAvailableAssignments] = useState(new Set());
  const deliveryLoopIntervalRef = useRef(null);

  // Track duty status in state to trigger re-renders
  const [isOnDuty, setIsOnDuty] = useState(
    () => localStorage.getItem("delivererOnDuty") === "true",
  );

  // Track if delivery boy has an active current order
  const [hasCurrentOrder, setHasCurrentOrder] = useState(false);

  // Prevent notifications from playing on initial mount or re-renders
  const safeNotify = useCallback(
    (message, type, options) => {
      if (isInitializedRef.current) {
        notify(message, type, options);
      }
    },
    [notify],
  );

  // Mark as initialized after first render
  useEffect(() => {
    isInitializedRef.current = true;
    return () => {
      isInitializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleDutyChange = () => {
      const newDutyStatus = localStorage.getItem("delivererOnDuty") === "true";
      setIsOnDuty(newDutyStatus);

      // If going off-duty, clear assignments and stop loop
      if (!newDutyStatus) {
        setAvailableAssignments(new Set());
      }
    };

    // Listen for both custom event (same tab) and storage event (cross-tab)
    window.addEventListener("delivery-boy-duty-changed", handleDutyChange);
    window.addEventListener("storage", handleDutyChange);

    return () => {
      window.removeEventListener("delivery-boy-duty-changed", handleDutyChange);
      window.removeEventListener("storage", handleDutyChange);
    };
  }, []);

  // Check for active order to suppress notifications
  useEffect(() => {
    if (userData?.role === "deliveryBoy") {
      const checkCurrentOrder = async () => {
        try {
          const result = await axios.get(
            `${serverUrl}/api/order/get-current-order?t=${Date.now()}`,
            { withCredentials: true },
          );
          // If we get an order back, we are busy
          if (result.data && result.data._id) {
            setHasCurrentOrder(true);
            // Also clear any available assignments we might have stored,
            // because we shouldn't be notified about them while busy.
            setAvailableAssignments(new Set());
          } else {
            setHasCurrentOrder(false);
          }
        } catch (error) {
          // If 404 or other error, assume no active order
          setHasCurrentOrder(false);
        }
      };

      checkCurrentOrder();
      // Poll less frequently just to stay in sync, e.g., every minute
      const interval = setInterval(checkCurrentOrder, 60000);
      return () => clearInterval(interval);
    }
  }, [userData?.role]);

  // Listen for active order updates from Deliverer component if needed,
  // but for now, we can rely on the fact that if a user accepts a job,
  // the page usually refreshes or state updates.
  // A more robust way is to listen for a "job-accepted" event or similar.

  // --- Sound Loop Logic for Owner ---
  useEffect(() => {
    // If there are pending orders, start the loop if not running
    if (pendingOrderIds.size > 0) {
      if (!loopIntervalRef.current) {
        // Play immediately
        safeNotify("You have new orders!", "warning");

        // Loop every 5 seconds
        loopIntervalRef.current = setInterval(() => {
          safeNotify("You have new orders! Please check.", "warning");
        }, 5000);
      }
    } else {
      // No pending orders, stop the loop
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
    }

    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
    };
  }, [pendingOrderIds, safeNotify]);

  // --- Sound Loop Logic for Delivery Boy ---
  useEffect(() => {
    // Disable notification loops for delivery boys to prevent spamming
    // Notifications will still play for new assignments via socket events
    return () => {
      if (deliveryLoopIntervalRef.current) {
        clearInterval(deliveryLoopIntervalRef.current);
        deliveryLoopIntervalRef.current = null;
      }
    };
  }, [availableAssignments, safeNotify]);

  // --- Fetch Initial Assignments for Deliverer ---
  useEffect(() => {
    if (userData?.role === "deliveryBoy" && isOnDuty) {
      const fetchAssignments = async () => {
        try {
          const result = await axios.get(
            `${serverUrl}/api/order/get-assignments?t=${Date.now()}`,
            { withCredentials: true },
          );
          if (result.data && Array.isArray(result.data)) {
            const assignmentIds = result.data.map((a) => a.assignmentId);
            setAvailableAssignments(new Set(assignmentIds));
          }
        } catch (error) {}
      };

      fetchAssignments();

      // Don't poll here since DeliveryLayout already handles polling
      // const pollInterval = setInterval(fetchAssignments, 30000);
      // return () => clearInterval(pollInterval);
    } else if (userData?.role === "deliveryBoy" && !isOnDuty) {
      // Clear if off duty (double safety)
      setAvailableAssignments(new Set());
    }
  }, [userData?.role, isOnDuty]);

  // --- Location Check Logic (Stop Pinging for Owner) ---
  useEffect(() => {
    // Check if we are on an order detail page
    const match = matchPath("/order-detail/:orderId", location.pathname);

    if (match && match.params.orderId) {
      const viewedOrderId = match.params.orderId;

      // If the viewed order was pending, remove it
      setPendingOrderIds((prev) => {
        if (prev.has(viewedOrderId)) {
          const next = new Set(prev);
          next.delete(viewedOrderId);
          return next;
        }
        return prev;
      });
    }
  }, [location.pathname]);

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket || !userData) return;

    // 1. Owner: New Order
    const handleNewOrder = (data) => {
      if (userData.role === "owner") {
        // Extract order ID. Adjust based on payload structure from search result
        // Payload usually has the full order object.
        const orderId = data._id || data.order?._id;
        const readableOrderId = data.orderId || data.order?.orderId || null;
        const displayOrderId =
          typeof readableOrderId === "string" &&
          readableOrderId.startsWith("LMF-")
            ? orderId
            : readableOrderId || orderId;

        if (orderId) {
          // Check if we are ALREADY on this order's page
          const match = matchPath("/order-detail/:orderId", location.pathname);
          if (match && match.params.orderId === orderId) {
            // We are already viewing it, don't ping
            safeNotify(
              displayOrderId
                ? `New Order ${displayOrderId.toString().slice(-4)} received!`
                : "New Order received!",
              "success",
            );
          } else {
            // Add to pending to start pinging
            setPendingOrderIds((prev) => {
              const next = new Set(prev);
              next.add(orderId);
              return next;
            });
          }
        }
      }
    };

    // 2. User: Order Status Change
    const handleUpdateStatus = (data) => {
      // data: { orderId, shopId, status, ... }
      if (userData.role === "user") {
        safeNotify(`Your order is now ${data.status}`, "info");
      }
    };

    // 3. Deliverer: New Job
    const handleDeliveryAssignment = (data) => {
      if (userData.role === "deliveryBoy" && isOnDuty) {
        // data contains assignmentId
        const assignmentId = data.assignmentId;
        if (assignmentId) {
          setAvailableAssignments((prev) => {
            const next = new Set(prev);
            // Only notify if this is a truly new assignment
            if (!prev.has(assignmentId)) {
              safeNotify("New delivery job available!", "info");
            }
            next.add(assignmentId);
            return next;
          });
        }
      }
    };

    // 4. Deliverer: Job Removed (Accepted by someone else or cancelled)
    const handleDeliveryAssignmentRemoved = (data) => {
      if (userData.role === "deliveryBoy") {
        const assignmentId = data.assignmentId;
        if (assignmentId) {
          setAvailableAssignments((prev) => {
            const next = new Set(prev);
            next.delete(assignmentId);
            return next;
          });
        }
      }
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("update-status", handleUpdateStatus);
    socket.on("delivery-assignment", handleDeliveryAssignment);
    socket.on("delivery-assignment-removed", handleDeliveryAssignmentRemoved);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("update-status", handleUpdateStatus);
      socket.off("delivery-assignment", handleDeliveryAssignment);
      socket.off(
        "delivery-assignment-removed",
        handleDeliveryAssignmentRemoved,
      );
    };
  }, [socket, userData, safeNotify, location.pathname]); // Add location.pathname to dependency if we want the newOrder check to be fresh

  return null; // This component renders nothing
};

export default NotificationListener;
