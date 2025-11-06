import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UsageWarning = () => {
  const { usage, profile, isExpired } = useAuth();
  const [showWarning, setShowWarning] = useState(true);
  const nav = useNavigate();
  const location = useLocation();
  // Reset warning when user plan changes
  useEffect(() => {
    setShowWarning(true);
  }, [profile?.subscription_type]);

  const warningThreshold = 0.7;

  const limits = {
    free: { simplify: 10, followup: 5 },
    basic: { simplify: 100, followup: 50 },
    pro: { simplify: Infinity, followup: Infinity },
  };

  const userPlan = profile?.subscription_type || 'free';
  const currentLimit = limits[userPlan];

  const simplifiedCount = usage?.simplify_count || 0;
  const followupCount = usage?.followup_count || 0;

  const simplifiedThreshold = simplifiedCount / currentLimit?.simplify;
  const followupThreshold = followupCount / currentLimit?.followup;
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get("status");
    if (!status) return;

    if (status === "success") toast.success("Payment successful! Your subscription is active.");
    else if (status === "cancel") toast.info("Payment canceled. You can try again.");
    else if (status === "failed") toast.error("Payment failed. Please try again.");
  }, [location.search]);
  if (!showWarning) return null;

  // Expired / on-hold plan warning (highest priority)
  if ((userPlan !== "free") && (isExpired || userPlan === "on_hold")) {
    return (
      <div className='bg-red-500 py-3 px-3 sm:px-20 font-semibold text-white flex justify-between items-center'>
        <p className='text-xs sm:text-[16px]'>
          Your {userPlan} plan has expired or is on hold.{' '}
          <span className='underline cursor-pointer' onClick={() => nav('/app/pricing')}>
            Renew or upgrade your plan
          </span>{' '}
          to continue using premium features.
        </p>
        <button className='cursor-pointer' onClick={() => setShowWarning(false)}>
          <X />
        </button>
      </div>
    );
  }


  // Usage exceeded (red)
  if (simplifiedCount >= currentLimit?.simplify || followupCount >= currentLimit?.followup) {
    return (
      <div className='bg-red-500 py-3 px-3 sm:px-20 font-semibold text-white flex justify-between items-center'>
        <p className='text-xs sm:text-[16px]'>
          You have reached one of your monthly usage limits (
          {simplifiedCount}/{currentLimit.simplify} simplify, {followupCount}/{currentLimit.followup} followups).{' '}
          <span className='underline cursor-pointer' onClick={() => nav('/app/pricing')}>
            Upgrade your plan
          </span>{' '}
          to continue.
        </p>
        <button className='cursor-pointer' onClick={() => setShowWarning(false)}>
          <X />
        </button>
      </div>
    );
  }

  // Approaching usage limit (yellow)
  if (
    (simplifiedThreshold > warningThreshold && simplifiedCount < currentLimit?.simplify) ||
    (followupThreshold > warningThreshold && followupCount < currentLimit?.followup)
  ) {
    return (
      <div className='bg-yellow-100 text-yellow-800 py-3 px-3 sm:px-20 font-semibold flex justify-between items-center'>
        <p className='text-xs sm:text-[16px]'>
          ⚠️ You are approaching your monthly usage limits (
          {simplifiedCount}/{currentLimit.simplify} simplify, {followupCount}/{currentLimit.followup} followups).{' '}
          <span className='cursor-pointer underline' onClick={() => nav('/app/pricing')}>
            Consider upgrading!
          </span>
        </p>
        <button className='cursor-pointer' onClick={() => setShowWarning(false)}>
          <X />
        </button>
      </div>
    );
  }

  return null; // no warning
};

export default UsageWarning;
