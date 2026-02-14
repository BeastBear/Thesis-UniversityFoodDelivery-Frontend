import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import RestaurantListingCard from "../components/RestaurantListingCard";
import { setCurrentCafeteria } from "../redux/userSlice";
import { IoIosArrowBack } from "react-icons/io";
import { checkBusinessHours } from "../utils/checkBusinessHours";

function CafeteriaPage() {
  const { cafeteriaName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { shopsInMyCity, userData, currentCafeteria } = useSelector(
    (state) => state.user
  );

  // Update global cafeteria state when visiting this page
  useEffect(() => {
    if (cafeteriaName && currentCafeteria !== cafeteriaName) {
      dispatch(setCurrentCafeteria(cafeteriaName));
    }
  }, [cafeteriaName, currentCafeteria, dispatch]);

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

  return (
    <div className="w-full min-h-screen flex flex-col items-center pb-20">
      <div className="w-full max-w-6xl p-4 pt-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <IoIosArrowBack size={24} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-800">{cafeteriaName}</h1>
        </div>

        {shopsInMyCity && shopsInMyCity.length > 0 ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopsInMyCity.map((shop) => {
              // Calculate distance
              let distance = null;
              if (userData?.location?.coordinates && shop?.location) {
                distance = calculateDistance(
                  userData.location.coordinates[1],
                  userData.location.coordinates[0],
                  shop.location.latitude,
                  shop.location.longitude
                );
              }

              // Mock duration
              const duration = distance ? distance * 2 + 10 : 20;

              return (
                <RestaurantListingCard
                  key={shop._id}
                  data={shop}
                  distance={distance}
                  duration={duration}
                  deliveryFee={0} // Mock fee
                  onClick={() => navigate(`/restaurant/${shop._id}`)}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-[60vh] flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg">No restaurants found in {cafeteriaName}.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 text-primary-orange font-extrabold hover:underline">
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CafeteriaPage;
