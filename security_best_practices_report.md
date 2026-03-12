# Security Best Practices Report

## Executive Summary

Current client code does not show a critical XSS or secret-exposure bug. The biggest risks are operational: adding user login, voting, and comments without strict Supabase RLS, moderation gates, and runtime security headers. To reduce that risk, the project now includes a secure Supabase schema starter in [community-schema.sql](C:/Users/junsu/Desktop/appT/mind-check-lab/supabase/community-schema.sql).

## Medium Severity

### SEC-01: Runtime security headers are not visible in the current app code

- Location: [index.html:4](C:/Users/junsu/Desktop/appT/mind-check-lab/index.html#L4)
- Evidence: the current entry file includes only charset, viewport, and title metadata.
- Impact: once public comments and social login are live, missing CSP and clickjacking protections increase the blast radius of any future frontend injection issue.
- Fix: add CSP, `frame-ancestors`, `Referrer-Policy`, and `X-Content-Type-Options` at the hosting layer or edge. For static hosting, a meta CSP is better than nothing, but response headers are preferred.
- Mitigation: keep using React’s escaped rendering path and avoid any `dangerouslySetInnerHTML` or raw HTML rendering for comments.

### SEC-02: Social auth must use publishable keys only

- Location: [supabase.ts:3](C:/Users/junsu/Desktop/appT/mind-check-lab/src/lib/supabase.ts#L3)
- Evidence: the client initializes Supabase from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Impact: if a service-role or secret key is accidentally placed in a `VITE_*` variable, it will ship to every browser user.
- Fix: use only the Supabase publishable key in the frontend. Keep service-role keys only in server-side environments.
- Mitigation: keep `.env` out of version control and verify key type before sharing values.

## Low Severity

### SEC-03: Browser storage is currently safe only because it holds non-sensitive data

- Location: [App.tsx:54](C:/Users/junsu/Desktop/appT/mind-check-lab/src/App.tsx#L54), [App.tsx:221](C:/Users/junsu/Desktop/appT/mind-check-lab/src/App.tsx#L221), [i18n.ts:18](C:/Users/junsu/Desktop/appT/mind-check-lab/src/i18n.ts#L18)
- Evidence: `localStorage` stores streak/session UI data and language preference.
- Impact: if auth state, admin flags, or sensitive profile data later get added to localStorage, any XSS or shared-device access would expose them.
- Fix: keep localStorage limited to harmless UI preferences only.
- Mitigation: rely on Supabase auth session handling and keep public UI identity to nicknames, not email addresses.

## Positive Controls Already Present

### SEC-04: Read-only app content already uses RLS

- Location: [schema.sql:9](C:/Users/junsu/Desktop/appT/mind-check-lab/supabase/schema.sql#L9)
- Evidence: `public.app_content` has RLS enabled with a public read-only policy.
- Value: this is a safe default for localized seed content because anonymous users can read, but no write policy is exposed.

### SEC-05: Secure starter schema for auth, votes, and comments has been added

- Location: [community-schema.sql](C:/Users/junsu/Desktop/appT/mind-check-lab/supabase/community-schema.sql)
- Evidence: per-user RLS policies, public-visible comment moderation status, and an aggregate vote RPC are defined.
- Value: this avoids exposing raw vote rows publicly and makes one-user-one-vote constraints enforceable in the database.

## Recommended Next Steps

1. Turn on Google and Kakao auth in Supabase and keep frontend on the publishable key only.
2. Apply [community-schema.sql](C:/Users/junsu/Desktop/appT/mind-check-lab/supabase/community-schema.sql) before enabling live votes/comments.
3. Add runtime security headers at the hosting layer before launch.
4. Keep displayed identity anonymous-friendly by using profile nicknames instead of email addresses.
