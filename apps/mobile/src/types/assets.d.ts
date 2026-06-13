// Metro resolves font/asset imports to numeric module ids (expo-font accepts them).
declare module '*.woff2' {
  const asset: number;
  export default asset;
}
