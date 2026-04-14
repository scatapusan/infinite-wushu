import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}
