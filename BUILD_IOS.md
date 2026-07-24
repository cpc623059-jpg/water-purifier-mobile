# iOS Build Notes

This project already contains an iOS workspace at `ios/App/App.xcworkspace`.

## Commands

On any machine:

```bash
npm install
npm run ios:sync
```

On macOS with Xcode, CocoaPods, and xcodegen installed:

```bash
npm run ios:archive:unsigned
```

That command produces:

- `build/ios/App-unsigned.xcarchive`
- `build/ios/PureWater-unsigned.ipa`

This path is useful when you want to re-sign the IPA yourself later.

## Signed build

1. Open `ios/App/App.xcworkspace` in Xcode.
2. Set the correct `Team`, bundle signing, and provisioning profile for target `App`.
3. Archive from CLI:

```bash
npm run ios:archive:signed
```

4. Edit `scripts/ExportOptions.development.plist`:

- Replace `YOUR_TEAM_ID`
- Replace `YOUR_DEVELOPMENT_PROFILE_NAME`

5. Export a development IPA:

```bash
npm run ios:export:development
```

If you want custom output paths, pass them after `--`:

```bash
npm run ios:archive:unsigned -- /tmp/App-unsigned.xcarchive /tmp/PureWater-unsigned.ipa
npm run ios:archive:signed -- /tmp/App-signed.xcarchive
npm run ios:export:development -- /tmp/App-signed.xcarchive /tmp/dev-export ./scripts/ExportOptions.development.plist
```

## Required tools on macOS

```bash
brew install xcodegen cocoapods
```

Xcode must also be installed and opened at least once so its command line tools are ready.
