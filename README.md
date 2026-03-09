# Wind & Co. — Closet App

A mobile wardrobe management app built with **React Native** and **Expo SDK 54**. Organize your closet, build outfits, and share your style — all from your phone.

## 📱 Screens

| Screen             | Description                                   |
| ------------------ | --------------------------------------------- |
| **Dashboard**      | Home screen with an overview of your wardrobe |
| **Closet**         | Browse and manage your clothing items         |
| **Outfit Builder** | Mix and match pieces to create outfits        |
| **Social Log**     | Share and log your outfit of the day          |
| **Archive**        | View your past outfits and history            |

## 🛠 Tech Stack

- **Framework:** React Native 0.81.5
- **Platform:** Expo SDK 54 (Managed Workflow)
- **Language:** TypeScript
- **Navigation:** React Navigation (Bottom Tabs + Stack)
- **State:** React Native Async Storage
- **Animations:** React Native Reanimated

## 📋 Prerequisites

- **Node.js** — v18 or later ([download](https://nodejs.org/))
- **npm** — comes with Node.js
- **Expo Go** — install from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

> **Important:** Make sure your Expo Go app version supports **SDK 54**. Update it from the App Store / Google Play if needed.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Arushx/Wind-Co-Closet-App.git
cd Wind-Co-Closet-App
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npx expo start
```

This will display a **QR code** in your terminal.

### 4. Open on Your Phone

1. Open the **Expo Go** app on your phone
2. Scan the **QR code** shown in the terminal
3. Make sure your phone and computer are on the **same Wi-Fi network**

> **Tip:** If you're on a different network, use tunnel mode instead:
>
> ```bash
> npx expo start --tunnel
> ```
>
> This will prompt you to install `@expo/ngrok` on first use — just press `Y` to accept.

## 📂 Project Structure

```
Wind-Co-Closet-App/
├── App.tsx                  # Root component
├── index.ts                 # Entry point
├── app.json                 # Expo configuration
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
├── assets/                  # Icons, splash screens, images
└── src/
    ├── theme.ts             # App-wide design tokens & styles
    ├── navigation/
    │   └── AppNavigator.tsx # Tab & stack navigation setup
    └── screens/
        ├── DashboardScreen.tsx
        ├── ClosetScreen.tsx
        ├── OutfitBuilderScreen.tsx
        ├── SocialLogScreen.tsx
        └── ArchiveScreen.tsx
```

## 📜 Available Scripts

| Command                    | Description                               |
| -------------------------- | ----------------------------------------- |
| `npx expo start`           | Start the dev server (LAN mode)           |
| `npx expo start --tunnel`  | Start with tunnel (works across networks) |
| `npx expo start --web`     | Open the app in a web browser             |
| `npx expo start --ios`     | Open in iOS Simulator                     |
| `npx expo start --android` | Open in Android Emulator                  |

## 🔧 Troubleshooting

### "Project is incompatible with this version of Expo Go"

Your Expo Go app is outdated. Update it from the App Store or Google Play.

### QR code won't connect

- Ensure your phone and computer are on the **same Wi-Fi network**
- Try using `npx expo start --tunnel` instead

### Package version warnings

Run the following to auto-fix any version mismatches:

```bash
npx expo install --fix
```

### Clean reinstall

If things are broken, do a fresh install:

```bash
rm -rf node_modules
npm install
```

## 📄 License

Private project — all rights reserved.
