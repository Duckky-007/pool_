import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import {
  User,
  Pool,
  Investment,
  Asset,
  IncomeLog,
  Repayment,
  Transaction,
} from './models/index.js';

dotenv.config();

export async function seedDatabase() {
  await connectDB();
  console.log('🌱 Starting PoolFund seed process...');

  // Clear existing collections
  await User.deleteMany({});
  await Pool.deleteMany({});
  await Investment.deleteMany({});
  await Asset.deleteMany({});
  await IncomeLog.deleteMany({});
  await Repayment.deleteMany({});
  await Transaction.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Seed 2 Demo Companies
  const company1 = await User.create({
    name: 'Apex Mobility Fleet Ltd.',
    email: 'apex@mobility.com',
    password_hash: defaultPasswordHash,
    role: 'company',
    wallet_balance: 10000.0,
  });

  const company2 = await User.create({
    name: 'Urban Stay Properties Ltd.',
    email: 'urban@properties.com',
    password_hash: defaultPasswordHash,
    role: 'company',
    wallet_balance: 10000.0,
  });

  console.log('✅ Created 2 demo companies');

  // 2. Seed 5 Demo Investors
  const investor1 = await User.create({
    name: 'Aarav Sharma',
    email: 'aarav@investor.com',
    password_hash: defaultPasswordHash,
    role: 'investor',
    wallet_balance: 7000.0,
  });

  const investor2 = await User.create({
    name: 'Priya Patel',
    email: 'priya@investor.com',
    password_hash: defaultPasswordHash,
    role: 'investor',
    wallet_balance: 8000.0,
  });

  const investor3 = await User.create({
    name: 'Rohan Gupta',
    email: 'rohan@investor.com',
    password_hash: defaultPasswordHash,
    role: 'investor',
    wallet_balance: 6000.0,
  });

  const investor4 = await User.create({
    name: 'Ananya Iyer',
    email: 'ananya@investor.com',
    password_hash: defaultPasswordHash,
    role: 'investor',
    wallet_balance: 6000.0,
  });

  const investor5 = await User.create({
    name: 'Vikram Malhotra',
    email: 'vikram@investor.com',
    password_hash: defaultPasswordHash,
    role: 'investor',
    wallet_balance: 8000.0,
  });

  console.log('✅ Created 5 demo investors');

  // 3. Seed Pool 1: In "funding" status (Partially funded)
  const deadline1 = new Date();
  deadline1.setDate(deadline1.getDate() + 25);

  const pool1 = await Pool.create({
    company_id: company1._id,
    title: 'Electric Airport Taxi Fleet Expansion #1',
    description:
      'Funding an all-electric sedan dedicated to busy airport transfers with guaranteed ride demand contracts.',
    target_amount: 12000.0,
    interest_rate_percent: 12.0,
    duration_days: 180,
    status: 'funding',
    total_shares: 5000.0,
    total_pool_value: 5000.0,
    funding_deadline: deadline1,
    borrowed_at: null,
  });

  // Investments in Pool 1
  await Investment.create({
    pool_id: pool1._id,
    investor_id: investor1._id,
    amount_deposited: 3000.0,
    shares_received: 3000.0,
  });
  await Transaction.create({
    user_id: investor1._id,
    pool_id: pool1._id,
    type: 'deposit',
    amount: 3000.0,
  });

  await Investment.create({
    pool_id: pool1._id,
    investor_id: investor2._id,
    amount_deposited: 2000.0,
    shares_received: 2000.0,
  });
  await Transaction.create({
    user_id: investor2._id,
    pool_id: pool1._id,
    type: 'deposit',
    amount: 2000.0,
  });

  console.log('✅ Created Pool 1 (partially funded, status = funding)');

  // 4. Seed Pool 2: In "repaying" status with registered Asset, Repayment, & Income Logs
  const deadline2 = new Date();
  deadline2.setDate(deadline2.getDate() - 10);
  const borrowedDate = new Date();
  borrowedDate.setDate(borrowedDate.getDate() - 20);

  // Started with ₹10,000 target funded by Rohan (4k), Ananya (4k), Vikram (2k)
  // Repayment of ₹800 made -> total_pool_value = 10800, total_shares = 10000 -> NAV = 1.08
  const pool2 = await Pool.create({
    company_id: company1._id,
    title: 'Toyota Innova Crysta - High Demand Airport Taxi #4',
    description:
      'High capacity 7-seater multi-utility vehicle servicing VIP airport transfers and business rentals in tech corridors.',
    target_amount: 10000.0,
    interest_rate_percent: 10.0,
    duration_days: 120,
    status: 'repaying',
    total_shares: 10000.0,
    total_pool_value: 10800.0, // Increased by ₹800 repayment! Share price = 1.08
    funding_deadline: deadline2,
    borrowed_at: borrowedDate,
  });

  // Seed Pool 2 investments
  await Investment.create({
    pool_id: pool2._id,
    investor_id: investor3._id,
    amount_deposited: 4000.0,
    shares_received: 4000.0,
  });
  await Transaction.create({
    user_id: investor3._id,
    pool_id: pool2._id,
    type: 'deposit',
    amount: 4000.0,
  });

  await Investment.create({
    pool_id: pool2._id,
    investor_id: investor4._id,
    amount_deposited: 4000.0,
    shares_received: 4000.0,
  });
  await Transaction.create({
    user_id: investor4._id,
    pool_id: pool2._id,
    type: 'deposit',
    amount: 4000.0,
  });

  await Investment.create({
    pool_id: pool2._id,
    investor_id: investor5._id,
    amount_deposited: 2000.0,
    shares_received: 2000.0,
  });
  await Transaction.create({
    user_id: investor5._id,
    pool_id: pool2._id,
    type: 'deposit',
    amount: 2000.0,
  });

  // Company borrow transaction
  await Transaction.create({
    user_id: company1._id,
    pool_id: pool2._id,
    type: 'borrow',
    amount: 10000.0,
  });

  // Asset registered for Pool 2
  const asset2 = await Asset.create({
    pool_id: pool2._id,
    type: 'vehicle',
    name: 'Toyota Innova Crysta - Taxi #4',
    description: 'White metallic Innova Crysta diesel automatic, registered commercial vehicle KA-03-TR-8812.',
    status: 'active',
  });

  // Income Logs for Asset 2:
  // Log 1 (converted)
  const log1 = await IncomeLog.create({
    asset_id: asset2._id,
    amount_earned: 500.0,
    period_label: 'Week of Sep 8',
    logged_by: company1._id,
    converted_to_repayment: true,
  });

  // Log 2 (converted)
  const log2 = await IncomeLog.create({
    asset_id: asset2._id,
    amount_earned: 300.0,
    period_label: 'Week of Sep 15',
    logged_by: company1._id,
    converted_to_repayment: true,
  });

  // Repayment from Log 1 + Log 2
  await Repayment.create({
    pool_id: pool2._id,
    amount: 800.0,
    source_income_log_ids: [log1._id, log2._id],
  });

  await Transaction.create({
    user_id: company1._id,
    pool_id: pool2._id,
    type: 'repay',
    amount: 800.0,
  });

  // Pending income logs waiting for conversion:
  await IncomeLog.create({
    asset_id: asset2._id,
    amount_earned: 450.0,
    period_label: 'Week of Sep 22',
    logged_by: company1._id,
    converted_to_repayment: false,
  });

  await IncomeLog.create({
    asset_id: asset2._id,
    amount_earned: 350.0,
    period_label: 'Week of Sep 29',
    logged_by: company1._id,
    converted_to_repayment: false,
  });

  console.log('✅ Created Pool 2 (status = repaying, Asset registered, Share price = ₹1.08, pending logs ready to convert)');

  // 5. Seed an extra property pool for variety
  const deadline3 = new Date();
  deadline3.setDate(deadline3.getDate() + 40);
  await Pool.create({
    company_id: company2._id,
    title: 'Co-Living Studio Unit #102 - Student Housing',
    description:
      'Furnished studio apartment in university corridor producing recurring monthly rental cash flow.',
    target_amount: 25000.0,
    interest_rate_percent: 9.5,
    duration_days: 365,
    status: 'funding',
    total_shares: 0.0,
    total_pool_value: 0.0,
    funding_deadline: deadline3,
    borrowed_at: null,
  });
  console.log('✅ Created Pool 3 (new property funding pool)');

  console.log('\n🎉 Database successfully seeded with demo data!');
  console.log('👥 Demo Credentials:');
  console.log('  Company 1: apex@mobility.com / password123');
  console.log('  Company 2: urban@properties.com / password123');
  console.log('  Investor 1: aarav@investor.com / password123 (invested in Pool 1)');
  console.log('  Investor 3: rohan@investor.com / password123 (invested in Pool 2, eligible for withdrawal at ₹1.08 share price!)');
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

