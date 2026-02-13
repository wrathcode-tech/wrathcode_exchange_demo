# Passkey - Digital Asset Links

**File:** `assetlinks.json`  
**URL:** https://demoexchange.wrathcode.com/.well-known/assetlinks.json

## Action Required

Replace the placeholder SHA256 in `assetlinks.json` with your app's real SHA256 fingerprint (from keytool).

**Get SHA256:**
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the value after `SHA256:` (format: `91:F7:CB:F9:D6:81:...`).

Add both debug and release fingerprints if needed.
