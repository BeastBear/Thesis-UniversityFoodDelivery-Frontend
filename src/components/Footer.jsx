import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-8 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-gray-400 text-sm font-medium">
            &copy; 2026 UniEats. Made for Students.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link
            to="/help"
            className="text-gray-400 hover:text-primary-orange text-sm font-medium transition-colors">
            Help Center
          </Link>
          <button
            className="text-gray-400 hover:text-primary-orange text-sm font-medium transition-colors cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to Top
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
