export function calculateBmi(weightKg, heightCm) {
  if (weightKg == null || heightCm == null) return null;
  const weight = Number(weightKg);
  const height = Number(heightCm);
  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
    throw new Error('Weight and height must be positive numbers');
  }
  return Number((weight / ((height / 100) ** 2)).toFixed(2));
}
