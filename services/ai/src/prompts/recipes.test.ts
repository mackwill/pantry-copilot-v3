import { describe, expect, it } from 'vitest';
import { buildGenerationSystemPrompt } from './recipes.js';

describe('buildGenerationSystemPrompt', () => {
  it('names the terminal emit_recipe tool', () => {
    expect(buildGenerationSystemPrompt(40, [])).toContain('emit_recipe');
  });
  it('selects band posture by weirdness score', () => {
    expect(buildGenerationSystemPrompt(5, [])).toMatch(/normal/i);
    expect(buildGenerationSystemPrompt(95, [])).toMatch(/chaotic/i);
  });
  it('surfaces an intensity calibration sentence (floor vs ceiling)', () => {
    expect(buildGenerationSystemPrompt(62, [])).toMatch(/floor/i);
    expect(buildGenerationSystemPrompt(80, [])).toMatch(/ceiling/i);
  });
  it('lists provided pantry chips by name', () => {
    const prompt = buildGenerationSystemPrompt(40, [
      { name: 'Spinach', quantity: 2, unit: 'cup', expiresInDays: 2 },
    ]);
    expect(prompt).toContain('Spinach');
  });
  it('states the open-pantry posture when no chips are given', () => {
    expect(buildGenerationSystemPrompt(40, [])).toMatch(/any common/i);
  });
  it('renders dietary constraints as hard rules when provided', () => {
    const prompt = buildGenerationSystemPrompt(40, [], { dietary: ['vegetarian only'] });
    expect(prompt).toContain('vegetarian only');
  });
  it('produces a single recipe instruction (not a batch)', () => {
    expect(buildGenerationSystemPrompt(40, [])).toMatch(/one recipe|a single recipe|exactly one/i);
  });
  it('instructs structured steps with a label and an optional duration timer', () => {
    const prompt = buildGenerationSystemPrompt(40, []);
    expect(prompt).toContain('label');
    expect(prompt).toContain('durationMinutes');
  });
});
