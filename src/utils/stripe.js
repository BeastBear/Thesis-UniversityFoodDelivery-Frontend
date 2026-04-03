import { loadStripe } from "@stripe/stripe-js";

let stripePromise = null;

export const getStripePromise = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn("VITE_STRIPE_PUBLISHABLE_KEY is missing!");
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};
