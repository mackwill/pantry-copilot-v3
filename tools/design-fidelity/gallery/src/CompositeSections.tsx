import { useState } from 'react';
import {
  BottomSheet,
  Button,
  Card,
  Eyebrow,
  Icon,
  NLPrompt,
  Pill,
  Tabs,
  WebShell,
  WeirdnessControl,
  WeirdnessSlider,
} from '@pantry/design-system/web';
import { Row, Section } from './layout.js';

const WEIRDNESS_VALUES = [10, 40, 70, 95];

export function WeirdnessSection() {
  return (
    <Section id="weirdness" title="Weirdness controls">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '28px 40px',
          maxWidth: 880,
          marginBottom: 28,
        }}
      >
        {WEIRDNESS_VALUES.map((value) => (
          <WeirdnessSlider key={value} value={value} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
        {WEIRDNESS_VALUES.map((value) => (
          <WeirdnessControl key={value} value={value} />
        ))}
      </div>
    </Section>
  );
}

export function SheetSection() {
  const [open, setOpen] = useState(() =>
    new URLSearchParams(window.location.search).has('sheet'),
  );
  return (
    <Section id="bottom-sheet" title="Bottom sheet">
      <Row>
        <Button
          kind="secondary"
          onClick={() => {
            setOpen(true);
          }}
        >
          Open bottom sheet
        </Button>
      </Row>
      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        eyebrow="Category"
        title="What kind of thing is this?"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button kind="secondary" full>
              Cancel
            </Button>
            <Button kind="primary" full>
              Use Dairy
            </Button>
          </div>
        }
      >
        {['Produce', 'Dairy', 'Pantry', 'Protein'].map((label, index, all) => (
          <div
            key={label}
            style={{
              padding: '14px 20px',
              borderBottom: index < all.length - 1 ? '1px solid var(--line)' : 'none',
              font: '500 15px var(--font-sans)',
            }}
          >
            {label}
          </div>
        ))}
      </BottomSheet>
    </Section>
  );
}

export function NLPromptSection() {
  const [ask, setAsk] = useState('');
  const [weirdness, setWeirdness] = useState(40);
  return (
    <Section id="nl-prompt" title="NL prompt">
      <div style={{ display: 'grid', gap: 20, maxWidth: 720 }}>
        <NLPrompt
          value={ask}
          onChange={setAsk}
          placeholder="Tell me what you're hungry for…"
          eyebrow="Ask in your own words"
          submitLabel="Cook this"
          mic={{ label: 'Voice input', onClick: () => undefined }}
          footer={
            <>
              {['something quick & vegetarian', 'use up the milk + scallions'].map((s) => (
                <Pill key={s} tone="outline" style={{ cursor: 'pointer', padding: '5px 10px', fontSize: 12 }}>
                  <Icon name="Plus" size={11} /> {s}
                </Pill>
              ))}
            </>
          }
        />
        <NLPrompt
          value={ask}
          onChange={setAsk}
          placeholder="Tell me what you're hungry for…"
          eyebrow="Ask in your own words"
          submitLabel="Cook this"
          footer={<WeirdnessControl value={weirdness} onChange={setWeirdness} size="sm" />}
        />
      </div>
    </Section>
  );
}

export function WebShellSection() {
  return (
    <Section id="web-shell" title="Web shell">
      <div
        style={{
          height: 520,
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}
      >
        <WebShell
          navItems={[
            { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
            { id: 'pantry', label: 'Pantry', icon: 'Refrigerator' },
            { id: 'cook', label: 'Cook', icon: 'ChefHat' },
            { id: 'recipes', label: 'Recipes', icon: 'BookOpen' },
            { id: 'shopping', label: 'Shopping', icon: 'ShoppingCart' },
          ]}
          activeId="dashboard"
          listsLabel="Lists"
          lists={[
            { id: 'veg', label: 'Vegetarian', icon: 'Leaf' },
            { id: 'freezer', label: 'Freezer', icon: 'Snowflake' },
            { id: 'using-up', label: 'Use it up', icon: 'Flame' },
          ]}
          user={{ initials: 'MS', name: 'Mara Singh', email: 'mara@home.kitchen' }}
          search={{ placeholder: 'Search ingredients, recipes, or ideas', shortcut: '⌘K' }}
          topbarRight={
            <>
              <Button kind="secondary" size="sm" leftIcon={<Icon name="Bell" size={14} />}>
                3
              </Button>
              <Button kind="primary" size="sm" leftIcon={<Icon name="Plus" size={14} color="var(--accent-fg)" />}>
                Add ingredient
              </Button>
            </>
          }
        >
          <Eyebrow style={{ marginBottom: 10 }}>Dashboard</Eyebrow>
          <Card style={{ maxWidth: 480 }}>
            <div style={{ font: '400 20px/1.3 var(--font-display)', letterSpacing: '-0.02em' }}>
              Shell content slot
            </div>
          </Card>
        </WebShell>
      </div>
    </Section>
  );
}

export function TabsSection() {
  const [active, setActive] = useState('all');
  return (
    <Section id="tabs" title="Tabs">
      <Tabs
        tabs={['All', 'Produce', 'Dairy', 'Pantry', 'Freezer', 'Spice'].map((label) => ({
          id: label.toLowerCase(),
          label,
        }))}
        activeId={active}
        onChange={setActive}
      />
    </Section>
  );
}
