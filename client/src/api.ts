const BASE_URL = 'https://pool-funds-server.onrender.com/';

export function getToken(): string | null {
  return localStorage.getItem('poolfund_token');
}

export function setToken(token: string): void {
  localStorage.setItem('poolfund_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('poolfund_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<{ user: any }>('/auth/me'),
  getDemoUsers: () => request<{ users: any[] }>('/auth/demo-users'),

  // Pools
  getPools: () => request<{ pools: any[] }>('/pools'),
  getPool: (id: string) => request<{ pool: any }>(`/pools/${id}`),
  createPool: (body: any) => request<{ pool: any; message: string }>('/pools', { method: 'POST', body: JSON.stringify(body) }),
  borrowPool: (id: string, body: any) =>
    request<any>(`/pools/${id}/borrow`, { method: 'POST', body: JSON.stringify(body) }),

  // Investments
  invest: (poolId: string, amount: number) =>
    request<any>(`/investments/pools/${poolId}/invest`, { method: 'POST', body: JSON.stringify({ amount }) }),
  getMyInvestments: () => request<{ investments: any[] }>('/investments/my'),
  withdraw: (investmentId: string) =>
    request<any>(`/investments/${investmentId}/withdraw`, { method: 'POST' }),

  // Income & Repayments
  logIncome: (assetId: string, body: any) =>
    request<any>(`/assets/${assetId}/income`, { method: 'POST', body: JSON.stringify(body) }),
  repayPool: (poolId: string) =>
    request<any>(`/repayments/${poolId}/repay`, { method: 'POST' }),

  // Transactions & Demo Faucet
  getMyTransactions: () => request<{ transactions: any[] }>('/transactions/my'),
  getAllTransactions: () => request<{ transactions: any[] }>('/transactions/all'),
  claimFaucet: (amount = 5000) =>
    request<any>('/transactions/faucet', { method: 'POST', body: JSON.stringify({ amount }) }),

  // Seed / Reset
  seedDatabase: () => request<{ message: string }>('/seed', { method: 'POST' }),
};

