import { createSlice } from "@reduxjs/toolkit";

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem("cartItems");
    const savedTotal = localStorage.getItem("totalAmount");
    if (savedCart && savedTotal) {
      const parsedCart = JSON.parse(savedCart);
      const isValidObjectId = (value) =>
        typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
      const normalizedCart = Array.isArray(parsedCart)
        ? parsedCart
            .filter(Boolean)
            .map((item) => {
              const id = item?.id || item?._id || item?.itemId;
              return id ? { ...item, id } : item;
            })
            .filter((item) => isValidObjectId(item?.id))
        : [];
      // Cart loaded from localStorage
      return {
        cartItems: normalizedCart,
        totalAmount: parseFloat(savedTotal),
      };
    }
  } catch (error) {
    // Error loading cart from localStorage
  }
  return {
    cartItems: [],
    totalAmount: 0,
  };
};

// Save cart to localStorage
const saveCartToStorage = (cartItems, totalAmount) => {
  try {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    localStorage.setItem("totalAmount", totalAmount);
    // Cart saved to localStorage
  } catch (error) {
    // Error saving cart
  }
};

// Helpers to deterministically hash options for cart item identity
const sortObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }
  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((res, key) => {
        res[key] = sortObject(obj[key]);
        return res;
      }, {});
  }
  return obj;
};

const generateCartItemId = (cartItem) => {
  const baseId = cartItem.id || cartItem._id || cartItem.menuItemId;
  const normalizedOptions = sortObject(cartItem.selectedOptions || {});
  const optionsKey = JSON.stringify(normalizedOptions);
  return `${baseId || "item"}::${optionsKey}`;
};

const initialCartState = loadCartFromStorage();

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    isAuthLoading: true,
    isShopLoading: false,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    currentCafeteria: null,
    shopsInMyCity: null,
    allShops: null,
    itemsInMyCity: null,
    cartItems: initialCartState.cartItems,
    totalAmount: initialCartState.totalAmount,
    myOrders: [],
    searchItems: null,
    socket: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
      state.isAuthLoading = false;
    },
    setAuthLoading: (state, action) => {
      state.isAuthLoading = action.payload;
    },
    setShopLoading: (state, action) => {
      state.isShopLoading = action.payload;
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },
    setCurrentCafeteria: (state, action) => {
      state.currentCafeteria = action.payload;
    },
    setShopsInMyCity: (state, action) => {
      state.shopsInMyCity = action.payload;
    },
    setAllShops: (state, action) => {
      state.allShops = action.payload;
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload;
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    addToCart: (state, action) => {
      const cartItem = { ...action.payload };
      // Ensure deterministic identity per menu item + options
      cartItem.cartItemId = cartItem.cartItemId || generateCartItemId(cartItem);

      const existingItem = state.cartItems.find(
        (i) => i.cartItemId === cartItem.cartItemId,
      );

      if (existingItem) {
        existingItem.quantity += cartItem.quantity;
      } else {
        state.cartItems.push(cartItem);
      }

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
        0,
      );

      saveCartToStorage(state.cartItems, state.totalAmount);
    },
    updateQuantity: (state, action) => {
      const { id, cartItemId, quantity } = action.payload;
      const targetId = cartItemId || id;
      const item = state.cartItems.find(
        (i) => i.cartItemId === targetId || i.id === targetId,
      );
      if (item) {
        item.quantity = quantity;
      }
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
        0,
      );
      saveCartToStorage(state.cartItems, state.totalAmount);
    },
    removeCartItem: (state, action) => {
      const itemIdToRemove =
        action.payload.cartItemId || action.payload.id || action.payload;
      state.cartItems = state.cartItems.filter(
        (i) => i.cartItemId !== itemIdToRemove && i.id !== itemIdToRemove,
      );
      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
        0,
      );
      saveCartToStorage(state.cartItems, state.totalAmount);
    },
    clearCart: (state) => {
      // Clearing cart
      state.cartItems = [];
      state.totalAmount = 0;
      // Clear from localStorage
      localStorage.removeItem("cartItems");
      localStorage.removeItem("totalAmount");
      // Cart cleared from localStorage
    },
    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
    },
    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders];
    },
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      const order = state.myOrders.find((o) => o._id == orderId);
      if (order) {
        if (order.shopOrders) {
          order.shopOrders.forEach((shopOrder) => {
            if (shopOrder.shop._id == shopId) {
              shopOrder.status = status;
            }
          });
        }
      }
    },
    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      const order = state.myOrders.find((o) => o._id == orderId);
      if (!order) {
        return;
      }

      const shopOrder = order.shopOrders.find((so) => {
        const currentShopId =
          so.shop && so.shop._id ? so.shop._id : so.shop?.toString();
        return currentShopId == shopId;
      });

      if (shopOrder) {
        shopOrder.status = status;
      }
    },
    updateMyLocation: (state, action) => {
      if (!state.userData) {
        return;
      }
      const { lat, lon, address } = action.payload;
      state.userData.location = {
        type: "Point",
        coordinates: [lon, lat],
      };
      if (address) {
        state.userData.currentAddress = address;
      }
    },
    setSearchItems: (state, action) => {
      state.searchItems = action.payload;
    },
  },
});

export const {
  setUserData,
  setAuthLoading,
  setShopLoading,
  setCurrentCity,
  setCurrentState,
  setCurrentAddress,
  setCurrentCafeteria,
  setShopsInMyCity,
  setAllShops,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  clearCart,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  setSearchItems,
  setSocket,
  updateRealtimeOrderStatus,
  updateMyLocation,
} = userSlice.actions;
export default userSlice.reducer;
