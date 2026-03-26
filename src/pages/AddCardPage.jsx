import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { FaInfoCircle } from "react-icons/fa";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SetupForm = ({ clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    cardholderName: "",
    nickname: "",
    isDefault: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    if (!formData.cardholderName.trim()) {
      toast.error("Please enter cardholder name");
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the SetupIntent
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: formData.cardholderName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setIsProcessing(false);
        return;
      }

      // Notify backend to save the card reference
      const res = await axios.post(
        `${serverUrl}/api/user/add-card`,
        {
          setupIntentId: setupIntent.id,
          cardholderName: formData.cardholderName,
          nickname: formData.nickname,
          isDefault: formData.isDefault,
        },
        { withCredentials: true }
      );

      // Update Redux state
      const updatedUser = { ...userData, savedCards: res.data };
      dispatch(setUserData(updatedUser));
      toast.success("Card saved securely");
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to add card");
    } finally {
      setIsProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  return (
    <form onSubmit={handleSave} className="flex-1 p-6 space-y-6 max-w-[600px] mx-auto w-full">
      <div>
        <label className="block text-sm text-gray-600 mb-2">Card Details</label>
        <div className="p-3 border border-gray-300 rounded-lg focus-within:border-primary-orange focus-within:ring-2 focus-within:ring-primary-orange/20 transition-colors bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Cardholder name</label>
        <input
          type="text"
          placeholder="Enter cardholder name (EN)"
          className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-colors"
          value={formData.cardholderName}
          onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Card nickname (optional)</label>
        <input
          type="text"
          placeholder="Enter card nickname"
          className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-colors"
          value={formData.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-gray-700 font-medium">Set as a default payment</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-orange"></div>
        </label>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/95 backdrop-blur z-40">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-primary-orange text-white font-extrabold py-3 rounded-2xl hover:bg-primary-orange/90 transition-colors disabled:opacity-50"
        >
          {isProcessing ? "Saving securely..." : "Save"}
        </button>
      </div>
    </form>
  );
};

function AddCardPage() {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Fetch setup intent client secret
    const fetchSetupIntent = async () => {
      try {
        const res = await axios.post(
          `${serverUrl}/api/user/create-setup-intent`,
          {},
          { withCredentials: true }
        );
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        toast.error("Failed to initialize secure card setup.");
      }
    };
    fetchSetupIntent();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SetupForm clientSecret={clientSecret} />
        </Elements>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-gray-500">Initializing secure connection...</p>
        </div>
      )}
    </div>
  );
}

export default AddCardPage;
