"use client";

import { useState } from "react";

export function PasswordInput({
  value,
  onChange,
  autoComplete,
  minLength,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="auth-password">
      <input
        className="auth-field auth-field-password"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
      />
      <button
        type="button"
        className="auth-password-toggle"
        aria-label={visible ? "Slēpt paroli" : "Rādīt paroli"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12S6.2 6.5 12 6.5 21.5 12 21.5 12 17.8 17.5 12 17.5 2.5 12 2.5 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.5 4.5 20 20" strokeLinecap="round" />
      <path d="M9.2 6.9A9.8 9.8 0 0 1 12 6.5c5.8 0 9.5 5.5 9.5 5.5a16 16 0 0 1-3.1 3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.1 7.8C3.9 9.4 2.5 12 2.5 12S6.2 17.5 12 17.5c1.1 0 2.1-.2 3-.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.1 10.2a2.6 2.6 0 0 0 3.6 3.6" strokeLinecap="round" />
    </svg>
  );
}
