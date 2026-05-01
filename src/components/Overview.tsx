import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  Landmark,
  Bolt,
  PiggyBank
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import { LedgerState } from '../types';

interface OverviewProps {
  ledger: LedgerState;
  onUpdate: (newState: Partial<LedgerState>) => void;
  darkMode?: boolean;
}

export default function Overview({ ledger, onUpdate, darkMode }: OverviewProps) {
  const [chartPeriod, setChartPeriod] = useState<'1Y' | '6M' | 'ALL'>('1Y');
  const [chartFilter, setChartFilter] = useState<'all' | 'bank' | 'broker'>('all');
  const snapshots = ledger.snapshots || [];
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const prevSnapshot = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

  const activeAssetIds = new Set((ledger.assets || []).filter(a => !a.inactive).map(a => a.id));

  let totalWealth = (ledger.assets || []).filter(a => !a.inactive).reduce((sum, asset) => sum + asset.balance, 0);
  let monthlyIncome = 0;
  let monthlyDelta = 0;
  let realExpenses = 0;
  let growthPct = 0;

  if (latestSnapshot) {
    // Calculate wealth from latest snapshot
    let snapshotWealth = 0;
    Object.entries(latestSnapshot.bankData || {}).forEach(([id, d]) => {
      snapshotWealth += d.b25;
    });
    Object.entries(latestSnapshot.brokerData || {}).forEach(([id, d]) => {
      snapshotWealth += d.balance;
    });
    totalWealth = snapshotWealth;

    // Calculate income from latest snapshot
    Object.entries(latestSnapshot.bankData || {}).forEach(([id, d]) => {
      monthlyIncome += (d.b25 - d.b24);
    });

    // Calculate total contributions
    let totalContr = 0;
    Object.entries(latestSnapshot.brokerData || {}).forEach(([id, d]) => {
      totalContr += d.contribution;
    });

    // Calculate expenses from previous snapshot
    if (prevSnapshot) {
      let totalOutflow = 0;
      Object.keys(prevSnapshot.bankData || {}).forEach(bankId => {
        const b25_prev = prevSnapshot.bankData[bankId].b25;
        const b24_curr = latestSnapshot.bankData[bankId]?.b24 || 0;
        totalOutflow += (b25_prev - b24_curr);
      });
      
      // Real Expenses = Outflow from banks - Money that went to investments
      realExpenses = totalOutflow - totalContr;
      
      // Monthly savings = Income - Real Expenses
      monthlyDelta = monthlyIncome - (totalOutflow - totalContr);

      // Calculate growth %
      let prevWealth = 0;
      Object.entries(prevSnapshot.bankData || {}).forEach(([id, d]) => {
        prevWealth += d.b25;
      });
      Object.entries(prevSnapshot.brokerData || {}).forEach(([id, d]) => {
        prevWealth += d.balance;
      });
      if (prevWealth > 0) {
        growthPct = ((totalWealth - prevWealth) / prevWealth) * 100;
      }
    }
  }

  const savingsRate = monthlyIncome > 0 ? (monthlyDelta / monthlyIncome) * 100 : 0;

  // Chart data from snapshots
  let chartData = snapshots.length > 0 
    ? snapshots.map(s => {
        let wealth = 0;
        if (chartFilter === 'all' || chartFilter === 'bank') {
          Object.entries(s.bankData || {}).forEach(([id, d]) => {
            wealth += d.b25;
          });
        }
        if (chartFilter === 'all' || chartFilter === 'broker') {
          Object.entries(s.brokerData || {}).forEach(([id, d]) => {
            wealth += d.balance;
          });
        }
        return { name: `${s.month} ${s.year}`, value: wealth };
      })
    : [
        { name: 'JAN 2024', value: (chartFilter !== 'broker' ? totalWealth : 0) * 0.92 },
        { name: 'FEB 2024', value: (chartFilter !== 'broker' ? totalWealth : 0) * 0.95 },
        { name: 'MAR 2024', value: (chartFilter !== 'broker' ? totalWealth : 0) },
      ];

  if (chartPeriod === '6M') {
    chartData = chartData.slice(-6);
  } else if (chartPeriod === '1Y') {
    chartData = chartData.slice(-12);
  }

  const bankAssets = (ledger.assets || []).filter(a => a.type === 'bank');
  const brokerAssets = (ledger.assets || []).filter(a => a.type === 'broker');
  const pensionAssets = (ledger.assets || []).filter(a => a.type === 'pension');

  const bankTotal = bankAssets.filter(a => !a.inactive).reduce((sum, a) => sum + (latestSnapshot?.bankData[a.id]?.b25 ?? a.balance), 0);
  const brokerTotal = brokerAssets.filter(a => !a.inactive).reduce((sum, a) => sum + (latestSnapshot?.brokerData[a.id]?.balance ?? a.balance), 0);
  const pensionTotal = pensionAssets.filter(a => !a.inactive).reduce((sum, a) => sum + (latestSnapshot?.brokerData[a.id]?.balance ?? a.balance), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-stretch">
        <div className="lg:col-span-7 emerald-gradient rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden shadow-lg shadow-secondary/10 min-h-[180px] lg:min-h-[240px] flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-[10px] lg:text-sm font-medium opacity-80 mb-1 lg:mb-2 uppercase tracking-wider">Total Wealth Capital</p>
            <h1 className="text-3xl lg:text-5xl font-headline font-extrabold tracking-tight mb-2 lg:mb-4 privacy-safe">
              € {totalWealth.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className={cn(
              "backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1",
              growthPct >= 0 ? "bg-white/20" : "bg-error/20"
            )}>
              {growthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-xs font-bold">{growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%</span>
            </div>
            <span className="text-xs opacity-70">vs last month</span>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Monthly Income (B25 - B24)</p>
              <p className="text-xl lg:text-2xl font-headline font-bold text-on-surface privacy-safe">
                € {monthlyIncome.toLocaleString('de-DE')}
              </p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary">
              <Wallet className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-sm">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Real Expenses</p>
              <p className="text-lg lg:text-xl font-headline font-bold text-on-surface privacy-safe">
                € {realExpenses.toLocaleString('de-DE')}
              </p>
              <div className="mt-3 w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-error h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (realExpenses / (monthlyIncome || 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-sm">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Monthly Savings</p>
              <p className="text-lg lg:text-xl font-headline font-bold text-secondary privacy-safe">
                € {monthlyDelta.toLocaleString('de-DE')}
              </p>
              <span className="inline-block mt-2 text-[10px] text-on-secondary-container font-bold bg-secondary-container px-2 py-0.5 rounded uppercase tracking-wider">
                {savingsRate.toFixed(1)}% Rate
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-lg lg:text-xl font-headline font-bold mb-1">Wealth Progression</h2>
            <p className="text-[10px] lg:text-xs text-on-surface-variant">Combined equity evolution over the selected period</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <div className="flex bg-surface-container-low rounded-full p-1 border border-outline-variant/20">
              <button
                onClick={() => setChartFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors",
                  chartFilter === 'all' ? "bg-primary-container text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                ALL
              </button>
              <button
                onClick={() => setChartFilter('bank')}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors",
                  chartFilter === 'bank' ? "bg-primary-container text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                BANKS
              </button>
              <button
                onClick={() => setChartFilter('broker')}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors",
                  chartFilter === 'broker' ? "bg-primary-container text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                BROKERS
              </button>
            </div>
            
            <div className="flex gap-1 lg:gap-1">
              {(['1Y', '6M', 'ALL'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-colors",
                    chartPeriod === p 
                      ? "bg-secondary-container text-on-secondary-container" 
                      : "hover:bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="h-64 lg:h-80 w-full" key={`${chartPeriod}-${chartFilter}-${activeAssetIds.size}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={darkMode ? "#d946ef" : "#006c4a"} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={darkMode ? "#d946ef" : "#006c4a"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1f2937" : "#e0e3e5"} opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#74777f', fontWeight: 500 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                formatter={(value: number) => [`€ ${value.toLocaleString('de-DE')}`, 'Wealth']}
                contentStyle={{ 
                  backgroundColor: darkMode ? '#111827' : '#ffffff', 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  color: darkMode ? '#f3f4f6' : '#191c1e'
                }}
                itemStyle={{ color: darkMode ? '#f3f4f6' : '#191c1e' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: darkMode ? '#f3f4f6' : '#191c1e' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={darkMode ? "#d946ef" : "#000000"} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Asset Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        <div className="bg-surface-container-low/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Landmark className="w-5 h-5 text-on-surface-variant" />
              <h3 className="text-lg font-headline font-bold">Bank Accounts</h3>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider privacy-safe">
              € {bankTotal.toLocaleString('de-DE')} Total
            </span>
          </div>
          
          <div className="space-y-3">
            {bankAssets.length === 0 && <p className="text-xs text-outline italic py-4 text-center">No bank accounts configured.</p>}
            {bankAssets.map((asset) => {
              const snapshotBalance = latestSnapshot?.bankData[asset.id]?.b25 ?? asset.balance;
              const isInactive = asset.inactive;
              return (
                <div key={asset.id} className={cn(
                  "bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between transition-all hover:translate-x-1 shadow-sm",
                  isInactive && "opacity-50 grayscale"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-[10px] text-secondary font-bold">
                      {asset.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{asset.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">{asset.details || 'Checking Account'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-sm font-bold privacy-safe">€ {snapshotBalance.toLocaleString('de-DE')}</p>
                    <button 
                      onClick={() => {
                        const newAssets = ledger.assets.map(a => a.id === asset.id ? { ...a, inactive: !a.inactive } : a);
                        onUpdate({ assets: newAssets });
                      }}
                      className={cn(
                        "w-8 h-4 rounded-full relative transition-colors",
                        isInactive ? "bg-outline-variant" : "bg-secondary"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                        isInactive ? "left-0.5" : "right-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-container-low/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-on-surface-variant" />
              <h3 className="text-lg font-headline font-bold">Brokers & Pensions</h3>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider privacy-safe">
              € {(brokerTotal + pensionTotal).toLocaleString('de-DE')} Total
            </span>
          </div>
          
          <div className="space-y-3">
            {[...brokerAssets, ...pensionAssets].length === 0 && <p className="text-xs text-outline italic py-4 text-center">No investment assets configured.</p>}
            {[...brokerAssets, ...pensionAssets].map((asset) => {
              const snapshotBalance = latestSnapshot?.brokerData[asset.id]?.balance ?? asset.balance;
              const isInactive = asset.inactive;
              return (
                <div key={asset.id} className={cn(
                  "bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between transition-all hover:translate-x-1 shadow-sm",
                  isInactive && "opacity-50 grayscale"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                      asset.type === 'broker' ? "bg-on-surface" : "bg-primary-container"
                    )}>
                      {asset.type === 'broker' ? <Bolt className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{asset.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">{asset.details || (asset.type === 'broker' ? 'Investment Portfolio' : 'Pension Fund')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-sm font-bold privacy-safe">€ {snapshotBalance.toLocaleString('de-DE')}</p>
                    <button 
                      onClick={() => {
                        const newAssets = ledger.assets.map(a => a.id === asset.id ? { ...a, inactive: !a.inactive } : a);
                        onUpdate({ assets: newAssets });
                      }}
                      className={cn(
                        "w-8 h-4 rounded-full relative transition-colors",
                        isInactive ? "bg-outline-variant" : "bg-secondary"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                        isInactive ? "left-0.5" : "right-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
