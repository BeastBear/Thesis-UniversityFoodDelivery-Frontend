import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe outside of the component lifecycle and main bundle initialization cycle
// to prevent circular dependency issues (Temporal Dead Zone crashes)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn("Stripe Publishable Key is missing from environment variables.");
}

export const stripePromise = loadStripe(stripePublishableKey);
