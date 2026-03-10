import { useState, useCallback } from 'react';
import './App.css';
import type { Assets, Liabilities, NisabStandard, ZakatResponse } from './types';
import { calculateZakat } from './api';
import { CURRENCIES } from './currencies';
import {
  Coins,
  Landmark,
  TrendingUp,
  Wallet,
  MinusCircle,
  Calculator,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Moon,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_ASSETS: Assets = {
  gold: 0,
  silver: 0,
  cash_on_hand: 0,
  cash_future_purpose: 0,
  receivables: 0,
  investments: 0,
  trade_goods_value: 0,
};

const DEFAULT_LIABILITIES: Liabilities = {
  borrowed_money: 0,
  wages_due: 0,
  immediate_expenses: 0,
};

function fmt(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  currency: string;
}

function NumberField({ label, hint, value, onChange, currency }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <p className="field-hint">{hint}</p>
      <div className="input-wrap">
        <span className="currency-badge">{currency}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value === 0 ? '' : value}
          placeholder="0.00"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="number-input"
        />
      </div>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  accent: string;
}

function Section({ icon, title, children, accent }: SectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`section accent-${accent}`}>
      <button className="section-header" onClick={() => setOpen((o) => !o)}>
        <span className="section-icon">{icon}</span>
        <span className="section-title">{title}</span>
        <ChevronDown
          size={18}
          className={`chevron ${open ? 'chevron-open' : ''}`}
        />
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

interface ResultCardProps {
  result: ZakatResponse;
}

function ResultCard({ result }: ResultCardProps) {
  const due = result.is_zakat_due;
  const noWealth = result.zakatable_wealth === 0;

  return (
    <div className={`result-card ${due ? 'result-due' : 'result-none'}`}>
      <div className="result-icon-wrap">
        {noWealth ? (
          <AlertCircle size={40} />
        ) : due ? (
          <CheckCircle size={40} />
        ) : (
          <XCircle size={40} />
        )}
      </div>

      <p className="result-message">{result.message}</p>

      <div className="result-grid">
        <ResultRow label="Total Assets" value={fmt(result.total_assets, result.currency)} />
        <ResultRow label="Total Liabilities" value={fmt(result.total_liabilities, result.currency)} />
        <ResultRow
          label="Zakatable Wealth"
          value={fmt(result.zakatable_wealth, result.currency)}
          highlight
        />
        <ResultRow
          label="Nisab Threshold"
          value={`${fmt(result.nisab_threshold, result.currency)} (${result.nisab_basis}g)`}
        />
        <ResultRow
          label="Zakat Due"
          value={fmt(result.zakat_due, result.currency)}
          highlight={due}
          accent={due}
        />
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`result-row ${highlight ? 'result-row-highlight' : ''} ${accent ? 'result-row-accent' : ''}`}>
      <span className="result-row-label">{label}</span>
      <span className="result-row-value">{value}</span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function App() {
  const [assets, setAssets] = useState<Assets>(DEFAULT_ASSETS);
  const [liabilities, setLiabilities] = useState<Liabilities>(DEFAULT_LIABILITIES);
  const [nisab, setNisab] = useState<NisabStandard>('GOLD');
  const [currency, setCurrency] = useState('USD');
  const [currencySearch, setCurrencySearch] = useState('');
  const [result, setResult] = useState<ZakatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAsset = useCallback(
    (key: keyof Assets) => (v: number) => setAssets((a) => ({ ...a, [key]: v })),
    []
  );
  const setLiability = useCallback(
    (key: keyof Liabilities) => (v: number) => setLiabilities((l) => ({ ...l, [key]: v })),
    []
  );

  const reset = () => {
    setAssets(DEFAULT_ASSETS);
    setLiabilities(DEFAULT_LIABILITIES);
    setNisab('GOLD');
    setCurrency('USD');
    setCurrencySearch('');
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await calculateZakat({ assets, liabilities, nisab, currency });
      setResult(res);
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const selectedCurrencyName = CURRENCIES.find((c) => c.code === currency)?.name ?? currency;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <Moon size={28} className="brand-icon" />
            <div>
              <h1 className="brand-title">Zakat Calculator</h1>
              <p className="brand-sub">Real-time gold &amp; silver prices · 150+ currencies</p>
            </div>
          </div>
          <button className="btn-ghost" onClick={reset} title="Reset form">
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} noValidate>
          {/* ── Currency & Nisab ── */}
          <div className="top-row">
            {/* Currency picker */}
            <div className="top-card">
              <label className="top-card-label">
                <Wallet size={15} />
                Currency
              </label>
              <div className="currency-selected">{currency} — {selectedCurrencyName}</div>
              <input
                type="text"
                className="currency-search"
                placeholder="Search currencies…"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
              />
              <div className="currency-list">
                {filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className={`currency-option ${c.code === currency ? 'currency-option-active' : ''}`}
                    onClick={() => { setCurrency(c.code); setCurrencySearch(''); }}
                  >
                    <span className="currency-code">{c.code}</span>
                    <span className="currency-name">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nisab standard */}
            <div className="top-card">
              <label className="top-card-label">
                <Coins size={15} />
                Nisab Standard
              </label>
              <p className="nisab-desc">
                Choose which precious metal sets your Nisab threshold. The API fetches live market prices.
              </p>
              <div className="nisab-options">
                <button
                  type="button"
                  className={`nisab-btn ${nisab === 'GOLD' ? 'nisab-btn-active' : ''}`}
                  onClick={() => setNisab('GOLD')}
                >
                  <span className="nisab-dot nisab-dot-gold" />
                  Gold
                  <span className="nisab-grams">87.48 g</span>
                </button>
                <button
                  type="button"
                  className={`nisab-btn ${nisab === 'SILVER' ? 'nisab-btn-active' : ''}`}
                  onClick={() => setNisab('SILVER')}
                >
                  <span className="nisab-dot nisab-dot-silver" />
                  Silver
                  <span className="nisab-grams">612.36 g</span>
                </button>
              </div>
              <div className="nisab-info">
                <AlertCircle size={13} />
                <span>
                  {nisab === 'GOLD'
                    ? 'Gold Nisab is typically higher — stricter threshold.'
                    : 'Silver Nisab is typically lower — more inclusive threshold.'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Assets ── */}
          <Section icon={<TrendingUp size={18} />} title="Assets" accent="green">
            <div className="fields-grid">
              <NumberField label="Gold" hint="Market value of gold owned" value={assets.gold} onChange={setAsset('gold')} currency={currency} />
              <NumberField label="Silver" hint="Market value of silver owned" value={assets.silver} onChange={setAsset('silver')} currency={currency} />
              <NumberField label="Cash on Hand" hint="Cash in hand, bank accounts &amp; savings" value={assets.cash_on_hand} onChange={setAsset('cash_on_hand')} currency={currency} />
              <NumberField label="Cash (Future Purpose)" hint="Savings set aside for a future goal (e.g. Hajj)" value={assets.cash_future_purpose} onChange={setAsset('cash_future_purpose')} currency={currency} />
              <NumberField label="Receivables" hint="Money lent out that is expected to be returned" value={assets.receivables} onChange={setAsset('receivables')} currency={currency} />
              <NumberField label="Investments" hint="Stocks, business equity, certificates of deposit" value={assets.investments} onChange={setAsset('investments')} currency={currency} />
              <NumberField label="Trade Goods Value" hint="Market value of goods held for trade or sale" value={assets.trade_goods_value} onChange={setAsset('trade_goods_value')} currency={currency} />
            </div>

            <div className="section-total">
              <Landmark size={14} />
              Total Assets:&nbsp;
              <strong>{fmt(Object.values(assets).reduce((s, v) => s + v, 0), currency)}</strong>
            </div>
          </Section>

          {/* ── Liabilities ── */}
          <Section icon={<MinusCircle size={18} />} title="Liabilities" accent="red">
            <div className="fields-grid">
              <NumberField label="Borrowed Money" hint="Loans or credit currently owed" value={liabilities.borrowed_money} onChange={setLiability('borrowed_money')} currency={currency} />
              <NumberField label="Wages Due" hint="Wages owed to employees" value={liabilities.wages_due} onChange={setLiability('wages_due')} currency={currency} />
              <NumberField label="Immediate Expenses" hint="Bills, rent, or taxes due imminently" value={liabilities.immediate_expenses} onChange={setLiability('immediate_expenses')} currency={currency} />
            </div>

            <div className="section-total">
              <Landmark size={14} />
              Total Liabilities:&nbsp;
              <strong>{fmt(Object.values(liabilities).reduce((s, v) => s + v, 0), currency)}</strong>
            </div>
          </Section>

          {/* ── Submit ── */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <RefreshCw size={18} className="spin" />
                Fetching live prices…
              </>
            ) : (
              <>
                <Calculator size={18} />
                Calculate Zakat
              </>
            )}
          </button>
        </form>

        {/* ── Error ── */}
        {error && (
          <div className="error-banner" id="result-section">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div id="result-section">
            <ResultCard result={result} />
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="footer">
          Powered by&nbsp;<a href="https://goldapi.io" target="_blank" rel="noreferrer">goldapi.io</a>&nbsp;
          &amp;&nbsp;<a href="https://app.currencyapi.net" target="_blank" rel="noreferrer">currencyapi.net</a>
          &nbsp;· All monetary values are in the selected currency at live exchange rates.
        </footer>
      </main>
    </div>
  );
}
