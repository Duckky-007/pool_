# PoolFund — Asset Investment Pool Platform

> **Demo prototype — not a real financial product. No real money is used.**

PoolFund is a full-stack web application prototype for co-funding real-world income-generating assets (such as airport taxis, delivery fleets, or rental property units). Companies propose an asset acquisition request, investors contribute capital into a shared pool, and once funded, the asset generates revenues that automatically appreciate the pool's share price.

---


## 🧭 Database & MongoDB Compass Integration

PoolFund is backed by **MongoDB**. You can inspect all live collections and documents inside **MongoDB Compass**:

- **Compass Connection URI**: `mongodb://127.0.0.1:27017`
- **Database Name**: `poolfund`

### Collections created in MongoDB Compass:
1. `users` — Companies and investors with simulated `wallet_balance`
2. `pools` — Asset funding pools with `total_shares`, `total_pool_value`, status, and target amount
3. `investments` — Investor contributions with minted proportional shares
4. `assets` — Physical assets registered to pools (**Enforced Scope Rule**: 1 pool = 1 asset)
5. `incomelogs` — Periodic income logged by companies (e.g. "Week of Sep 8")
6. `repayments` — Repayments injected back into the pool linked to source income logs
7. `transactions` — Transparent double-entry movement ledger (`deposit`, `borrow`, `repay`, `withdraw`)

---

## 🧮 The Core Math: Share-Based NAV Engine

Traditional crowdfunding relies on manual spreadsheets or rigid debt tracking. PoolFund uses an open-end mutual fund **Net Asset Value (NAV)** accounting engine:

### 1. Initial State
When a pool is created:
$$\text{total\_shares} = 0, \quad \text{total\_pool\_value} = 0$$

### 2. Investor Deposit & Share Minting
When an investor deposits amount $X$ into a pool (strictly restricted to `status = "funding"`):
- If first deposit ($\text{total\_shares} = 0$):
  $$\text{shares\_to\_mint} = X \quad (\text{Parity: 1 unit of currency} = 1 \text{ share})$$
- For subsequent deposits:
  $$\text{shares\_to\_mint} = X \times \left(\frac{\text{total\_shares}}{\text{total\_pool\_value}}\right) = \frac{X}{\text{current\_NAV}}$$
- Update state:
  $$\text{total\_shares} \mathrel{+}= \text{shares\_to\_mint}, \quad \text{total\_pool\_value} \mathrel{+}= X$$

### 3. Borrowing & Deployment
When $\text{total\_pool\_value} \ge \text{target\_amount}$, pool status transitions to `active`:
- The company borrows the full pooled amount (credited to company fake ledger balance).
- An asset is registered (e.g., *Toyota Innova Crysta Taxi*).
- **CRITICAL**: $\text{total\_pool\_value}$ **does NOT reset to 0**. It represents the active capital base owed back to the pool.

### 4. Revenue & Repayments (Automatic NAV Appreciation)
When the company logs revenue $Y$ and executes **"Convert to repayment"**:
$$\text{total\_pool\_value} \mathrel{+}= Y$$
Because $\text{total\_shares}$ remains unchanged:
$$\text{New Share Price (NAV)} = \frac{\text{total\_pool\_value} + Y}{\text{total\_shares}} > \text{Old NAV}$$
**Every investor's holding automatically gains value without calculating anyone's individual cut!**

### 5. Investor Share Redemption (Withdrawal)
Allowed after at least one repayment has been logged:
$$\text{Current Share Price} = \frac{\text{total\_pool\_value}}{\text{total\_shares}}$$
$$\text{Payout} = \text{Investor's Shares} \times \text{Current Share Price}$$
$$\text{total\_shares} \mathrel{-}= \text{Investor's Shares}, \quad \text{total\_pool\_value} \mathrel{-}= \text{Payout}$$

---

## 🛡️ Anti-Abuse Safeguard

**Rule Enforced**: Deposits into a pool are strictly prohibited once status changes to `active` or `repaying`.
- **Why this exists**: In a share-based NAV system, allowing deposits after asset operations commence would enable predatory front-running—depositing capital right before a scheduled repayment to instantly capture share appreciation without having undertaken the risk of funding the initial asset acquisition.

---

## 👥 Pre-Seeded Demo Accounts (Password: `password123`)

The app includes 1-click login buttons in the navbar and login page:

| Role | Name | Email | Scenario |
| :--- | :--- | :--- | :--- |
| **Company** | Apex Mobility Fleet Ltd. | `apex@mobility.com` | Operates Innova Taxi #4, can log income & convert repayments |
| **Company** | Urban Stay Properties Ltd. | `urban@properties.com` | Manages student housing studio pool |
| **Investor** | Rohan Gupta | `rohan@investor.com` | Invested ₹4,000 in Innova Taxi pool; eligible for withdrawal at **₹1.08 NAV** |
| **Investor** | Ananya Iyer | `ananya@investor.com` | Invested ₹4,000 in Innova Taxi pool |
| **Investor** | Vikram Malhotra | `vikram@investor.com` | Invested ₹2,000 in Innova Taxi pool |
| **Investor** | Aarav Sharma | `aarav@investor.com` | Invested ₹3,000 in Electric Taxi pool (currently in funding) |
| **Investor** | Priya Patel | `priya@investor.com` | Invested ₹2,000 in Electric Taxi pool |

---

## 🚀 Running the Project

### 1. Start MongoDB
Ensure your local MongoDB daemon is running (default port `27017`).

### 2. Seed Demo Data
```bash
cd server
npm run seed
```

### 3. Start Backend & Frontend
In root:
```bash
# Terminal 1: Backend API (runs on http://localhost:4000)
cd server
npm run dev

# Terminal 2: Frontend App (runs on http://localhost:3000)
cd client
npm run dev
```

Open your browser to **`http://localhost:3000`**.

# POOLFUND
