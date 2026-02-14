import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaShoppingCart, FaTimes, FaTrash } from "react-icons/fa";
import { removeCartItem, updateQuantity } from "../redux/userSlice";

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartItems, totalAmount } = useSelector((state) => state.user);

  // Close drawer on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleIncreaseQuantity = (id, quantity) => {
    dispatch(updateQuantity({ id, quantity: quantity + 1 }));
  };

  const handleDecreaseQuantity = (id, quantity) => {
    if (quantity > 1) {
      dispatch(updateQuantity({ id, quantity: quantity - 1 }));
    } else {
      dispatch(removeCartItem(id));
    }
  };

  const handleRemoveItem = (id) => {
    dispatch(removeCartItem(id));
  };

  const totalCartItems =
    cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-orange/10 flex items-center justify-center text-primary-orange">
                <FaShoppingCart className="text-xl" />
              </div>
              <h2 className="text-xl font-black text-gray-900">My Cart</h2>
              <span className="px-2.5 py-0.5 bg-primary-orange text-white text-xs font-bold rounded-full">
                {totalCartItems}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
                <FaShoppingCart className="text-6xl text-gray-200" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Your cart is empty
                  </h3>
                  <p className="text-sm">
                    Looks like you haven't added any food yet.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary-orange text-white font-bold rounded-full shadow-lg shadow-primary-orange/30 hover:shadow-primary-orange/50 transition-all">
                  Start Ordering
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex gap-4 group hover:border-primary-orange/30 transition-all">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-gray-900 truncate pr-4">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <FaTrash size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        ฿{item.price?.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-primary-orange">
                        ฿{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-3 bg-white rounded-full px-2 py-1">
                        <button
                          onClick={() =>
                            handleDecreaseQuantity(item.id, item.quantity)
                          }
                          className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-gray-700 hover:text-primary-orange transition-colors">
                          -
                        </button>
                        <span className="text-sm font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleIncreaseQuantity(item.id, item.quantity)
                          }
                          className="w-6 h-6 rounded-full bg-primary-orange text-white shadow-lg shadow-primary-orange/30 flex items-center justify-center hover:bg-orange-600 transition-colors">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cartItems?.length > 0 && (
            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-sm font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900">
                    ฿{totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xl font-black text-gray-900">
                  <span>Total</span>
                  <span className="text-primary-orange">
                    ฿{totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  navigate("/cart");
                }}
                className="w-full py-4 bg-primary-orange text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-orange/30 hover:shadow-primary-orange/50 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                <FaShoppingCart />
                <span>Checkout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
