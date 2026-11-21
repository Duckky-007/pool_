# PoolFund: Asset Investment Pool Platform

> **Demo prototype. Not a real financial product. No real money is used.**

PoolFund is a full-stack web app prototype for co-funding real-world, income-generating assets such as airport taxis, delivery fleets, or rental property units.

1. A company proposes an asset acquisition.
2. Investors contribute capital into a shared pool.
3. Once the pool is funded, the asset generates revenue.
4. Repayments raise the pool's share price, so every investor's holding grows automatically.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Anti-Abuse Safeguard](#anti-abuse-safeguard)
- [Database Schema](#database-schema)
- [Demo Accounts](#demo-accounts)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

---

## How It Works

PoolFund uses an open-end mutual fund style **Net Asset Value (NAV)** engine instead of manual spreadsheets or per-investor debt tracking.

**NAV (share price)** = `total_pool_value / total_shares`

### 1. Pool creation

```text
total_shares      = 0
total_pool_value  = 0
```

### 2. Investor deposit and share minting

Deposits are only allowed while the pool status is `funding`.

```text
First deposit (total_shares == 0):
    shares_to_mint = X                              # 1 currency unit = 1 share

Later deposits:
    shares_to_mint = X * (total_shares / total_pool_value)
                   = X / current_NAV

Then update:
    total_shares      += shares_to_mint
    total_pool_value  += X
```

### 3. Borrowing and deployment

When `total_pool_value >= target_amount`, the pool status becomes `active`:

- The company borrows the full pooled amount (credited to its simulated ledger balance).
- An asset is registered to the pool (for example, a *Toyota Innova Crysta Taxi*).
- `total_pool_value` **does not reset to 0**. It represents the active capital base owed back to the pool.

### 4. Revenue and repayments (automatic NAV appreciation)

When the company logs revenue `Y` and clicks **Convert to repayment**:

```text
total_pool_value += Y
```

`total_shares` does not change, so:

```text
new_NAV = (old_total_pool_value + Y) / total_shares  >  old_NAV
```

Every investor's holding gains value automatically, with no individual profit-share calculations.

### 5. Share redemption (withdrawal)

Allowed after at least one repayment has been logged.

```text
current_NAV = total_pool_value / total_shares
payout      = investor_shares * current_NAV

total_shares      -= investor_shares
total_pool_value  -= payout
```

---

## Anti-Abuse Safeguard

**Rule:** Deposits are prohibited once a pool's status is `active` or `repaying`.

**Why:** In a share-based NAV system, allowing deposits after the asset starts operating would enable front-running. Someone could deposit right before a scheduled repayment and instantly capture the share appreciation without taking the risk of funding the asset acquisition.

---

## Database Schema

PoolFund is backed by **MongoDB**. You can inspect the live data in **MongoDB Compass**:

- **Connection URI:** `mongodb://127.0.0.1:27017`
- **Database name:** `poolfund`

| Collection | Description |
| :--- | :--- |
| `users` | Companies and investors, with a simulated `wallet_balance` |
| `pools` | Funding pools with `total_shares`, `total_pool_value`, status, and target amount |
| `investments` | Investor contributions and the proportional shares minted |
| `assets` | Physical assets registered to pools (**scope rule:** 1 pool = 1 asset) |
| `incomelogs` | Periodic income logged by companies (for example, "Week of Sep 8") |
| `repayments` | Repayments added back into the pool, linked to their source income log |
| `transactions` | Double-entry ledger of money movements (`deposit`, `borrow`, `repay`, `withdraw`) |

---

## Demo Accounts

All demo accounts use the password **`password123`**. The navbar and login page include 1-click login buttons.

| Role | Name | Email | Scenario |
| :--- | :--- | :--- | :--- |
| Company | Apex Mobility Fleet Ltd. | `apex@mobility.com` | Operates Innova Taxi #4; can log income and convert repayments |
| Company | Urban Stay Properties Ltd. | `urban@properties.com` | Manages the student housing studio pool |
| Investor | Rohan Gupta | `rohan@investor.com` | Invested ₹4,000 in the Innova Taxi pool; eligible to withdraw at ₹1.08 NAV |
| Investor | Ananya Iyer | `ananya@investor.com` | Invested ₹4,000 in the Innova Taxi pool |
| Investor | Vikram Malhotra | `vikram@investor.com` | Invested ₹2,000 in the Innova Taxi pool |
| Investor | Aarav Sharma | `aarav@investor.com` | Invested ₹3,000 in the Electric Taxi pool (currently funding) |
| Investor | Priya Patel | `priya@investor.com` | Invested ₹2,000 in the Electric Taxi pool |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on the default port `27017`

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Seed the demo data

```bash
cd server
npm run seed
```

### 3. Run the app

Use two terminals.

```bash
# Terminal 1: backend API (http://localhost:4000)
cd server
npm run dev
```

```bash
# Terminal 2: frontend (http://localhost:3000)
cd client
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Project Structure

```text
.
├── client/    # Frontend app (port 3000)
└── server/    # Backend API, seed script, MongoDB models (port 4000)
```
