export function maskCardNumber(cardNumber) {
  const value = String(cardNumber || '');
  if (value.length <= 4) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.min(8, value.length - 4))}${value.slice(-4)}`;
}

export function sanitizePatientCard(card) {
  return { ...card, cardNumber: maskCardNumber(card.cardNumber) };
}
