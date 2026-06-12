export const authStrings = {
  login: {
    eyebrow: 'Welcome back',
    heading: { before: 'Sign in to your', em: 'kitchen.' },
    lede: 'Pick up where you left off — your pantry, your saved recipes, the chaos slider exactly where you parked it.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    keepSignedIn: 'Keep me signed in',
    forgotPassword: 'Forgot password',
    submit: 'Sign in',
    divider: 'or',
    oauthApple: 'Continue with Apple',
    oauthGoogle: 'Continue with Google',
    footerPrompt: 'New here?',
    footerCta: 'Create an account →',
    errors: {
      emailRequired: 'Enter your email.',
      passwordRequired: 'Enter your password.',
      invalidCredentials: 'That email and password don’t match.',
      oauthFailed: 'That sign-in method isn’t available right now.',
    },
  },
  hero: {
    eyebrow: 'Tonight’s idea',
    heading: { before: 'Burnt-butter', em: 'milk ramen.' },
    description:
      'A dairy-noodle hybrid that shouldn’t work. It works. Generated for someone with milk that’s about to turn and a half pack of soba.',
    pillTime: '22 min',
    pillIngredients: '7 ingredients',
    pillExpiring: 'uses 3 expiring',
    weirdness: 'weirdness · 0.62',
    meta: 'v1.4 · Apr 21',
  },
} as const;
