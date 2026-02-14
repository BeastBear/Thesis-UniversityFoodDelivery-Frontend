import React, { useState } from "react";
import {
  FaRegEye,
  FaRegEyeSlash,
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignUp = async (e) => {
    e?.preventDefault();
    if (!fullName || !email || !password || !mobile) {
      toast.warn("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { fullName, email, password, mobile, role },
        { withCredentials: true },
      );

      localStorage.setItem("userToken", result.data.token);
      dispatch(setUserData(result.data.user));
      setLoading(false);
      toast.success("Account created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Signup failed");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!mobile) {
      return toast.warn("Mobile number is required for Google Sign Up");
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        {
          fullName: result.user.displayName,
          email: result.user.email,
          role,
          mobile,
        },
        { withCredentials: true },
      );
      localStorage.setItem("userToken", result.data.token);
      dispatch(setUserData(data));
      toast.success("Successfully signed in with Google!");
      navigate("/");
    } catch (error) {
      toast.error("Google Auth Failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[0%] left-[0%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] w-full max-w-md p-8 sm:p-10 border border-white/50 z-10 relative my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Create Account
          </h1>
          <p className="text-gray-500 font-medium">
            Join the community of food lovers
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 text-xs ml-1 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative group">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-orange transition-colors duration-300" />
              <input
                type="text"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 pl-11 py-3.5 focus:outline-none focus:border-primary-orange focus:ring-4 focus:ring-primary-orange/20 transition-all duration-300 font-semibold text-gray-800 placeholder-gray-300"
                placeholder="John Doe"
                onChange={(e) => setFullName(e.target.value)}
                value={fullName}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 text-xs ml-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-orange transition-colors duration-300" />
              <input
                type="email"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 pl-11 py-3.5 focus:outline-none focus:border-primary-orange focus:ring-4 focus:ring-primary-orange/20 transition-all duration-300 font-semibold text-gray-800 placeholder-gray-300"
                placeholder="hello@example.com"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 text-xs ml-1 uppercase tracking-wider">
              Mobile Number
            </label>
            <div className="relative group">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-orange transition-colors duration-300" />
              <input
                type="text"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 pl-11 py-3.5 focus:outline-none focus:border-primary-orange focus:ring-4 focus:ring-primary-orange/20 transition-all duration-300 font-semibold text-gray-800 placeholder-gray-300"
                placeholder="0812345678"
                onChange={(e) => setMobile(e.target.value)}
                value={mobile}
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
                className="w-full bg-white border border-gray-200 rounded-xl px-4 pl-11 py-3.5 focus:outline-none focus:border-primary-orange focus:ring-4 focus:ring-primary-orange/20 transition-all duration-300 font-semibold text-gray-800 placeholder-gray-300"
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
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-gray-700 font-bold mb-1.5 text-xs ml-1 uppercase tracking-wider">
              I am a...
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["user", "owner", "deliveryBoy"].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border-2 ${
                    role === r
                      ? "bg-orange-50 border-primary-orange text-primary-orange shadow-sm"
                      : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                  }`}>
                  {r === "deliveryBoy" ? "Driver" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-full font-bold rounded-xl py-4 transition-all duration-300 bg-gradient-to-r from-primary-orange to-orange-400 text-white shadow-lg shadow-primary-orange/30 hover:shadow-primary-orange/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm uppercase tracking-wide mt-4"
            disabled={loading}>
            {loading ? (
              <ClipLoader size={20} color="white" />
            ) : (
              "Create Account"
            )}
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
            <span>Sign Up with Google</span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-8 text-gray-600 font-medium text-sm">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-primary-orange font-bold hover:underline transition-all">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
