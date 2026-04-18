# Manas Menu Data Scraper

A Node.js scraper that collects daily cafeteria and buffet data from [beslenme.manas.edu.kg](https://beslenme.manas.edu.kg), normalizes it, and saves versioned JSON snapshots into this repository.

This project is designed for **static delivery** (for example via Vercel/GitHub Pages/CDN), not as a long-running backend server.

## What this repository provides

- `public/menu.json` — university cafeteria menu (foods, multilingual names, calories, photos, daily menu mapping).
- `public/buffet.json` — kiraathane/buffet menu (categories, items, prices, photos).
- Automated daily updates via GitHub Actions.

## Data sources

- Cafeteria menu page: `https://beslenme.manas.edu.kg/menu`
- Kiraathane page: `https://beslenme.manas.edu.kg/1`

## Project structure

```text
public/
  config.js                   # source URLs + common meta
  index.js                    # entry point; runs JSON generation
  services/saveJsonFiles.js   # writes menu.json and buffet.json
  parsers/menuParser.js       # parser for cafeteria menu
  parsers/kiraathaneParser.js # parser for buffet/kiraathane menu
  utils/generateId.js         # slug/id generation
  utils/translateFood.js      # food and category translations
  menu.json                   # generated output
  buffet.json                 # generated output
.github/workflows/update_menu.yml  # daily automation
```

## Requirements

- Node.js 18+ (Node.js 20 is used in CI)
- npm

## Install

```bash
npm install
```

## Run locally

Generate fresh JSON files:

```bash
npm start
```

Run in watch mode (re-generates when source files change):

```bash
npm run dev
```

After running, check:

- `public/menu.json`
- `public/buffet.json`

## Automation

The workflow `.github/workflows/update_menu.yml` runs:

- **daily at `0 0 * * *` (00:00 UTC)**
- and manually via **workflow_dispatch**

Pipeline steps:

1. Install dependencies.
2. Run parser (`node public/index.js`).
3. Commit and push `public/menu.json` and `public/buffet.json` if they changed.

## Output format (high level)

### `menu.json`

```json
{
  "foods": [
    {
        "id": "...",
      "name": { "tr": "...", "ru": "...", "en": "..." },
      "calories": 0,
      "thumbUrl": "...",
      "fullPhotoUrl": "..."
    }
  ],
  "menus": [
   { "date": "YYYY-MM-DD", "items": ["food_id_1", "food_id_2"] }
  ],
  "meta": {
    "timezone": "Asia/Bishkek",
    "source": "manas_kantin",
    "lastUpdated": "2025-02-10T12:00:00.000Z"
  }
}
```

### `buffet.json`

```json
{
  "categories": [
    {
       "id": "...",
      "title": "...",
      "items": [
         { "id": "...", "name": "...", "price": 0, "photoUrl": "..." }
      ]
    }
  ],
  "meta": {
    "timezone": "Asia/Bishkek",
    "currency": "KGS",
    "lastUpdated": "2025-02-10T12:00:00.000Z"
  }
}
```

## Notes

- Food/category text is parsed from source HTML and partially translated in `public/utils/translateFood.js`.
- Photos are resolved using CDN manifests (`public/manifest.json` and `public/buffet_manifest.json`) with fallback to source image URLs.
- If the source website structure changes, parser selectors may need updates.

## License

No license file is currently defined in this repository.
