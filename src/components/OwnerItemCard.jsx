import axios from "axios";
import React from "react";
import { FaPen } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";

function OwnerItemCard({ data }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleDelete = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/item/delete/${data._id}`,
        { withCredentials: true },
      );
      dispatch(setMyShopData(result.data));
    } catch (error) {}
  };

  const priceValue =
    typeof data?.onlinePrice === "number"
      ? data.onlinePrice
      : typeof data?.price === "number"
        ? data.price
        : Number(data?.price) || 0;

  return (
    <div className="flex bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all w-full">
      <div className="w-32 sm:w-36 md:w-40 flex-shrink-0 aspect-square bg-gray-100 overflow-hidden">
        <img
          src={data.image}
          alt={data?.name || "Menu item"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>

      <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {data.name}
            </h2>
            <div className="shrink-0 text-primary-green font-extrabold text-lg">
              ฿{priceValue.toFixed(2)}
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500 font-semibold">
            <span className="capitalize">{data.category || "Other"}</span>
            {data.foodType ? <span className="text-gray-300"> · </span> : null}
            {data.foodType ? <span>{data.foodType}</span> : null}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              data?.isAvailable === false
                ? "bg-white text-gray-500 border-gray-200"
                : "bg-primary-green/10 text-primary-green border-primary-green/20"
            }`}>
            {data?.isAvailable === false ? "Unavailable" : "Available"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 rounded-full hover:bg-white flex items-center justify-center text-gray-700 border border-gray-200 transition-colors"
              onClick={() => navigate(`/edit-item/${data._id}`)}
              aria-label="Edit item">
              <FaPen size={14} />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center text-red-600 border border-red-100 transition-colors"
              onClick={handleDelete}
              aria-label="Delete item">
              <FaTrashAlt size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerItemCard;
