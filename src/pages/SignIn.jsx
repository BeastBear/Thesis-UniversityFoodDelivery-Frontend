import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData, setAuthLoading } from "../redux/userSlice";
import { toast } from "react-toastify";

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignIn = async (e) => {
    e?.preventDefault(); // Handle form submit

    if (!email || !password) {
      toast.warn("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { withCredentials: true },
      );

      dispatch(setUserData(result.data.user));
      dispatch(setAuthLoading(false));

      toast.success(`Welcome back, ${result.data.user.fullName}!`);
      setLoading(false);

      setTimeout(() => {
        if (result.data.user.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 500);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Sign in failed. Please try again.";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        { email: result.user.email },
        { withCredentials: true },
      );
      dispatch(setUserData(data.user));
      dispatch(setAuthLoading(false));

      toast.success("Successfully signed in with Google!");

      setTimeout(() => {
        if (data.user.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 500);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Google sign in failed. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] w-full max-w-md p-8 sm:p-10 border border-white/50 z-10 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex w-16 h-16 bg-gradient-to-tr from-primary-orange to-orange-400 rounded-2xl items-center justify-center mb-6 text-white text-3xl font-extrabold shadow-lg shadow-primary-orange/30 transform hover:scale-105 transition-transform duration-300">
            V
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-500 font-medium">
            Sign in to continue your delicious journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 text-xs ml-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-orange transition-colors duration-300" />
              <input
                type="email"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 pl-11 py-3.5 focus:outline-none focus:border-primary-orange focus:ring-4 focus:ring-primary-orange/20 transition-all duration-300 font-semibold text-gray-800 placeholder-gray-300 shadow-sm group-hover:shadow-md"
                placeholder="hello@example.com"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 text-xs ml-1 uppercase tracking-wider">
              Password
            </label>
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-orange transition-colors duration-300" />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 pl-11 py-3.5 focus:outline-none focus:border-primary-orange focus:ring-4 focus:ring-primary-orange/20 transition-all duration-300 font-semibold text-gray-800 placeholder-gray-300 shadow-sm group-hover:shadow-md"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                onClick={() => setShowPassword(!showPassword)}>
                {!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </button>
            </div>
            <div className="text-right mt-2">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-primary-orange hover:text-primary-orange/80 transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full font-bold rounded-xl py-4 transition-all duration-300 bg-gradient-to-r from-primary-orange to-orange-400 text-white shadow-lg shadow-primary-orange/30 hover:shadow-primary-orange/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm uppercase tracking-wide"
            disabled={loading || !email || !password}>
            {loading ? <ClipLoader size={20} color="white" /> : "Sign In"}
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              Or continue with
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold rounded-xl py-3.5 flex items-center justify-center gap-3 hover:bg-white hover:border-gray-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
            onClick={handleGoogleAuth}>
            <FcGoogle size={24} />
            <span>Sign In with Google</span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-8 text-gray-600 font-medium text-sm">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary-orange font-bold hover:underline transition-all">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignIn;
