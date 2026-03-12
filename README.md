# Picksy MVP

Picksy is a fast pick-and-compare web app with:

- one-tap choice cards
- instant crowd comparison
- streak and Sparks rewards
- live reaction comments by room
- Korean and English i18n with browser auto-detect
- email OTP sign-in/sign-up with nickname onboarding
- 100 Korean and 100 English random nickname combinations
- optional Supabase connection through env vars
- 30 localized battle cards ready for seed data

## Run

```bash
npm install
npm run dev
```

## Optional DB

Create a `.env` file from `.env.example` and add:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Without those values the app keeps auth and remote content features inactive.

## Supabase

1. Run the table setup SQL in [schema.sql](C:/Users/junsu/Desktop/appT/mind-check-lab/supabase/schema.sql)
2. Run [community-schema.sql](C:/Users/junsu/Desktop/appT/mind-check-lab/supabase/community-schema.sql) for community tables and profile helpers
3. In Supabase Auth set `Site URL` and `Redirect URLs` to your app domain or local dev URL
4. Keep `Email` auth enabled and follow [supabase-email-otp-setup.md](C:/Users/junsu/Desktop/appT/mind-check-lab/docs/supabase-email-otp-setup.md) so the app can send verification codes
5. Generate the localized seed SQL:

```bash
npm run db:seed
```

6. Paste the generated [seed.sql](C:/Users/junsu/Desktop/appT/mind-check-lab/supabase/seed.sql) into the Supabase SQL editor

The generated payload includes:

- cards
- leaderboard
- rewards
- comments
