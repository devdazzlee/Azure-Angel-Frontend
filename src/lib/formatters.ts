export function formatMoney(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currency}0`;
  }
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCurrency(value: number | null | undefined, currency: string = '$') {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currency}0.00`;
  }
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}