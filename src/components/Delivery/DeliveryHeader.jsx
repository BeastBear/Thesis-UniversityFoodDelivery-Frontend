import { FaUserCircle, FaSignOutAlt, FaBell } from "react-icons/fa";

const DeliveryHeader = ({
  userData,
  isOnDuty,
  toggleDuty,
  todayIncome,
  jobCredit,
  onLogout,
  onNavigate,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-md p-4 shadow-lg z-20 sticky top-0 border-b border-gray-100">
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-blue/10 text-primary-blue border border-primary-blue/20 flex items-center justify-center font-black">
            <span>🚴</span>
          </div>
          <div className="font-extrabold text-gray-900">Campus Delivery</div>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate?.("/")}
            className="text-sm font-extrabold text-slate-700 hover:text-slate-900">
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("/delivery-boy-job-details")}
            className="text-sm font-extrabold text-slate-700 hover:text-slate-900">
            History
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("/profile")}
            className="text-sm font-extrabold text-slate-700 hover:text-slate-900">
            Profile
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <FaBell size={16} />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-blue/10 border border-primary-blue/20 flex items-center justify-center overflow-hidden">
            {userData?.image ? (
              <img
                src={userData.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserCircle className="text-primary-blue" size={22} />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-blue/10 border border-primary-blue/20 flex items-center justify-center text-primary-blue font-bold text-xl overflow-hidden">
            {userData?.image ? (
              <img
                src={userData.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">
                {userData?.fullName?.substring(0, 2).toUpperCase() || "DB"}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">
              {userData?.fullName || "Delivery Partner"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-11 h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
            <FaSignOutAlt size={16} />
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-3xl p-4 border-none shadow-lg mt-4 lg:mt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-extrabold text-slate-800">Status</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isOnDuty}
                onChange={toggleDuty}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
              <span
                className={`ml-2 text-sm font-extrabold ${
                  isOnDuty ? "text-primary-blue" : "text-slate-400"
                }`}>
                {isOnDuty ? "Online" : "Offline"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <span className="block text-xs font-bold text-slate-500">
                Job Credit
              </span>
              <span
                className={`text-lg font-extrabold ${
                  (jobCredit ?? 0) >= 300 ? "text-slate-900" : "text-red-600"
                }`}>
                ฿{Number(jobCredit ?? 0).toFixed(2)}
              </span>
              {(jobCredit ?? 0) < 300 && (
                <div className="text-[10px] text-red-500 font-semibold mt-0.5">
                  Min ฿300 to go online
                </div>
              )}
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-500">
                Today's Earnings
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                ฿{todayIncome?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryHeader;
