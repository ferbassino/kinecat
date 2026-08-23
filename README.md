# Kinecat — App móvil (Expo)

Evaluaciones biomecánicas con sensores del teléfono (stability, artrokinemática, salto).

## Requisitos

- Node.js >= 22
- Expo CLI / EAS CLI para builds Android

## Desarrollo

```bash
npm install
cp .env.example .env   # ajustar API_URL
npm start
```

## Tests

```bash
npm test
```

CI: `.github/workflows/test.yml`

## Builds Android

```bash
npm run build:android:apk   # EAS preview (APK)
```

Ver `eas.json` y `app.json`.

## API

Producción: `https://kinapp-api.vercel.app/`

Documentación workspace: [`docs/MOBILE.md`](../docs/MOBILE.md)

## Repo

Remote: `https://github.com/ferbassino/kinecat.git` (crear en GitHub si aún no existe).
