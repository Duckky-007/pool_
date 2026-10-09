import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['investor', 'company'], required: true },
    wallet_balance: { type: Number, default: 10000.0 }, // Starts at 10000 fake balance for demo
    created_at: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        },
    },
});
export const User = mongoose.model('User', UserSchema);
const PoolSchema = new Schema({
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
}, {
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        },
    },
});
export const Pool = mongoose.model('Pool', PoolSchema);
const InvestmentSchema = new Schema({
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', required: true },
    investor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount_deposited: { type: Number, required: true, min: 1 },
    shares_received: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        },
    },
});
export const Investment = mongoose.model('Investment', InvestmentSchema);
const AssetSchema = new Schema({
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', required: true, unique: true },
    type: { type: String, enum: ['vehicle', 'property', 'other'], required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'idle', 'sold'], default: 'active' },
    registered_at: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        },
    },
});
export const Asset = mongoose.model('Asset', AssetSchema);
const IncomeLogSchema = new Schema({
    asset_id: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    amount_earned: { type: Number, required: true, min: 1 },
    period_label: { type: String, required: true, trim: true },
    logged_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    converted_to_repayment: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        },
    },
});
export const IncomeLog = mongoose.model('IncomeLog', IncomeLogSchema);
const RepaymentSchema = new Schema({
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', required: true },
    amount: { type: Number, required: true, min: 1 },
    source_income_log_ids: [{ type: Schema.Types.ObjectId, ref: 'IncomeLog' }],
    created_at: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        },
    },
});
export const Repayment = mongoose.model('Repayment', RepaymentSchema);
const TransactionSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pool_id: { type: Schema.Types.ObjectId, ref: 'Pool', default: null },
    type: { type: String, enum: ['deposit', 'withdraw', 'borrow', 'repay'], required: true },
    amount: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
}, {
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        },
    },
});
export const Transaction = mongoose.model('Transaction', TransactionSchema);
