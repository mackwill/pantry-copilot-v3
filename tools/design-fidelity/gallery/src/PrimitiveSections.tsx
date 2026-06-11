import { useState } from 'react';
import {
  Button,
  Card,
  Eyebrow,
  Field,
  Icon,
  Input,
  Pill,
  Wordmark,
  type ButtonKind,
  type ButtonSize,
  type PillTone,
} from '@pantry/design-system/web';
import { Row, Section } from './layout.js';

const BUTTON_KINDS: ButtonKind[] = ['primary', 'secondary', 'ghost', 'inverse', 'danger'];
const BUTTON_SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const PILL_TONES: PillTone[] = [
  'neutral',
  'success',
  'warning',
  'danger',
  'accent',
  'inverse',
  'outline',
];

export function ButtonsSection() {
  return (
    <Section id="buttons" title="Buttons">
      {BUTTON_KINDS.map((kind) => (
        <Row key={kind}>
          {BUTTON_SIZES.map((size) => (
            <Button key={size} kind={kind} size={size}>
              {`${kind} ${size}`}
            </Button>
          ))}
          <Button kind={kind} leftIcon={<Icon name="Plus" size={14} />}>
            with icon
          </Button>
          <Button kind={kind} disabled>
            disabled
          </Button>
        </Row>
      ))}
    </Section>
  );
}

export function PillsSection() {
  return (
    <Section id="pills" title="Pills">
      <Row>
        {PILL_TONES.map((tone) => (
          <Pill key={tone} tone={tone}>
            {tone}
          </Pill>
        ))}
        <Pill tone="warning">
          <Icon name="Clock" size={11} />
          expires in 2 days
        </Pill>
      </Row>
    </Section>
  );
}

export function FieldsSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('mara@home');
  return (
    <Section id="fields" title="Fields">
      <Row>
        <Field label="Ingredient" hint="What should we call it?" style={{ width: 280 }}>
          <Input value={name} onChange={setName} placeholder="e.g. Whole milk" />
        </Field>
        <Field label="Email" error="That doesn't look like an email." style={{ width: 280 }}>
          <Input value={email} onChange={setEmail} type="email" />
        </Field>
      </Row>
    </Section>
  );
}

export function InputsSection() {
  const [empty, setEmpty] = useState('');
  const [filled, setFilled] = useState('Whole milk');
  const [query, setQuery] = useState('');
  return (
    <Section id="inputs" title="Inputs">
      <Row>
        <Input value={empty} onChange={setEmpty} placeholder="Empty input" style={{ width: 240 }} />
        <Input value={filled} onChange={setFilled} style={{ width: 240 }} />
        <Input
          value={query}
          onChange={setQuery}
          type="search"
          placeholder="Search the pantry"
          leftIcon={<Icon name="Search" size={15} />}
          style={{ width: 240 }}
        />
      </Row>
    </Section>
  );
}

export function CardSection() {
  return (
    <Section id="card" title="Card">
      <Card style={{ maxWidth: 420 }}>
        <Eyebrow style={{ marginBottom: 10 }}>Expiring soon</Eyebrow>
        <div
          style={{
            font: '400 22px/1.2 var(--font-display)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Whole milk, half a gallon
        </div>
        <Row>
          <Pill tone="warning">2 days</Pill>
          <Pill tone="neutral">Fridge</Pill>
        </Row>
      </Card>
    </Section>
  );
}

export function WordmarkSection() {
  return (
    <Section id="wordmark" title="Wordmark">
      <Row>
        <Wordmark size={20} />
        <Wordmark size={26} />
        <Wordmark size={34} />
      </Row>
    </Section>
  );
}
