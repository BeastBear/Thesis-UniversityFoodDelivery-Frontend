import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Card from "../components/ui/Card";

function DisplaySettings() {
  const navigate = useNavigate();
  const [showSales, setShowSales] = useState(true);

  useEffect(() => {
    const savedSetting = localStorage.getItem("showSalesOnHome");
    if (savedSetting !== null) {
      setShowSales(savedSetting === "true");
    } else {
      // Default to true
      setShowSales(true);
      localStorage.setItem("showSalesOnHome", "true");
    }
  }, []);

  const handleToggle = (value) => {
    setShowSales(value);
    localStorage.setItem("showSalesOnHome", value.toString());
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Card className="overflow-hidden">
          <div className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-2xl border"
                style={{
                  backgroundColor: "var(--color-primary-bg-light)",
                  color: "var(--color-primary)",
                  borderColor: "var(--color-primary-border)",
                }}>
                {showSales ? <FaEye size={24} /> : <FaEyeSlash size={24} />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Show Sales on Home
                </h3>
                <p className="text-sm text-gray-500">
                  Display today's sales summary on your dashboard
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showSales}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <div
                className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary-green) peer-focus:ring-4 peer-focus:ring-green-100"
                style={{
                  "--tw-ring-color": "var(--color-primary-shadow-light)",
                }}></div>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DisplaySettings;
