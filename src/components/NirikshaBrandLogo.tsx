import React from "react";

interface NirikshaBrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const NirikshaBrandLogo: React.FC<NirikshaBrandLogoProps> = ({
  className = "",
  size = "md",
}) => {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Emblem & Hindi/English Wordmark */}
      <div className="flex items-center justify-center gap-2">
        {/* Stylized Logo Visual matching prototype */}
        <div className="relative flex items-center">
          <svg
            viewBox="0 0 240 68"
            className={
              size === "sm"
                ? "h-9 w-auto"
                : size === "lg"
                ? "h-14 w-auto"
                : "h-11 w-auto"
            }
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outline map / seal aura in soft cyan */}
            <path
              d="M175 14 C185 8, 198 12, 204 22 C210 32, 206 46, 196 52 C186 58, 172 54, 168 44 C164 34, 168 20, 175 14 Z"
              fill="#e0f2fe"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              opacity="0.8"
            />
            {/* Mini India map outline stylized inside badge */}
            <path
              d="M186 20 L188 23 L192 23 L193 26 L190 28 L191 32 L188 35 L187 39 L184 41 L182 37 L179 33 L180 27 L184 25 Z"
              fill="#0284c7"
              opacity="0.3"
            />

            {/* Devanagari "निरीक्षा" Wordmark */}
            {/* 'नि' */}
            <text
              x="10"
              y="40"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="34"
              fontWeight="900"
              fill="#0b1a30"
              letterSpacing="-0.5"
            >
              निरीक्षा
            </text>

            {/* Saffron Shirorekha / accent dot */}
            <circle cx="26" cy="12" r="3.5" fill="#f97316" />
            <circle cx="78" cy="12" r="3" fill="#0284c7" />

            {/* English transliteration "NiriKsha" overlapping in sleek clean styling */}
            <text
              x="132"
              y="38"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="24"
              fontWeight="800"
              fill="#0b1a30"
              letterSpacing="-0.2"
            >
              Niri<tspan fill="#0284c7">K</tspan>sha
            </text>

            {/* Motto underneath: DISCOVER • ANALYZE • IMPROVE */}
            <text
              x="14"
              y="60"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="7.5"
              fontWeight="700"
              fill="#64748b"
              letterSpacing="2.8"
            >
              DISCOVER • ANALYZE • IMPROVE
            </text>
          </svg>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 tracking-tight">
        AI-Assisted Legal Metrology Inspection
      </p>
    </div>
  );
};
