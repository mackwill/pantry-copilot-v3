import { Button, Eyebrow, Field, Icon, Input, Wordmark } from '@pantry/design-system/web';
import { Link } from '@tanstack/react-router';
import { authStrings } from '../strings';
import { useSignup } from '../useSignup';
import { LoginHero } from './LoginHero';
import styles from './login.module.css';

const s = authStrings.signup;

/** Board-silent screen: mirrors the login left column with primitives only. */
export function SignupScreen() {
  const signup = useSignup();
  return (
    <div className={styles['screen']}>
      <div className={styles['formColumn']}>
        <Wordmark size={26} />
        <div className={styles['formBody']}>
          <Eyebrow style={{ marginBottom: 18 }}>{s.eyebrow}</Eyebrow>
          <h1 className={styles['heading']}>
            {s.heading.before}
            <br />
            <em>{s.heading.em}</em>
          </h1>
          <p className={styles['lede']}>{s.lede}</p>
          <form
            className={styles['fields']}
            onSubmit={(e) => {
              e.preventDefault();
              void signup.submit();
            }}
          >
            <Field
              label={s.nameLabel}
              {...(signup.error === undefined ? {} : { error: signup.error })}
            >
              <Input
                value={signup.name}
                onChange={signup.setName}
                name="name"
                leftIcon={<Icon name="User" size={16} />}
              />
            </Field>
            <Field label={s.emailLabel}>
              <Input
                value={signup.email}
                onChange={signup.setEmail}
                type="email"
                name="email"
                leftIcon={<Icon name="AtSign" size={16} />}
              />
            </Field>
            <Field label={s.passwordLabel}>
              <Input
                value={signup.password}
                onChange={signup.setPassword}
                type="password"
                name="password"
                leftIcon={<Icon name="Lock" size={16} />}
              />
            </Field>
            <Button
              kind="primary"
              size="lg"
              full
              type="submit"
              disabled={signup.pending}
              style={{ marginTop: 8 }}
            >
              {s.submit}
            </Button>
          </form>
        </div>
        <div className={styles['footer']}>
          {s.footerPrompt}{' '}
          <Link to="/login" className={styles['footerCta']}>
            {s.footerCta}
          </Link>
        </div>
      </div>
      <LoginHero />
    </div>
  );
}
