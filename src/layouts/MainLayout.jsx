import React from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import PartnerLayout from "./PartnerLayout";
import DeliveryLayout from "./DeliveryLayout";
import { DelivererProvider } from "../context/DelivererContext.jsx";
import CustomerLayout from "./CustomerLayout";

const MainLayout = () => {
  const { userData } = useSelector((state) => state.user);

  // Partner Layout (Owner)
  if (userData?.role === "owner") {
    return <PartnerLayout />;
  }

  // Delivery Boy Layout
  if (userData?.role === "deliveryBoy") {
    return (
      <DelivererProvider>
        <DeliveryLayout>
          <Outlet />
        </DeliveryLayout>
      </DelivererProvider>
    );
  }

  // Customer Layout (User) - New Modern Design
  return <CustomerLayout />;
};

export default MainLayout;
