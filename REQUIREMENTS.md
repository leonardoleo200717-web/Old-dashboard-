# Personal Finance Dashboard Requirements

## 1. Overview
The application is a personal finance dashboard that tracks wealth progression based on a specific salary cycle (salary received on the 25th of the month). It provides insights into income, real expenses, savings rate, and overall net worth.

## 2. Core Functional Requirements
- **Snapshot-based Tracking:** Users can create monthly "snapshots" of their financial status.
- **Salary Cycle (24th/25th rule):** 
  - Net worth of bank accounts must be tracked before the salary is received (24th of the month - B24) and after it is received (25th of the month - B25).
  - Income is calculated as the difference between the balance on the 25th and the 24th of the current month.
- **Broker Tracking:**
  - Net worth of brokers is recorded once per month (representing the value on the 25th).
  - Broker data also requires tracking "Monthly Contributions" to accurately calculate real expenses vs. investments.
- **Dynamic Asset Management (Settings):**
  - Users can have multiple bank accounts and multiple brokers.
  - The dashboard must support adding, editing, disabling (inactive), or removing brokers and bank accounts via a dedicated **Settings** tab.
- **Data Visualization & Analytics:**
  - **Main Chart:** A line/area chart showing wealth progression over time (1Y, 6M, or ALL time periods).
  - **Chart Filtering:** The user must be able to select what to plot on the chart (All Assets, Bank Accounts only, or Brokers only).
  - **Expense Calculation:** Real expenses are calculated by looking at the outflow from bank accounts (Previous month's 25th balance minus Current month's 24th balance) and subtracting the total contributions made to brokers.

## 3. Technology Stack & Design
- **Framework:** React with TypeScript and Vite.
- **Styling:** Tailwind CSS with a deliberate "Financial/Polished" dark/light mode aesthetic.
- **Charts:** Recharts for area and donut charts.
- **Icons:** `lucide-react`.
- **State Management:** LocalStorage / manual JSON import/export to persist the ledger of assets and monthly snapshots.
