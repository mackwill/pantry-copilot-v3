import { Button, Card, Eyebrow, Icon, WebShell } from '@pantry/design-system/web';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import { billingStrings as s } from '../strings';
import styles from '../billing.module.css';

export interface TrialEndingUser {
  name: string;
  email: string;
}

interface TrialEndingScreenProps {
  user: TrialEndingUser;
  /** "Back to dashboard" affordance. */
  onBack: () => void;
  /** "Keep Pro" / "Switch to annual" — routes to the upgrade paywall. */
  onKeepPro: () => void;
  /** "Cancel trial" affordance. */
  onCancel: () => void;
}

/** Board paywall-contextual · frame 9 (`WebTrialEnding`) — in-shell trial reminder page. */
export function TrialEndingScreen({ user, onBack, onKeepPro, onCancel }: TrialEndingScreenProps) {
  const shellNav = useShellNav('dashboard');
  const c = s.trialEnding;

  return (
    <WebShell {...shellNav} user={webShellUser(user)} hideTopbar>
      <div className={styles['trialBack']}>
        <Button kind="ghost" size="sm" leftIcon={<Icon name="ArrowLeft" size={14} />} onClick={onBack}>
          {c.back}
        </Button>
      </div>

      <div className={styles['trialBody']}>
        <div className={styles['trialBadge']}>
          <span className={styles['trialBadgeDot']} />
          {c.badge}
        </div>
        <h1 className={styles['trialHeadline']}>
          {c.headlineLead}
          <br />
          <em className={styles['trialHeadlineEm']}>{c.headlineEmphasis}</em>
        </h1>
        <p className={styles['trialText']}>{c.body}</p>

        <Card style={{ marginBottom: 14 }}>
          <Eyebrow style={{ marginBottom: 16 }}>{c.perksEyebrow}</Eyebrow>
          <div className={styles['trialPerksGrid']}>
            {c.perks.map((perk) => {
              const italic = perk.value.includes(' ') || perk.value === 'chaotic';
              const valueClass = [
                styles['trialPerkValue'],
                italic ? styles['trialPerkValueItalic'] : null,
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div key={perk.label}>
                  <div className={valueClass}>{perk.value}</div>
                  <div className={styles['trialPerkLabel']}>{perk.label}</div>
                  <div className={styles['trialPerkSub']}>{perk.sub}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ marginBottom: 22 }}>
          <Eyebrow style={{ marginBottom: 12 }}>{c.timelineEyebrow}</Eyebrow>
          <div className={styles['trialTimeline']}>
            <div className={styles['trialTimelineFill']} />
          </div>
          <div className={styles['trialTimelineLabels']}>
            <span>{c.timeline.start}</span>
            <span>{c.timeline.today}</span>
            <span>{c.timeline.billing}</span>
          </div>
        </Card>

        <div className={styles['trialCtas']}>
          <Button
            kind="primary"
            size="lg"
            leftIcon={<Icon name="Check" size={16} color="#fff" />}
            onClick={onKeepPro}
          >
            {c.keepPro}
          </Button>
          <Button
            kind="secondary"
            size="lg"
            leftIcon={<Icon name="Sparkles" size={14} />}
            onClick={onKeepPro}
          >
            {c.switchAnnual}
          </Button>
          <div className={styles['trialCancel']}>
            <Button kind="ghost" size="lg" onClick={onCancel}>
              {c.cancelTrial}
            </Button>
          </div>
        </div>
      </div>
    </WebShell>
  );
}
