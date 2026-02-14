// Azure-Angel-Frontend/src/lib/currency-utils.ts

export const formatCurrency = (amount: number | null | undefined, currencySymbol: string = '$'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currencySymbol}0.00`;
  }
  return `${currencySymbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) {
    return 0;
  }
  // Remove currency symbols, commas, and trim whitespace
  const cleanedString = currencyString.replace(/[^0-9.-]/g, '');
  const parsedValue = parseFloat(cleanedString);
  return isNaN(parsedValue) ? 0 : parsedValue;
};

// This function is for internal use within CurrencyInput to handle user typing with $ and commas
export const formatInputCurrency = (value: string, currencySymbol: string = '$'): string => {
  const cleaned = value.replace(/[^0-9.]/g, ''); // Allow only numbers and a single decimal point
  const parts = cleaned.split('.');
  let integerPart = parts[0];
  let decimalPart = parts[1];

  // Add commas to the integer part
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimalPart !== undefined) {
    // Limit to two decimal places
    decimalPart = decimalPart.substring(0, 2);
    return `${currencySymbol}${integerPart}.${decimalPart}`;
  } else if (value.includes('.')) {
    // If user types '.' but no decimals yet
    return `${currencySymbol}${integerPart}.`;
  }
  return `${currencySymbol}${integerPart}`;
};
