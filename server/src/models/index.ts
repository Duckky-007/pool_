import mongoose, { Schema, Document, Types } from 'mongoose';

// ==========================================
// USER MODEL
// ==========================================
export interface IUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: 'investor' | 'company';
  wallet_balance: number;
  created_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['investor', 'company'], required: true },
    wallet_balance: { type: Number, default: 10000.0 }, // Starts at 10000 fake balance for demo
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

// ==========================================
// POOL MODEL
// ==========================================
export interface IPool extends Document {
  company_id: Types.ObjectId;
  title: string;
  description: string;
  target_amount: number;
  interest_rate_percent: number;
  duration_days: number;
  status: 'funding' | 'active' | 'repaying' | 'completed';
  total_shares: number;
  total_pool_value: number;
  funding_deadline: Date;
  borrowed_at?: Date | null;
  created_at: Date;
}

const PoolSchema = new Schema<IPool>(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    target_amount: { type: Number, required: true, min: 1 },
    interest_rate_percent: { type: Number, required: true, min: 0 },
    duration_days: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['funding', 'active', 'repaying', 'completed'],
      default: 'funding',
    },
    total_shares: { type: Number, default: 0.0 },
    total_pool_value: { type: Number, default: 0.0 },
    funding_deadline: { type: Date, required: true },
    borrowed_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Pool = mongoose.model<IPool>('Pool', PoolSchema);

// ==========================================
// INVESTMENT MODEL
// ==========================================
export interface IInvestment extends Document {
  pool_id: Types.ObjectId;
  investor_id: Types.ObjectId;
  amount_deposited: number;
  shares_received: number;
  created_at: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', required: true },
    investor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount_deposited: { type: Number, required: true, min: 1 },
    shares_received: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Investment = mongoose.model<IInvestment>('Investment', InvestmentSchema);

// ==========================================
// ASSET MODEL
// Scope rule: One pool funds exactly ONE asset.
// ==========================================
export interface IAsset extends Document {
  pool_id: Types.ObjectId;
  type: 'vehicle' | 'property' | 'other';
  name: string;
  description: string;
  status: 'active' | 'idle' | 'sold';
  registered_at: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', required: true, unique: true },
    type: { type: String, enum: ['vehicle', 'property', 'other'], required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'idle', 'sold'], default: 'active' },
    registered_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);

// ==========================================
// INCOME LOG MODEL
// ==========================================
export interface IIncomeLog extends Document {
  asset_id: Types.ObjectId;
  amount_earned: number;
  period_label: string;
  logged_by: Types.ObjectId;
  converted_to_repayment: boolean;
  created_at: Date;
}

const IncomeLogSchema = new Schema<IIncomeLog>(
  {
    asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    amount_earned: { type: Number, required: true, min: 1 },
    period_label: { type: String, required: true, trim: true },
    logged_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    converted_to_repayment: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const IncomeLog = mongoose.model<IIncomeLog>('IncomeLog', IncomeLogSchema);

// ==========================================
// REPAYMENT MODEL
// ==========================================
export interface IRepayment extends Document {
  pool_id: Types.ObjectId;
  amount: number;
  source_income_log_ids: Types.ObjectId[];
  created_at: Date;
}

const RepaymentSchema = new Schema<IRepayment>(
  {
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', required: true },
    amount: { type: Number, required: true, min: 1 },
    source_income_log_ids: [{ type: Schema.Types.ObjectId, ref: 'IncomeLog' }],
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Repayment = mongoose.model<IRepayment>('Repayment', RepaymentSchema);

// ==========================================
// TRANSACTION MODEL
// ==========================================
export interface ITransaction extends Document {
  user_id: Types.ObjectId;
  pool_id?: Types.ObjectId | null;
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  amount: number;
  created_at: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', default: null },
    type: { type: String, enum: ['deposit', 'withdraw', 'borrow', 'repay'], required: true },
    amount: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
