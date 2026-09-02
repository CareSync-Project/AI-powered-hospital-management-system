const indicator = (value, low, high, criticalLow, criticalHigh) => value == null ? null : value <= criticalLow || value >= criticalHigh ? 'URGENT_REVIEW' : value < low ? 'LOW' : value > high ? 'HIGH' : 'WITHIN_EXPECTED_RANGE';
export const vitalAssessmentService = {
  assess(vital) {
    const indicators = {
      temperature: indicator(Number(vital.temperature), 36.0, 37.5, 34, 40),
      systolicBP: indicator(vital.systolicBP, 90, 139, 70, 180),
      diastolicBP: indicator(vital.diastolicBP, 60, 89, 40, 120),
      heartRate: indicator(vital.heartRate, 60, 100, 40, 140),
      oxygenSaturation: indicator(Number(vital.oxygenSaturation), 95, 100, 88, 101),
      respiratoryRate: indicator(vital.respiratoryRate, 12, 20, 8, 30),
    };
    return { indicators, urgentReviewRecommended: Object.values(indicators).includes('URGENT_REVIEW'), disclaimer: 'Adult baseline indicators only. These indicators do not replace clinical assessment.' };
  },
};
