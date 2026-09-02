import prisma from '../config/prisma.js';
import { DEPARTMENT_ALIASES } from './data/conditionKnowledgeBase.js';
const normal = value => value.toUpperCase().replace(/[^A-Z0-9&]/g, ' ').replace(/\s+/g, ' ').trim();
export async function resolveDepartment(hospitalId, key) {
  if (!hospitalId) return null;
  const departments = await prisma.department.findMany({ where: { hospitalId, active: true }, select: { id: true, hospitalId: true, name: true, code: true, description: true } });
  const matchesAlias = (value, alias) => {
    const normalizedValue = normal(value);
    const normalizedAlias = normal(alias);
    return normalizedValue === normalizedAlias || normalizedValue.startsWith(`${normalizedAlias} `);
  };
  const find = category => departments.find(department => (DEPARTMENT_ALIASES[category] || []).some(alias => matchesAlias(department.name, alias) || matchesAlias(department.code, alias)));
  return find(key) || find('GENERAL') || null;
}
