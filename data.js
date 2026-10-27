// Shared state, cached data loaders (always read from Supabase) and finance calculations.
import { supabase } from './supabase-client.js';
import { todayISO, addDays } from './utils.js';

export const state = { user: null, profile: null };

export const EXPENSE_CATS = ['food', 'transport', 'housing', 'education', 'entertainment', 'health', 'small', 'other'];
export const INCOME_CATS = ['allowance', 'extra_income', 'other'];
export const TASK_CATS = ['study', 'university', 'work', 'personal'];
export const PRIORITIES = ['low', 'medium', 'high'];

/** Throws if a Supabase response carries an error, otherwise returns its data. */
export async function unwrap(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

/* The cache only avoids re-fetching between views; call invalidate() after every write. */
const cache = {};
export const invalidate = (key) => (key ? delete cache[key] : Object.keys(cache).forEach((k) => delete cache[k]));
async function load(key, build) {
  if (!cache[key]) cache[key] = await unwrap(build());
  return cache[key];
}
export const getTransactions = () => load('tx', () => supabase.from('transactions').select('*')
  .order('tx_date', { ascending: false }).order('created_at', { ascending: false }).limit(5000));
export const getBudgets = () => load('budgets', () => supabase.from('budgets').select('*'));
export const getTasks = () => load('tasks', () => supabase.from('tasks').select('*')
  .order('due_date', { ascending: true, nullsFirst: false }).limit(2000));
export const getSessions = () => load('sessions', () => supabase.from('study_sessions').select('*')
  .order('session_date', { ascending: false }).order('created_at', { ascending: false }).limit(2000));

export const isOverdue = (task, today = todayISO()) => !task.is_done && !!task.due_date && task.due_date < today;

/** All dashboard / report numbers come from real rows; nothing is estimated unless labelled. */
export function computeFinance(txs, budgets, profile, today = todayISO()) {
  const month = today.slice(0, 7);
  const f = { income: 0, expense: 0, mIncome: 0, mExpense: 0, catMonth: {}, catAll: {}, byMonth: {} };

  for (const x of txs) {
    const amount = Number(x.amount);
    const m = x.tx_date.slice(0, 7);
    const bucket = (f.byMonth[m] ||= { income: 0, expense: 0 });
    bucket[x.type] += amount;
    if (x.type === 'income') {
      f.income += amount;
      if (m === month) f.mIncome += amount;
    } else {
      f.expense += amount;
      f.catAll[x.category] = (f.catAll[x.category] || 0) + amount;
      if (m === month) {
        f.mExpense += amount;
        f.catMonth[x.category] = (f.catMonth[x.category] || 0) + amount;
      }
    }
  }

  f.balance = f.income - f.expense;            // actual, all-time
  f.monthNet = f.mIncome - f.mExpense;         // actual, this month
  f.dailyAvg = f.mExpense / Number(today.slice(8, 10));
  const expMonths = Object.values(f.byMonth).filter((v) => v.expense > 0).length;
  const incMonths = Object.values(f.byMonth).filter((v) => v.income > 0).length;
  f.monthlyAvgExpense = expMonths ? f.expense / expMonths : 0;
  f.monthlyAvgIncome = incMonths ? f.income / incMonths : 0;

  f.budgetStatus = budgets.map((b) => {
    const limit = Number(b.amount);
    const spent = b.category === 'total' ? f.mExpense : f.catMonth[b.category] || 0;
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return { category: b.category, limit, spent, remaining: limit - spent, pct, level: pct > 100 ? 'over' : pct >= 80 ? 'warn' : 'ok' };
  }).sort((a, b) => (b.category === 'total') - (a.category === 'total') || b.pct - a.pct);

  const totalBudget = f.budgetStatus.find((b) => b.category === 'total');
  f.goal = Number(profile?.savings_goal) || 0;
  f.goalPct = f.goal > 0 ? Math.max(0, Math.min(100, (f.balance / f.goal) * 100)) : null;
  // ESTIMATE: average monthly income minus the planned monthly budget.
  f.estMonthlySaving = totalBudget && f.monthlyAvgIncome > 0 ? f.monthlyAvgIncome - totalBudget.limit : null;
  f.monthsToGoal = f.goal > 0 && f.estMonthlySaving > 0 ? Math.ceil(Math.max(0, f.goal - f.balance) / f.estMonthlySaving) : null;

  // Small recurring expenses: same description ≥3 times in 90 days, cheaper than the average expense.
  const cutoff = addDays(today, -90);
  const groups = {};
  let sum = 0;
  let count = 0;
  for (const x of txs) {
    if (x.type !== 'expense' || x.tx_date < cutoff) continue;
    sum += Number(x.amount); count += 1;
    const key = x.description.trim().toLowerCase();
    if (!key) continue;
    const g = (groups[key] ||= { label: x.description.trim(), count: 0, total: 0 });
    g.count += 1; g.total += Number(x.amount);
  }
  const avg = count ? sum / count : 0;
  f.smallRecurring = Object.values(groups).filter((g) => g.count >= 3 && g.total / g.count < avg)
    .sort((a, b) => b.total - a.total).slice(0, 5);
  return f;
}
