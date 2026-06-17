import { Button, Icon, Pill } from '@pantry/design-system/web';
import { recipeChatStrings as s } from '../strings';
import styles from '../recipe-chat.module.css';

export interface VersionBarProps {
  version: number;
  tweakCount: number;
  onBack: () => void;
  onRevert: () => void;
  canRevert: boolean;
}

/** Version pill (`v3 · 2 tweaks`) + Revert (board §✦ WebRecipeChatB header). */
export function VersionBar({ version, tweakCount, onBack, onRevert, canRevert }: VersionBarProps) {
  return (
    <div className={styles['versionBar']}>
      <Button kind="ghost" size="sm" leftIcon={<Icon name="ArrowLeft" size={14} />} onClick={onBack}>
        {s.back}
      </Button>
      <Pill tone="accent">
        <span className={styles['versionPill']}>
          <span className={styles['versionV']}>
            {s.versionPrefix}
            {version}
          </span>
          <span className={styles['versionSep']}>{s.versionDot}</span>
          {s.tweaksSuffix(tweakCount)}
        </span>
      </Pill>
      <div className={styles['versionActions']}>
        <Button
          kind="secondary"
          size="sm"
          leftIcon={<Icon name="RotateCcw" size={14} />}
          onClick={onRevert}
          disabled={!canRevert}
        >
          {s.revert}
        </Button>
      </div>
    </div>
  );
}
