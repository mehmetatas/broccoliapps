# Authentication Flow

broccoliapps.com serves as the central authentication provider. Individual web apps delegate sign-in to broccoliapps.com and receive back an auth code which they exchange for JWT tokens in their own backend.

## Sign-in Methods

Three sign-in methods are supported: **Apple**, **Google**, and **Email**.

Apple and Google use OAuth via AWS Cognito with PKCE. Email uses a magic link flow with S2S (server-to-server) authentication.

All three methods converge at the same point: broccoliapps.com creates a short-lived **auth code** and redirects back to the app, which exchanges the code for access and refresh tokens.

---

## Sequence Diagrams

### Apple & Google OAuth

```
Browser               broccoliapps.com           Cognito              App Backend
  │                        │                       │                       │
  │── /auth?app&provider ─>│                       │                       │
  │                        │                       │                       │
  │   generate PKCE verifier + challenge           │                       │
  │   set cookies (verifier, app, platform)        │                       │
  │                        │                       │                       │
  │── redirect ───────────────────────────────────>│                       │
  │                        │   /oauth2/authorize   │                       │
  │                        │   + code_challenge    │                       │
  │                        │                       │                       │
  │          user signs in with Apple/Google       │                       │
  │                        │                       │                       │
  │<───────── redirect + cognitoCode ──────────────│                       │
  │                        │                       │                       │
  │── /auth/callback ─────>│                       │                       │
  │   (cognitoCode)        │                       │                       │
  │                        │── exchange code ─────>│                       │
  │                        │   + PKCE verifier     │                       │
  │                        │<── ID token ──────────│                       │
  │                        │                       │                       │
  │                        │   decode JWT                                  │
  │                        │   get/create user                             │
  │                        │   create authCode (1 min TTL)                 │
  │                        │   clear cookies                               │
  │                        │                       │                       │
  │<── redirect ───────────│                       │                       │
  │    /app/auth/callback?code={authCode}          │                       │
  │                        │                       │                       │
  │── /app/auth/callback ─────────────────────────────────────────────────>│
  │                        │                       │                       │
  │                        │<────── POST /api/v1/auth/verify ──────────────│
  │                        │        { app, code: RSA(authCode) }           │
  │                        │                       │                       │
  │                        │─────── { user } ─────────────────────────────>│
  │                        │                       │                       │
  │                        │                       │create JWT access token│
  │                        │                       │ create refresh token  │
  │                        │                       │                       │
  │<──────────── { accessToken, refreshToken, user } ──────────────────────│
  │                        │                       │                       │
```

### Email Magic Link

```
Browser              App Backend            broccoliapps.com                   Email
  │                       │                              │                       │
  │── enter email ───────>│                              │                       │
  │                       │                              │                       │
  │                       │── POST /api/v1/auth/email ──>│                       │
  │                       │   { app, email,              │                       │
  │                       │     code: RSA(email) }       │                       │
  │                       │                              │                       │
  │                       │                              │ decrypt & verify S2S  │
  │                       │                              │ check rate limit      │
  │                       │                              │ generate 64-char token|
  │                       │                              │ store (15 min TTL)    │
  │                       │                              │                       │
  │                       │                              │── send magic link ───>│
  │                       │<───── { success: true } ─────│                       │
  │<── "check email" ─────│                              │                       │
  │                       │                              │                       │
  │   · · · user opens email · · ·                       │                       │
  │                       │                              │                       │
  │── click magic link ─────────────────────────────────>│                       │
  │   /auth/email-callback?token={token}                 │                       │
  │                       │                              │                       │
  │                       │                              │ look up token         │
  │                       │                              │ validate not expired  │
  │                       │                              │ delete token          │
  │                       │                              │ derive name           │
  │                       │                              │ get/create user       │
  │                       │                              │ create authCode       │
  │                       │                              │                       │
  │<── redirect ─────────────────────────────────────────│                       │
  │    /app/auth/callback?code={authCode}                │                       │
  │                       │                              │                       │
  │─ /app/auth/callback ─>│                              │                       │
  │                       │─ POST /api/v1/auth/verify ──>│                       │
  │                       │ { app, code: RSA(authCode) } │                       │
  │                       │<──────── { user } ───────────│                       │
  │                       │                              │                       │
  │                       │   create JWT access token    │                       │
  │                       │   create refresh token       │                       │
  │                       │.                             │                       │
  │<────── { accessToken, refreshToken, user } ──────────│                       │
  │                       │                              │                       │
```

### Token Refresh

```
Client                App Backend              DynamoDB
  │                       │                       │
  │─ POST /auth/refresh ─>│                       │
  │   { refreshToken }    │                       │
  │                       │─ get(sha256(token)) ─>│
  │                       │<─── token record ─────│
  │                       │                       │
  │                       │ validate not expired  │
  │                       │ reload user data      │
  │                       │                       │
  │                       │ if <20% lifetime left │
  │                       │── delete old hash ───>│
  │                       │── put new hash ──────>│
  │                       │                       │
  │                       │   sign new JWT        │
  │                       │                       │
  │<── { accessToken,     │                       │
  │      refreshToken } ──│                       │
  │                       │                       │
```

---

## 1. Apple & Google OAuth (PKCE via Cognito)

### Flow

1. A web app redirects the user to `broccoliapps.com/auth?app={appId}&provider={provider}`.
2. The auth page generates a PKCE challenge:
   - 32 random bytes (256 bits), base64url-encoded as the **code verifier**
   - SHA-256 hash of the verifier, base64url-encoded as the **code challenge**
3. The code verifier and app ID are stored in secure, httpOnly cookies (5-minute TTL, `SameSite=lax`).
4. The browser redirects to Cognito's `/oauth2/authorize` endpoint with the code challenge (`S256` method), requesting `email openid profile` scopes.
5. The user signs in with Apple or Google through Cognito's hosted UI.
6. Cognito redirects back to `broccoliapps.com/auth/callback?code={cognitoCode}`.
7. The callback handler:
   - Reads the PKCE code verifier from the cookie
   - Exchanges the Cognito authorization code + code verifier for a Cognito ID token
   - Decodes the JWT payload to extract: email, name, provider, and Cognito sub
   - Looks up or creates the user in the central `users` table
   - Creates an **auth code** (1-minute TTL) in the `authCodes` table
   - Clears auth cookies
   - Redirects to the app: `{appBaseUrl}/app/auth/callback?code={authCode}`

---

## 2. Email Magic Link

### Flow

1. A web app's backend sends a POST to `broccoliapps.com/api/v1/auth/email` with:
   - `app` — the app identifier
   - `email` — the user's email address
   - `code` — the email RSA-encrypted with the app's private key (S2S auth)
   - `platform` — optional, `"mobile"` for deep link redirects
2. broccoliapps.com verifies the S2S signature:
   - Decrypts `code` using the app's public key
   - Confirms the decrypted value matches the submitted `email`
3. Rate limiting is enforced: **5 emails per hour per email address**.
4. A 64-character random token is generated and stored in the `magicLinkTokens` table with a **15-minute TTL**.
5. An email containing a magic link (`broccoliapps.com/auth/email-callback?token={token}`) is sent to the user.
6. When the user clicks the link, the callback handler:
   - Looks up the token in DynamoDB
   - Validates it hasn't expired
   - Deletes the token (single-use)
   - Derives a display name from the email (e.g. `john.doe@gmail.com` -> "John Doe")
   - Looks up or creates the user in the central `users` table
   - Creates an **auth code** (1-minute TTL) in the `authCodes` table
   - Redirects to the app: `{appBaseUrl}/app/auth/callback?code={authCode}`

---

## 3. Auth Code Exchange

All three sign-in flows produce the same artifact: a short-lived auth code stored in the `authCodes` table. The app must exchange this code for tokens before it expires.

### Auth Code Structure

| Field       | Description                           |
| ----------- | ------------------------------------- |
| `code`      | Random token (partition key)          |
| `app`       | Which app initiated the auth          |
| `email`     | User's email address                  |
| `name`      | User's display name                   |
| `userId`    | Central user ID                       |
| `provider`  | `"google"`, `"apple"`, or `"email"`   |
| `expiresAt` | Expiration timestamp (ms)             |
| `ttl`       | DynamoDB TTL (seconds) — **1 minute** |

### Exchange Flow

1. The app's backend receives the auth code from the callback redirect.
2. It RSA-encrypts the auth code with its private key.
3. It POSTs to `broccoliapps.com/api/v1/auth/verify` with `{ app, code: encrypted }`.
4. broccoliapps.com decrypts the code using the app's public key, looks it up, validates it hasn't expired and belongs to the requesting app, then deletes it (single-use).
5. broccoliapps.com returns the user data: `{ userId, email, name, provider }`.
6. The app's backend generates its own JWT access token and refresh token (see next section) and returns them to the client.

---

## 4. Token Lifecycle

After a successful auth code exchange, the app backend creates two tokens.

### Access Token

- **Format:** RS256-signed JWT
- **Lifetime:** 1 day (production) / 5 minutes (development)
- **Payload:** `{ sub, data: { userId, email, name, provider }, iss, exp }`
- **Storage:** Client-side only (memory / cookie); not persisted server-side
- **Verification:** Checked on each API request using the app's RSA public key

### Refresh Token

- **Format:** 128-character random string
- **Lifetime:** 1 year (production) / 1 hour (development)
- **Storage:** SHA-256 hashed, stored in DynamoDB `tokens` table (hash is the partition key)
- **Lookup:** Client sends the plaintext token; server hashes it to find the record

### Token Refresh

When the access token expires, the client sends the refresh token to the app's `/auth/refresh` endpoint:

1. Server SHA-256 hashes the refresh token and looks it up in the `tokens` table.
2. Validates the token exists and hasn't expired.
3. Reloads user data from the app's data layer.
4. **Rotation check:** If the refresh token has used 80% of its total lifetime, a new refresh token is generated and the old one is deleted.
5. A new access token is always generated.
6. Both tokens are returned to the client.

### Response Shape

```
{
  accessToken: string
  accessTokenExpiresAt: number    // ms since epoch
  refreshToken: string            // may be rotated
  refreshTokenExpiresAt: number   // ms since epoch
  user: { userId, email, name, provider }
}
```

---

## 5. Security Mechanisms

### PKCE (Proof Key for Code Exchange)

Prevents authorization code interception during the OAuth redirect. A 256-bit random verifier is generated client-side, and only its SHA-256 hash is sent to Cognito. The plaintext verifier is stored in a secure httpOnly cookie and sent server-side when exchanging the code.

### S2S RSA Authentication

App-to-platform requests (magic link send, auth code verify) are authenticated using RSA encryption. The app encrypts a known value with its private key; broccoliapps.com decrypts it with the app's public key. This proves request origin without shared secrets. A SHA-256 hash of the request body is included in the `x-amz-content-sha256` header for additional integrity verification.

### Single-Use Tokens

Auth codes, magic link tokens, and (on rotation) refresh tokens are deleted immediately after use, preventing replay attacks.

### TTLs

| Token            | TTL           |
| ---------------- | ------------- |
| PKCE cookies     | 5 minutes     |
| Auth code        | 1 minute      |
| Magic link token | 15 minutes    |
| Access token     | 1 day (prod)  |
| Refresh token    | 1 year (prod) |

All DynamoDB records include a `ttl` field for automatic expiration cleanup.

### Rate Limiting

Magic link emails are rate-limited to **5 per hour per email address** to prevent abuse.

### Refresh Token Rotation

Refresh tokens are automatically rotated when they've consumed 80% of their total lifetime. The old token is deleted and a new one is issued, limiting the window of exposure if a token is compromised.

### Secure Cookies

Auth-related cookies use `httpOnly`, `Secure`, and `SameSite=lax` flags with short max-age values (5 minutes).

---

## 6. Mobile App Sign-In

The Tasquito mobile app supports all three sign-in methods. The reusable `Login` component lives in `framework/mobile` and each app wraps it in a screen that connects to its own `AuthContext`.

### Overview

| Method | iOS                    | Android                     |
| ------ | ---------------------- | --------------------------- |
| Google | InAppBrowser OAuth     | InAppBrowser OAuth          |
| Apple  | Native `appleAuth`     | InAppBrowser OAuth fallback |
| Email  | Magic link → deep link | Magic link → deep link      |

All three methods ultimately produce the same `AuthExchangeResponse` containing `accessToken`, `refreshToken`, and their expiration timestamps.

### Google Sign-In Flow

1. User taps "Continue with Google".
2. `Login` opens an InAppBrowser to `{broccoliappsBaseUrl}/auth?app={appId}&provider=google&platform=mobile`.
3. The redirect URI is `{mobileScheme}://auth/callback` (e.g. `tasquito://auth/callback`).
4. The standard OAuth flow runs in the browser (PKCE via Cognito, same as web).
5. broccoliapps.com redirects back with `?code={authCode}`.
6. InAppBrowser intercepts the custom-scheme redirect and returns the URL.
7. `parseCodeFromUrl` extracts the `code` query parameter.
8. The app calls `POST /auth/exchange` with `{ code }` to get tokens.
9. `onLoginSuccess` receives the tokens and passes them to `AuthContext.login()`.

```
Mobile App           InAppBrowser         broccoliapps.com            Cognito
  │                       │                       │                      │
  │── open InAppBrowser ─>│                       │                      │
  │                       │─ /auth?app&provider ─>│                      │
  │                       │                       │- /oauth2/authorize ->│
  │                       │                       │   (PKCE)             │
  │                       │     user signs in with Google                │
  │                       │<──── redirect + cognitoCode ──────────────── │
  │                       │── /auth/callback ────>│                     │
  │                       │                       │ exchange + verify    │
  │                       │                       │ create authCode      │
  │                       │<── tasquito://auth/callback?code={code} ─────│
  │<── url result ────────│                       │                      │
  │                                                                      │
  │── POST /auth/exchange { code } ─────────────────────────────────────>│
  │<── { accessToken, refreshToken, ... } ───────────────────────────────│
```

### Apple Sign-In Flow

**iOS (native):**

1. User taps "Continue with Apple".
2. `appleAuth.performRequest()` presents the native Apple Sign-In sheet, requesting `EMAIL` and `FULL_NAME` scopes.
3. After the user authenticates, `getCredentialStateForUser` confirms the state is `AUTHORIZED`.
4. The app sends the `identityToken`, `authorizationCode`, `user` ID, and optional `fullName` to `POST /auth/verify-apple`.
5. The backend verifies the Apple identity token and returns `AuthExchangeResponse`.

```
Mobile App              iOS Native             App Backend
  │                       │                       │
  │── performRequest() ──>│                       │
  │  (LOGIN, EMAIL, NAME) │                       │
  │                       │                       │
  │   user authenticates via Face ID / password   │
  │                       │                       │
  │<── identityToken,     │                       │
  │    authorizationCode, │                       │
  │    user, fullName ────│                       │
  │                                               │
  │── POST /auth/verify-apple ───────────────────>│
  │   { identityToken, authorizationCode,         │
  │     user, fullName }                          │
  │<── { accessToken, refreshToken, ... } ────────│
```

**Android (fallback):**

Uses the same InAppBrowser OAuth flow as Google, but with `provider=apple`. The sequence is identical to the Google flow above.

### Email Magic Link Flow

1. User enters email and taps "Continue with Email".
2. The app calls `POST /auth/send-magic-link` with `{ email, platform: "mobile" }`.
3. broccoliapps.com sends an email containing a magic link to `https://www.broccoliapps.com/auth/email-callback?token={token}`.
4. The UI shows a "Check your email" confirmation screen.
5. When the user taps the link in their email, the browser opens broccoliapps.com.
6. broccoliapps.com validates the token, creates an auth code, and redirects to `tasquito://auth/callback?code={authCode}`.
7. The OS opens the app via the deep link.
8. `AuthContext` handles the deep link (see Deep Link Handling below), extracts the `code`, and calls `POST /auth/exchange`.

```
Mobile App            App Backend          broccoliapps.com        Email
  │                       │                       │                   │
  │── POST /auth/send-magic-link ────────────────>│                   │
  │   { email, platform: "mobile" }               │                   │
  │                       │                       │── send email ────>│
  │<── { success: true } ─────────────────────────│                   │
  │                                                                   │
  │  show "Check your email" screen                                   │
  │                                                                   │
  │   · · · user taps link in email · · ·                             │
  │                                                                   │
  │                Browser ──────────────────────>│                   │
  │                  /auth/email-callback?token=  │                   │
  │                                               │ validate token    │
  │                                               │ create authCode   │
  │<── redirect: tasquito://auth/callback?code={code} ────────────────│
  │                                                                   │
  │── POST /auth/exchange { code } ──────────────────────────────────>│
  │<── { accessToken, refreshToken, ... } ────────────────────────────│
```

### Token Management

**AuthContext lifecycle (`tasquito/mobile/src/auth/AuthContext.tsx`):**

1. **On mount:** reads stored tokens from Keychain. If the refresh token is still valid (not expired), sets `isAuthenticated = true`. Otherwise clears storage.
2. **`login(tokens)`:** saves tokens to Keychain and updates state.
3. **`logout()`:** clears Keychain storage and resets state.
4. **`getAccessToken()`:** returns the current access token if it expires more than 5 minutes from now. Otherwise attempts a refresh via `POST /auth/refresh`. If refresh fails, clears tokens and returns `undefined`.

**Auto-refresh buffer:** `TOKEN_BUFFER_MS = 5 * 60 * 1000` (5 minutes). The access token is proactively refreshed before it actually expires to prevent requests from failing.

**Keychain storage (`tasquito/mobile/src/auth/storage.ts`):**

Tokens are stored in the iOS Keychain / Android Keystore via `react-native-keychain` under the service `com.broccoliapps.tasquito`. The stored shape:

```typescript
type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // ms since epoch
  refreshTokenExpiresAt: number; // ms since epoch
};
```

### Deep Link Handling

The `AuthContext` registers deep link listeners for `tasquito://auth/callback` to handle the email magic link callback.

**Cold start** (app not running when link tapped):

- `Linking.getInitialURL()` is called on mount to check if the app was opened via a deep link.

**Warm start** (app in background when link tapped):

- `Linking.addEventListener('url', ...)` fires when a deep link arrives while the app is running.

Both paths call the same `handleDeepLink` function which:

1. Checks the URL contains `auth/callback`.
2. Extracts the `code` query parameter.
3. Sets `isExchangingToken = true` (shows loading state).
4. Calls `POST /auth/exchange` with the code.
5. On success, stores the tokens via `login()`.

URL scheme: `tasquito://auth/callback?code={authCode}`

### API Contracts

All contracts are defined in `framework/shared/src/auth.ts` with DTOs in `framework/shared/src/auth.dto.ts` (validated with `valibot`).

| Endpoint                | Method | Request                                                 | Response                                                                           |
| ----------------------- | ------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/auth/exchange`        | POST   | `{ code: string }`                                      | `{ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user }` |
| `/auth/verify-apple`    | POST   | `{ identityToken, authorizationCode, user, fullName? }` | Same as `/auth/exchange`                                                           |
| `/auth/send-magic-link` | POST   | `{ email: string, platform?: "mobile" }`                | `{ success: boolean }`                                                             |
| `/auth/refresh`         | POST   | `{ refreshToken: string }`                              | `{ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt }`       |

`user` object shape: `{ id, email, name, isNewUser }`

### Key Files

| File                                          | Purpose                                                             |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `framework/mobile/src/Login.tsx`              | Reusable login component with all three sign-in methods             |
| `framework/mobile/src/types.ts`               | `LoginProps` type definition                                        |
| `framework/mobile/src/theme.ts`               | Login screen theming                                                |
| `tasquito/mobile/src/screens/LoginScreen.tsx` | Tasquito-specific screen wrapper, connects `Login` to `AuthContext` |
| `tasquito/mobile/src/auth/AuthContext.tsx`    | Auth state management, token refresh, deep link handling            |
| `tasquito/mobile/src/auth/storage.ts`         | Keychain token storage (`react-native-keychain`)                    |
| `tasquito/mobile/src/config.ts`               | API base URL (`https://www.tasquito.com`)                           |
| `framework/shared/src/auth.ts`                | API contract definitions                                            |
| `framework/shared/src/auth.dto.ts`            | Request/response DTOs with valibot validation                       |
| `framework/shared/src/global-config.ts`       | App base URLs and `mobileScheme` configuration                      |
