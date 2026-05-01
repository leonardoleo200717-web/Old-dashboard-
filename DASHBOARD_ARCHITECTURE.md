# Dashboard Architecture & Key Features

This document outlines how the current Personal Finance Dashboard is built, its core mechanisms, and key features. Review this to understand the existing logic before rebuilding it from scratch.

## 1. Core State & Data Structure
The app persists data exclusively on the client-side using `localStorage`, modeled around a central `ledger_state` object.

The state is broken down into two main concepts:
- **Assets (`Asset[]`)**: Definitions of where the money is kept. Each asset has:
  - `id`: A unique identifier.
  - `name`: Display name (e.g., "Main Bank", "Trading212").
  - `type`: Either `bank` (requires B24 and B25 balances) or `broker` (requires total balance and monthly contribution).
  - `isActive`: Boolean allowing the user to hide assets they no longer use, without losing historical data.
- **Snapshots (`MonthlySnapshot[]`)**: The historical record of net worth, taken once a month.
  - Contains a `year` and `month`.
  - `bankData`: A map linking bank asset IDs to their respective `b24` (before salary) and `b25` (after salary) amounts.
  - `brokerData`: A map linking broker asset IDs to their respective `balance` (total worth) and `contribution` (money deposited that month).

## 2. The 24th/25th Salary Logic
A uniquely distinguishing feature of this dashboard is how it calculates income and expenses based on a mid-month salary date.
- **24th (B24)**: The lowest point of the month for checking accounts, right before the salary arrives.
- **25th (B25)**: The highest point, immediately after the new salary is credited.

This implies:
- **Monthly Income** is inferred mathematically checking the difference: `Income = Sum of all B25 balances - Sum of all B24 balances` of the current month.
  
## 3. Expense & Contribution Math
Calculating real expenses is complex when moving money from a bank to an investment broker.
- **Total Outflow**: Previous Month's B25 (starting amount after last salary) minus Current Month's B24 (remaining amount just before the new salary).
- **Contributions**: Money moved intentionally to brokers (`totalContr = Sum of all broker contributions`).
- **Real Expenses**: `Real Expenses = Total Outflow - Contributions`. This ensures that investing money doesn't falsely look like consumer spending.

## 4. Key Components (UI Architecture)
The application uses a tab-based navigation layout featuring:
- **Overview (`Overview.tsx`)**: 
  - Calculates and displays the high-level metrics: Total Net Worth, Monthly Income, Real Expenses, and Savings rate.
  - Contains the main AreaChart (using `recharts`), which dynamically plots the wealth across "1Y", "6M", or "ALL" timeframes.
  - Features toggle filters to view the chart for "ALL", "BANKS", or "BROKERS" exclusively.
- **Annual/Ledger (`Annual.tsx`)**:
  - A detailed table view showing month-by-month raw data (B24, B25, Broker Balances).
  - Useful for finding discrepancies and editing historical snapshot data.
- **Settings (`Settings.tsx`)**:
  - Asset Management: Add, edit, or disable specific banks and brokers.
  - Data Portability: Export the entire ledger as a JSON file, or import an existing JSON to restore data.

## 5. Styling & Visuals
- Built using **Tailwind CSS** with CSS variables defined in `/src/index.css`.
- Fully supports **Dark/Light mode**, controlled by a toggle at the top of the app.
- Contains a **Privacy Mode (Eye icon)**, which applies a CSS blur filter (`.privacy-safe`) to all sensitive numbers so the dashboard can be used safely in public.

## 6. Starting from Scratch considerations
When you start from scratch, you will want to consider:
1. Retaining the `localStorage` JSON structure so the user's existing data doesn't break, or writing a migration function if you change the schema.
2. The core math (`b25 - b24 = income`) should be strictly preserved since it defines the distinct logic requested for this dashboard.
3. Keeping the component logic separated into hooks (e.g., `useFinanceCalculations`) might make the math easier to manage instead of embedding it directly in the UI components like it currently is.
