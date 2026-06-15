import { describe, expect, it } from 'vitest';
import { generationEventSchema } from '../index';

const base = { seq: 1, t: 120 };

describe('generationEventSchema', () => {
  it('parses a pulling_from event', () => {
    const e = generationEventSchema.parse({ type: 'pulling_from', must: ['Spinach'], maybe: ['Eggs'], ...base });
    expect(e.type).toBe('pulling_from');
  });
  it('parses a thinking_token event', () => {
    const e = generationEventSchema.parse({ type: 'thinking_token', text: 'Looking at...', ...base });
    expect(e.type === 'thinking_token' && e.text).toBe('Looking at...');
  });
  it('parses a tool_event and defaults result to null', () => {
    const e = generationEventSchema.parse({
      type: 'tool_event',
      id: 'tool-1',
      name: 'read_pantry',
      state: 'pending',
      display: 'read_pantry()',
      ...base,
    });
    expect(e.type === 'tool_event' && e.result).toBeNull();
  });
  it('rejects a tool_event with an unknown tool name', () => {
    const r = generationEventSchema.safeParse({
      type: 'tool_event',
      id: 'tool-1',
      name: 'rm_rf',
      state: 'pending',
      display: 'x',
      ...base,
    });
    expect(r.success).toBe(false);
  });
  it('parses a recipe_partial event and defaults complete to false', () => {
    const e = generationEventSchema.parse({ type: 'recipe_partial', recipe: { title: 'Soup' }, ...base });
    expect(e.type === 'recipe_partial' && e.complete).toBe(false);
  });
  it('parses a notice event', () => {
    const e = generationEventSchema.parse({ type: 'notice', text: 'Heads up', ...base });
    expect(e.type).toBe('notice');
  });
  it('parses a done event and defaults recipeId to null', () => {
    const e = generationEventSchema.parse({
      type: 'done',
      recipe: {
        title: 'Soup',
        summary: 's',
        weirdnessScore: 10,
        ingredients: [{ name: 'Water' }],
        steps: ['Boil'],
        timeMinutes: 5,
        difficulty: 'easy',
        whySuggested: 'why',
      },
      ...base,
    });
    expect(e.type === 'done' && e.recipeId).toBeNull();
  });
  it('parses an error event', () => {
    const e = generationEventSchema.parse({ type: 'error', code: 'timeout', message: 'too slow', ...base });
    expect(e.type === 'error' && e.code).toBe('timeout');
  });
  it('parses an aborted event', () => {
    expect(generationEventSchema.parse({ type: 'aborted', ...base }).type).toBe('aborted');
  });
  it('rejects an unknown event type', () => {
    expect(generationEventSchema.safeParse({ type: 'mystery', ...base }).success).toBe(false);
  });
});
