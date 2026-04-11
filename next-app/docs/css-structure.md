# CSS Structure

This project currently uses:

- CSS Modules for component- and route-scoped styles
- Sass (`.scss`) for nesting, tokens, and mixins
- CSS custom properties for runtime theming

## File layout

```text
app/
  globals.scss
  page.module.scss
  styles/
    _tokens.scss
    _mixins.scss
```

## How the pieces fit together

### `app/globals.scss`

Global foundation styles live here:

- resets (`box-sizing`, margin, padding)
- root layout styles for `html` and `body`
- theme application through CSS variables on `:root`
- light and dark mode variable switching

This file should stay focused on truly global concerns only.

### `app/styles/_tokens.scss`

Shared Sass tokens and theme mixins live here:

- Sass variables for breakpoints, spacing, widths, radii, and transitions
- `theme-light` mixin for light theme CSS variables
- `theme-dark` mixin for dark theme CSS variables

Use this file for design tokens that should be reused across modules.

### `app/styles/_mixins.scss`

Shared Sass mixins live here.

Right now it contains:

- `mobile-down` for `max-width: 600px` responsive rules

Add future reusable layout or responsive helpers here.

### `app/*.module.scss`

Component or route styles should live beside the component/page that uses them.

Current example:

- `app/page.module.scss`

These files should:

- import shared tokens and mixins with `@use`
- keep styles locally scoped through CSS Modules
- use CSS variables for theme-aware colors
- use Sass variables/mixins for compile-time structure and responsive behavior

## Styling pattern

Use this split consistently:

- CSS variables: values that should remain dynamic at runtime, especially colors and theme-driven values
- Sass variables: values that are compile-time constants, such as breakpoints, spacing presets, widths, radii, and transitions
- CSS Modules: per-page or per-component class definitions
- global SCSS: app-wide base styles only

## Current conventions

- Global stylesheet import happens in `app/layout.tsx`
- Module styles use the `.module.scss` naming pattern
- Shared Sass partials are underscored (`_tokens.scss`, `_mixins.scss`)
- Theme colors are exposed as `--color-*` custom properties
- Fonts are consumed through CSS variables such as `--font-geist-sans`

## When adding new styles

### Add to `globals.scss` when

- the rule must apply app-wide
- the rule is a reset, base element style, or theme variable definition

### Add to a `.module.scss` file when

- the rule belongs to one page or one component
- the rule should stay locally scoped

### Add to `_tokens.scss` when

- a Sass value will be reused in multiple style modules
- a new theme variable group is needed

### Add to `_mixins.scss` when

- a responsive or structural Sass helper will be reused

## Example workflow for a new component

1. Create the component or route file.
2. Add a sibling `ComponentName.module.scss`.
3. Import shared Sass helpers with `@use`.
4. Prefer `var(--color-...)` for colors.
5. Prefer Sass tokens/mixins for spacing, sizing, and breakpoints.

This keeps the system simple: global theme variables at the app level, reusable Sass helpers in `app/styles`, and scoped module styles next to the UI they belong to.
