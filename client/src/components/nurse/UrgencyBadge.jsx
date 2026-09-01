export default function UrgencyBadge({level='ROUTINE'}){return <span className={`urgency urgency--${level.toLowerCase()}`}>{level}</span>}
