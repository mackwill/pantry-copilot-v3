import { Button, Icon } from '@pantry/design-system/web';
import { generationStrings } from '../strings';

/** Ghost "Stop" — unsubscribes the stream (tears down the API→AI→provider chain). */
export function StopButton({ onStop }: { onStop: () => void }) {
  return (
    <Button kind="ghost" size="sm" leftIcon={<Icon name="X" size={14} />} onClick={onStop} style={{ color: 'var(--fg-muted)' }}>
      {generationStrings.thinking.stop}
    </Button>
  );
}
