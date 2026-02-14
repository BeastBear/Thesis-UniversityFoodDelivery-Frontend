import React from "react";

import { FaArrowLeft } from "react-icons/fa";

function DeliveryPageHero({
  eyebrow,
  title,
  description,
  icon,
  onBack,
  left,
  right,
}) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary-blue to-primary-blue/80 text-white shadow-lg border-none p-3 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors flex items-center justify-center shrink-0"
              aria-label="Back">
              <FaArrowLeft size={18} className="text-white" />
            </button>
          )}

          {left ? <div className="shrink-0">{left}</div> : null}

          <div className="min-w-0">
            {eyebrow && (
              <div className="text-xs font-black tracking-[0.14em] text-white/80">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-1 text-lg sm:text-2xl font-extrabold truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-xs sm:text-sm text-white/80 hidden sm:block">
                {description}
              </p>
            )}
          </div>
        </div>

        {right ? (
          <div className="shrink-0">{right}</div>
        ) : icon ? (
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default DeliveryPageHero;
