"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "./spinner";

export function SubmitButton({
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} {...rest}>
      {pending && <Spinner />}
      {children}
    </button>
  );
}
