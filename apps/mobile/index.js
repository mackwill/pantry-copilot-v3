// Custom entry: install the Hermes disposable-symbol polyfills BEFORE expo-router
// pulls in any tRPC code. tRPC v11's httpSubscriptionLink (recipe generation)
// throws an empty SuppressedError on Hermes without them. See src/lib/polyfills.ts.
import './src/lib/polyfills';
import 'expo-router/entry';
