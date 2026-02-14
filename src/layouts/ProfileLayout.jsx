import React from "react";

/**
 * ProfileLayout - Sidebar Layout for Profile & Settings Pages
 *
 * Mobile: Full-width content (no sidebar)
 * Desktop: Left sidebar menu + Right content area
 */
const ProfileLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="w-full">
          {/* Content Area */}
          <main className="w-full">
            {React.Children.map(children, (child) => child)}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
