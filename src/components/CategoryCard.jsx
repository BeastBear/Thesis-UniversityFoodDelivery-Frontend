import React from "react";

function CategoryCard({ name, image, onClick, isClosed = false }) {
  return (
    <div
      className="w-[120px] h-[120px] md:w-[180px] md:h-[180px] bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all shrink-0 relative cursor-pointer"
      onClick={onClick}>
      <img
        src={image}
        alt=""
        className={`w-full h-full object-cover transform hover:scale-110 transition-all duration-300 ${isClosed ? 'blur-sm' : ''}`}
      />
      {isClosed && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
            CLOSED
          </div>
        </div>
      )}
      <div className="absolute bottom-0 w-full left-0 bg-white/95 px-3 py-2 rounded-t-3xl text-center text-sm font-bold text-gray-900 backdrop-blur">
        {name}
      </div>
    </div>
  );
}

export default CategoryCard;
