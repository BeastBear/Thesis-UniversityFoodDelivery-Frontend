import React from "react";

const FoodSkeleton = () => {
  return (
    <div className="w-full h-full bg-white rounded-3xl shadow-lg border-none overflow-hidden animate-pulse flex flex-col">
      <div className="w-full aspect-4/3 bg-gray-200"></div>
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-auto"></div>
        <div className="flex justify-between items-center mt-2">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-7 w-7 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default FoodSkeleton;
