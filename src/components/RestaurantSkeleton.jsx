import React from "react";

const RestaurantSkeleton = () => {
  return (
    <div className="w-full bg-white rounded-3xl shadow-lg border-none overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full aspect-[4/3] bg-gray-200"></div>

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-8"></div>
        </div>

        <div className="h-3 bg-gray-200 rounded w-1/2"></div>

        <div className="flex items-center gap-2 mt-1">
          <div className="h-6 w-16 bg-gray-200 rounded-xl"></div>
          <div className="h-6 w-12 bg-gray-200 rounded-xl"></div>
          <div className="h-4 w-10 bg-gray-200 rounded ml-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSkeleton;
