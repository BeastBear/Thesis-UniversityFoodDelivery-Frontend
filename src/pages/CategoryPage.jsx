import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { useHeaderTitle } from "../context/UIContext.jsx";

import RestaurantListingCard from "../components/RestaurantListingCard";
import RestaurantSkeleton from "../components/RestaurantSkeleton";
import { IoIosArrowBack } from "react-icons/io";

function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { allShops, shopsInMyCity, userData } = useSelector(
    (state) => state.user,
  );
  const [filteredShops, setFilteredShops] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useHeaderTitle(category?.name || "Category", {
    loading,
    loadingText: "Loading...",
  });

  useEffect(() => {
    const fetchCategory = async () => {
      if (categoryId && categoryId !== "all") {
        try {
          const response = await axios.get(
            `${serverUrl}/api/global-categories`,
          );
          const categories = Array.isArray(response.data) ? response.data : [];
          const foundCategory = categories.find(
            (cat) => cat._id === categoryId,
          );
          setCategory(foundCategory || null);
        } catch (error) {}
      }
      setLoading(false);
    };

    fetchCategory();
  }, [categoryId]);

  useEffect(() => {
    if (categoryId) {
      const allAvailableShops = (allShops || shopsInMyCity || []).filter(
        Boolean,
      );

      if (categoryId === "all") {
        setFilteredShops(allAvailableShops);
      } else {
        const filtered = allAvailableShops.filter((shop) => {
          const shopCategoryId =
            typeof shop?.category === "object"
              ? shop.category?._id
              : shop?.category;
          return shopCategoryId === categoryId;
        });
        setFilteredShops(filtered);
      }
    }
  }, [categoryId, allShops, shopsInMyCity]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const categoryName =
    categoryId === "all" ? "All Categories" : category?.name || "Category";

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center pb-20">
      <div className="w-full max-w-6xl p-4 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <IoIosArrowBack size={24} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{categoryName}</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <RestaurantSkeleton key={i} />
            ))}
          </div>
        ) : filteredShops.length > 0 ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop) => {
              // Calculate distance
              let distance = null;
              if (userData?.location?.coordinates && shop?.location) {
                distance = calculateDistance(
                  userData.location.coordinates[1],
                  userData.location.coordinates[0],
                  shop.location.latitude,
                  shop.location.longitude,
                );
              }
              const duration = distance ? distance * 2 + 10 : 20;

              return (
                <RestaurantListingCard
                  key={shop._id}
                  data={shop}
                  distance={distance}
                  duration={duration}
                  deliveryFee={
                    distance && distance > 5
                      ? null
                      : distance
                        ? Math.min(
                            Math.round((5.5 + distance * 11) * 100) / 100,
                            30,
                          )
                        : 0
                  }
                  onClick={() => navigate(`/restaurant/${shop._id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-[60vh] flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg">No restaurants found in this category.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 text-primary-orange font-extrabold hover:underline">
              Browse other categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;
