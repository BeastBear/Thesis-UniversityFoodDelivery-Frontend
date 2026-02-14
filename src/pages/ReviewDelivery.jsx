import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdClose } from "react-icons/io";
import { FaStore, FaMotorcycle } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";

/**
 * ReviewDelivery — unified review modal.
 *
 * Props:
 *   order        – the full order object
 *   shopOrder    – the specific shopOrder being reviewed
 *   onClose      – callback to close the modal
 *   reviewType   – "driver" | "restaurant" | undefined
 */
const ReviewDelivery = ({ order, shopOrder, onClose, reviewType }) => {
  const navigate = useNavigate();
  const isRestaurant = reviewType === "restaurant";

  // ─── Shared state ─────────────────────────────────────────────────────
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Restaurant pre-fill ──────────────────────────────────────────────
  const [existingReviewId, setExistingReviewId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isRestaurant);

  useEffect(() => {
    if (!isRestaurant) return;

    const fetchExistingReview = async () => {
      try {
        const shopId = shopOrder.shop?._id;
        if (!shopId) return;

        const { data } = await axios.get(
          `${serverUrl}/api/review/shop/${shopId}/user`,
          { withCredentials: true },
        );

        if (data && data._id && data.rating) {
          setExistingReviewId(data._id);
          setRating(data.rating);
          setComment(data.comment || "");
          setIsEditing(true);
        }
      } catch {
        // No existing review
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExistingReview();
  }, [isRestaurant, shopOrder.shop?._id]);

  // ─── Rating label ─────────────────────────────────────────────────────
  const getRatingLabel = (r) => {
    switch (r) {
      case 1:
        return "Terrible";
      case 2:
        return "Bad";
      case 3:
        return "Okay";
      case 4:
        return "Good";
      case 5:
        return "Amazing!";
      default:
        return "";
    }
  };

  // ─── Close helper ─────────────────────────────────────────────────────
  const handleClose = () => {
    if (onClose) onClose();
    else navigate("/", { replace: true });
  };

  // ─── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      if (isRestaurant) {
        if (isEditing && existingReviewId) {
          // ── PUT: update existing review ──
          await axios.put(
            `${serverUrl}/api/review/${existingReviewId}`,
            { rating, comment },
            { withCredentials: true },
          );
        } else {
          // ── POST: create new review ──
          await axios.post(
            `${serverUrl}/api/review/delivery-completed`,
            {
              shopReview: {
                rating,
                comment,
                shopId: shopOrder.shop?._id,
              },
              orderId: order._id,
              shopOrderId: shopOrder._id,
            },
            { withCredentials: true },
          );
        }
      } else {
        // Driver review — always POST
        const reviewData = {
          delivererReview: {
            rating,
            comment: "",
            tags: [],
            tipAmount: 0,
            delivererId: shopOrder.assignedDeliveryBoy?._id,
          },
          orderId: order._id,
          shopOrderId: shopOrder._id,
        };

        const response = await axios.post(
          `${serverUrl}/api/review/delivery-completed`,
          reviewData,
          { withCredentials: true },
        );

        if (!response.data.delivererReviewSubmitted) {
          if (response.data.delivererReviewAlreadyExisted) {
            toast.error(
              "You have already reviewed this deliverer for this order",
            );
            // Still refresh the order data to hide the Deliverer Info section
            if (onClose) {
              onClose();
            } else {
              navigate("/", { replace: true });
            }
            return;
          } else {
            toast.error("Driver review was not submitted");
            return;
          }
        }
      }

      toast.success(isEditing ? "Review updated!" : "Review submitted!");

      // If this is a driver review, we need to refresh the parent component's order data
      // to update the isDriverReviewed status. The onClose callback should handle this.
      if (onClose) {
        onClose();
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── StarRow ──────────────────────────────────────────────────────────
  const StarRow = () => (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-5xl transition-all duration-150 ${
              star <= rating
                ? "text-yellow-400 scale-110"
                : "text-gray-200 hover:text-yellow-200"
            }`}>
            ★
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-sm font-medium text-gray-600">
          {getRatingLabel(rating)}
        </p>
      )}
      {rating === 0 && (
        <p className="text-sm text-gray-400">Tap a star to rate</p>
      )}
    </div>
  );

  // ─── Submit button (shared) ───────────────────────────────────────────
  const SubmitButton = () => (
    <button
      onClick={handleSubmit}
      disabled={rating === 0 || submitting}
      className={`w-full font-extrabold py-3.5 rounded-2xl shadow-lg transition-all text-base ${
        rating > 0 && !submitting
          ? "bg-primary-orange text-white hover:bg-primary-orange/90 shadow-primary-orange/20"
          : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
      }`}>
      {submitting
        ? "Submitting..."
        : isEditing
          ? "Update Review"
          : "Submit Review"}
    </button>
  );

  // ─── Loading ──────────────────────────────────────────────────────────
  if (loadingExisting) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  // ─── Restaurant review UI ─────────────────────────────────────────────
  if (isRestaurant) {
    return (
      <div className="min-h-screen  flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-800">
            <IoMdClose size={22} />
          </button>
          <h1 className="text-lg font-extrabold text-gray-900">
            Rate Restaurant
          </h1>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-6 pt-10 pb-8">
            {/* Restaurant icon */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-sm"
              style={{
                backgroundColor: "var(--color-primary-bg-light)",
                color: "var(--color-primary)",
              }}>
              <FaStore size={28} />
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 mb-1">
              {shopOrder.shop?.name || "Restaurant"}
            </h2>
            {isEditing && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 mb-6">
                Editing your review
              </span>
            )}
            {!isEditing && <div className="mb-6" />}

            {/* Stars */}
            <StarRow />

            {/* Comment */}
            <div className="w-full mt-8">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the restaurant..."
                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange/30 focus:border-primary-orange/50 resize-none transition-all"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1.5 text-right">
                {comment.length}/500
              </p>
            </div>

            {/* Submit Button */}
            <div className="w-full mt-6">
              <SubmitButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Driver review UI ─────────────────────────────────────────────────
  const delivererName = shopOrder.assignedDeliveryBoy?.fullName || "Deliverer";
  const delivererInitial = delivererName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors text-gray-800">
          <IoMdClose size={22} />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">Rate Driver</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 pt-10 pb-8">
          {/* Driver avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden mb-5 shadow-sm border-2 border-white">
            {shopOrder.assignedDeliveryBoy?.profileImage ? (
              <img
                src={shopOrder.assignedDeliveryBoy.profileImage}
                alt={delivererName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-extrabold text-2xl"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {delivererInitial}
              </div>
            )}
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 mb-1">
            {delivererName}
          </h2>
          <p className="text-sm text-gray-500 mb-8 flex items-center gap-1.5">
            <FaMotorcycle size={14} />
            Your delivery partner
          </p>

          {/* Stars */}
          <StarRow />

          {/* Submit Button */}
          <div className="w-full mt-10">
            <SubmitButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDelivery;
