import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import logo from "../assets/logo.svg"
// Lazy load icons for mobile menu & hamburger
const MenuIcon = lazy(() => import("lucide-react").then(mod => ({ default: mod.Menu })));
const XIcon = lazy(() => import("lucide-react").then(mod => ({ default: mod.X })));

const Navbar = () => {
  const nav = useNavigate();
  const { user, signout, profile, refreshProfile, usage } = useAuth();

  // Tooltip & mobile menu state
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refresh profile safely only on client
  useEffect(() => {
    if (typeof window !== "undefined") refreshProfile();
  }, [refreshProfile]);

  // Memoize current plan to avoid unnecessary state
  const currentPlan = useMemo(() => profile, [profile]);

  const limits = useMemo(() => ({
    free: { simplify: 10, followup: 5 },
    basic: { simplify: 100, followup: 50 },
    pro: { simplify: Infinity, followup: Infinity },
  }), []);

  const currentLimit = useMemo(() => limits[currentPlan?.subscription_type], [currentPlan, limits]);

  const initials = useMemo(() => {
    if (!user?.user_metadata.name) return "";
    return user.user_metadata.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2);
  }, [user]);

  return (
    <nav className="border border-gray-300 flex justify-between items-center px-6 py-3 rounded-4xl shadow-lg shadow-gray-500 mt-5 relative mx-5 md:mx-20 my-5">

      {/* Logo */}
      <section className="flex items-center gap-2" onClick={() => nav("/app")}>

        <img
          src={logo}
          alt="DocUnpack logo"
          className="h-10 scale-150 w-auto  origin-left "
        />
        <h1 className="ml-2 font-semibold text-lg b">
          DocUnpacks
        </h1>
      </section>

      {/* User Section */}
      <section className="flex gap-5 items-center">
        {/* Desktop */}
        <section className="hidden md:block">
          {user ? (
            <span
              className="rounded-full bg-amber-700 text-white font-bold flex items-center justify-center w-10 h-10 cursor-pointer shadow-md hover:scale-105 transition"
              onClick={() => setShowTooltip(prev => !prev)}
            >
              {initials}
            </span>
          ) : (
            <button
              className="bg-blue-500 py-1 px-4 rounded-xl hover:bg-blue-600 text-white font-medium cursor-pointer"
              onClick={() => nav("/login")}
            >
              Login
            </button>
          )}
        </section>

        {/* Mobile Hamburger */}
        <Suspense fallback={<div className="h-6 w-6" />}>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </Suspense>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-14 right-10 bg-white rounded-2xl shadow-xl p-6 w-60 border border-gray-200 z-50"
            >
              {/* User info */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2  border-b pb-3 mb-2">
                  <span className="rounded-full bg-amber-700 text-white font-bold flex items-center justify-center w-8 h-8 shadow-md text-sm">
                    {initials}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{user.user_metadata.name}</p>
                    <p className="text-[11px] text-gray-500">{user.email}</p>
                    {currentPlan && (
                      <>
                        <p className="text-[11px] text-gray-700 font-medium mt-1">
                          Current Plan: <span className="capitalize font-semibold">{currentPlan.subscription_type}</span>
                        </p>
                        <p className="text-[11px] text-gray-700 font-medium mt-1">
                          Expires on: <span className="font-semibold">{currentPlan.subscription_type === "free"
                            ? "No Expiry"
                            : currentPlan.subscription_end
                              ? new Date(currentPlan.subscription_end).toLocaleDateString()
                              : "-"}</span>
                        </p>
                      </>
                    )}
                    {usage && (
                      <>
                        <p className="text-[11px] text-gray-700 font-medium mt-1">
                          Simplify Count: <span className="font-semibold">{usage.simplify_count}/{currentLimit?.simplify}</span>
                        </p>
                        <p className="text-[11px] text-gray-700 font-medium mt-1">
                          Follow-Up Count: <span className="font-semibold">{usage.followup_count}/{currentLimit?.followup}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Upgrade / History / Signout */}
                <div className="flex flex-col gap-2">
                  {currentPlan?.subscription_type !== "pro" && (
                    <button
                      onClick={() => { nav("/app/pricing"); setShowTooltip(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg font-medium text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                    >
                      Upgrade Plan
                    </button>
                  )}
                  <button
                    onClick={() => { nav("/app/history"); setShowTooltip(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-black/10 transition cursor-pointer"
                  >
                    History
                  </button>
                  <button
                    onClick={() => { signout(); setShowTooltip(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-200 transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <Suspense fallback={<div />}>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-3/4 sm:w-1/2 bg-white shadow-xl z-50 p-3 flex flex-col"
            >
              <div className="flex justify-end items-center mb-6 ">
                <button onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer hover:bg-gray-200 rounded-xl p-2">
                  <XIcon className="h-6 w-6" />
                </button>
              </div>
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2  border-b pb-3 mb-2">
                    <span className="rounded-full bg-amber-700 text-white font-bold flex items-center justify-center w-8 h-8 shadow-md text-sm">
                      {initials}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold">{user.user_metadata.name}</p>
                      <p className="text-[11px] text-gray-500">{user.email}</p>
                      {currentPlan && (
                        <>
                          <p className="text-[11px] text-gray-700 font-medium mt-1">
                            Current Plan: <span className="capitalize font-semibold">{currentPlan.subscription_type}</span>
                          </p>
                          <p className="text-[11px] text-gray-700 font-medium mt-1">
                            Expires on: <span className="font-semibold">{currentPlan.subscription_type === "free"
                              ? "No Expiry"
                              : currentPlan.subscription_end
                                ? new Date(currentPlan.subscription_end).toLocaleDateString()
                                : "-"}</span>
                          </p>
                        </>
                      )}
                      {usage && (
                        <>
                          <p className="text-[11px] text-gray-700 font-medium mt-1">
                            Simplify Count: <span className="font-semibold">{usage.simplify_count}/{currentLimit?.simplify}</span>
                          </p>
                          <p className="text-[11px] text-gray-700 font-medium mt-1">
                            Follow-Up Count: <span className="font-semibold">{usage.followup_count}/{currentLimit?.followup}</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Upgrade / History / Signout */}
                  <div className="flex flex-col gap-2">
                    {currentPlan?.subscription_type !== "pro" && (
                      <button
                        onClick={() => { nav("/app/pricing"); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg font-medium text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                      >
                        Upgrade Plan
                      </button>
                    )}
                    <button
                      onClick={() => { nav("/app/history"); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-black/10 transition cursor-pointer"
                    >
                      History
                    </button>
                    <button
                      onClick={() => { signout(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-200 transition cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { nav("/login"); setIsMobileMenuOpen(false); }} className="bg-blue-500 text-white py-1 px-4 rounded-xl hover:bg-blue-600">
                  Login
                </button>
              )}
            </motion.div>
          </Suspense>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
