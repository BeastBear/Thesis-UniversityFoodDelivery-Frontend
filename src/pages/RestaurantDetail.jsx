import axios from "axios";
import React, { useEffect, useState } from "react";
import { serverUrl } from "../App";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaLocationDot,
  FaStar,
  FaRegStar,
  FaPhone,
  FaClock,
  FaChevronLeft,
} from "react-icons/fa6";
import { IoIosArrowBack } from "react-icons/io";
import { useSelector } from "react-redux";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PrimaryButton from "../components/ui/PrimaryButton";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function RestaurantDetail() {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { userData } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("Details");
  const apikey = import.meta.env.VITE_GEOAPIKEY;

  const handleShop = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/item/get-by-shop/${shopId}`,
        { withCredentials: true },
      );
      setShop(result.data.shop);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/review/shop/${shopId}`, {
        withCredentials: true,
      });
      setReviews(result.data);
    } catch (error) {}
  };

  const fetchUserReview = async () => {
    if (!userData) return;
    try {
      const result = await axios.get(
        `${serverUrl}/api/review/shop/${shopId}/user`,
        { withCredentials: true },
      );
      if (result.data) {
        setUserReview(result.data);
        setRating(result.data.rating);
        setComment(result.data.comment || "");
      }
    } catch (error) {}
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${serverUrl}/api/review/shop/${shopId}`,
        { rating, comment },
        { withCredentials: true },
      );
      await fetchReviews();
      await fetchUserReview();
      await handleShop();
      setShowReviewForm(false);
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    handleShop();
    fetchReviews();
    if (userData) {
      fetchUserReview();
    }
  }, [shopId, userData]);

  useEffect(() => {
    const fetchAddressFromCoords = async () => {
      try {
        const lat = shop?.location?.latitude;
        const lon = shop?.location?.longitude;
        if (!apikey || !lat || !lon) {
          setResolvedAddress("");
          return;
        }
        const res = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${apikey}`,
        );
        const addr = res?.data?.results?.[0]?.formatted || "";
        setResolvedAddress(addr);
      } catch (error) {
        setResolvedAddress("");
      }
    };

    fetchAddressFromCoords();
  }, [shop?.location?.latitude, shop?.location?.longitude, apikey]);

  const renderStars = (ratingValue, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        interactive ? (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            className="focus:outline-none transition-transform hover:scale-110">
            {i <= rating ? (
              <FaStar className="text-yellow-400 text-3xl" />
            ) : (
              <FaRegStar className="text-yellow-400 text-3xl" />
            )}
          </button>
        ) : (
          <span key={i}>
            {i <= ratingValue ? (
              <FaStar className="text-yellow-400 text-sm" />
            ) : (
              <FaRegStar className="text-yellow-400 text-sm" />
            )}
          </span>
        ),
      );
    }
    return stars;
  };

  const renderRatingBars = () => {
    const totalReviews = reviews.length || 0;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5)
        ratingCounts[review.rating]++;
    });

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {[5, 4, 3, 2, 1].map((star) => (
          <div
            key={star}
            className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <span className="w-3">{star}</span>
            <FaStar className="text-gray-300" size={10} />
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{
                  width: `${
                    totalReviews ? (ratingCounts[star] / totalReviews) * 100 : 0
                  }%`,
                }}></div>
            </div>
            <span className="w-6 text-right text-gray-400">
              {ratingCounts[star]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Full Width Banner */}
      <div className="relative w-full h-[400px] md:h-[50vh] lg:h-[500px]">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10"></div>
        {shop.image ? (
          <img
            src={shop.image}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-6xl font-bold opacity-30">
              {shop.name?.charAt(0)}
            </span>
          </div>
        )}

        {/* Floating Navigation - Hidden on mobile, visible on desktop */}
        <button
          onClick={() => navigate("/")}
          className="hidden md:flex absolute top-6 left-6 z-30 w-10 h-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all shadow-lg">
          <FaChevronLeft size={18} />
        </button>

        {/* Hero Content (Bottom Left) */}
        <div className="absolute bottom-0 left-0 w-full z-30 p-6 md:p-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-white">
              <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight drop-shadow-sm">
                {shop.name}
              </h1>
              <div className="flex items-center flex-wrap gap-3 text-sm md:text-base font-medium opacity-90">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <FaStar className="text-yellow-400" />
                  {shop.rating?.average
                    ? shop.rating.average.toFixed(1)
                    : "New"}
                  <span className="opacity-60 text-xs font-normal ml-0.5">
                    ({shop.rating?.count || 0})
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FaClock className="opacity-70" />
                  20-30 min
                </span>
                <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                <span>฿10 Delivery</span>
              </div>
            </div>

            <div className="flex gap-3">
              {userData && !userReview && !showReviewForm && (
                <button
                  onClick={() => {
                    setActiveTab("Reviews");
                    setTimeout(() => setShowReviewForm(true), 100);
                    document
                      .getElementById("reviews-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-5 py-2.5 bg-white text-gray-900 font-extrabold rounded-full hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2 text-sm z-30">
                  <FaStar className="text-yellow-400" /> Rate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {shop?.temporaryClosure?.isClosed === true &&
        !shop?.temporaryClosure?.reopenTime &&
        !shop?.temporaryClosure?.closedUntil && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 font-bold text-sm">
            Closed by Admin
          </div>
        )}
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs - Centered & Modern */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex shadow-inner">
            {["Details", "Reviews"].map((tab) => (
              <button
                key={tab}
                className={`px-8 py-2.5 text-sm font-extrabold rounded-xl transition-all ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
                onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Menu" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Menu Items would go here - placeholder for now as list wasn't visible in original snippet */}
            <div className="col-span-full py-10 text-center text-gray-400">
              Menu capability coming in next step (integrating existing logic)
            </div>
          </div>
        )}

        {activeTab === "Details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map & Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl p-6 border border-gray-100">
                <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-primary-orange">
                    <FaLocationDot />
                  </div>
                  Location & Contact
                </h2>
                <div className="w-full h-[300px] bg-gray-100 rounded-2xl overflow-hidden relative z-0 mb-6">
                  {shop.location?.latitude ? (
                    <MapContainer
                      center={[shop.location.latitude, shop.location.longitude]}
                      zoom={15}
                      scrollWheelZoom={false}
                      className="w-full h-full"
                      dragging={true}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker
                        position={[
                          shop.location.latitude,
                          shop.location.longitude,
                        ]}>
                        <Popup>{shop.name}</Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Map Unavailable
                    </div>
                  )}
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-gray-600 font-medium leading-relaxed">
                      {resolvedAddress || shop.address || "No address provided"}
                    </p>
                  </div>
                  {shop.shopNumber && (
                    <div className="shrink-0">
                      <a
                        href={`tel:${shop.shopNumber}`}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                        <FaPhone className="text-gray-500" /> Call Now
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hours Side Widget */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 sticky top-24">
                <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <FaClock className="text-primary-orange" /> Opening Hours
                </h2>
                <div className="space-y-4">
                  {shop.businessHours?.map((hour, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                      <span className="font-bold text-gray-700 w-12 uppercase text-xs">
                        {hour.day.slice(0, 3)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          hour.isClosed
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-700"
                        }`}>
                        {hour.isClosed
                          ? "Closed"
                          : hour.timeSlots?.length > 0
                            ? hour.timeSlots
                                .map((s) =>
                                  s.is24Hours
                                    ? "24 Hrs"
                                    : `${s.openTime} - ${s.closeTime}`,
                                )
                                .join(", ")
                            : `${hour.openTime} - ${hour.closeTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Reviews" && (
          <div id="reviews-section" className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center flex flex-col items-center justify-center">
                <div className="text-6xl font-black text-gray-900 tracking-tighter">
                  {shop.rating?.average
                    ? shop.rating.average.toFixed(1)
                    : "0.0"}
                </div>
                <div className="flex gap-1 text-yellow-400 my-3 text-lg">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <FaStar key={i} />
                  ))}
                </div>
                <p className="text-gray-400 font-medium">
                  {shop.rating?.count || 0} reviews
                </p>
              </div>
              <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 flex items-center">
                {renderRatingBars()}
              </div>
            </div>

            {/* Review Form & List - Keeping logic but redesigning containers */}
            {showReviewForm && (
              <div className="mb-8 bg-white rounded-3xl p-6 border border-orange-100 shadow-lg shadow-orange-500/5 animate-fadeIn ring-4 ring-orange-500/5">
                <h3 className="font-extrabold text-xl text-gray-900 mb-6 text-center">
                  How was your experience?
                </h3>
                <div className="flex justify-center gap-4 mb-8">
                  {renderStars(rating, true)}
                </div>
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all resize-none font-medium"
                  rows="4"
                  placeholder="Tell us about the food, service, or atmosphere..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}></textarea>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 py-3.5 text-gray-600 font-extrabold hover:bg-gray-100 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-primary-orange text-white font-extrabold rounded-xl shadow-lg shadow-primary-orange/30 hover:bg-primary-orange/90 transition-all transform active:scale-95 disabled:opacity-70 disabled:transform-none">
                    {submitting ? "Posting..." : "Post Review"}
                  </button>
                </div>
              </div>
            )}

            {/* User Review Display */}
            {userReview && (
              <div className="mb-8 bg-orange-50/50 rounded-3xl p-6 border border-orange-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-primary-orange flex items-center justify-center font-black">
                      {userData?.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Your Review</h3>
                      <p className="text-xs text-gray-400 font-medium">
                        {new Date(userReview.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-yellow-400 text-sm bg-white px-3 py-1 rounded-full border border-orange-100">
                    {renderStars(userReview.rating)}
                  </div>
                </div>
                <p className="text-gray-700 text-base leading-relaxed pl-[52px]">
                  {userReview.comment}
                </p>
              </div>
            )}

            {/* Reviews List */}
            <div className="grid gap-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review._id}
                    className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-extrabold text-sm text-gray-500">
                          {review.user?.fullName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {review.user?.fullName || "Anonymous"}
                          </div>
                          <div className="text-xs text-gray-400 font-medium mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-yellow-400 text-xs bg-white px-2 py-1 rounded-lg">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm pl-[52px]">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-3xl">
                    <FaRegStar />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-gray-500">
                    Be the first to share your experience!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RestaurantDetail;
