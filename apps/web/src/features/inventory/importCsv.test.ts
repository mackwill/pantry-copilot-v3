import { describe, expect, it } from 'vitest';
import { parseImportCsv } from './importCsv';

describe('parseImportCsv', () => {
  it('parses valid rows and skips a header', () => {
    const { rows, errors } = parseImportCsv(
      'name,quantity,unit,category,location\nWhole milk,1,gallon,dairy,fridge_top\nCarrots,3,ea,produce,fridge_crisper',
    );
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: 'Whole milk', quantity: 1, unit: 'gallon', category: 'dairy' });
  });

  it('reports invalid rows without dropping the valid ones', () => {
    const { rows, errors } = parseImportCsv('Eggs,12,ea,protein,fridge_door\nBadRow,notanumber,ea,produce,counter');
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('BadRow');
  });

  it('returns nothing for empty input', () => {
    expect(parseImportCsv('   \n  ')).toEqual({ rows: [], errors: [] });
  });
});
