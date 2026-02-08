import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, currency: string = '$'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currency}0`;
  }
  return `${currency}${value.toLocaleString()}`;
}
