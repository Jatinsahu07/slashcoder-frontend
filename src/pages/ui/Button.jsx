// src/pages/ui/Button.jsx
import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "px-4 py-2 rounded-lg font-semibold transition-all " +
        "bg-[#ff4655] hover:bg-[#ff2f40] text-white shadow-md " +
        className
      }
    >
      {children}
    </button>
  );
}
