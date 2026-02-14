import React from "react";
import { FaStar, FaClock } from "react-icons/fa";
import { MdVerified, MdDeliveryDining } from "react-icons/md";

function RestaurantListingCard({
  data,
  onClick,
  distance,
  duration,
  deliveryFee,
}) {
  const rating = data.rating?.average
    ? Number(data.rating.average).toFixed(1)
    : "New";
  const time = duration
    ? `${Math.round(duration) - 5}-${Math.round(duration)} min`
    : "15-20 min";
  const fee =
    deliveryFee !== undefined && deliveryFee !== null && deliveryFee > 0
      ? `฿${Math.ceil(deliveryFee)}`
      : "Free";

  return (
    <div
      className="w-full bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all cursor-pointer group p-0"
      onClick={onClick}>
      {/* Image Section - Top */}
      <div className="relative w-full aspect-4/3 overflow-hidden bg-gray-100">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/35 to-transparent" />

        {data.isVerified && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <MdVerified className="text-primary-blue text-base" />
            <span>Verified</span>
          </div>
        )}
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 text-xs font-bold text-gray-800">
          <FaStar className="text-yellow-400" />
          <span>{rating}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="text-gray-900 font-bold text-lg truncate flex-1 group-hover:text-primary-orange transition-colors">
            {data.name}
          </h3>
        </div>

        <p className="text-gray-500 text-sm truncate">
          {data.category?.name || "Restaurant Category"}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700">
            <FaClock className="text-gray-400" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary-orange/10 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-primary-orange">
            <MdDeliveryDining className="text-primary-orange" size={14} />
            <span>{fee}</span>
          </div>
          {distance && (
            <div className="ml-auto text-xs font-semibold text-gray-500 bg-white px-2.5 py-1.5 rounded-xl">
              {distance.toFixed(1)} km
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantListingCard;
