export default function ClinicalAssessmentSummary({ assessment, audience = 'doctor' }) {
  if (!assessment) return null;
  const details = assessment.possibleConditions || {};
  const conditions = details.results || [];

  return <section className="clinical-assessment-summary" aria-labelledby="previsit-assessment-title">
    <h3 id="previsit-assessment-title">Patient Pre-Visit AI-Assisted Assessment</h3>
    <p><strong>Patient-reported symptoms:</strong> {assessment.symptomsText || 'Not supplied'}</p>
    <p><strong>Rule-based urgency suggestion:</strong> {assessment.urgencyLevel || 'Not assessed'}</p>
    {assessment.redFlagDetected && <p className="clinical-error"><strong>Red flag detected:</strong> Immediate clinical review is recommended.</p>}
    {!!conditions.length && <div><strong>Illustrative possibilities:</strong><ul>{conditions.slice(0, 5).map(item => <li key={item.displayName}>{item.displayName} — {item.shortReason}</li>)}</ul></div>}
    {assessment.recommendedAction && <p><strong>Suggested action:</strong> {assessment.recommendedAction}</p>}
    <p className="assessment-disclaimer">This rule-based result is not a diagnosis and does not replace {audience === 'nurse' ? 'nurse triage' : 'the doctor’s clinical judgment'}.</p>
  </section>;
}
