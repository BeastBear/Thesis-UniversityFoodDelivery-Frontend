import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosArrowRoundBack } from "react-icons/io";
import axios from "axios";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/send-otp`,
        { email, otp },
        { withCredentials: true },
      );

      setErr("");
      setStep(2);
      setLoading(false);
    } catch (error) {
      setErr(error.response.data.message);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/verify-otp`,
        { email, otp },
        { withCredentials: true },
      );

      setErr("");
      setStep(3);
      setLoading(false);
    } catch (error) {
      setErr(error?.response?.data?.message);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword != confirmPassword) {
      return null;
    }
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/reset-password`,
        { email, newPassword },
        { withCredentials: true },
      );
      setErr("");

      setLoading(false);
      navigate("/signin");
    } catch (error) {
      setErr(error?.response?.data?.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-center min-h-screen p-4 bg-white">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="flex item-center gap-4 mb-4">
          <IoIosArrowRoundBack
            size={30}
            className="cursor-pointer text-primary-orange"
            onClick={() => navigate("/signin")}
          />
          <h1 className="text-2xl font-extrabold text-center text-primary-orange">
            Forgot Password
          </h1>
        </div>
        {step == 1 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-grey-700 font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                placeholder="Enter your Email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
            <button
              className={`w-full font-semibold rounded-lg py-2 transition duration-200 
            bg-primary-orange text-white hover:bg-primary-orange/90 cursor-pointer shadow-lg shadow-primary-orange/20`}
              onClick={handleSendOtp}
              disabled={loading}>
              {loading ? <ClipLoader size={20} color="white" /> : "Send Otp"}
            </button>
            {err && (
              <p className="text-red-500 text-center my-[10px]">*{err}</p>
            )}
          </div>
        )}

        {step == 2 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="otp"
                className="block text-grey-700 font-medium mb-1">
                OTP
              </label>
              <input
                type="email"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                placeholder="Enter OTP"
                onChange={(e) => setOtp(e.target.value)}
                value={otp}
                required
              />
            </div>
            <button
              className={`w-full font-semibold rounded-lg py-2 transition duration-200 
            bg-primary-orange text-white hover:bg-primary-orange/90 cursor-pointer shadow-lg shadow-primary-orange/20`}
              onClick={handleVerifyOtp}
              disabled={loading}>
              {loading ? <ClipLoader size={20} color="white" /> : "Verify"}
            </button>
            {err && (
              <p className="text-red-500 text-center my-[10px]">*{err}</p>
            )}
          </div>
        )}

        {step == 3 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="newPassword"
                className="block text-grey-700 font-medium mb-1">
                New Password
              </label>
              <input
                type="email"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                placeholder="Enter New Password"
                onChange={(e) => setNewPassword(e.target.value)}
                value={newPassword}
                required
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="ConfirmPassword"
                className="block text-grey-700 font-medium mb-1">
                Confirm Password
              </label>
              <input
                type="email"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                required
              />
            </div>
            <button
              className={`w-full font-semibold rounded-lg py-2 transition duration-200 
            bg-primary-orange text-white hover:bg-primary-orange/90 cursor-pointer shadow-lg shadow-primary-orange/20`}
              onClick={handleResetPassword}
              disabled={loading}>
              {loading ? (
                <ClipLoader size={20} color="white" />
              ) : (
                "Reset Password"
              )}
            </button>
            {err && (
              <p className="text-red-500 text-center my-[10px]">*{err}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
