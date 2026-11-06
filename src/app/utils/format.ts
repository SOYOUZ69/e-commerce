export const formatPrice = (value: number) => {
  const formatted = new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number(value) || 0);
  return `${formatted} DT`;
};
