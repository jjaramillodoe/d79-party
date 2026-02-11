import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`flex h-10 w-full rounded-xl border border-[#e2e8e8] bg-white px-4 py-2 text-sm text-[#1a365d] shadow-sm transition placeholder:text-[#94a3b8] focus:border-[#0066b3] focus:outline-none focus:ring-2 focus:ring-[#0066b3]/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
