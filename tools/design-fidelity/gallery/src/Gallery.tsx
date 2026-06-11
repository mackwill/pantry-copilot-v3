import {
  NLPromptSection,
  SheetSection,
  TabsSection,
  WebShellSection,
  WeirdnessSection,
} from './CompositeSections.js';
import {
  ButtonsSection,
  CardSection,
  FieldsSection,
  InputsSection,
  PillsSection,
  WordmarkSection,
} from './PrimitiveSections.js';

/** Every primitive in the states the board shows them — the M0 screenshot subject. */
export function Gallery() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 80px' }}>
      <WordmarkSection />
      <ButtonsSection />
      <PillsSection />
      <FieldsSection />
      <InputsSection />
      <CardSection />
      <TabsSection />
      <WeirdnessSection />
      <NLPromptSection />
      <WebShellSection />
      <SheetSection />
    </div>
  );
}
