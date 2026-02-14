import React from "react";

const PrimaryButton = ({ className = "", type = "button", children, ...props }) => {
  return (
    <button
      type={type}
      className={`text-white font-bold py-3.5 px-8 rounded-2xl bg-primary-orange hover:bg-primary-orange/90 shadow-lg shadow-primary-orange/20 active:scale-[0.98] transition-all ${className}`.trim()}
      {...props}>
      {children}
    </button>
  );
};

export default PrimaryButton;
