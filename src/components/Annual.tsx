import React, { useState, Fragment } from 'react';
import { 
  ArrowDownToLine, 
  Plus,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  X,
  Save,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { LedgerState, MonthlySnapshot } from '../types';
import { cn } from '../lib/utils';

interface AnnualProps {
  ledger: LedgerState;
  onUpdate: (newState: Partial<LedgerState>) => void;
  onReset?: () => void;
  showAddModal?: boolean;
  setShowAddModal?: (show: boolean) => void;
}

export default function Annual({ ledger, onUpdate, onReset, showAddModal, setShowAddModal }: AnnualProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<MonthlySnapshot | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const banks = ledger.assets.filter(a => a.type === 'bank');
  const brokers = ledger.assets.filter(a => a.type === 'broker' || a.type === 'pension');

  const snapshots = ledger.snapshots || [];
  const availableYears = React.useMemo(() => 
    Array.from(new Set(snapshots.map(s => s.year))).sort((a, b) => a - b),
    [snapshots]
  );
  
  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  React.useEffect(() => {
    if (showAddModal) {
      handleAddMonth();
      if (setShowAddModal) setShowAddModal(false);
    }
  }, [showAddModal]);

  function handleAddMonth() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();

    // Check if snapshot for current month already exists
    const existing = (ledger.snapshots || []).find(s => s.month === currentMonth && s.year === currentYear);
    
    if (existing) {
      setModalError(null);
      setEditingSnapshot({ ...existing });
      setIsModalOpen(true);
      return;
    }

    const newSnapshot: MonthlySnapshot = {
      id: Math.random().toString(36).substr(2, 9),
      month: currentMonth,
      year: currentYear,
      bankData: {},
      brokerData: {}
    };

    banks.forEach(b => {
      newSnapshot.bankData[b.id] = { b24: 0, b25: 0 };
    });
    
    brokers.forEach(br => {
      newSnapshot.brokerData[br.id] = { 
        balance: 0, 
        recurringContribution: 0, 
        extraContribution: 0, 
        contribution: 0 
      };
    });

    setModalError(null);
    setEditingSnapshot(newSnapshot);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingSnapshot) return;

    const snapshots = ledger.snapshots || [];
    
    // Check for duplicate month/year with DIFFERENT ID
    const duplicate = snapshots.find(s => 
      s.id !== editingSnapshot.id && 
      s.month === editingSnapshot.month && 
      s.year === editingSnapshot.year
    );

    if (duplicate) {
      setModalError(`A record for ${editingSnapshot.month} ${editingSnapshot.year} already exists.`);
      return;
    }

    const existingIdx = snapshots.findIndex(s => s.id === editingSnapshot.id);
    let newSnapshots = [...snapshots];

    if (existingIdx >= 0) {
      newSnapshots[existingIdx] = editingSnapshot;
    } else {
      newSnapshots.push(editingSnapshot);
    }

    // Sort snapshots by year and month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    newSnapshots.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

    // Calculate salary from this snapshot
    let totalSalary = 0;
    Object.values(editingSnapshot.bankData || {}).forEach((d: { b24: number; b25: number }) => {
      totalSalary += (d.b25 - d.b24);
    });

    const isLatest = newSnapshots.length > 0 && newSnapshots[newSnapshots.length - 1].id === editingSnapshot.id;
    
    if (isLatest && totalSalary > 0) {
      onUpdate({ snapshots: newSnapshots, monthlySalary: totalSalary });
    } else {
      onUpdate({ snapshots: newSnapshots });
    }
    setIsModalOpen(false);
    setEditingSnapshot(null);
  };

  const calculateRowData = (snapshot: MonthlySnapshot, index: number) => {
    const snapshots = ledger.snapshots || [];
    const prevSnapshot = snapshots[index - 1];

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalContributions = 0;
    let totalWealth = 0;

    banks.forEach(b => {
      const data = snapshot.bankData[b.id] || { b24: 0, b25: 0 };
      totalIncome += (data.b25 - data.b24);
      
      if (prevSnapshot) {
        const prevData = prevSnapshot.bankData[b.id] || { b24: 0, b25: 0 };
        // Expenses of current month = B25 of previous month - B24 of current month
        totalExpenses += (prevData.b25 - data.b24);
      }
      
      totalWealth += data.b25;
    });

    brokers.forEach(br => {
      const data = snapshot.brokerData[br.id] || { balance: 0, contribution: 0 };
      totalContributions += data.contribution;
      totalWealth += data.balance;
    });

    let prevWealth = 0;
    if (prevSnapshot) {
      banks.forEach(b => {
        prevWealth += (prevSnapshot.bankData[b.id]?.b25 || 0);
      });
      brokers.forEach(br => {
        prevWealth += (prevSnapshot.brokerData[br.id]?.balance || 0);
      });
    }

    const delta = prevWealth > 0 ? totalWealth - prevWealth : 0;

    return {
      income: totalIncome,
      expenses: totalExpenses,
      contributions: totalContributions,
      wealth: totalWealth,
      delta,
      realExpenses: totalExpenses - totalContributions
    };
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-2">Monthly Ledger</h1>
          <p className="text-on-surface-variant font-medium">Replicating your Excel architecture for precise tracking.</p>
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
              className={`mt-2 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all px-3 py-1.5 rounded-lg ${
                resetConfirm ? 'bg-error text-surface' : 'text-secondary hover:bg-secondary/10'
              }`}
            >
              <RefreshCw className={cn("w-3 h-3", resetConfirm && "animate-spin")} /> 
              {resetConfirm ? 'Confirm Reset?' : 'Load Spreadsheet Data'}
            </button>
          )}
        </div>
      </section>

      {/* Year Selector */}
      {availableYears.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                "px-6 py-2 rounded-xl font-bold text-xs tracking-widest uppercase transition-all border",
                selectedYear === year 
                  ? "bg-on-surface text-surface border-on-surface shadow-lg" 
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-high"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-surface-container-lowest rounded-2xl lg:rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px] lg:min-w-[1200px]">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sticky left-0 bg-surface-container-low/50 z-10">Month</th>
                {banks.map(b => (
                  <th key={b.id} colSpan={5} className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center border-x border-outline-variant/10">
                    {b.name}
                  </th>
                ))}
                {brokers.map(br => (
                  <th key={br.id} colSpan={2} className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center border-x border-outline-variant/10">
                    {br.name}
                  </th>
                ))}
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-secondary text-right border-l border-outline-variant/10">Summary</th>
                <th colSpan={3} className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right"></th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right border-l border-outline-variant/10">Total Wealth</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Delta</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Actions</th>
              </tr>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                <th className="px-6 py-2 text-[8px] font-bold text-outline uppercase sticky left-0 bg-surface-container-low/30 z-10"></th>
                {banks.map(b => (
                  <React.Fragment key={b.id}>
                    <th className="px-2 py-2 text-[8px] font-bold text-outline uppercase text-right">24th</th>
                    <th className="px-2 py-2 text-[8px] font-bold text-outline uppercase text-right">25th</th>
                    <th className="px-2 py-2 text-[8px] font-bold text-outline uppercase text-right">Inc</th>
                    <th className="px-2 py-2 text-[8px] font-bold text-outline uppercase text-right">Exp</th>
                    <th className="px-2 py-2 text-[8px] font-bold text-outline uppercase text-right border-r border-outline-variant/10">Net</th>
                  </React.Fragment>
                ))}
                {brokers.map(br => (
                  <React.Fragment key={br.id}>
                    <th className="px-2 py-2 text-[8px] font-bold text-outline uppercase text-right">Worth</th>
                    <th className="px-2 py-2 text-[8px] font-bold text-outline uppercase text-right border-r border-outline-variant/10">Contr</th>
                  </React.Fragment>
                ))}
                {/* Summary Headers */}
                <th className="px-2 py-2 text-[8px] font-bold text-secondary uppercase text-right border-l border-outline-variant/10">Inc</th>
                <th className="px-2 py-2 text-[8px] font-bold text-error uppercase text-right">Real Exp</th>
                <th className="px-2 py-2 text-[8px] font-bold text-secondary uppercase text-right">Net Save</th>
                
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {snapshots.map((s, i) => {
                if (s.year !== selectedYear) return null;
                const row = calculateRowData(s, i);
                return (
                  <tr 
                    key={s.id} 
                    className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                    onClick={() => {
                      setEditingSnapshot(s);
                      setModalError(null);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-3 lg:px-6 py-3 lg:py-4 font-headline font-bold text-[11px] lg:text-sm text-on-surface sticky left-0 bg-surface-container-lowest group-hover:bg-surface-container-low transition-colors z-10">
                      {s.month} {s.year}
                    </td>
                    {banks.map(b => {
                      const data = s.bankData[b.id] || { b24: 0, b25: 0 };
                      const income = data.b25 - data.b24;
                      const prevS = (ledger.snapshots || [])[i-1];
                      const exp = prevS ? (prevS.bankData[b.id]?.b25 || 0) - data.b24 : 0;
                      return (
                        <React.Fragment key={b.id}>
                          <td className="px-2 py-4 text-[11px] text-right tabular-nums privacy-safe">€{data.b24.toLocaleString('de-DE')}</td>
                          <td className="px-2 py-4 text-[11px] text-right tabular-nums privacy-safe">€{data.b25.toLocaleString('de-DE')}</td>
                          <td className="px-2 py-4 text-[11px] text-right tabular-nums text-secondary font-medium privacy-safe">€{income.toLocaleString('de-DE')}</td>
                          <td className={`px-2 py-4 text-[11px] text-right tabular-nums font-medium privacy-safe ${exp > 0 ? 'text-error' : 'text-secondary'}`}>€{exp.toLocaleString('de-DE')}</td>
                          <td className="px-2 py-4 text-[11px] text-right tabular-nums border-r border-outline-variant/10 privacy-safe">€{(income - exp).toLocaleString('de-DE')}</td>
                        </React.Fragment>
                      );
                    })}
                    {brokers.map(br => {
                      const data = s.brokerData[br.id] || { balance: 0, contribution: 0 };
                      return (
                        <React.Fragment key={br.id}>
                          <td className="px-2 py-4 text-[11px] text-right tabular-nums privacy-safe">€{data.balance.toLocaleString('de-DE')}</td>
                          <td className="px-2 py-4 text-[11px] text-right tabular-nums text-on-surface-variant border-r border-outline-variant/10 privacy-safe">€{data.contribution.toLocaleString('de-DE')}</td>
                        </React.Fragment>
                      );
                    })}
                    {/* Summary Data */}
                    <td className="px-2 py-4 text-[11px] text-right tabular-nums text-secondary font-bold border-l border-outline-variant/10 privacy-safe">€{row.income.toLocaleString('de-DE')}</td>
                    <td className="px-2 py-4 text-[11px] text-right tabular-nums text-error font-bold privacy-safe">€{row.realExpenses.toLocaleString('de-DE')}</td>
                    <td className="px-2 py-4 text-[11px] text-right tabular-nums text-secondary font-bold border-r border-outline-variant/10 privacy-safe">€{(row.income - row.realExpenses).toLocaleString('de-DE')}</td>

                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-right font-bold tabular-nums border-l border-outline-variant/10 privacy-safe">€{row.wealth.toLocaleString('de-DE')}</td>
                    <td className={`px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-right font-bold tabular-nums privacy-safe ${row.delta >= 0 ? 'text-secondary' : 'text-error'}`}>
                      {row.delta >= 0 ? '+' : ''}€{row.delta.toLocaleString('de-DE')}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSnapshot(s);
                            setModalError(null);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deleteConfirmId === s.id) {
                              onUpdate({ snapshots: (ledger.snapshots || []).filter(snap => snap.id !== s.id) });
                              setDeleteConfirmId(null);
                            } else {
                              setDeleteConfirmId(s.id);
                              // Auto-reset after 3 seconds
                              setTimeout(() => setDeleteConfirmId(null), 3000);
                            }
                          }}
                          className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
                            deleteConfirmId === s.id 
                              ? 'bg-error text-surface px-3' 
                              : 'text-error hover:bg-error/10'
                          }`}
                          title={deleteConfirmId === s.id ? "Confirm Delete" : "Delete Record"}
                        >
                          <X className="w-4 h-4" />
                          {deleteConfirmId === s.id && <span className="text-[10px] font-bold uppercase">Confirm?</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAB - removed from here because it's now in App.tsx globally */}

      {/* Modal */}
      {isModalOpen && editingSnapshot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-surface rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-2xl font-headline font-bold">Monthly Snapshot</h2>
                  <p className="text-sm text-on-surface-variant font-medium">Record your financial status</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={editingSnapshot.month}
                    onChange={(e) => {
                      const newMonth = e.target.value;
                      const existing = (ledger.snapshots || []).find(s => s.month === newMonth && s.year === editingSnapshot.year);
                      if (existing) {
                        setEditingSnapshot({ ...existing });
                      } else {
                        const newSnap: MonthlySnapshot = {
                          id: Math.random().toString(36).substr(2, 9),
                          month: newMonth,
                          year: editingSnapshot.year,
                          bankData: {},
                          brokerData: {}
                        };
                        banks.forEach(b => { newSnap.bankData[b.id] = { b24: 0, b25: 0 }; });
                        brokers.forEach(br => { newSnap.brokerData[br.id] = { balance: 0, recurringContribution: 0, extraContribution: 0, contribution: 0 }; });
                        setEditingSnapshot(newSnap);
                      }
                      setModalError(null);
                    }}
                    className="bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-secondary/20"
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={editingSnapshot.year}
                    onChange={(e) => {
                      const newYear = Number(e.target.value);
                      const existing = (ledger.snapshots || []).find(s => s.month === editingSnapshot.month && s.year === newYear);
                      if (existing) {
                        setEditingSnapshot({ ...existing });
                      } else {
                        const newSnap: MonthlySnapshot = {
                          id: Math.random().toString(36).substr(2, 9),
                          month: editingSnapshot.month,
                          year: newYear,
                          bankData: {},
                          brokerData: {}
                        };
                        banks.forEach(b => { newSnap.bankData[b.id] = { b24: 0, b25: 0 }; });
                        brokers.forEach(br => { newSnap.brokerData[br.id] = { balance: 0, recurringContribution: 0, extraContribution: 0, contribution: 0 }; });
                        setEditingSnapshot(newSnap);
                      }
                      setModalError(null);
                    }}
                    className="bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-secondary/20"
                  >
                    {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-10">
              {modalError && (
                <div className="bg-error/10 border border-error/20 p-4 rounded-2xl flex items-center gap-3 text-error animate-in fade-in slide-in-from-top-2">
                  <X className="w-5 h-5" />
                  <p className="text-sm font-bold">{modalError}</p>
                </div>
              )}
              {/* Banks Section */}
              <section>
                <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Calculator className="w-3 h-3" />
                  Bank Balances (24th & 25th)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {banks.map(b => (
                    <div key={b.id} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                      <p className="text-sm font-bold mb-4">{b.name}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-outline uppercase">24th Balance</label>
                          <input 
                            type="number"
                            value={editingSnapshot.bankData[b.id]?.b24 === 0 ? '' : (editingSnapshot.bankData[b.id]?.b24 || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingSnapshot({
                                ...editingSnapshot,
                                bankData: {
                                  ...editingSnapshot.bankData,
                                  [b.id]: { ...editingSnapshot.bankData[b.id], b24: val === '' ? 0 : Number(val) }
                                }
                              });
                            }}
                            className="w-full bg-surface border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-outline uppercase">25th Balance</label>
                          <input 
                            type="number"
                            value={editingSnapshot.bankData[b.id]?.b25 === 0 ? '' : (editingSnapshot.bankData[b.id]?.b25 || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingSnapshot({
                                ...editingSnapshot,
                                bankData: {
                                  ...editingSnapshot.bankData,
                                  [b.id]: { ...editingSnapshot.bankData[b.id], b25: val === '' ? 0 : Number(val) }
                                }
                              });
                            }}
                            className="w-full bg-surface border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Brokers Section */}
              <section>
                <h3 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Broker & Pension Performance
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {brokers.map(br => (
                    <div key={br.id} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                      <p className="text-sm font-bold mb-4">{br.name}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-outline uppercase">End of Month Worth</label>
                          <input 
                            type="number"
                            value={editingSnapshot.brokerData[br.id]?.balance === 0 ? '' : (editingSnapshot.brokerData[br.id]?.balance || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingSnapshot({
                                ...editingSnapshot,
                                brokerData: {
                                  ...editingSnapshot.brokerData,
                                  [br.id]: { ...editingSnapshot.brokerData[br.id], balance: val === '' ? 0 : Number(val) }
                                }
                              });
                            }}
                            className="w-full bg-surface border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-outline uppercase">Recurring Contribution</label>
                          <input 
                            type="number"
                            value={editingSnapshot.brokerData[br.id]?.recurringContribution === 0 ? '' : (editingSnapshot.brokerData[br.id]?.recurringContribution || '')}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              const extra = editingSnapshot.brokerData[br.id]?.extraContribution || 0;
                              setEditingSnapshot({
                                ...editingSnapshot,
                                brokerData: {
                                  ...editingSnapshot.brokerData,
                                  [br.id]: { 
                                    ...editingSnapshot.brokerData[br.id], 
                                    recurringContribution: val,
                                    contribution: val + extra
                                  }
                                }
                              });
                            }}
                            className="w-full bg-surface border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-outline uppercase">Extra Contribution</label>
                          <input 
                            type="number"
                            value={editingSnapshot.brokerData[br.id]?.extraContribution === 0 ? '' : (editingSnapshot.brokerData[br.id]?.extraContribution || '')}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              const recurring = editingSnapshot.brokerData[br.id]?.recurringContribution || 0;
                              setEditingSnapshot({
                                ...editingSnapshot,
                                brokerData: {
                                  ...editingSnapshot.brokerData,
                                  [br.id]: { 
                                    ...editingSnapshot.brokerData[br.id], 
                                    extraContribution: val,
                                    contribution: val + recurring
                                  }
                                }
                              });
                            }}
                            className="w-full bg-surface border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-secondary/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-outline-variant/10 flex justify-end gap-4 sticky bottom-0 bg-surface">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bg-on-surface text-surface px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
              >
                <Save className="w-4 h-4" />
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

