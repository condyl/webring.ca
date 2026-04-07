# webring.ca

A webring for Canadian builders — developers, designers, and founders sharing their work on the open web. Members link their personal sites together in a ring that visitors can navigate, discovering new Canadian creators along the way.

## Join the ring

1. Add the webring widget to your site (see below)
2. Fork this repo and create `members/your-slug.json`:
   ```json
   {
     "name": "Your Name",
     "url": "https://yoursite.ca",
     "city": "Toronto",
     "active": true
   }
   ```
   The filename is your slug (e.g., `jane-doe.json`). Lowercase, hyphens only.
3. Open a pull request -- CI will verify your site and we'll merge you in

**Requirements:** A personal site or project by a Canadian builder, with real content and the webring widget installed.

## Add the widget

The widget renders a minimal `← 🍁 →` nav that links your site into the ring.

### Option 1: Script embed (recommended)

Copy and paste into your site:

```html
<div data-webring="ca" data-member="your-slug"></div>
<script src="https://webring.ca/embed.js" defer></script>
```

Replace `your-slug` with your filename (without `.json`).

If your site is a single-page app, always use this option. The plain HTML option may not be detectable by our health check on client-rendered sites.

### Option 2: Pure HTML (static sites only)

For simple static sites that don't load external scripts. Style however you want -- just keep the three links:

```html
<a href="https://webring.ca/prev/your-slug">←</a>
<a href="https://webring.ca">🍁</a>
<a href="https://webring.ca/next/your-slug">→</a>
```

### Customization

Style the widget with CSS variables on the container div:

| Variable | Default | Description |
|---|---|---|
| `--webring-size` | `1rem` | Overall widget size |
| `--webring-color` | `inherit` | Arrow and leaf color |
| `--webring-accent` | `#AF272F` | Hover color |

Example:

```html
<div data-webring="ca" data-member="your-slug"
     style="--webring-color: #666; --webring-accent: #e63946;"></div>
<script src="https://webring.ca/embed.js" defer></script>
```

### Framework examples

The script embed works with any framework. Place the snippet in your site's shared layout:

- **Next.js** -- `app/layout.tsx` (in the `<body>`, before the closing tag)
- **Astro** -- `src/layouts/Layout.astro` (in the `<body>`)
- **SvelteKit** -- `src/app.html` (in the `<body>`)
- **Hugo** -- `layouts/partials/footer.html`
- **Jekyll** -- `_includes/footer.html`

## API

`GET /api/members` — returns the active member list as JSON.

## Development

```bash
npm install
npm run dev        # starts wrangler dev server at localhost:8787
```

## Seed data

After creating a KV namespace, seed it with the member list:

```bash
npm run seed       # prints wrangler commands to run
```

The seed step now uses committed repo data only. Every member must already have resolvable coordinates from either:
- explicit `lat`/`lng` in the member's JSON file, or
- a city covered by the committed city map

If a contributor adds a city that is not yet covered, a maintainer can enrich coordinates locally before merge:

```bash
npm run enrich:coords
```

## Deploy

```bash
npm run deploy     # deploys via wrangler
```

## License

MIT
