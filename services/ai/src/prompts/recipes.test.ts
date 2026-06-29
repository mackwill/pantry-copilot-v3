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

  it('escalates the required divergence count band by band', () => {
    expect(buildGenerationSystemPrompt(10, [])).toMatch(/zero departures/i);
    expect(buildGenerationSystemPrompt(30, [])).toMatch(/exactly one/i);
    expect(buildGenerationSystemPrompt(50, [])).toMatch(/one full departure/i);
    expect(buildGenerationSystemPrompt(70, [])).toMatch(/two or more departures/i);
    const chaotic = buildGenerationSystemPrompt(95, []);
    expect(chaotic).toMatch(/three or more/i);
    expect(chaotic).toMatch(/core expectation/i);
  });

  it('forbids a lone single-ingredient change above curious', () => {
    expect(buildGenerationSystemPrompt(70, [])).toMatch(
      /single ingredient is NOT a departure/i,
    );
  });

  it('requires a pre-emit divergence self-audit kept out of whySuggested', () => {
    const prompt = buildGenerationSystemPrompt(70, []);
    expect(prompt).toMatch(/self-audit/i);
    expect(prompt).toMatch(/whySuggested/);
  });
});
