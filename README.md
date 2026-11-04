# Presh

**Current version:** `0.2.1`

Viena lapa visam, ko dari. Lietotājs reģistrējas (e-pasts vai Google), paņem savu `presh.me/vards` linku un studijā saliek portfolio: profilu, tagline, saites un tēmu. Ielogotam `/` ved uz studiju vai onboarding; ir kreisā studijas josla un labā admin josla.

Dati un autentifikācija ir **Supabase** (`.env.local`, `npm run db:migrate`). Google OAuth ir pašu (`GOOGLE_CLIENT_*`, ne Supabase Google provider). Pirmais reģistrētais lietotājs kļūst par `is_admin`.

Dokumentācija: [DEVELOPER.md](./DEVELOPER.md) · izmaiņas: [CHANGELOG.md](./CHANGELOG.md).

## Palaišana

```bash
npm install
npm run dev
```

Atver [http://localhost:3130](http://localhost:3130).

## Plūsma

1. Sākumlapā ievadi vēlamo linku.
2. Reģistrējies. Tiek izveidots konts un lapa.
3. Studijā pievieno profilu, sociālos, blokus un tēmu.
4. Publiskā lapa ir `/{links}`. Nepublicēts vai beidzies izmēģinājuma periods — apmeklētāji redz sākumlapu, ne profilu.
5. Gatavs piemērs bez konta: `/paraugs`.

## Datubāze

`app/lib/store.ts` ir UI slānis pret Supabase. Galvenās tabulas: `users`, `pages` (jsonb `content`), `admin_todos`, `user_feedback`, `contact_messages`, `site_*`.

```bash
npm run db:migrate
npm run db:test
```
