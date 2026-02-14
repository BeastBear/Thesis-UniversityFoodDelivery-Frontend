import React from "react";

const Card = ({ className = "", children, ...props }) => {
  return (
    <div
      {...props}
      className={`bg-white rounded-3xl shadow-lg border-none overflow-hidden hover:shadow-xl transition-all ${className}`.trim()}>
      {children}
    </div>
  );
};

export default Card;
