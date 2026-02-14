import React from "react";
import { FaCheckCircle, FaCircle, FaClock } from "react-icons/fa";

/**
 * OrderTimeline - Responsive Timeline Component
 *
 * Mobile: Vertical timeline
 * Desktop: Horizontal timeline
 *
 * @param {Object} props
 * @param {number} props.currentStep - Current active step (1-4)
 * @param {Array} props.steps - Array of step objects with { label, description, icon }
 */
const OrderTimeline = ({ currentStep = 1, steps = [] }) => {
  const defaultSteps = [
    {
      label: "Order Placed",
      description: "Restaurant received",
      icon: <FaCheckCircle />,
    },
    {
      label: "Preparing",
      description: "Kitchen is cooking",
      icon: <FaClock />,
    },
    {
      label: "On the Way",
      description: "Deliverer assigned",
      icon: <FaClock />,
    },
    {
      label: "Delivered",
      description: "Enjoy your meal!",
      icon: <FaCheckCircle />,
    },
  ];

  const timelineSteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="w-full pb-2">
      <div className="flex items-center w-full">
        {timelineSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = index === timelineSteps.length - 1;

          return (
            <div
              key={index}
              className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all relative z-10 ${
                  isActive
                    ? "bg-primary-orange text-white shadow-lg shadow-primary-orange/30"
                    : "bg-gray-100 text-gray-400"
                }`}>
                {step.icon ||
                  (isActive ? (
                    <FaCheckCircle size={18} />
                  ) : (
                    <FaCircle size={18} />
                  ))}
              </div>

              {!isLast && (
                <div className="flex-1 h-0.5 mx-3 flex items-center">
                  <div
                    className={`h-full w-full rounded-full transition-colors ${
                      stepNumber < currentStep
                        ? "bg-primary-orange"
                        : stepNumber === currentStep
                          ? "bg-primary-orange"
                          : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default OrderTimeline;
