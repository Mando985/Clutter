# Clutter

Clutter is a mobile app for decluttering your photo library. Instead of permanently deleting photos and videos right away, you mark them for deletion into a Clutter bin, review them later, and only then decide whether to restore them or delete them from your device for good.

Built with [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/), Expo Router, and NativeWind.

## Features

- **Albums tab** — browses your device's photo albums (including smart albums) and shows how many assets are selected for clutter in each one.
- **Culling** — open an album, tap any photo or video, and swipe through them with Back/Next. Deleting one marks it only — it is moved into the Clutter bin and covered with a red overlay in the grid, not removed from your device.
- **Recycle Bin tab** — shows every asset you've marked so far. Restore any of them back to their album, or hit Delete to permanently wipe all cluttered assets from your device.
- **Local-first** — Clutter state is stored in a local SQLite database (`clutter.db`); no accounts, no cloud sync.
- Photos and videos are both supported (video via `expo-video`), with lazy-loading grids and a shared action skeleton UI.

## Tech stack

- [Expo](https://expo.dev) SDK 54 + [Expo Router](https://docs.expo.dev/router/introduction) (file-based routing, typed routes)
- React Native 0.81, React 19, new architecture enabled
- [expo-media-library](https://docs.expo.dev/versions/v54.0.0/sdk/media-library) for album/asset access
- [expo-sqlite](https://docs.expo.dev/versions/v54.0.0/sdk/sqlite) for the Clutter bin
- [expo-image](https://docs.expo.dev/versions/v54.0.0/sdk/image) and [expo-video](https://docs.expo.dev/versions/v54.0.0/sdk/video) for media rendering
- [NativeWind](https://www.nativewind.dev) v5 + Tailwind CSS v4 for styling
- [expo-dev-client](https://docs.expo.dev/develop/development-builds/introduction) for development builds

## Project structure

```
app/
  _layout.tsx              # Root layout: SQLite provider + stack navigator
  (tabs)/
    index.tsx              # Albums tab (asks for media permissions)
    RecycleBin.tsx         # Recycle Bin tab
    _layout.tsx            # Bottom tab navigator
  (components)/
    Albums.tsx             # Album list with per-album clutter counts
    ActionSkeleton.tsx     # Skeleton UI shown while media is loading
  album_grid/[id].tsx      # 4-column grid of an album's photo/video thumbnails
  delete_action/[id].tsx   # Swipe-through viewer: mark asset for deletion
  restore_action/[id].tsx  # Viewer for binned assets: restore or keep
```

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the dev server

   ```bash
   npx expo start
   ```

3. Open the app in a development build, an emulator, or Expo Go. Android media-library permissions are configured in `app.json` (photos, videos, and selected audio).

## Running builds

EAS Build profiles are defined in `eas.json` (`development`, `preview`, and `production`). `app.json` is configured to build only the `arm64-v8a` Android architecture for faster local builds:

```bash
eas build --profile development --platform android
```

## Notes

- Deletion is two-step by design: the Delete button in a culling session only inserts a row into SQLite. Nothing is removed from the device until you confirm a full wipe from the Recycle Bin.
- Requires the Android app id `com.tokonsoftware.Clutter` to match your app.json if you change anything.