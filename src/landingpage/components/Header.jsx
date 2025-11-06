import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/useAuth";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import logo from "../../assets/logo.svg"
const Header = () => {
  const nav = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signout, session, profile, usage } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(profile);
  const location = useLocation();
  const hideMenuItems = location.pathname == "/login" || location.pathname == "/waitlist";
  console.log(hideMenuItems);

  const navItems = [
    { title: "Features", path: "features" },
    { title: "How It Works", path: "how-it-works" },
    { title: "Pricing", path: "pricing" },
  ];

  const limits = {
    free: { simplify: 10, followup: 5 },
    basic: { simplify: 100, followup: 50 },
    pro: { simplify: Infinity, followup: Infinity },
  }
  const currentLimit = limits[currentPlan?.subscription_type]
  const initials = user?.user_metadata.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  useEffect(() => {
    setCurrentPlan(profile);
  }, [profile]);


  const handleScroll = (path) => {
    document.getElementById(path).scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="border border-gray-300 flex justify-between items-center px-6 py-3 rounded-4xl shadow-lg shadow-gray-500 mt-5 relative  mx-5 md:mx-20 my-5">
      {/* Logo */}
      <section className="flex items-center cursor-pointer" onClick={() => nav("/")}>
        <img
          src={logo}
          alt="DocUnpack logo"
          className="h-10 scale-150 w-auto  origin-left "
        />
        <h1 className="ml-2 font-semibold text-lg b">
          DocUnpack
        </h1>

      </section>

      {/* Desktop Nav */}

      {!hideMenuItems &&
        <section className="hidden lg:block">
          <ul className="flex gap-5">
            {navItems.map((item, index) => (
              <li
                key={index}
                className="font-medium text-md hover:text-gray-500 cursor-pointer hover:scale-105 transition"
                onClick={() => handleScroll(item.path)}
              >
                {item.title}
              </li>
            ))}
          </ul>
        </section>
      }

      {/* Right Section */}
      <section className="flex gap-5 items-center">
        <section className="hidden lg:block">
          {user ? (
            <span
              className="rounded-full bg-amber-700 text-white font-bold flex items-center justify-center w-10 h-10 cursor-pointer shadow-md hover:scale-105 transition"
              onClick={() => setShowTooltip((prev) => !prev)}
            >
              {user && initials}
            </span>
          ) : (
            <div className="flex gap-2 items-center">
              {/* <button
                className="bg-blue-600 py-1.5 px-5 rounded-xl hover:bg-blue-700 text-white font-medium cursor-pointer transition-all hidden md:block shadow-sm"
                onClick={() => nav("/waitlist")}
              >
                Join Waitlist
              </button> */}
              <button
                className="border border-blue-800 text-blue-800 py-1.5 px-5 rounded-xl hover:bg-blue-50 font-medium cursor-pointer transition-all hidden md:block"
                onClick={() => nav("/login")}
              >
                Login
              </button>
            </div>

          )}
        </section>
        {/* Hamburger for mobile */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 right-10 bg-white rounded-2xl shadow-xl p-6 w-60 border border-gray-200 z-50"
            >
              <div className="flex items-center border-b pb-3 mb-2 flex-col">
                <div className="flex gap-2">
                  <span className="rounded-full bg-amber-700 text-white font-bold flex items-center justify-center w-10 h-10 shadow-md">
                    {user && initials}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{user.user_metadata.name}</p>
                    <p className="text-[11px] text-gray-500">{user.email}</p>
                    {currentPlan && (
                      <>
                        <p className="text-[11px] text-gray-700 font-medium mt-1">
                          Current Plan: <span className="capitalize">{currentPlan.subscription_type}</span>
                        </p>
                        <p className="text-[11px] text-gray-700 font-medium mt-1">
                          Expires on: {currentPlan?.subscription_end
                            ? new Date(currentPlan.subscription_end).toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                            : "-"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {/* Upgrade Button */}
                {currentPlan?.subscription_type !== "pro" && (
                  <button
                    onClick={() => {
                      nav("/app/pricing");
                      setShowTooltip(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg font-medium text-blue-600 hover:bg-blue-100 transition mt-3"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  signout();
                  setShowTooltip(false);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-100 transition"
              >
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-3/4 sm:w-1/2 bg-white shadow-xl z-50 p-4 flex flex-col"
          >
            {/* Close Button */}
            <div className="flex justify-end items-center mb-6 cursor-pointer">
              <button onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>

            {!hideMenuItems && <ul className="flex flex-col gap-4">
              {navItems.map((item, index) => (
                <li
                  key={index}
                  className="font-medium text-lg hover:text-gray-500 cursor-pointer hover:translate-x-2 transition"
                  onClick={() => handleScroll(item.path)}
                >
                  {item.title}
                </li>
              ))}
            </ul>}
            {user ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.2 }}
                className=" bg-white rounded-2xl shadow-xl p-2 w-full border border-gray-200 z-50 mt-2"
              >
                <div className="flex items-center gap-2 border-b pb-3 mb-3">
                  <span className="rounded-full bg-amber-700 text-white font-bold flex items-center justify-center w-10 h-10 shadow-md">
                    {user && initials}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{user.user_metadata.name}</p>
                    <p className="text-[11px] text-gray-500">{user.email}</p>
                    {profile && (
                      <p className="text-[11px] text-gray-700 font-medium mt-1">
                        Current Plan: <span className="capitalize">{profile.subscription_type}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Upgrade Button */}
                {profile?.subscription_type !== "pro" && (
                  <button
                    onClick={() => {
                      // Show upgrade options, e.g., modal, redirect to pricing, etc.
                      // setShowUpgradeModal(true); // or nav("/pricing")
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg font-medium text-blue-600 hover:bg-blue-100 transition mb-2"
                  >
                    Upgrade Plan
                  </button>
                )}

                <button
                  onClick={() => {
                    signout();
                    setShowTooltip(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-100 transition"
                >
                  Sign out
                </button>


              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* <button
                  className="bg-blue-600 py-2 px-4 rounded-xl hover:bg-blue-700 text-white font-medium cursor-pointer transition-all shadow-sm mt-3 hover:scale-105"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    nav("/waitlist")
                  }}
                >
                  Join Waitlist
                </button> */}
                <button
                  className="bg-white border border-blue-600 py-2 px-4 rounded-xl hover:bg-gray-100 text-blue-600 font-medium cursor-pointer shadow-sm hover:scale-105 mt-2"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    nav("/login")
                  }}
                >
                  Login
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Header;
