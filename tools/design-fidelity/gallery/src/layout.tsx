import type { ReactNode } from 'react';
import { Eyebrow } from '@pantry/design-system/web';

export interface SectionProps {
  /** Stable id used by the fidelity harness to screenshot individual sections. */
  id: string;
  title: string;
  children: ReactNode;
}

export function Section({ id, title, children }: SectionProps) {
  return (
    <section data-gallery-section={id} style={{ marginBottom: 48 }}>
      <Eyebrow style={{ marginBottom: 16 }}>{title}</Eyebrow>
      {children}
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
      {children}
    </div>
  );
}
