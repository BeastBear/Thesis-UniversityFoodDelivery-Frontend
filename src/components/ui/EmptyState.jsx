import React from "react";

const EmptyState = ({ icon, title, description, className = "" }) => {
  const hasPadding = /\bpt-\d+\b|\bpy-\d+\b|\bp-\d+\b/.test(className);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        hasPadding ? "" : "pt-16"
      } ${className}`.trim()}>
      {icon && (
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      )}
      {description && (
        <p className="text-gray-500 max-w-xs mt-2 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
