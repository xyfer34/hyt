import React from "react";

export default function HayatLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Top Green Portion of H */}
      <polygon
        points="15,10 38,10 38,43 62,43 62,10 85,10 85,36.25 62,44.3 38,52.7 15,60.75"
        fill="#00a859"
      />
      {/* Bottom Blue Portion of H */}
      <polygon
        points="15,63.75 38,55.7 62,47.3 85,39.25 85,90 62,90 62,57 38,57 38,90 15,90"
        fill="#1e3a8a"
      />
    </svg>
  );
}
