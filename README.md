# Redex Education

**CEU & License Management Portal** for Redex field technicians and staff.

Track professional licenses, certifications, required continuing education units (CEUs), expirations, and renewal compliance across the organization.

## Purpose

- Provide technicians a clear view of their active licenses, required CEU hours, and upcoming renewal deadlines
- Enable management to monitor company-wide compliance and proactively manage renewals (e.g. Locksmith, Guard Service, Low Voltage, etc.)
- Record external CEU purchases (EliteCEU, state providers) and internal training completions
- Maintain audit-ready records of certifications and CEU credits

## Stack (matches Redex Ops Hub)

- **Frontend**: Vite + React 18/19 + TypeScript + Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Backend / Auth / DB**: Supabase (shared project `toghxeuhgkcrbrdxewdw` with redex-ops-hub)
- **Deployment**: Netlify (or Vercel)

## Key Features (Planned)

### Technician Experience
- Personal dashboard with license cards (status, expiry, CEU progress)
- CEU credit history and upload of completion certificates
- Renewal calendar and action items
- Links to approved CEU providers

### Management Experience
- Organization compliance heatmap / list of expiring certifications
- Record bulk or individual CEU packages and assignments
- Technician license matrix export
- Alerts and reporting

## Getting Started

```bash
npm install
npm run dev
```

## Environment

Create `.env.local`:

```
VITE_SUPABASE_URL=https://toghxeuhgkcrbrdxewdw.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

(Use the same values as redex-ops-hub for now.)

## Related Repos

- [redex-ops-hub](https://github.com/lewis4x4/redex-ops-hub-37ca2a19) — Main operations platform (contains broader training + some certification tracking)
- [redex-victra-portal](https://github.com/lewis4x4/redex-victra-portal)

## License

Private — Redex Education


Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
