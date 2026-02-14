import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import useCafeterias from "../hooks/useCafeterias";

const FilterModal = ({ isOpen, onClose, onApply }) => {
  const [priceRange, setPriceRange] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCafeterias, setSelectedCafeterias] = useState([]);
  const { cafeterias } = useCafeterias();

  if (!isOpen) return null;

  const categories = [
    "StreetFood",
    "Bubble Tea",
    "Japanese",
    "North East",
    "Thai",
    "Seafood",
    "Breakfast/Brunch",
    "Noodles",
    "Dessert",
    "Coffee",
    "Bakery/Cake",
    "A la carte",
    "Chinese",
    "Rice dish",
    "Late Night Porridge",
    "Fast food",
    "Vietnam",
    "Sushi",
    "Healthy food",
    "Dim Sum",
  ];

  const cafeteriaOptions = [
    "Cafeteria 1",
    "Cafeteria 2",
    "Cafeteria 3",
    "Cafeteria 4",
    "Cafeteria 5",
  ];

  const handlePriceToggle = (price) => {
    setPriceRange((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price],
    );
  };

  const handleCafeteriaToggle = (cafeteria) => {
    setSelectedCafeterias((prev) =>
      prev.includes(cafeteria)
        ? prev.filter((c) => c !== cafeteria)
        : [...prev, cafeteria],
    );
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleReset = () => {
    setPriceRange([]);
    setSelectedCategories([]);
    setSelectedCafeterias([]);
  };

  const handleApply = () => {
    onApply({ priceRange, selectedCafeterias, selectedCategories });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-end sm:items-center">
      <div className="bg-white w-full max-w-md rounded-3xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up shadow-lg border-none overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Filter</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <IoClose size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Price */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Price</h3>
            <div className="flex gap-2">
              {["฿", "฿฿", "฿฿฿", "฿฿฿฿"].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriceToggle(p)}
                  className={`px-4 py-2 rounded-2xl border text-sm font-bold transition-all ${
                    priceRange.includes(p)
                      ? "bg-primary-green/10 border-primary-green text-primary-green"
                      : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Cafeteria */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Cafeteria</h3>
            <div className="flex flex-wrap gap-2">
              {cafeterias.map((cafeteria) => (
                <button
                  key={cafeteria}
                  onClick={() => handleCafeteriaToggle(cafeteria)}
                  className={`px-3 py-1.5 rounded-2xl border text-sm font-medium transition-all ${
                    selectedCafeterias.includes(cafeteria)
                      ? "bg-primary-green/10 border-primary-green text-primary-green"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  {cafeteria}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`px-3 py-1.5 rounded-2xl border text-sm font-medium transition-all ${
                    selectedCategories.includes(cat)
                      ? "bg-primary-green/10 border-primary-green text-primary-green"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors">
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-2xl bg-primary-green text-white font-bold hover:bg-primary-green/90 transition-colors">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
