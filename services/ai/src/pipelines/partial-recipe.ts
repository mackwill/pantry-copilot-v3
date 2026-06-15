import { type AIRecipePartial, aiRecipePartialSchema } from '@pantry/contracts';

/**
 * Tolerant parser for the partial JSON the providers stream token-by-token
 * as the `emit_recipe` tool-call arguments (a single recipe object). Walks
 * the input recording "safe boundary" positions where the prefix can be
 * closed and parsed as valid JSON, then tries boundaries latest→earliest
 * until `JSON.parse` succeeds.
 *
 * Never throws: returns `null` on empty or irrecoverable input so callers
 * treat it as "no snapshot yet". Hand-rolled rather than pulling a
 * dependency for the gnarliest part of the streaming pipeline.
 */
export function parsePartialRecipe(input: string): AIRecipePartial | null {
  if (!input || input.trim().length === 0) return null;

  const repaired = repairPartialJson(input);
  if (repaired === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(repaired);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const result = aiRecipePartialSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

interface Candidate {
  pos: number;
  stack: string[];
}

function repairPartialJson(input: string): string | null {
  const candidates: Candidate[] = [{ pos: 0, stack: [] }];
  let escape = false;
  let inString = false;
  let inLiteral = false;
  const stack: string[] = [];

  const snap = (pos: number): void => {
    if (inString || inLiteral) return;
    candidates.push({ pos, stack: stack.slice() });
  };

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i] ?? '';
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        snap(i + 1);
      }
      continue;
    }
    if (inLiteral && !isLiteralChar(ch)) {
      inLiteral = false;
      snap(i);
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') {
      stack.push(ch);
      continue;
    }
    if (ch === '}' || ch === ']') {
      const want = ch === '}' ? '{' : '[';
      if (stack[stack.length - 1] !== want) return null;
      stack.pop();
      snap(i + 1);
      continue;
    }
    if (ch === ',') {
      snap(i);
      continue;
    }
    if (ch === ':' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') continue;
    if (!inLiteral) inLiteral = true;
  }
  if (!inString && !inLiteral) snap(input.length);

  for (let k = candidates.length - 1; k >= 0; k -= 1) {
    const candidate = candidates[k];
    if (!candidate) continue;
    let closers = '';
    for (let j = candidate.stack.length - 1; j >= 0; j -= 1) {
      closers += candidate.stack[j] === '{' ? '}' : ']';
    }
    const text = input.slice(0, candidate.pos) + closers;
    try {
      JSON.parse(text);
      return text;
    } catch {
      // try an earlier boundary
    }
  }
  return null;
}

function isLiteralChar(ch: string): boolean {
  return (
    (ch >= '0' && ch <= '9') ||
    (ch >= 'a' && ch <= 'z') ||
    (ch >= 'A' && ch <= 'Z') ||
    ch === '.' ||
    ch === '-' ||
    ch === '+'
  );
}
