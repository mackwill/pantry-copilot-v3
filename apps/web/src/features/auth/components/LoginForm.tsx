import { Button, Eyebrow, Field, Icon, Input, Wordmark } from '@pantry/design-system/web';
import { Link } from '@tanstack/react-router';
import { authStrings } from '../strings';
import { useLogin } from '../useLogin';
import styles from './login.module.css';

const s = authStrings.login;

export function LoginForm() {
  const login = useLogin();
  return (
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
            void login.submit();
          }}
        >
          <Field
            label={s.emailLabel}
            {...(login.error === undefined ? {} : { error: login.error })}
          >
            <Input
              value={login.email}
              onChange={login.setEmail}
              type="email"
              name="email"
              leftIcon={<Icon name="AtSign" size={16} />}
            />
          </Field>
          <Field label={s.passwordLabel}>
            <Input
              value={login.password}
              onChange={login.setPassword}
              type="password"
              name="password"
              leftIcon={<Icon name="Lock" size={16} />}
            />
          </Field>
          <div className={styles['rememberRow']}>
            <label className={styles['remember']}>
              <button
                type="button"
                role="checkbox"
                aria-checked={login.rememberMe}
                aria-label={s.keepSignedIn}
                className={login.rememberMe ? styles['checkOn'] : styles['checkOff']}
                onClick={() => {
                  login.setRememberMe(!login.rememberMe);
                }}
              >
                {login.rememberMe ? <Icon name="Check" size={11} color="#fff" /> : null}
              </button>
              {s.keepSignedIn}
            </label>
            <span className={styles['forgot']}>{s.forgotPassword}</span>
          </div>
          <Button
            kind="primary"
            size="lg"
            full
            type="submit"
            disabled={login.pending}
            style={{ marginTop: 8 }}
          >
            {s.submit}
          </Button>
          <div className={styles['divider']}>
            <span className={styles['dividerLine']} />
            <span className={styles['dividerText']}>{s.divider}</span>
            <span className={styles['dividerLine']} />
          </div>
          <Button
            kind="secondary"
            full
            leftIcon={<Icon name="Apple" size={16} />}
            onClick={() => void login.oauth('apple')}
          >
            {s.oauthApple}
          </Button>
          <Button
            kind="secondary"
            full
            leftIcon={<Icon name="Chrome" size={16} />}
            onClick={() => void login.oauth('google')}
          >
            {s.oauthGoogle}
          </Button>
        </form>
      </div>
      <div className={styles['footer']}>
        {s.footerPrompt}{' '}
        <Link to="/signup" className={styles['footerCta']}>
          {s.footerCta}
        </Link>
      </div>
    </div>
  );
}
