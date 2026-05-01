import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  PieChart, 
  Settings as SettingsIcon, 
  Search, 
  Bell, 
  User,
  Plus,
  Banknote,
  TrendingUp,
  Moon,
  Sun,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from './lib/utils';
import Overview from './components/Overview';
import Annual from './components/Annual';
import Portfolio from './components/Portfolio';
import Settings from './components/Settings';
import { Asset, LedgerState } from './types';

const INITIAL_STATE: LedgerState = {
  assets: [
    { id: '1', name: 'ABN AMRO', type: 'bank', balance: 7722.00, details: 'Primary Checking', color: 'bg-secondary', isSalaryAccount: true },
    { id: '2', name: 'Scalable', type: 'broker', balance: 160000.00, details: 'ETF Portfolio', color: 'bg-on-surface' },
    { id: '3', name: 'Trade rep.', type: 'broker', balance: 1600.00, details: 'Stocks', color: 'bg-black' },
    { id: '4', name: 'Equatplus', type: 'broker', balance: 0, details: 'Equity', color: 'bg-primary-container' },
    { id: '5', name: 'Scalable savings', type: 'broker', balance: 20000.00, details: 'Savings Plan', color: 'bg-secondary-container' },
    { id: '6', name: 'Savings', type: 'bank', balance: 13202.00, details: 'Emergency Fund', color: 'bg-on-secondary-container' },
  ],
  salaryDay: 25,
  monthlySalary: 5103.00,
  snapshots: [
    {
      id: 'jan-2026',
      month: 'Jan',
      year: 2026,
      bankData: { 
        '1': { b24: 5000, b25: 9455 },
        '6': { b24: 0, b25: 30847 }
      },
      brokerData: { 
        '2': { balance: 135200, recurringContribution: 713, extraContribution: 0, contribution: 713 },
        '3': { balance: 1600, recurringContribution: 0, extraContribution: 0, contribution: 0 },
        '4': { balance: 14152, recurringContribution: 0, extraContribution: 0, contribution: 0 },
        '5': { balance: 0, recurringContribution: 0, extraContribution: 0, contribution: 0 }
      }
    },
    {
      id: 'feb-2026',
      month: 'Feb',
      year: 2026,
      bankData: { 
        '1': { b24: 2556, b25: 17712 },
        '6': { b24: 0, b25: 34202 }
      },
      brokerData: { 
        '2': { balance: 153423, recurringContribution: 1215, extraContribution: 13400, contribution: 14615 },
        '3': { balance: 1600, recurringContribution: 0, extraContribution: 0, contribution: 0 },
        '4': { balance: 0, recurringContribution: 0, extraContribution: 0, contribution: 0 },
        '5': { balance: 0, recurringContribution: 0, extraContribution: 0, contribution: 0 }
      }
    },
    {
      id: 'mar-2026',
      month: 'Mar',
      year: 2026,
      bankData: { 
        '1': { b24: 2619, b25: 7722 },
        '6': { b24: 0, b25: 13202 }
      },
      brokerData: { 
        '2': { balance: 160000, recurringContribution: 1383, extraContribution: 13000, contribution: 14383 },
        '3': { balance: 1600, recurringContribution: 0, extraContribution: 0, contribution: 0 },
        '4': { balance: 0, recurringContribution: 0, extraContribution: 0, contribution: 0 },
        '5': { balance: 20000, recurringContribution: 0, extraContribution: 0, contribution: 0 }
      }
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'bank' | 'broker'>('all');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved === 'true';
  });
  const [privacyMode, setPrivacyMode] = useState(() => {
    const saved = localStorage.getItem('privacy_mode');
    return saved === 'true';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [ledger, setLedger] = useState<LedgerState>(() => {
    const saved = localStorage.getItem('ledger_state');
    let state = INITIAL_STATE;
    if (saved) {
      try {
        state = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse ledger from localStorage', e);
        state = INITIAL_STATE;
      }
    }
    // Ensure snapshots and assets exist for backward compatibility
    if (!state.snapshots) state.snapshots = [];
    if (!state.assets) state.assets = [];
    return state;
  });

  useEffect(() => {
    localStorage.setItem('ledger_state', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    if (privacyMode) {
      document.documentElement.classList.add('privacy-mode');
    } else {
      document.documentElement.classList.remove('privacy-mode');
    }
    localStorage.setItem('privacy_mode', privacyMode.toString());
  }, [privacyMode]);

  const updateLedger = (newState: Partial<LedgerState>) => {
    setLedger(prev => ({ ...prev, ...newState }));
  };

  const resetLedger = () => {
    setLedger(INITIAL_STATE);
    localStorage.setItem('ledger_state', JSON.stringify(INITIAL_STATE));
  };

  const exportLedger = () => {
    const dataStr = JSON.stringify(ledger, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ledger_export_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importLedger = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedState = JSON.parse(content);
        // Basic validation
        if (importedState.assets && importedState.snapshots) {
          setLedger(importedState);
          localStorage.setItem('ledger_state', JSON.stringify(importedState));
          alert('Data imported successfully');
        } else {
          alert('Invalid ledger file format');
        }
      } catch (err) {
        alert('Error parsing ledger file');
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'annual', label: 'Annual', icon: CalendarDays },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface text-on-surface font-sans selection:bg-secondary/30">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-72 border-r border-outline-variant/10 flex-col sticky top-0 h-screen bg-surface-container-lowest/50 backdrop-blur-xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-on-surface rounded-xl flex items-center justify-center shadow-lg shadow-on-surface/10">
              <TrendingUp className="w-6 h-6 text-surface" />
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tight">Ledger.</span>
          </div>

          <nav className="space-y-10">
            <div>
              <h3 className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-6 px-4">Assets</h3>
              <div className="space-y-1">
                <button 
                  onClick={() => {
                    setActiveTab('portfolio');
                    setPortfolioFilter('bank');
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-all group"
                >
                  <Banknote className="w-4 h-4 text-outline group-hover:text-secondary transition-colors" />
                  Bank Accounts
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('portfolio');
                    setPortfolioFilter('broker');
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-all group"
                >
                  <TrendingUp className="w-4 h-4 text-outline group-hover:text-secondary transition-colors" />
                  Brokers
                </button>
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-outline-variant/10">
          <div className="bg-surface-container-high rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">LL</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Leonardo L.</span>
              <span className="text-[10px] text-outline font-medium">Premium Tier</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 px-4 lg:px-12 py-4 lg:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-12 w-full lg:w-auto">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-on-surface rounded-lg flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-surface" />
              </div>
              <span className="font-headline font-extrabold text-lg tracking-tight">Ledger.</span>
            </div>
            <nav className="hidden lg:flex items-center gap-2 bg-surface-container-low p-1 rounded-full border border-outline-variant/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 tracking-wide
                    ${activeTab === tab.id 
                      ? 'bg-on-surface text-surface shadow-lg shadow-on-surface/10' 
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}
                  `}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className="p-2.5 rounded-full bg-surface-container-low text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-all border border-outline-variant/10"
              title={privacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full bg-surface-container-low text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-all border border-outline-variant/10"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-secondary transition-colors" />
              <input 
                type="text" 
                placeholder="Search ledger..." 
                className="bg-surface-container-low border-none rounded-full py-2.5 pl-11 pr-6 text-xs font-medium w-64 focus:ring-2 focus:ring-secondary/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors relative">
                <Bell className="w-5 h-5 text-on-surface-variant" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-surface" />
              </button>
              <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <User className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-12 overflow-y-auto hide-scrollbar flex-1">
          {activeTab === 'overview' && <Overview ledger={ledger} onUpdate={updateLedger} darkMode={darkMode} />}
          {activeTab === 'annual' && (
            <Annual 
              ledger={ledger} 
              onUpdate={updateLedger} 
              onReset={resetLedger} 
              showAddModal={showAddModal} 
              setShowAddModal={setShowAddModal} 
            />
          )}
          {activeTab === 'portfolio' && <Portfolio ledger={ledger} filter={portfolioFilter} onFilterChange={setPortfolioFilter} onUpdate={updateLedger} darkMode={darkMode} />}
          {activeTab === 'settings' && (
            <Settings 
              ledger={ledger} 
              onUpdate={updateLedger} 
              onReset={resetLedger} 
              onExport={exportLedger}
              onImport={importLedger}
            />
          )}
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 px-6 py-3 flex items-center justify-between z-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                activeTab === tab.id ? "text-on-surface" : "text-on-surface-variant opacity-60"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all",
                activeTab === tab.id ? "bg-on-surface/5" : ""
              )}>
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-secondary" : "")} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* FAB - Global for Add Record */}
        <button 
          onClick={() => {
            setActiveTab('annual');
            setShowAddModal(true);
          }}
          className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 w-14 h-14 lg:w-16 lg:h-16 bg-on-surface text-surface rounded-2xl shadow-2xl shadow-on-surface/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
        >
          <Plus className="w-7 h-7 lg:w-8 lg:h-8 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </main>
    </div>
  );
}
