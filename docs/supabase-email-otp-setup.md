# Supabase Email OTP Setup

Picksy now uses email verification codes for sign-in and sign-up.

## 1. Confirm the project URL

- Project URL: `https://wcznyvpyhlgextidzrry.supabase.co`

## 2. Keep Email auth enabled

In Supabase:

1. Open `Authentication`.
2. Open `Providers`.
3. Make sure `Email` is enabled.

## 3. Send a code instead of a magic link

To make the app's code input work, the email template needs to include the OTP token instead of only a magic link.

In Supabase:

1. Open `Authentication`.
2. Open `Email Templates`.
3. Update the sign-in / magic link template so it uses the token placeholder.

Official docs:

- [Supabase email OTP guide](https://supabase.com/docs/guides/auth/auth-email-passwordless?language=js&queryGroups=language)
- [Supabase JavaScript `signInWithOtp`](https://supabase.com/docs/reference/javascript/auth-signinwithotp)

## 4. Local env

This project expects:

```bash
VITE_SUPABASE_URL=https://wcznyvpyhlgextidzrry.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## 5. Security note

- Use only the `publishable key` in the frontend.
- Rotate any leaked `secret key` immediately.
