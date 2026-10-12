# GetGrounded mobile

Expo SDK 57 with **expo-dev-client** (not Expo Go). Native modules: mic, speech recognition, Firebase.

## Hot refresh (Fast Refresh)

Fast Refresh needs **Metro running** and the **dev client** on your phone connected to it.

**Wrong:** Phone open, no Metro → baked bundle; saves do nothing.  
**Right:** Metro on your Mac (`--lan`) → phone loads JS over Wi‑Fi → saves hot-refresh.

### Physical device (recommended)

Phone and Mac on the **same Wi‑Fi**. USB helps the first install.

**1. Env** — copy `.env.example` → `.env` and set your Mac’s LAN IP:

```bash
ipconfig getifaddr en0
# Put that IP in REACT_NATIVE_PACKAGER_HOSTNAME and EXPO_PUBLIC_API_URL
```

**2. Android — accept USB debugging** (if `adb devices` shows `unauthorized`):

Unlock the phone → tap **Allow USB debugging** on the prompt.

**3. Terminal 1 — Metro (leave running):**

```bash
cd mobile
npm start
```

**4. Terminal 2 — install dev client (first time or after native dep changes):**

```bash
cd mobile
npm run android:device   # Android
# npm run ios:device     # iPhone (USB, trusted, Developer Mode on)
```

**Android build needs JDK 17**, not 26. If Gradle fails on `jlink` / `androidJdkImage`:

```bash
brew install openjdk@17
# gradle.properties already pins org.gradle.java.home for Homebrew
```

**5. Reload on device:** shake phone → **Reload**, confirm **Fast Refresh** is on.

If LAN is blocked (guest Wi‑Fi), use tunnel instead: `npx expo start --dev-client --port 8080 --tunnel`

### Simulator fallback

```bash
npm run ios:sim
```

## Env

`RCT_METRO_PORT=8080` must match `package.json`. Restart Metro after any `.env` change.

## Path with spaces

If `expo run:ios` fails on `Personal Projects/` in the path, work from the symlink:

```bash
cd ~/GetGroundedApp/mobile
npm run ios:sim
```
