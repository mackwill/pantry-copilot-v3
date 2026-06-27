import { Card, Field, Input } from '@pantry/design-system/web';
import { accountStrings as s } from '../strings';
import styles from '../account.module.css';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

const noop = () => {};

interface ProfileCardProps {
  user: { name: string; email: string };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const labels = s.fieldLabels;
  const staticVals = s.staticProfile;

  return (
    <Card>
      <div className={styles['profileHeader']}>
        <div className={styles['avatar']}>{initialsOf(user.name)}</div>
        <div className={styles['profileMeta']}>
          <div className={styles['profileName']}>{user.name}</div>
          <div className={styles['profileSub']}>
            {`${user.email}${staticVals.sep}${staticVals.joined}`}
          </div>
        </div>
      </div>
      <div className={styles['fieldGrid']}>
        <Field label={labels.displayName}>
          <Input value={user.name} onChange={noop} />
        </Field>
        <Field label={labels.email}>
          <Input value={user.email} onChange={noop} type="email" />
        </Field>
        <Field label={labels.household}>
          <Input value={staticVals.household} onChange={noop} />
        </Field>
        <Field label={labels.timezone}>
          <Input value={staticVals.timezone} onChange={noop} />
        </Field>
      </div>
    </Card>
  );
}
