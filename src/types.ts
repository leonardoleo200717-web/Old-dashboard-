export type AssetType = 'bank' | 'broker' | 'pension';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  balance: number;
  details?: string;
  icon?: string;
  color?: string;
  inactive?: boolean;
  isSalaryAccount?: boolean;
}

export interface MonthlySnapshot {
  id: string;
  month: string; // "Jan", "Feb", etc.
  year: number;
  bankData: { [assetId: string]: { b24: number; b25: number } };
  brokerData: { [assetId: string]: { 
    balance: number; 
    recurringContribution: number; 
    extraContribution: number;
    contribution: number; // Sum of the two
  } };
}

export interface LedgerState {
  assets: Asset[];
  salaryDay: number;
  monthlySalary: number;
  snapshots: MonthlySnapshot[];
}
