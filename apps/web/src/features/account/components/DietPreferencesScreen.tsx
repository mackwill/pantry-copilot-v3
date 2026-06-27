import { ALLERGY_OPTIONS, DIET_OPTIONS, type UserPreferences } from '@pantry/contracts';
import { Button, Icon, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../../../lib/api';
import { authClient } from '../../../lib/auth-client';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import { accountStrings } from '../strings';
import styles from '../account.module.css';
import { AccountSidebar } from './AccountSidebar';
import { PreferenceEditor } from './PreferenceEditor';

const s = accountStrings.diet;

interface DietPreferencesScreenProps {
  user: { name: string; email: string };
  preferences: UserPreferences;
}

export function DietPreferencesScreen({ user, preferences }: DietPreferencesScreenProps) {
  const navigate = useNavigate();
  const shellNav = useShellNav();
  const [diet, setDiet] = useState<string[]>(preferences.diet);
  const [allergies, setAllergies] = useState<string[]>(preferences.allergies);
  const [saved, setSaved] = useState(false);

  const handleSignOut = (): void => {
    void authClient.signOut().then(() => navigate({ to: '/login' }));
  };

  const save = (): void => {
    void api.user.updatePreferences
      .mutate({ diet, allergies })
      .then(() => {
        setSaved(true);
      })
      .catch(() => undefined);
  };

  return (
    <WebShell {...shellNav} user={webShellUser(user)} hideTopbar>
      <div className={styles['topBar']}>
        <Button
          kind="ghost"
          size="sm"
          leftIcon={<Icon name="ChevronLeft" size={16} />}
          onClick={() => void navigate({ to: '/settings' })}
        >
          {accountStrings.back}
        </Button>
      </div>
      <div className={styles['grid']}>
        <AccountSidebar onSignOut={handleSignOut} current="diet" />
        <div className={styles['contentCol']}>
          <h1 className={styles['pageTitle']}>{s.title}</h1>
          <p className={styles['dietSubtitle']}>{s.subtitle}</p>
          <PreferenceEditor
            testId="diet-editor"
            heading={s.dietHeading}
            options={DIET_OPTIONS}
            value={diet}
            onChange={(next) => {
              setDiet(next);
              setSaved(false);
            }}
          />
          <PreferenceEditor
            testId="allergy-editor"
            heading={s.allergyHeading}
            options={ALLERGY_OPTIONS}
            value={allergies}
            onChange={(next) => {
              setAllergies(next);
              setSaved(false);
            }}
          />
          <div className={styles['dietActions']}>
            <Button kind="primary" onClick={save}>
              {saved ? s.saved : s.save}
            </Button>
          </div>
        </div>
      </div>
    </WebShell>
  );
}
