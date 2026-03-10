export interface Assets {
  gold: number;
  silver: number;
  cash_on_hand: number;
  cash_future_purpose: number;
  receivables: number;
  investments: number;
  trade_goods_value: number;
}

export interface Liabilities {
  borrowed_money: number;
  wages_due: number;
  immediate_expenses: number;
}

export type NisabStandard = 'GOLD' | 'SILVER';

export interface ZakatRequest {
  assets: Assets;
  liabilities: Liabilities;
  nisab: NisabStandard;
  currency: string;
}

export interface ZakatResponse {
  total_assets: number;
  total_liabilities: number;
  zakatable_wealth: number;
  nisab_threshold: number;
  currency: string;
  zakat_due: number;
  is_zakat_due: boolean;
  message: string;
  nisab_basis: number;
}

export interface ApiError {
  error: string;
}

export interface Currency {
  code: string;
  name: string;
}
