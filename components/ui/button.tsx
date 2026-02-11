import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const buttonVariants = {
  default:
    "bg-[#0066b3] text-white shadow hover:bg-[#004d8c] focus-visible:ring-[#0066b3]",
  outline:
    "border border-[#e2e8e8] bg-white hover:bg-[#faf8f0] hover:border-[#0066b3] focus-visible:ring-[#0066b3]",
  secondary:
    "bg-[#f1f5f9] text-[#1a365d] hover:bg-[#e2e8e8] focus-visible:ring-[#94a3b8]",
  ghost: "hover:bg-[#f1f5f9] focus-visible:ring-[#94a3b8]",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
};

const sizeVariants = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-lg px-3 text-sm",
  lg: "h-11 rounded-xl px-8 text-base",
  icon: "h-10 w-10",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f0] disabled:pointer-events-none disabled:opacity-50 ${buttonVariants[variant]} ${sizeVariants[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
