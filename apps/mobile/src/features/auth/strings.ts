export const authStrings = {
  login: {
    eyebrow: 'Welcome back',
    heading: { before: 'Sign in to your', em: 'kitchen.' },
    lede: 'Pick up where you left off — your pantry, your saved recipes, the chaos slider where you parked it.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    forgotPassword: 'Forgot password',
    submit: 'Sign in',
    divider: 'or',
    oauthApple: 'Continue with Apple',
    oauthGoogle: 'Continue with Google',
    footerPrompt: 'New here?',
    footerCta: 'Create an account',
    errors: {
      emailRequired: 'Enter your email.',
      passwordRequired: 'Enter your password.',
      invalidCredentials: 'That email and password don’t match.',
      oauthFailed: 'That sign-in method isn’t available right now.',
    },
  },
} as const;
