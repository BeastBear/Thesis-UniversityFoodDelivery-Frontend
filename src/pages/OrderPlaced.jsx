import React, { useEffect, useState } from "react";
import { FaCircleCheck, FaBoxOpen } from "react-icons/fa6";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addMyOrder, clearCart } from "../redux/userSlice";
import axios from "axios";
import { serverUrl } from "../App";

function OrderPlaced() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  useEffect(() => {
    const handleStripeReturn = async () => {
      // Get session ID from URL parameters
      const sessionId = searchParams.get("session_id");
      const pendingOrderId = localStorage.getItem("pendingOrderId");
      if (pendingOrderId) setConfirmedOrderId(pendingOrderId);

      if (sessionId) {
        setIsLoading(true);

        try {
          // Get the order ID from localStorage
          const orderIdFromStorage = localStorage.getItem("pendingOrderId");

          if (orderIdFromStorage) {
            // First, check the current order status
            const orderResponse = await axios.get(
              `${serverUrl}/api/order/get-order-by-id/${orderIdFromStorage}`,
              { withCredentials: true },
            );

            if (orderResponse.data) {
              // If payment is already confirmed, process success
              if (orderResponse.data.payment === true) {
                dispatch(addMyOrder(orderResponse.data));
                dispatch(clearCart());
              } else {
                // Payment not confirmed - try to update with session ID

                try {
                  const updateResponse = await axios.post(
                    `${serverUrl}/api/order/manual-update-payment`,
                    {
                      orderId: orderIdFromStorage,
                      sessionId: sessionId,
                    },
                    { withCredentials: true },
                  );

                  // Check if update was successful by fetching order again
                  const updatedOrderResponse = await axios.get(
                    `${serverUrl}/api/order/get-order-by-id/${orderIdFromStorage}`,
                    { withCredentials: true },
                  );

                  if (
                    updatedOrderResponse.data &&
                    updatedOrderResponse.data.payment === true
                  ) {
                    dispatch(addMyOrder(updatedOrderResponse.data));
                    dispatch(clearCart());
                  } else {
                    dispatch(
                      addMyOrder(
                        updatedOrderResponse.data || orderResponse.data,
                      ),
                    );
                  }
                } catch (updateError) {
                  dispatch(addMyOrder(orderResponse.data));
                }
              }
            }
          }
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      } else {
        // No session ID - handle localStorage fallback (for direct navigation)
        const orderIdFromStorage = localStorage.getItem("pendingOrderId");

        if (orderIdFromStorage) {
          setIsLoading(true);

          try {
            const response = await axios.get(
              `${serverUrl}/api/order/get-order-by-id/${orderIdFromStorage}`,
              { withCredentials: true },
            );

            if (response.data) {
              // Only clear cart if payment is confirmed
              if (response.data.payment === true) {
                dispatch(addMyOrder(response.data));
                dispatch(clearCart());
              } else {
                dispatch(addMyOrder(response.data));
              }
            }
          } catch (error) {
          } finally {
            setIsLoading(false);
          }
        }
      }
    };

    handleStripeReturn();
  }, [searchParams, dispatch, serverUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">
          Processing your order...
        </h2>
        <p className="text-gray-500 mt-2">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 text-center relative overflow-hidden">
      {/* Abstract Shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative z-10 max-w-sm w-full mx-auto animate-scaleIn">
        <div className="w-20 h-20 bg-green-100/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-green-50">
          <FaCircleCheck className="text-[#10b981] text-5xl drop-shadow-sm" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Order Placed!
        </h1>
        <p className="text-gray-500 mb-6 leading-relaxed font-medium">
          Your order has been confirmed successfully. <br />
          <span className="text-sm text-gray-400">
            Order ID: #{confirmedOrderId?.slice(-4) || "..."}
          </span>
        </p>

        <div className="space-y-3">
          <button
            className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white py-4 rounded-2xl text-base font-bold transition-all shadow-lg shadow-primary-orange/20 active:scale-95 flex items-center justify-center gap-2"
            onClick={() => {
              if (confirmedOrderId) {
                localStorage.removeItem("pendingOrderId");
                navigate(`/track-order/${confirmedOrderId}`);
              } else {
                navigate("/my-orders");
              }
            }}>
            <FaBoxOpen /> Track Order
          </button>
          <button
            className="w-full bg-white border-none shadow-sm text-gray-700 py-3.5 rounded-2xl text-base font-bold hover:bg-white hover:shadow-md transition-all active:scale-95"
            onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderPlaced;
