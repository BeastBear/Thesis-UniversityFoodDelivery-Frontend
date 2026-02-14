import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useGetCity from "./hooks/useGetCity";
import useDetectCafeteria from "./hooks/useDetectCafeteria";
import { useDispatch, useSelector } from "react-redux";
import Home from "./pages/Home";
import useGetMyShop from "./hooks/useGetMyShop";
import CreateEditRestaurant from "./pages/CreateEditRestaurant";
import Verify from "./pages/Verify";
import AddItem from "./pages/AddItem";
import EditItem from "./pages/EditItem";
import useGetShopByCity from "./hooks/useGetShopByCity";
import useGetItemsByCity from "./hooks/useGetItemByCity";
import CartPage from "./pages/CartPage";
// CheckOut component removed
import OrderPlaced from "./pages/OrderPlaced";
import MyOrders from "./pages/MyOrders";
import useGetMyOrders from "./hooks/useGetMyOrders";
import useUpdateLocation from "./hooks/useUpdateLocation";
import TrackOrderPage from "./pages/TrackOrderPage";
import Restaurant from "./pages/Restaurant";
import RestaurantDetail from "./pages/RestaurantDetail";
import MenuManagement from "./pages/MenuManagement";
import CategoryManagement from "./pages/CategoryManagement";
import EditCategories from "./pages/EditCategories";
import AddOption from "./pages/AddOption";
import ManageOptionItems from "./pages/ManageOptionItems";
import OrderDetail from "./pages/OrderDetail";
import CancelOrder from "./pages/CancelOrder";
import CancelOrderPending from "./pages/CancelOrderPending";
import CancelOrderPreparing from "./pages/CancelOrderPreparing";
import EditOrderItems from "./pages/EditOrderItems";
import ItemDetail from "./pages/ItemDetail";
import History from "./pages/History";
import OrderSetting from "./pages/OrderSetting";
import SetSpecialHoliday from "./pages/SetSpecialHoliday";
import SalesSummary from "./pages/SalesSummary";
import Contracts from "./pages/Contracts";
import DeliveryBoyFinance from "./pages/DeliveryBoyFinance";
import DeliveryBoyJobDetails from "./pages/DeliveryBoyJobDetails";
import DeliveryBoyBankAccount from "./pages/DeliveryBoyBankAccount";
import IncomeSummary from "./pages/IncomeSummary";
import DeliveryHistory from "./pages/DeliveryHistory";
import DeliveryOrderDetail from "./pages/DeliveryOrderDetail";
import DeliveryContract from "./pages/DeliveryContract";
import CategoryPage from "./pages/CategoryPage";
import CafeteriaPage from "./pages/CafeteriaPage";
import SettingPage from "./pages/SettingPage";
import HelpPage from "./pages/HelpPage";
import SavedAddresses from "./pages/SavedAddresses";
import PaymentMethods from "./pages/PaymentMethods";
import AddCardPage from "./pages/AddCardPage";
import RestaurantStatusPage from "./pages/RestaurantStatusPage";
import DisplaySettings from "./pages/DisplaySettings";
import NotificationsPage from "./pages/NotificationsPage";
import { useEffect } from "react";
import ProfilePage from "./pages/ProfilePage";
import TicketChat from "./pages/TicketChat";
import { io } from "socket.io-client";
import { setSocket } from "./redux/userSlice";
import NotificationListener from "./components/NotificationListener";
import ScrollToTop from "./components/ScrollToTop";
import ThemeProvider from "./components/ThemeProvider";
import AnnouncementBanner from "./components/AnnouncementBanner";

import useGetAllShops from "./hooks/useGetAllShops";

import DeliveryVerification from "./pages/DeliveryVerification";
import AdminLayout from "./layouts/AdminLayout";
import MainLayout from "./layouts/MainLayout";
import ProfileLayout from "./layouts/ProfileLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminShops from "./pages/admin/AdminShops";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminZones from "./pages/admin/AdminZones";
import AdminCafeterias from "./pages/admin/AdminCafeterias";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminTicketChat from "./pages/admin/AdminTicketChat";

// Default to backend's configured port (5000) when no env override is provided.
export const serverUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const socketUrl = import.meta.env.VITE_SOCKET_URL || serverUrl;

function ShopRouteRedirect() {
  const { shopId } = useParams();
  return <Navigate to={`/restaurant/${shopId}`} replace />;
}

function ShopDetailRouteRedirect() {
  const { shopId } = useParams();
  return <Navigate to={`/restaurant/${shopId}/detail`} replace />;
}

function CafeteriaRouteRedirect() {
  const { cafeteriaName } = useParams();
  return (
    <Navigate to={`/cafeteria/${encodeURIComponent(cafeteriaName)}`} replace />
  );
}

function App() {
  const { userData, isAuthLoading, socket } = useSelector(
    (state) => state.user,
  );
  const dispatch = useDispatch();

  useUpdateLocation();
  useGetCurrentUser();
  useGetCity();
  useDetectCafeteria();
  useGetMyShop();
  useGetShopByCity();
  useGetAllShops();
  useGetItemsByCity();
  useGetMyOrders();
  useEffect(() => {
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });
    dispatch(setSocket(socketInstance));

    return () => {
      socketInstance.disconnect();
      dispatch(setSocket(null));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!socket || !userData?._id) {
      return;
    }

    const handleConnect = () => {
      socket.emit("identity", { userId: userData._id });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.once("connect", handleConnect);
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, userData?._id]);

  // Show loading screen while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mb-6"
          style={{ borderTopColor: "var(--color-primary)" }}></div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          Uni<span style={{ color: "var(--color-primary)" }}>Eats</span>
        </h2>
        <p className="text-gray-500 mt-2 font-medium animate-pulse">
          Loading your experience...
        </p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ScrollToTop />
      <ToastContainer />
      <NotificationListener />
      <AnnouncementBanner />
      <ErrorBoundary>
        <Routes>
          {/* Public Routes - No Sidebar/Header */}
          <Route
            path="/signup"
            element={!userData ? <SignUp /> : <Navigate to={"/"} />}
          />
          <Route
            path="/signin"
            element={!userData ? <SignIn /> : <Navigate to={"/"} />}
          />
          <Route
            path="/forgot-password"
            element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />}
          />

          {/* Admin Routes - Scoped Layout */}
          <Route
            path="/admin"
            element={
              userData?.role === "admin" ? (
                <AdminLayout />
              ) : (
                <Navigate to={"/signin"} />
              )
            }>
            <Route index element={<AdminOverview />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="tickets/:ticketId" element={<AdminTicketChat />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="zones" element={<AdminZones />} />
            <Route path="cafeterias" element={<AdminCafeterias />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          {/* Restaurant Verification - No Sidebar/Header */}
          <Route
            path="/verify"
            element={userData ? <Verify /> : <Navigate to={"/signin"} />}
          />
          <Route
            path="/delivery-verification"
            element={
              userData?.role === "deliveryBoy" ? (
                <DeliveryVerification />
              ) : (
                <Navigate to={"/signin"} />
              )
            }
          />

          {/* Protected Routes - Wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            <Route
              path="/"
              element={
                userData ? (
                  userData.role === "admin" ? (
                    <Navigate to="/admin" replace />
                  ) : userData.role === "owner" &&
                    userData.shopVerificationStatus !== "verified" ? (
                    <Navigate to="/verify" replace />
                  ) : userData.role === "deliveryBoy" ? (
                    userData.deliveryVerificationStatus === "verified" ? (
                      <Home />
                    ) : (
                      <Navigate to="/delivery-verification" replace />
                    )
                  ) : (
                    <Home />
                  )
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />

            <Route
              path="/create-edit-shop"
              element={
                userData ? (
                  <CreateEditRestaurant />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/add-item"
              element={userData ? <AddItem /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/edit-item/:itemId"
              element={userData ? <EditItem /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/cart"
              element={userData ? <CartPage /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/order-placed"
              element={userData ? <OrderPlaced /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/my-orders"
              element={userData ? <MyOrders /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/track-order/:orderId"
              element={
                userData ? <TrackOrderPage /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/order-detail/:orderId"
              element={userData ? <OrderDetail /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/cancel-order/:orderId"
              element={userData ? <CancelOrder /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/cancel-order-pending/:orderId"
              element={
                userData ? <CancelOrderPending /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/cancel-order-preparing/:orderId"
              element={
                userData ? (
                  <CancelOrderPreparing />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/edit-order-items/:orderId"
              element={
                userData ? <EditOrderItems /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/restaurant/:shopId"
              element={userData ? <Restaurant /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/restaurant/:shopId/detail"
              element={
                userData ? <RestaurantDetail /> : <Navigate to={"/signin"} />
              }
            />

            <Route
              path="/shop/:shopId"
              element={
                userData ? <ShopRouteRedirect /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/shop/:shopId/detail"
              element={
                userData ? (
                  <ShopDetailRouteRedirect />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/item/:itemId"
              element={userData ? <ItemDetail /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/manage-menu"
              element={
                userData ? <MenuManagement /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/manage-categories"
              element={
                userData ? <CategoryManagement /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/edit-categories"
              element={
                userData ? <EditCategories /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/add-option"
              element={userData ? <AddOption /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/manage-option-items"
              element={
                userData ? <ManageOptionItems /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/history"
              element={userData ? <History /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/order-setting"
              element={
                userData ? <OrderSetting /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/set-special-holiday"
              element={
                userData ? <SetSpecialHoliday /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/sales-summary"
              element={
                userData?.role === "owner" ? (
                  <SalesSummary />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/contracts"
              element={
                userData?.role === "owner" ? (
                  <Contracts />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/shop-status"
              element={
                userData?.role === "owner" ? (
                  <RestaurantStatusPage />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/display-settings"
              element={
                userData?.role === "owner" ? (
                  <DisplaySettings />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/setting"
              element={
                userData ? (
                  userData.role === "owner" ? (
                    <SettingPage />
                  ) : (
                    <SettingPage />
                  )
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />

            <Route
              path="/delivery-boy-finance"
              element={
                userData?.role === "deliveryBoy" ? (
                  <DeliveryBoyFinance />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/delivery-history"
              element={
                userData?.role === "deliveryBoy" ? (
                  <DeliveryHistory />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/delivery-boy-job-details"
              element={
                userData?.role === "deliveryBoy" ? (
                  <DeliveryBoyJobDetails />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/income-summary"
              element={
                userData?.role === "deliveryBoy" ? (
                  <IncomeSummary />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/delivery-order-detail/:orderId"
              element={
                userData?.role === "deliveryBoy" ? (
                  <DeliveryOrderDetail />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/delivery-boy-bank-account"
              element={
                userData?.role === "deliveryBoy" ? (
                  <DeliveryBoyBankAccount />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />

            <Route
              path="/delivery-contract"
              element={
                userData?.role === "deliveryBoy" ? (
                  <DeliveryContract />
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/category/:categoryId"
              element={
                userData ? <CategoryPage /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/cafeteria/:cafeteriaName"
              element={
                userData ? <CafeteriaPage /> : <Navigate to={"/signin"} />
              }
            />
            <Route
              path="/help"
              element={userData ? <HelpPage /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/tickets/:ticketId"
              element={userData ? <TicketChat /> : <Navigate to={"/signin"} />}
            />
            {/* Profile & Settings Routes */}
            <Route
              path="/profile"
              element={
                userData ? (
                  userData.role === "admin" ? (
                    <Navigate to="/admin/profile" replace />
                  ) : userData.role === "user" || !userData.role ? (
                    <ProfileLayout>
                      <ProfilePage />
                    </ProfileLayout>
                  ) : (
                    <ProfilePage />
                  )
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/saved-addresses"
              element={
                userData ? (
                  userData.role === "user" || !userData.role ? (
                    <ProfileLayout>
                      <SavedAddresses />
                    </ProfileLayout>
                  ) : (
                    <SavedAddresses />
                  )
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/payment-methods"
              element={
                userData ? (
                  userData.role === "user" || !userData.role ? (
                    <ProfileLayout>
                      <PaymentMethods />
                    </ProfileLayout>
                  ) : (
                    <PaymentMethods />
                  )
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/setting"
              element={
                userData ? (
                  userData.role === "user" || !userData.role ? (
                    <ProfileLayout>
                      <SettingPage />
                    </ProfileLayout>
                  ) : (
                    <SettingPage />
                  )
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
            <Route
              path="/add-card"
              element={userData ? <AddCardPage /> : <Navigate to={"/signin"} />}
            />
            <Route
              path="/notifications"
              element={
                userData ? (
                  userData.role === "admin" ? (
                    <Navigate to="/admin/notifications" replace />
                  ) : (
                    <NotificationsPage />
                  )
                ) : (
                  <Navigate to={"/signin"} />
                )
              }
            />
          </Route>
          {/* Catch-all route for debugging */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-[#fff9f6] flex flex-col justify-center items-center px-4 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">
                  Page Not Found
                </h1>
                <p className="text-gray-600 mb-4">
                  The requested page could not be found.
                </p>
                <button
                  className="text-white px-4 py-2 rounded-2xl font-extrabold shadow-lg"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 10px 25px -5px var(--color-primary-shadow)",
                  }}
                  onClick={() => (window.location.href = "/")}>
                  Go Home
                </button>
              </div>
            }
          />
        </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
