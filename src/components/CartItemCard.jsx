import React from "react";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { CiTrash } from "react-icons/ci";
import { useDispatch } from "react-redux";
import { removeCartItem, updateQuantity } from "../redux/userSlice";

function CartItemCard({ data }) {
  const dispatch = useDispatch();
  const handleIncrease = (id, quantity) => {
    dispatch(updateQuantity({ id, quantity: quantity + 1 }));
  };
  const handleDecrease = (id, quantity) => {
    if (quantity > 1) {
      dispatch(updateQuantity({ id, quantity: quantity - 1 }));
    }
  };
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
          <img
            src={data.image}
            alt={data.name || "Cart item"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-base">{data.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            ฿{data.price} x {data.quantity}
          </p>
          <p className="font-extrabold text-primary-orange text-lg mt-1">
            ฿{data.price * data.quantity}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          onClick={() => handleDecrease(data.id, data.quantity)}>
          <FaMinus size={12} />
        </button>
        <span className="font-bold text-gray-900">{data.quantity}</span>
        <button
          className="p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          onClick={() => handleIncrease(data.id, data.quantity)}>
          <FaPlus size={12} />
        </button>
        <button
          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
          onClick={() => dispatch(removeCartItem(data.id))}>
          <CiTrash size={18} />
        </button>
      </div>
    </div>
  );
}

export default CartItemCard;
