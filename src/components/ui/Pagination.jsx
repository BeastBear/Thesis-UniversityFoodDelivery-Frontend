import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Logic to show limited page numbers (e.g., 1, 2, 3 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-center gap-2 mt-6 ${className}`}>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        aria-label="Previous Page">
        <FaChevronLeft size={14} />
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="w-10 h-10 flex items-center justify-center text-gray-400 font-medium">
                ...
              </span>
            ) : (
              <button
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-sm ${
                  currentPage === page
                    ? "bg-purple-600 text-white shadow-purple-200"
                    : "bg-white border border-gray-100 text-gray-700 hover:bg-white"
                }`}>
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        aria-label="Next Page">
        <FaChevronRight size={14} />
      </button>
    </div>
  );
};

export default Pagination;
