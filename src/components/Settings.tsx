import { 
  Calculator, 
  Calendar, 
  Edit3, 
  Landmark, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Lock,
  Sparkles,
  RefreshCw,
  PlusCircle,
  PiggyBank,
  X,
  Download,
  Upload,
  Banknote
} from 'lucide-react';
import { LedgerState, Asset, AssetType } from '../types';
import { useState, useRef } from 'react';
import { cn } from '../lib/utils';

interface SettingsProps {
  ledger: LedgerState;
  onUpdate: (newState: Partial<LedgerState>) => void;
  onReset?: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
}

export default function Settings({ ledger, onUpdate, onReset, onExport, onImport }: SettingsProps) {
  const [isAddingAsset, setIsAddingAsset] = useState<AssetType | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '',
    balance: 0,
    details: '',
  });

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

  const salaryAccounts = ledger.assets.filter(a => a.type === 'bank' && a.isSalaryAccount);
  
  // Calculate monthly salary from latest snapshot (only from salary accounts)
  const salaryBreakdown = salaryAccounts.map(asset => {
    const data = latestSnapshot?.bankData[asset.id];
    const delta = data ? (data.b25 - data.b24) : 0;
    return { name: asset.name, delta };
  });

  const calculatedSalary = salaryBreakdown.reduce((acc, curr) => acc + curr.delta, 0);

  const handleAddAsset = () => {
    if (!isAddingAsset || !newAsset.name) return;

    const asset: Asset = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAsset.name,
      type: isAddingAsset,
      balance: Number(newAsset.balance) || 0,
      details: newAsset.details || '',
      color: isAddingAsset === 'bank' ? 'bg-secondary' : isAddingAsset === 'broker' ? 'bg-on-surface' : 'bg-primary-container',
    };

    onUpdate({
      assets: [...ledger.assets, asset]
    });

    setIsAddingAsset(null);
    setNewAsset({ name: '', balance: 0, details: '' });
  };

  const handleDeleteAsset = (id: string) => {
    onUpdate({
      assets: ledger.assets.filter(a => a.id !== id)
    });
  };

  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => {
    onUpdate({
      assets: ledger.assets.map(a => a.id === id ? { ...a, ...updates } : a)
    });
  };

  const handleUpdateAssetBalance = (id: string, newBalance: number) => {
    const updatedAssets = ledger.assets.map(a => a.id === id ? { ...a, balance: newBalance } : a);
    
    // Also update the latest snapshot if it exists to keep them "linked"
    let updatedSnapshots = [...ledger.snapshots];
    if (latestSnapshot) {
      const snapIdx = updatedSnapshots.findIndex(s => s.id === latestSnapshot.id);
      if (snapIdx >= 0) {
        const snap = { ...updatedSnapshots[snapIdx] };
        const asset = ledger.assets.find(a => a.id === id);
        if (asset?.type === 'bank') {
          snap.bankData = { ...snap.bankData, [id]: { ...snap.bankData[id], b25: newBalance } };
        } else {
          snap.brokerData = { ...snap.brokerData, [id]: { ...snap.brokerData[id], balance: newBalance } };
        }
        updatedSnapshots[snapIdx] = snap;
      }
    }
    
    onUpdate({ assets: updatedAssets, snapshots: updatedSnapshots });
  };

  const renderAssetSection = (type: AssetType, title: string, Icon: any) => {
    const assets = ledger.assets.filter(a => a.type === type);

    return (
      <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-headline font-bold flex items-center gap-3">
            <Icon className="w-5 h-5 text-secondary" />
            {title}
          </h3>
          <button 
            onClick={() => setIsAddingAsset(type)}
            className="text-[10px] font-bold text-secondary hover:underline tracking-widest uppercase flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add {type}
          </button>
        </div>

        <div className="space-y-6">
          {assets.length === 0 && (
            <p className="text-xs text-outline italic text-center py-4">No {type}s configured.</p>
          )}
          {assets.map(asset => (
            <div key={asset.id} className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={asset.name}
                      onChange={(e) => handleUpdateAsset(asset.id, { name: e.target.value })}
                      className="bg-transparent border-none p-0 font-bold text-on-surface focus:ring-0 w-full"
                    />
                    {asset.type === 'bank' && (
                      <button 
                        onClick={() => handleUpdateAsset(asset.id, { isSalaryAccount: !asset.isSalaryAccount })}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                          asset.isSalaryAccount 
                            ? "bg-secondary/20 text-secondary border border-secondary/20" 
                            : "bg-surface-container-high text-outline hover:text-on-surface"
                        )}
                        title={asset.isSalaryAccount ? "This is a Salary Account" : "Mark as Salary Account"}
                      >
                        <Banknote className="w-3 h-3" />
                        {asset.isSalaryAccount ? "Salary" : "Set Salary"}
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={asset.details}
                    onChange={(e) => handleUpdateAsset(asset.id, { details: e.target.value })}
                    placeholder="Details (e.g. Account number)"
                    className="bg-transparent border-none p-0 text-[10px] text-outline focus:ring-0 w-full"
                  />
                </div>
                <button 
                  onClick={() => handleDeleteAsset(asset.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-outline uppercase tracking-widest mb-1">Current Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-outline-variant font-bold">€</span>
                    <input 
                      type="number" 
                      value={
                        (() => {
                           const val = latestSnapshot ? (asset.type === 'bank' ? latestSnapshot.bankData[asset.id]?.b25 : latestSnapshot.brokerData[asset.id]?.balance) ?? asset.balance : asset.balance;
                           return val === 0 ? '' : val;
                        })()
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateAssetBalance(asset.id, val === '' ? 0 : Number(val));
                      }}
                      className="w-full bg-white border-none rounded-xl py-2 pl-7 pr-3 text-xs font-bold focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-2">Ledger Configuration</h1>
          <p className="text-on-surface-variant max-w-lg font-medium">Define your financial architecture. Add accounts, brokers, and pension funds to track your global equity.</p>
          <div className="flex flex-wrap gap-4 mt-6">
            {onReset && (
              <button 
                onClick={() => {
                  if (resetConfirm) {
                    onReset();
                    setResetConfirm(false);
                  } else {
                    setResetConfirm(true);
                    setTimeout(() => setResetConfirm(false), 3000);
                  }
                }}
                className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all px-3 py-1.5 rounded-lg ${
                  resetConfirm ? 'bg-error text-surface' : 'text-secondary hover:bg-secondary/10'
                }`}
              >
                <RefreshCw className={cn("w-3 h-3", resetConfirm && "animate-spin")} /> 
                {resetConfirm ? 'Confirm Reset?' : 'Load Spreadsheet Data'}
              </button>
            )}

            {onExport && (
              <button 
                onClick={onExport}
                className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant hover:text-on-surface tracking-widest uppercase transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container-high"
              >
                <Download className="w-3 h-3" /> Export JSON
              </button>
            )}

            {onImport && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
                  className="hidden" 
                  accept=".json"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant hover:text-on-surface tracking-widest uppercase transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container-high"
                >
                  <Upload className="w-3 h-3" /> Import JSON
                </button>
              </>
            )}
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl flex items-center gap-8 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">Salary Day</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-secondary" />
              <input 
                type="number" 
                min="1" 
                max="31"
                value={ledger.salaryDay || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdate({ salaryDay: val === '' ? 1 : Number(val) });
                }}
                className="w-12 bg-transparent border-none p-0 text-xl font-bold font-headline focus:ring-0"
              />
              <span className="text-xl font-bold font-headline">th</span>
            </div>
          </div>
          <div className="w-[1px] h-10 bg-outline-variant/30" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">Monthly Salary</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-headline">€</span>
                <input 
                  type="number" 
                  value={ledger.monthlySalary === 0 ? '' : (ledger.monthlySalary || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdate({ monthlySalary: val === '' ? 0 : Number(val) });
                  }}
                  className="w-24 bg-transparent border-none p-0 text-xl font-bold font-headline focus:ring-0"
                />
              </div>
              
              {calculatedSalary > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onUpdate({ monthlySalary: calculatedSalary })}
                    className={cn(
                      "group flex items-center gap-2 text-[10px] font-bold px-2 py-1.5 rounded uppercase tracking-wider transition-all",
                      ledger.monthlySalary === calculatedSalary 
                        ? "bg-secondary/20 text-secondary border border-secondary/20" 
                        : "bg-on-surface text-surface hover:bg-on-surface/90 shadow-lg shadow-on-surface/10"
                    )}
                    title="Click to apply calculated salary from latest snapshot"
                  >
                    <Sparkles className="w-3 h-3" />
                    {ledger.monthlySalary === calculatedSalary ? 'Synced' : `Apply Calc: €${calculatedSalary.toLocaleString('de-DE')}`}
                  </button>
                  
                  {/* Calculation Info */}
                  <div className="group relative">
                    <div className="p-1 hover:bg-surface-container-high rounded-full cursor-help">
                      <Calculator className="w-3.5 h-3.5 text-outline" />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-on-surface text-surface p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-2 border-b border-surface/10 pb-1">Calculation Logic</p>
                      <div className="space-y-1.5">
                        {salaryBreakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[10px]">
                            <span className="opacity-60">{item.name}:</span>
                            <span className="font-bold privacy-safe">€{item.delta.toLocaleString('de-DE')}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-[10px] pt-1 border-t border-surface/10 mt-1">
                          <span className="font-bold">Total:</span>
                          <span className="text-secondary privacy-safe">€{calculatedSalary.toLocaleString('de-DE')}</span>
                        </div>
                      </div>
                      <p className="text-[8px] mt-2 opacity-40 italic leading-tight">Sum of (B25 - B24) for all accounts marked as "Salary Account".</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Asset Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {renderAssetSection('bank', 'Bank Accounts', Landmark)}
          {renderAssetSection('pension', 'Pension Funds', PiggyBank)}
        </div>
        <div className="space-y-8">
          {renderAssetSection('broker', 'Brokerage Assets', TrendingUp)}
          
          <section className="bg-primary-container text-white p-8 rounded-2xl relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h2 className="text-lg font-headline font-bold mb-6 flex items-center gap-3">
                <Calculator className="w-5 h-5 text-secondary-container" />
                Ledger Logic
              </h2>
              <div className="space-y-6 font-mono text-xs opacity-90">
                <div className="flex justify-between border-b border-white/10 pb-3">
                  <span className="opacity-60">Expenses =</span>
                  <span className="text-secondary-container font-bold">Delta - Savings</span>
                </div>
                <p className="text-[10px] leading-relaxed italic opacity-60">
                  Your configuration defines the baseline. Monthly updates will calculate velocity based on the deltas between your snapshots.
                </p>
              </div>
            </div>
            <div className="absolute inset-0 emerald-gradient opacity-5 pointer-events-none" />
          </section>
        </div>
      </div>

      {/* Add Asset Modal Overlay */}
      {isAddingAsset && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-headline font-extrabold capitalize">Add {isAddingAsset}</h3>
              <button onClick={() => setIsAddingAsset(null)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Name</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder={`e.g. My ${isAddingAsset} Account`}
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Current Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant font-bold">€</span>
                  <input 
                    type="number" 
                    value={newAsset.balance === 0 ? '' : (newAsset.balance || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewAsset({ ...newAsset, balance: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Description / Details</label>
                <input 
                  type="text" 
                  value={newAsset.details}
                  onChange={(e) => setNewAsset({ ...newAsset, details: e.target.value })}
                  placeholder="e.g. IBAN, Account Type"
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-secondary/20 transition-all"
                />
              </div>

              <button 
                onClick={handleAddAsset}
                disabled={!newAsset.name}
                className="w-full bg-on-surface text-surface py-4 rounded-2xl font-bold text-xs tracking-widest uppercase shadow-xl hover:bg-on-surface/90 disabled:opacity-50 transition-all mt-4"
              >
                Confirm Addition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Policy */}
      <footer className="mt-24 pt-12 border-t border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Editorial Policy</h5>
            <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
              Financial data is treated as high-priority architectural records. We prioritize the preservation of historical velocity over real-time volatility.
            </p>
          </div>
          <div className="md:col-span-2 relative h-48 rounded-3xl overflow-hidden bg-surface-container-low group shadow-inner">
            <img 
              src="https://picsum.photos/seed/office/800/400" 
              className="w-full h-full object-cover opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700" 
              alt="Policy Background"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-surface-container-low via-transparent to-transparent">
              <Sparkles className="w-8 h-8 mb-3 text-secondary/40" />
              <p className="font-headline font-bold text-xl tracking-tight">Next Step: Portfolio Rebalancing</p>
              <p className="text-[10px] text-outline mt-2 italic font-medium">Once locked, Ledger logic will update your diversification targets.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
