// Project-wide CNIC and Phone Number Auto-Formatter Utilities

export const formatCNIC = (val) => {
  if (!val) return '';
  const digits = val.toString().replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

export const formatPhone = (val) => {
  if (!val) return '';
  const digits = val.toString().replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

export const stripDashes = (val) => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '');
};
