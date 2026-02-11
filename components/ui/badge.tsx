import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "outline";
}

const badgeVariants = {
  default: "bg-[#0066b3] text-white",
  secondary: "bg-[#f1f5f9] text-[#475569]",
  success: "bg-[#dcfce7] text-[#166534]",
  warning: "bg-[#fef3c7] text-[#92400e]",
  outline: "border border-[#e2e8e8] bg-transparent text-[#64748b]",
};

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export { Badge };
