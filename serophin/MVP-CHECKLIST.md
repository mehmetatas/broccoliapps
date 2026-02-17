# Serophin MVP — What's Left For You

This document lists everything the developer needs to do manually to complete the Serophin MVP. The codebase is fully implemented with placeholder audio and TODO markers where real values are needed.

---

## 1. Apple Developer Setup

### App Store Connect
- [ ] Create a new app in App Store Connect for Serophin
- [ ] Bundle ID: `com.broccoliapps.serophin.ios`
- [ ] Set up App Store listing (screenshots, description, category: Health & Fitness)

### Sign in with Apple
- [ ] Register a new App ID with "Sign in with Apple" capability in Apple Developer Portal
- [ ] Create a Services ID for web-based Sign in with Apple (identifier: `com.broccoliapps.serophin.web`)
- [ ] Configure the return URL in the Services ID to point to `https://broccoliapps.com/api/auth/apple/callback`
- [ ] Generate a private key for Sign in with Apple and note the Key ID
- [ ] Update the auth configuration in the BroccoliApps backend with the new app's credentials

### In-App Purchase (iOS)
- [ ] Create a non-consumable IAP product in App Store Connect:
  - Product ID: `com.broccoliapps.serophin.course`
  - Price: $9.99 USD (Tier 10)
  - Display Name: "Meditation Course — All 3 Levels"
  - Description: "Unlock 30 guided meditation lessons across 3 levels"
- [ ] Submit the IAP for review (can be done alongside app submission)
- [ ] Implement server-side Apple receipt validation in `serophin/web/src/api/handlers/purchases.ts` (currently trusts receipt — needs App Store Server API verification)

---

## 2. Google Play Setup

### Play Console
- [ ] Create a new app in Google Play Console for Serophin
- [ ] Package name: `com.broccoliapps.serophin.android`
- [ ] Set up store listing (screenshots, description, category: Health & Fitness)

### Sign in with Google
- [ ] Create OAuth 2.0 credentials in Google Cloud Console for the Serophin app
- [ ] Add the Android SHA-1 fingerprint to the OAuth client
- [ ] Configure the web client ID for the mobile app

### In-App Purchase (Android)
- [ ] Create a one-time product in Google Play Console:
  - Product ID: `com.broccoliapps.serophin.course`
  - Price: $9.99 USD
  - Title: "Meditation Course — All 3 Levels"
  - Description: "Unlock 30 guided meditation lessons across 3 levels"
- [ ] Implement server-side Google Play receipt validation in `serophin/web/src/api/handlers/purchases.ts` (currently trusts receipt — needs Google Play Developer API verification)

---

## 3. AWS Infrastructure

### DynamoDB Table
- [ ] The CDK stack will create the DynamoDB table automatically on first deploy
- [ ] Table name: `serophin`
- [ ] Verify the table schema matches: PK=`userId` for both preferences and purchases entities

### SSL Certificate
- [ ] Register the domain `serophin.com` (or your chosen domain)
- [ ] Create an ACM certificate in `us-east-1` for `serophin.com` and `*.serophin.com`
- [ ] Update `SSL_CERT_ARN` in `serophin/web/cdk/stack.ts` with the certificate ARN
- [ ] Update the `DOMAIN` value if using a different domain

### CloudFront
- [ ] After first deploy, note the CloudFront distribution ID
- [ ] Update the `invalidate` script in `serophin/web/package.json` with the distribution ID

### DNS
- [ ] Point `serophin.com` and `www.serophin.com` to the CloudFront distribution
- [ ] Point API subdomain if needed

---

## 4. Audio Content (Replace Placeholders)

All audio files are currently silent 1-second placeholder `.mp4` files located in `serophin/mobile/assets/audio/`.

### Guided Meditation Audio (7 files)
- [ ] `meditation/guided-5min.mp4` — 5-minute guided meditation
- [ ] `meditation/guided-10min.mp4` — 10-minute guided meditation
- [ ] `meditation/guided-15min.mp4` — 15-minute guided meditation
- [ ] `meditation/guided-20min.mp4` — 20-minute guided meditation
- [ ] `meditation/guided-30min.mp4` — 30-minute guided meditation
- [ ] `meditation/guided-45min.mp4` — 45-minute guided meditation
- [ ] `meditation/guided-60min.mp4` — 60-minute guided meditation

### Background Sounds (7 files, loopable)
- [ ] `background/rain.mp4`
- [ ] `background/waves.mp4`
- [ ] `background/forest.mp4`
- [ ] `background/wind.mp4`
- [ ] `background/fire.mp4`
- [ ] `background/birds.mp4`
- [ ] `background/thunder.mp4`

### Sleep Sounds (8 files, loopable)
- [ ] `sleep/rain.mp4`
- [ ] `sleep/waves.mp4`
- [ ] `sleep/forest.mp4`
- [ ] `sleep/wind.mp4`
- [ ] `sleep/fire.mp4`
- [ ] `sleep/whitenoise.mp4`
- [ ] `sleep/brownnoise.mp4`
- [ ] `sleep/pinknoise.mp4`

### Course Lessons (30 files, ~10 min each)
- [ ] `course/level1-lesson1.mp4` through `course/level1-lesson10.mp4` (Foundations)
- [ ] `course/level2-lesson1.mp4` through `course/level2-lesson10.mp4` (Deepening Practice)
- [ ] `course/level3-lesson1.mp4` through `course/level3-lesson10.mp4` (Advanced Awareness)

**Total: 52 audio files to replace**

> Tip: For background/sleep sounds, you can source royalty-free ambient audio from sites like Freesound.org, Pixabay, or commission custom recordings. For guided meditations and course lessons, you'll need a narrator.

---

## 5. React Native Project Setup

### iOS (Xcode)
- [ ] Run `cd serophin/mobile/ios && bundle exec pod install`
- [ ] Open `serophin/mobile/ios/Serophin.xcworkspace` in Xcode
- [ ] Set the Bundle Identifier to `com.broccoliapps.serophin.ios`
- [ ] Configure the app icon using `serophin/logo/logo_1024.png`
- [ ] Add "Sign in with Apple" capability
- [ ] Add "In-App Purchase" capability
- [ ] Configure the development team and provisioning profiles

### Android (Android Studio)
- [ ] Ensure the application ID in `android/app/build.gradle` is `com.broccoliapps.serophin.android`
- [ ] Configure the app icon using `serophin/logo/logo_512.png`
- [ ] Set up the signing config for release builds
- [ ] Add the Google Services JSON file if using Google Sign-In

### react-native-iap Setup
- [ ] Follow `react-native-iap` setup guide for both iOS and Android
- [ ] Test IAP in sandbox/test environment before production
- [ ] Wire up the purchase flow in `CourseScreen.tsx` to call `verifyPurchase` after successful IAP

---

## 6. Environment & Configuration

### BroccoliApps Auth Backend
- [ ] Register "serophin" as a new app in the BroccoliApps auth system (broccoliapps.com backend)
- [ ] The app uses the shared auth system — magic link, Google, and Apple sign-in all flow through broccoliapps.com
- [ ] Ensure the `BA_APP_ID=serophin` environment variable is set correctly

### API Base URL
- [ ] Update the API base URL in the mobile app's configuration to point to `https://serophin.com/api` (production) or `http://localhost:8083/api` (development)

---

## 7. Testing

- [ ] Test magic link login flow end-to-end
- [ ] Test Google Sign-In on both platforms
- [ ] Test Apple Sign-In on iOS
- [ ] Test meditation session (timer, haptics, background sound)
- [ ] Test breathing exercise (animation, phase transitions, haptics)
- [ ] Test sleep sounds (playback, timer, stop)
- [ ] Test IAP purchase flow in sandbox
- [ ] Test course access before and after purchase
- [ ] Test course lesson playback
- [ ] Test settings (theme, sign out)
- [ ] Test the marketing website (landing, terms, privacy pages)

---

## 8. First Deploy

```bash
# 1. Build framework
npm run build:framework

# 2. Build serophin shared
npm run build -w @broccoliapps/serophin-shared

# 3. Deploy web (marketing site + API)
npm run deploy:serophin

# 4. Install mobile on device (DO NOT run these from CI — run manually)
# iOS: npm run ios:install:release -w @broccoliapps/serophin-mobile
# Android: npm run android:install:release -w @broccoliapps/serophin-mobile
```
