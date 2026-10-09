export interface User {
  id: string;
  name: string;
  email: string;
  role: 'investor' | 'company';
  wallet_balance: number;
}

export interface IncomeLog {
  id: string;
  asset_id: string;
  amount_earned: number;
  period_label: string;
  logged_by: { id: string; name: string; email: string } | string;
  converted_to_repayment: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  pool_id: string;
  type: 'vehicle' | 'property' | 'other';
  name: string;
  description: string;
  status: 'active' | 'idle' | 'sold';
  registered_at: string;
  income_logs?: IncomeLog[];
}

export interface Investment {
  id: string;
  pool_id: string;
  investor_id: string;
  investor?: { id: string; name: string; email: string };
  pool?: Pool;
  amount_deposited: number;
  shares_received: number;
  created_at: string;
  current_share_price?: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
  can_withdraw?: boolean;
}

export interface Repayment {
  id: string;
  pool_id: string;
  amount: number;
  source_income_log_ids: any[];
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  user?: { id: string; name: string; email: string; role: string };
  pool_id?: string | null;
  pool?: { id: string; title: string; status: string };
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  amount: number;
  created_at: string;
}

export interface Pool {
  id: string;
  company_id: string;
  company?: { id: string; name: string; email: string };
  title: string;
  description: string;
  target_amount: number;
  interest_rate_percent: number;
  duration_days: number;
  status: 'funding' | 'active' | 'repaying' | 'completed';
  total_shares: number;
  total_pool_value: number;
  funding_deadline: string;
  borrowed_at?: string | null;
  created_at: string;
  asset?: Asset | null;
  investments?: Investment[];
  repayments?: Repayment[];
  transactions?: Transaction[];
  current_share_price: number;
  progress_percent: number;
  investor_count?: number;
  total_repayments_made?: number;
  target_return?: number;
  can_borrow?: boolean;
}
