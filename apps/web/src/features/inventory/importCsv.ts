import { createPantryItemInput, type CreatePantryItemInput } from '@pantry/contracts';

export interface ParsedImport {
  rows: CreatePantryItemInput[];
  errors: string[];
}

/**
 * Parse a simple `name,quantity,unit,category,location` CSV into pantry-item
 * create inputs. An optional header row (starting with "name") is skipped.
 * Invalid rows are reported rather than imported. Quoted commas are not
 * supported (logged in docs/decisions.md) — the format is intentionally plain.
 */
export function parseImportCsv(text: string): ParsedImport {
  const rows: CreatePantryItemInput[] = [];
  const errors: string[] = [];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const hasHeader = lines[0]?.toLowerCase().startsWith('name') ?? false;
  const offset = hasHeader ? 1 : 0;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  dataLines.forEach((line, index) => {
    const [name = '', quantity = '', unit = '', category = '', location = ''] = line
      .split(',')
      .map((cell) => cell.trim());
    const parsed = createPantryItemInput.safeParse({
      name,
      quantity: Number(quantity),
      unit,
      category,
      location,
    });
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      errors.push(`Line ${String(index + offset + 1)}: ${name === '' ? '(empty)' : name}`);
    }
  });

  return { rows, errors };
}
