import { CalendarDays, CreditCard, Home, PlusCircle, UserRound } from 'lucide-react';
const ITEMS = [['home', Home, 'Home'], ['appointments', CalendarDays, 'Appointments'], ['book', PlusCircle, 'Book'], ['cards', CreditCard, 'Cards'], ['profile', UserRound, 'Profile']];
export default function MobileBottomNavigation({ active, onSelect }) {
  return <nav className="patient-bottom-nav" aria-label="Patient navigation">{ITEMS.map(([key, Icon, label]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => onSelect(key)} aria-current={active === key ? 'page' : undefined}><Icon size={21}/><span>{label}</span></button>)}</nav>;
}
