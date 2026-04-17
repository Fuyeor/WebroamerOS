## For Designers

We embrace modern web standards and purposeful aesthetics. Please adhere to the following principles:

- **Design Philosophy**:
    - **Consistency**: Design should be predictable and intuitive.
    - **Emotional**: UI should evoke and suggest an "emotional atmosphere" through subtle transitions, lighting, and depth.
    - **Clearness**: Keep the interface uncluttered. Every element must serve a purpose.
- **Native CSS**: Use native CSS only. Leverage modern CSS properties (e.g., Grid, Flexbox, Nesting) without worrying about legacy browser compatibility.
- **Responsiveness**: Use CSS Container Queries instead of Media Queries for component-level responsiveness. Components should adapt based on their container's dimensions, not just the viewport.
- **Vector-Based Icons**: Use SVG for all icons. This ensures icons can dynamically adapt to theme colors and maintain crispness at any scale.
- **Tokenized Styling**: Always use Design Tokens (CSS Variables), No hard-coded values.

## For Developers

### 📜 Coding Rules

- **Zero Bloat**: Implement features natively whenever possible. Don't add a dependency unless it is absolutely necessary for core functionality.
- **Clean History**: Do not submit individual PRs for minor typos. Please collect small fixes into a single Issue or batch them into a meaningful PR.
- **Visible Context**: Every source file must start with a comment indicating its relative path from the self-contained package root.
    - E.g., `// src/main.rs` or `// @webroamer/ui/src/components/button.ts`.
- **Ecosystem Alignment**: Adhere strictly to the idiomatic best practices and conventions of each respective language and ecosystem.
- **Fail Fast**: When designing libraries or internal APIs, throw errors immediately upon receiving invalid inputs.

### 🛠 Prerequisites

#### Frontend

The frontend build process is managed by Node.js and pnpm. Ensure your environment meets the following:

- **Node.js**: Latest LTS version
- **TypeScript**: 5.9+

```bash
# 1. Install pnpm
npm i -g pnpm

# 2. Clone the repository
git clone https://github.com/Fuyeor/webroamer
# or https://gitlab.com/webroamer/os

# 3. Navigate to the project directory
cd webroamer

# 4. Install dependencies
pnpm i

# 5. Start the development server
pnpm -F @webroamer/os-front-end dev
```

**Frontend-Specific Standards:**

- **Style Decoupling**: Separate CSS into independent `.styles.ts` files to isolate logic from presentation and facilitate design-only contributions.
    ```typescript
    // @/path/to/name.styles.ts
    import { css } from 'lit';
    
    export const styles = css`...`;
    ```
- **Explicit Browser Environment**: No SSR or legacy environment checks (e.g., avoid `typeof window !== 'undefined'`). Assume a modern, standard-compliant browser. For native APIs, explicit usage like `window.navigation` is recommended for clarity.

#### Backend

The backend is powered by Rust.

- **Rust**: Edition 2024

```bash
cd apps/os/back-end
cargo run
```

**backend-Specific Standards:**

- **Schema Integrity**: Ensure accurate utoipa annotations for all API endpoints to enable frontend type generation via OpenAPI.

### ⚙️ Development Workflow

#### Generate TypeScript Types

Sync frontend types with the backend OpenAPI schema:

```bash
pnpm -F @webroamer/os-front-end dev:sync-types
```

#### Internationalization (i18n)

We use a custom toolchain for locale management:

```bash
# Generate all locales
pnpm locale make os

# Generate a specific locale (e.g., English)
pnpm locale make os --target=en

# Merge translations from single files
pnpm locale collect os

# Format locale files
pnpm locale format os
```

#### Adding Translations

Add new strings to `/apps/os/front-end/src/locale/locale.json`. 

When adding a new key, all supported languages must be translated. You are encouraged to collaborate with AI for translations, but empty values or placeholders are not permitted.

Template:

```json
"template.translationKey": {
    "ar": "",
    "de": "",
    "en": "",
    "es": "",
    "fr": "",
    "ja": "",
    "ko": "",
    "pt": "",
    "ru": "",
    "zh-hans": "",
},
```

## 🚀 Commits/Collaboration

- **Conventional Commits**: All commit messages must follow the [Conventional Commits specification](https://www.conventionalcommits.org).
- **Language**: All commits and comments must be in **English** to ensure seamless global collaboration.