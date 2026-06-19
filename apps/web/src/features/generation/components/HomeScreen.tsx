import type { PantryItem } from '@pantry/contracts';
import { Eyebrow, WebShell } from '@pantry/design-system/web';
import { freshnessFor, freshnessLabel, rankByExpiration } from '@pantry/utils';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';
import { type ExpiringEntry, HomeContextCards, type RecentEntry } from './HomeContextCards';
import { HeroPrompt } from './HeroPrompt';
import { SuggestionPills } from './SuggestionPills';

const s = generationStrings.home;

export interface HomeScreenUser {
  name: string;
  email: string;
}

function toExpiring(items: readonly PantryItem[]): ExpiringEntry[] {
  return rankByExpiration(items)
    .map((item) => ({ item, freshness: freshnessFor(item.bestBy) }))
    .filter(({ freshness }) => freshness.tone !== 'success')
    .slice(0, 3)
    .map(({ item, freshness }) => ({
      name: item.name,
      qty: `${item.quantity.toString()} ${item.unit}`,
      exp: freshnessLabel(freshness),
      tone: freshness.tone,
    }));
}

function tryHintFrom(expiring: readonly ExpiringEntry[]): string | null {
  const names = expiring.slice(0, 2).map((e) => e.name.toLowerCase());
  if (names.length < 2) return null;
  return `use up the ${names[0] ?? ''} and ${names[1] ?? ''}`;
}

export interface HomeScreenProps {
  user: HomeScreenUser;
  items: readonly PantryItem[];
  recent?: readonly RecentEntry[];
  /** Which sidebar tab is active. The board's Home is the `dashboard` tab. */
  activeNav?: string;
}

/** Board §01 Home — prompt-first hero + ambient pantry/recipe context. */
export function HomeScreen({ user, items, recent = [], activeNav = 'cook' }: HomeScreenProps) {
  const navigate = useNavigate();
  const shellNav = useShellNav(activeNav);
  const [prompt, setPrompt] = useState('');
  const [weirdness, setWeirdness] = useState(38);
  const [active, setActive] = useState<string[]>([]);

  const expiring = useMemo(() => toExpiring(items), [items]);
  const greeting = `${s.greeting(user.name.split(' ')[0] ?? user.name)} `;

  const effectivePrompt = [prompt.trim(), ...active].filter((part) => part.length > 0).join(', ');

  const submit = (): void => {
    if (effectivePrompt.length === 0) return;
    void navigate({ to: '/cook/generate', search: { prompt: effectivePrompt, weirdness } });
  };

  return (
    <WebShell {...shellNav} user={webShellUser(user)}>
      <div className={styles['homeWrap']}>
        <div className={styles['metaRow']}>
          <Eyebrow>{s.kitchenEyebrow}</Eyebrow>
          <span className={styles['metaCount']}>{s.pantrySummary(items.length, expiring.length)}</span>
        </div>

        <h1 className={styles['greeting']}>
          {greeting}
          <em className={styles['greetingAccent']}>{s.greetingAccent}</em>
        </h1>

        <HeroPrompt
          value={prompt}
          onChange={setPrompt}
          weirdness={weirdness}
          onWeirdnessChange={setWeirdness}
          onSubmit={submit}
          chips={
            <SuggestionPills
              suggestions={s.suggestions}
              active={active}
              onToggle={(suggestion) => {
                setActive((prev) =>
                  prev.includes(suggestion) ? prev.filter((p) => p !== suggestion) : [...prev, suggestion],
                );
              }}
            />
          }
        />

        <HomeContextCards expiring={expiring} recent={recent} tryHint={tryHintFrom(expiring)} />
      </div>
    </WebShell>
  );
}
