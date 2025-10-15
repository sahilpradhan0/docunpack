import React, { useState } from 'react'
import { useAuth } from '../context/useAuth';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsageWarning = () => {
  const { usage, profile } = useAuth();
  const [showWarning, setShowWarning] = useState(true)

  const nav = useNavigate();
  const warningThreshold = 0.7;
  const limits = {
    free: { simplify: 10, followup: 5 },
    basic: { simplify: 100, followup: 50 },
    pro: { simplify: Infinity, followup: Infinity },
  }
  const userPlan = profile?.subscription_type || "free";
  const currentLimit = limits[userPlan];
  const simplifiedCount = usage?.simplify_count || 0;
  const followupCount = usage?.followup_count || 0;
  const simplifiedThreshold = simplifiedCount / currentLimit?.simplify;
  const followupThreshold = followupCount / currentLimit?.followup;
  if (!showWarning) return null;
  if (simplifiedThreshold > warningThreshold && simplifiedCount < currentLimit?.simplify) {
    return (
      <div className='bg-yellow-100 text-yellow-800 py-3 px-3 sm:px-20 font-semibold flex justify-between items-center'>
        <p className='text-xssm:text-[16px] '>⚠️ You are close to your monthly simplify docs limit ({simplifiedCount}/{currentLimit.simplify}). <span className='cursor-pointer underline' onClick={() => nav("/app/pricing")}>Consider upgrading!</span></p>
        <button className='cursor-pointer' onClick={() => setShowWarning(false)}><X /></button>
      </div>
    )
  }

  if (followupThreshold > warningThreshold && followupCount < currentLimit?.followup) {
    return (
      <div className='bg-yellow-100 text-yellow-800 py-3 px-3 sm:px-20 font-semibold  flex justify-between items-center'>
        <p className='text-xs sm:text-[16px]'>⚠️ You are close to your monthly simplify docs limit({followupCount} / {currentLimit.followup}). <span className='cursor-pointer underline' onClick={() => nav("/app/pricing")}>Consider upgrading!</span></p>
        <button className='cursor-pointer' onClick={() => setShowWarning(false)}><X /></button>
      </div>
    )
  }
  if (simplifiedCount >= currentLimit?.simplify || followupCount >= currentLimit?.followup) {
    return (
      <div className='bg-red-500 py-3 px-3 sm:px-20 font-semibold text-white flex justify-between items-center'>
        <p className='text-xs sm:text-[16px]'>You have reached one of your monthly usage limits. <span className='underline cursor-pointer' onClick={() => nav("/app/pricing")}>Upgrade your plan</span>  to continue.</p>
        <button className='cursor-pointer' onClick={() => setShowWarning(false)}><X /></button>
      </div>
    );
  }
}

export default UsageWarning