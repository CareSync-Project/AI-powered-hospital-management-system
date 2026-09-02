import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');

describe('Prisma schema integrity contracts', () => {
  it('prevents duplicate departments within a hospital', () => {
    expect(schema).toContain('@@unique([hospitalId, name])');
    expect(schema).toContain('@@unique([hospitalId, code])');
  });

  it('prevents duplicate doctor and patient hospital relationships', () => {
    expect(schema).toContain('@@unique([doctorId, hospitalId])');
    expect(schema).toContain('@@unique([patientId, hospitalId])');
  });

  it('does not cascade medical history deletion', () => {
    expect(schema).not.toContain('onDelete: Cascade');
  });
});
