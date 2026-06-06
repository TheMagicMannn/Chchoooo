export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: 28, fontSize: "text-sm", gap: "gap-2" },
    md: { icon: 36, fontSize: "text-base", gap: "gap-2.5" },
    lg: { icon: 44, fontSize: "text-lg", gap: "gap-3" },
  };

  const { icon, fontSize, gap } = sizes[size];

  return (
    <span className={`flex items-center ${gap} select-none`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20 3L5 9.5V20.5C5 28.5 11.5 36 20 38C28.5 36 35 28.5 35 20.5V9.5L20 3Z"
          fill="hsl(191, 97%, 40%)"
        />
        <path
          d="M20 3L5 9.5V20.5C5 28.5 11.5 36 20 38C28.5 36 35 28.5 35 20.5V9.5L20 3Z"
          fill="url(#shield-gradient)"
        />
        <path
          d="M14 20.5L18.5 25L26.5 16"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="shield-gradient" x1="20" y1="3" x2="20" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(191, 97%, 52%)" />
            <stop offset="100%" stopColor="hsl(191, 97%, 32%)" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-bold tracking-tight leading-none ${fontSize}`}>
        <span style={{ color: "hsl(191, 97%, 40%)" }}>Proof</span>
        <span className="text-foreground"> of Human</span>
      </span>
    </span>
  );
}
