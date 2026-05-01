import { useState } from 'react';
import { 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  MoreVertical, 
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  Landmark,
  PiggyBank,
  Bolt,
  ArrowDownToLine,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { cn } from '../lib/utils';
import { LedgerState } from '../types';

interface PortfolioProps {
  ledger: LedgerState;
  filter?: 'all' | 'bank' | 'broker';
  onFilterChange?: (filter: 'all' | 'bank' | 'broker') => void;
  onUpdate?: (newState: Partial<LedgerState>) => void;
  darkMode?: boolean;
}

export default function Portfolio({ ledger, filter = 'all', onFilterChange, onUpdate, darkMode }: PortfolioProps) {
  const [activityPeriod, setActivityPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const snapshots = ledger.snapshots || [];
  const monthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const sortedSnapshots = [...snapshots].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return monthMap[b.month] - monthMap[a.month];
  });

  const latestSnapshot = sortedSnapshots.length > 0 ? sortedSnapshots[0] : null;
  const prevSnapshot = sortedSnapshots.length > 1 ? sortedSnapshots[1] : null;

  const totalWealth = latestSnapshot 
    ? (filter === 'all' || filter === 'bank' 
        ? Object.entries(latestSnapshot.bankData || {}).filter(([id]) => (ledger.assets || []).find(a => a.id === id && !a.inactive)).reduce((sum, [_, b]) => sum + b.b25, 0) 
        : 0) +
      (filter === 'all' || filter === 'broker'
        ? Object.entries(latestSnapshot.brokerData || {}).filter(([id]) => (ledger.assets || []).find(a => a.id === id && !a.inactive)).reduce((sum, [_, b]) => sum + b.balance, 0)
        : 0)
    : (ledger.assets || []).filter(a => !a.inactive && (filter === 'all' || a.type === filter)).reduce((sum, asset) => sum + asset.balance, 0);

  const prevWealth = prevSnapshot
    ? (filter === 'all' || filter === 'bank' 
        ? Object.entries(prevSnapshot.bankData || {}).filter(([id]) => (ledger.assets || []).find(a => a.id === id && !a.inactive)).reduce((sum, [_, b]) => sum + b.b25, 0) 
        : 0) +
      (filter === 'all' || filter === 'broker'
        ? Object.entries(prevSnapshot.brokerData || {}).filter(([id]) => (ledger.assets || []).find(a => a.id === id && !a.inactive)).reduce((sum, [_, b]) => sum + b.balance, 0)
        : 0)
    : 0;

  const growthPct = prevWealth > 0 ? ((totalWealth - prevWealth) / prevWealth) * 100 : 0;

  const bankAssets = (ledger.assets || []).filter(a => a.type === 'bank');
  const brokerAssets = (ledger.assets || []).filter(a => a.type === 'broker');
  const pensionAssets = (ledger.assets || []).filter(a => a.type === 'pension');

  const equityAllocation = totalWealth > 0 
    ? ((brokerAssets.reduce((sum, a) => {
        const balance = latestSnapshot?.brokerData[a.id]?.balance ?? a.balance;
        return sum + balance;
      }, 0) + pensionAssets.reduce((sum, a) => {
        const balance = latestSnapshot?.brokerData[a.id]?.balance ?? a.balance;
        return sum + balance;
      }, 0)) / totalWealth) * 100 
    : 0;

  const assetAllocationData = (ledger.assets || [])
    .filter(a => !a.inactive && (filter === 'all' || a.type === filter))
    .map((asset, index) => {
      let balance = asset.balance;
      if (latestSnapshot) {
        if (asset.type === 'bank') {
          balance = latestSnapshot.bankData[asset.id]?.b25 ?? asset.balance;
        } else {
          balance = latestSnapshot.brokerData[asset.id]?.balance ?? asset.balance;
        }
      }
      
      const colors = darkMode 
        ? [
            '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#06b6d4', 
            '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'
          ]
        : [
            '#006c4a', '#141414', '#6750a4', '#d946ef', '#4c1d95', 
            '#001b3d', '#74777f', '#ba1a1a', '#00714e', '#82f5c1'
          ];
      
      return {
        name: asset.name,
        value: balance,
        color: colors[index % colors.length]
      };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-10 animate-in zoom-in-95 duration-700 pb-24">
      {/* Hero Section - Allocation Focus */}
      <section className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left: Net Worth Summary */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Portfolio Net Worth</span>
                <div className="flex gap-1 bg-surface-container-high p-0.5 rounded-lg">
                  {(['all', 'bank', 'broker'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => onFilterChange?.(f)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all",
                        filter === f ? "bg-on-surface text-surface shadow-sm" : "text-outline hover:text-on-surface"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <h1 className="text-5xl font-headline font-extrabold text-on-surface tracking-tighter privacy-safe">
                €{totalWealth.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </h1>
              <div className="flex items-center gap-3 mt-4">
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
                  growthPct >= 0 ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                )}>
                  {growthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                  {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
                </div>
                <span className="text-[10px] font-medium text-outline">vs last month</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-6 border-t border-outline-variant/10 max-h-[180px] overflow-y-auto pr-4 custom-scrollbar">
              {assetAllocationData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-outline truncate max-w-[80px]">{item.name}</p>
                    <p className="text-[11px] font-bold text-on-surface privacy-safe">€{item.value.toLocaleString('de-DE')}</p>
                    <p className="text-[9px] text-outline font-medium">{((item.value / totalWealth) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Allocation Pie Chart */}
          <div className="w-full lg:w-[320px] h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {assetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => [`€ ${value.toLocaleString('de-DE')}`, 'Value']}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#111827' : '#141414', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#ffffff',
                    fontSize: '10px'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <PieChartIcon className="w-5 h-5 text-outline opacity-20 mb-1" />
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Assets</span>
            </div>
          </div>
        </div>
      </section>
      {/* Asset Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Bank Accounts */}
        {(filter === 'all' || filter === 'bank') && (
          <div className={cn("col-span-12 space-y-6", filter === 'all' ? "lg:col-span-5" : "lg:col-span-12")}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold">Bank Accounts</h2>
              <button 
                onClick={() => onFilterChange?.('bank')}
                className="text-secondary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className={cn("space-y-4", filter === 'bank' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0")}>
              {bankAssets.length === 0 && <p className="text-xs text-outline italic py-4">No bank accounts configured.</p>}
              {bankAssets.map(asset => {
                const balance = latestSnapshot?.bankData[asset.id]?.b25 ?? asset.balance;
                const isInactive = asset.inactive;
                return (
                  <div key={asset.id} className={cn(
                    "bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-all group",
                    isInactive && "opacity-50 grayscale"
                  )}>
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                          <Landmark className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface">{asset.name}</h4>
                          <p className="text-[10px] text-outline font-medium">{asset.details || 'Primary Account'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const newAssets = ledger.assets.map(a => a.id === asset.id ? { ...a, inactive: !a.inactive } : a);
                          onUpdate?.({ assets: newAssets });
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-colors",
                          isInactive ? "bg-outline-variant text-white" : "bg-secondary-container text-on-secondary-container"
                        )}
                      >
                        {isInactive ? "INACTIVE" : "ACTIVE"}
                      </button>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-1">Available Balance</p>
                        <p className="text-3xl font-headline font-extrabold text-on-surface privacy-safe">€{balance.toLocaleString('de-DE')}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-xs font-bold flex items-center justify-end gap-0.5 privacy-safe",
                          (latestSnapshot?.bankData[asset.id]?.b25 || 0) - (latestSnapshot?.bankData[asset.id]?.b24 || 0) >= 0 ? "text-secondary" : "text-error"
                        )}>
                          <ArrowUpRight className={cn("w-3 h-3", (latestSnapshot?.bankData[asset.id]?.b25 || 0) - (latestSnapshot?.bankData[asset.id]?.b24 || 0) < 0 && "rotate-90")} /> 
                          €{((latestSnapshot?.bankData[asset.id]?.b25 || 0) - (latestSnapshot?.bankData[asset.id]?.b24 || 0)).toLocaleString('de-DE')}
                        </p>
                        <p className="text-[10px] text-outline font-medium">Monthly income</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Brokers & Pensions */}
        {(filter === 'all' || filter === 'broker') && (
          <div className={cn("col-span-12 space-y-6", filter === 'all' ? "lg:col-span-7" : "lg:col-span-12")}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold">Investments & Funds</h2>
              <div className="flex gap-2">
                <button className="p-2 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors"><MoreVertical className="w-4 h-4 text-on-surface-variant" /></button>
                <button className="p-2 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors"><PlusCircle className="w-4 h-4 text-on-surface-variant" /></button>
              </div>
            </div>
            
            <div className={cn("grid grid-cols-1 gap-6", filter === 'all' ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3")}>
              {[...brokerAssets, ...pensionAssets].length === 0 && <p className="text-xs text-outline italic py-4">No investment assets configured.</p>}
              {[...brokerAssets, ...pensionAssets].map((asset) => {
                const balance = latestSnapshot?.brokerData[asset.id]?.balance ?? asset.balance;
                const isInactive = asset.inactive;
                return (
                  <div key={asset.id} className={cn(
                    "bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-all group",
                    isInactive && "opacity-50 grayscale"
                  )}>
                    <div className="flex justify-between items-center mb-6">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                        asset.type === 'broker' ? "bg-on-surface" : "bg-primary-container"
                      )}>
                        {asset.type === 'broker' ? <Bolt className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
                      </div>
                      <button 
                        onClick={() => {
                          const newAssets = ledger.assets.map(a => a.id === asset.id ? { ...a, inactive: !a.inactive } : a);
                          onUpdate?.({ assets: newAssets });
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-colors",
                          isInactive ? "bg-outline-variant text-white" : "bg-secondary-container text-on-secondary-container"
                        )}
                      >
                        {isInactive ? "INACTIVE" : "ACTIVE"}
                      </button>
                    </div>
                    <h4 className="font-headline font-bold text-on-surface">{asset.name}</h4>
                    <p className="text-[10px] text-outline font-medium mb-4">{asset.details || (asset.type === 'broker' ? 'Brokerage' : 'Pension')}</p>
                    <p className="text-2xl font-headline font-extrabold text-on-surface mb-1 privacy-safe">€{balance.toLocaleString('de-DE')}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-secondary privacy-safe">+{(latestSnapshot?.brokerData[asset.id]?.contribution || 0).toLocaleString('de-DE')}</span>
                      <span className="text-[10px] text-outline font-medium">Monthly</span>
                    </div>
                    <div className="mt-6 h-12 w-full bg-surface-container-low rounded-xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary/20" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <section className="bg-surface-container-low/50 rounded-3xl p-8 border border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-lg font-headline font-bold">Recent Liquidity Shifts</h3>
            <p className="text-xs text-on-surface-variant font-medium">Intra-portfolio movements and external contributions</p>
          </div>
        </div>
        
        {latestSnapshot ? (
          <div className="space-y-4">
            {[...bankAssets, ...brokerAssets, ...pensionAssets].map(asset => {
              const activities = [];
              if (asset.type === 'bank') {
                const data = latestSnapshot.bankData[asset.id];
                if (data) {
                  const income = data.b25 - data.b24;
                  if (income !== 0) {
                    activities.push({
                      type: income > 0 ? 'Income' : 'Outflow',
                      label: `${income > 0 ? 'Salary / Income' : 'Adjustment'} in ${asset.name}`,
                      value: income,
                      icon: <ArrowDownToLine className="w-4 h-4" />
                    });
                  }
                  if (prevSnapshot) {
                    const prevB25 = prevSnapshot.bankData[asset.id]?.b25 || 0;
                    const outflow = prevB25 - data.b24;
                    if (outflow !== 0) {
                      activities.push({
                        type: outflow > 0 ? 'Outflow' : 'Inflow',
                        label: `${outflow > 0 ? 'Expense / Transfer' : 'Reimbursement'} from ${asset.name}`,
                        value: -outflow,
                        icon: outflow > 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />
                      });
                    }
                  }
                }
              } else {
                const data = latestSnapshot.brokerData[asset.id];
                if (data && data.contribution !== 0) {
                  activities.push({
                    type: 'Investment',
                    label: `Investment in ${asset.name}`,
                    value: data.contribution,
                    icon: <PlusCircle className="w-4 h-4" />
                  });
                }
              }

              return activities.map((act, idx) => (
                <div key={`${asset.id}-${idx}`} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between shadow-sm border border-outline-variant/5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      act.value > 0 ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                    )}>
                      {act.icon}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-0.5">{act.type}</p>
                      <p className="text-sm font-bold text-on-surface">{act.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold privacy-safe",
                      act.value > 0 ? "text-secondary" : "text-error"
                    )}>
                      {act.value > 0 ? '+' : ''}€{act.value.toLocaleString('de-DE')}
                    </p>
                    <p className="text-[10px] text-outline font-medium">{latestSnapshot.month} {latestSnapshot.year}</p>
                  </div>
                </div>
              ));
            })}
            
            {latestSnapshot && bankAssets.length === 0 && brokerAssets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
                <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6 text-outline opacity-40" />
                </div>
                <p className="text-sm font-bold text-on-surface-variant">No recent activity detected</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
            <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-outline opacity-40" />
            </div>
            <p className="text-sm font-bold text-on-surface-variant">No record for the current month</p>
            <p className="text-[10px] text-outline font-medium uppercase tracking-widest mt-1">Add a snapshot in the Ledger to see activity</p>
          </div>
        )}
      </section>
    </div>
  );
}
