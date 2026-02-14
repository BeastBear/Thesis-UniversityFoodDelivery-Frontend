import React from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function FoodCard({ data }) {
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.user);

  const isValidObjectId = (value) =>
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

  // Check if item is already in cart
  const cartItem = cartItems.find((item) => item.id === data._id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  return (
    <div
      className="w-full h-full bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all cursor-pointer group flex flex-col"
      onClick={() => {
        const itemId = data?._id || data?.id || data?.itemId;
        if (!isValidObjectId(itemId)) {
          toast.error("Item not available");
          return;
        }
        navigate(`/item/${itemId}`);
      }}>
      <div className="relative w-full aspect-4/3 overflow-hidden bg-gray-100">
        <img
          src={data.image}
          alt={data.name}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-tight group-hover:text-primary-orange transition-colors">
          {data.name}
        </h3>

        {/* Category */}
        <div className="text-xs text-gray-500 font-semibold">
          <span className="capitalize">
            {data.categoryRef?.name ||
              data.categories?.[0]?.name ||
              data.category?.name ||
              data.category ||
              "Other"}
          </span>
          {data.foodType ? <span className="text-gray-300"> · </span> : null}
          {data.foodType ? <span>{data.foodType}</span> : null}
        </div>

        {/* Description Placeholder */}
        <div className="text-xs text-gray-500 line-clamp-1">
          {data.description || "Delicious food"}
        </div>

        <div className="mt-auto flex justify-between items-center pt-2">
          <span className="font-extrabold text-primary-orange text-lg">
            ฿{data.price}
          </span>
          {quantityInCart > 0 ? (
            <div
              className="w-7 h-7 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange font-bold text-xs border-2 border-primary-orange"
              onClick={(e) => {
                e.stopPropagation();
                // Prevent navigation when clicking the counter
              }}>
              {quantityInCart}
            </div>
          ) : (
            <button
              className="w-7 h-7 rounded-full bg-primary-orange flex items-center justify-center text-white hover:bg-primary-orange/90 transition-colors shadow-lg shadow-primary-orange/30 active:scale-95"
              aria-label="Add to cart">
              <FaPlus size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodCard;
