// Minimal ESLint config to avoid circular structure bug
// TODO: Restore full config when ESLint 9.x compatibility is resolved
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "Doormat_original/**",
    ],
  },
];

export default eslintConfig;
