import { LoginForm } from './LoginForm';
import { LoginHero } from './LoginHero';
import styles from './login.module.css';

export function LoginScreen() {
  return (
    <div className={styles['screen']}>
      <LoginForm />
      <LoginHero />
    </div>
  );
}
