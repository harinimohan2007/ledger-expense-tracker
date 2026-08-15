# Ledger — Personal Expense Tracker

A responsive, progressive web app for managing personal finances. Track cash and bank balances, log income and expenses, transfer money between accounts, monitor budgets, visualize spending patterns, and achieve financial goals.

Built as a student portfolio project — no backend, no build step, just open `index.html` in any modern browser. Or deploy to GitHub Pages for instant global access. Installable on mobile devices as a native-like app.

![Status](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![HTML](https://img.shields.io/badge/HTML-5-orange) ![CSS](https://img.shields.io/badge/CSS-3-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)

---

## Overview

**Ledger** is a personal finance dashboard that helps you understand where your money goes. It's built on a **dual-account model** (cash in hand + bank balance) and a **transaction ledger** where every income entry, expense, and transfer is recorded.

Unlike traditional expense trackers, Ledger understands that moving money between your own accounts (e.g., depositing cash into the bank) is **not** income or an expense. The math is simple and correct:

```
Total Money = Cash + Bank  (never changes from transfers)
```

Everything is stored **locally in your browser** using the browser's localStorage API. No login required. No data leaves your device.

---

## Features

✨ **Core Features:**

- **Dual-account tracking** — see cash in hand, bank balance, and total money at a glance
- **Income, expense, and transfer logging** with categories, accounts, dates, and notes
- **Correct transfer accounting** — moving money between cash and bank never counts as income or an expense, and never changes your total
- **Transaction history** with search, multi-field filters (type, account, category, date range), edit, and delete operations
- **Monthly budgets** per category with progress bars and threshold warnings (80% used / exceeded)
- **Analytics dashboard** — expense-by-category pie chart, cash vs. bank split visualization, 6-month expense trend, income vs. expenses comparison chart
- **Smart spending insights** generated from your own data — no AI API required
- **Financial goals** with savings progress tracking (e.g. "New Laptop — 41.6% funded")
- **Recurring expenses** with due-date tracking on the dashboard
- **Reports** by month, last month, year, or custom date range, with **CSV export** and print-friendly view
- **Guided onboarding** to set opening cash/bank balances without creating fake income
- **Light & dark themes**, saved automatically to your preference
- **Full validation** — no negative/zero amounts, no overspending an account, friendly error messages
- **Toast notifications**, delete confirmations, and empty states throughout
- **Mobile-first responsive layout** with a bottom navigation bar optimized for small screens
- **Progressive Web App (PWA)** — installable on mobile home screen; works offline; sync-free
- **Everything persists in `localStorage`** — survives refreshes and browser restarts
- **Demo data loader** in Settings, so new users and reviewers can explore the app instantly

---

## Technologies Used

- **HTML5** — semantic markup, forms with validation
- **CSS3** — custom properties, CSS Grid, Flexbox, animations, light/dark mode support
- **JavaScript ES6+** — vanilla JS (no frameworks), no build tools, no dependencies
- **[Chart.js](https://www.chartjs.org/)** — interactive data visualization charts (loaded from CDN)
- **localStorage API** — browser-native data persistence
- **Progressive Web App (PWA) APIs** — Web App Manifest, Service Workers
- **Responsive Design** — mobile-first, media queries for tablet and desktop
- **Google Fonts** — Fraunces (display), Inter (body), JetBrains Mono (numeric)

---

## Project Structure

```
expense-tracker/
├── index.html                # Main HTML file (PWA-enabled)
├── manifest.json             # PWA manifest (app info, icons, theme colors)
├── service-worker.js         # Service Worker (offline caching)
├── css/
│   ├── style.css             # Design tokens, layout, forms, buttons, modals
│   ├── dashboard.css         # Passbook cards, charts, tables, budgets, goals
│   └── responsive.css        # Mobile breakpoints, bottom navigation
├── js/
│   ├── storage.js            # localStorage, state model, balance math
│   ├── app.js                # Routing, event wiring, form handlers
│   ├── transactions.js       # Table rendering, search/filter, edit/delete
│   ├── dashboard.js          # Balances, month summary, insights
│   ├── analytics.js          # Chart.js visualizations
│   ├── budgets.js            # Budget CRUD + progress tracking
│   ├── goals.js              # Goals CRUD + progress tracking
│   └── reports.js            # Report generation + CSV export
├── assets/
│   └── icons/                # App icons for PWA (if added)
├── .gitignore                # Git ignore rules
├── LICENSE                   # MIT License
└── README.md                 # This file
```

---

## Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
```

### Open Locally

Simply open `index.html` in your web browser:

```bash
# macOS
open index.html

# Windows (PowerShell)
start index.html

# Linux
xdg-open index.html
```

### Run with a Local Server

For **PWA features** (service workers, manifest) to work correctly, serve the app over HTTP/HTTPS from a local server:

**Option 1: VS Code Live Server**
- Install the "Live Server" extension in VS Code
- Right-click `index.html` → "Open with Live Server"

**Option 2: Python**
```bash
# Python 3
python3 -m http.server 8000

# Then visit: http://localhost:8000
```

**Option 3: Node.js**
```bash
npx serve .
```

### No Dependencies

No npm install required. The app loads Chart.js and Google Fonts from CDNs. Everything else is vanilla JavaScript.

---

## GitHub Pages Deployment

### 1. Create a GitHub Repository

```bash
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select **main** branch and **/root** folder
5. Click **Save**

GitHub will provide your live URL: `https://YOUR_USERNAME.github.io/expense-tracker/`

### 3. Test the Deployment

Visit your GitHub Pages URL in a browser. The app should work exactly as it does locally.

**Note:** All paths in the project are relative (`./css/style.css`, `./js/app.js`, etc.), so the app works correctly under any base path, including GitHub Pages repositories.

---

## Mobile Installation

The app is a **Progressive Web App (PWA)** and can be installed on mobile devices.

### On iOS

1. Open the deployed URL in Safari (not in-app browser)
2. Tap the **Share** button (bottom center)
3. Scroll and tap **Add to Home Screen**
4. Tap **Add**

The app icon will appear on your home screen and will open in fullscreen mode.

### On Android

1. Open the deployed URL in Chrome (or another Chromium browser)
2. Tap the **menu** (three dots) → **Install app** or **Add to Home Screen**
3. Tap **Install**

The app icon will appear on your home screen and will open in fullscreen mode.

### Offline Support

Once installed, the PWA can load and display the dashboard even without an internet connection. Financial data is stored locally and doesn't require cloud synchronization.

---

## Data Storage & Privacy

### How Data is Stored

All financial data (cash balance, bank balance, transactions, budgets, goals) is stored in your browser's **`localStorage`** API. This means:

- ✅ Data never leaves your device
- ✅ No login or authentication required
- ✅ No server, no database, no backend
- ✅ Data persists across browser refreshes and restarts
- ✅ Only you can access it on your device

### Storage Limits

Most modern browsers allow ~5-10MB of localStorage per domain. Ledger's storage is very efficient and can store **thousands of transactions** without hitting this limit.

### Clearing Data

You can manually clear all data using the **Settings** page ("Reset all data" button). Clearing your browser cache will also clear all stored data.

### No Encryption

Ledger does **not** provide encryption or password protection. It relies on your device's OS-level security. If someone has access to your device's browser, they can see your financial data.

⚠️ **Do not use Ledger for sensitive financial data on shared devices.**

---

## Contributing

This is a portfolio project, but contributions are welcome!

If you find a bug or want to suggest a feature:

1. Open a GitHub issue with a clear description
2. Fork the repository
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please keep changes aligned with the project's philosophy:
- Vanilla JavaScript (no frameworks)
- Client-side only (no backend)
- Simple, beginner-friendly code
- Preserve existing features

---

## How the Math Works

Ledger keeps your accounts balanced correctly by treating transfers specially.

**Transaction Formula:**

For any account (cash or bank), the balance is calculated as:

```
Account Balance = Opening Balance
                + Income into this account
                − Expenses from this account
                − Transfers out of this account
                + Transfers into this account
```

**Why Transfers Don't Affect Total:**

A transfer moves money from one account to another. If you transfer ₹100 from Cash to Bank:

```
Cash:   -₹100 (transfer out)
Bank:   +₹100 (transfer in)
Total:  0     (no change)
```

This is mathematically correct. Transfers are **not** income or expenses.

---

## Troubleshooting

### Data Disappeared After Browser Update

If you cleared your browser cache or used an incognito/private window, localStorage data is deleted. This is expected behavior.

**Tip:** Consider exporting your data as CSV (Reports → Export CSV) periodically as a backup.

### Service Worker Causing Issues

If the app behaves unexpectedly:

1. Open DevTools (F12)
2. Go to **Application** → **Service Workers**
3. Click **Unregister** on any registered workers
4. Refresh the page (Ctrl+Shift+R / Cmd+Shift+R)

### Fonts Not Loading

If fonts don't load, check your internet connection. Fonts are loaded from Google Fonts CDN.

### Charts Not Showing

Ensure Chart.js is loading from the CDN. Open DevTools (F12) and check for errors in the **Console** tab.

---

## Future Improvements

Potential features for future versions (not implemented yet):

- **Cloud Backup** — optional encrypted backup to cloud storage (Dropbox, Google Drive)
- **User Accounts** — login and sync data across devices
- **Multi-Currency Support** — track expenses in multiple currencies
- **Advanced Insights** — AI-powered spending patterns and recommendations
- **Receipt Scanning** — OCR to extract transaction details from photos
- **Bill Reminders** — notifications for recurring expenses
- **Family Sharing** — shared budget for household management
- **Custom Categories** — create custom expense categories
- **Recurring Income** — track salary and other recurring income
- **Export Formats** — PDF reports, Excel integration

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this code for personal, educational, or commercial purposes.

---

## Support

Have questions or found a bug? Please open an issue on GitHub or contact the maintainers.

---

## Credits

Built with ❤️ as a personal finance learning project.

- **Chart.js** — https://www.chartjs.org/
- **Google Fonts** — https://fonts.google.com/
- **MDN Web Docs** — https://developer.mozilla.org/

---

**Last Updated:** 2026-08-15

---

### Quick Links

- 📊 [View Live Demo](https://YOUR_USERNAME.github.io/expense-tracker/) (after deployment)
- 🐛 [Report Issues](../../issues)
- 📝 [Discussions](../../discussions)
- ⭐ If you find this project useful, please star it!
