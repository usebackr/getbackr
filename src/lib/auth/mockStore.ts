// A simple in-memory mock store for users and metrics during the demo session.
// In a real environment, this data is persisted in PostgreSQL.

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  emailVerified: boolean;
}

export interface MockCampaign {
  id: string;
  userId: string;
  title: string;
  status: 'draft' | 'published' | 'completed' | 'inactive';
  createdAt: Date;
}

export interface MockTransaction {
  id: string;
  campaignId: string;
  amount: number;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  createdAt: Date;
}

export interface MockWithdrawal {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
}

export interface MockCampaignView {
  id: string;
  campaignId: string;
  timestamp: Date;
}

// Global Fee Config
const PLATFORM_FEE_PERCENT = 0.05; // 5%

const mockUsers: MockUser[] = [];
const mockCampaigns: MockCampaign[] = [];
const mockTransactions: MockTransaction[] = [];
const mockWithdrawals: MockWithdrawal[] = [];
const mockCampaignViews: MockCampaignView[] = [];

export const mockStore = {
  users: mockUsers,
  campaigns: mockCampaigns,
  transactions: mockTransactions,
  withdrawals: mockWithdrawals,
  views: mockCampaignViews,

  // User helpers
  addUser: (user: MockUser) => {
    mockUsers.push(user);
    console.log('[MockDB] User added:', user.email);
  },
  findUserByEmail: (email: string) => mockUsers.find((u) => u.email === email.toLowerCase()),
  findUserById: (id: string) => mockUsers.find((u) => u.id === id),

  // Metrics Logic Implementation
  getDashboardStats: (userId: string, filterDays?: number) => {
    const userCampaigns = mockCampaigns.filter((c) => c.userId === userId);
    const campaignIds = userCampaigns.map((c) => c.id);

    const now = new Date();
    const filterDate = filterDays
      ? new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000)
      : null;

    // 1. Total Raised (Successful payments only)
    const successfulTransactions = mockTransactions.filter(
      (t) =>
        campaignIds.includes(t.campaignId) &&
        t.status === 'success' &&
        (!filterDate || t.createdAt >= filterDate),
    );
    const totalRaised = successfulTransactions.reduce((acc, t) => acc + t.amount, 0);

    // 2. Withdrawable Amount (Logic: Raised - Fees - Withdrawn) - NOT filtered by time as per spec
    const allSuccessfulTransactions = mockTransactions.filter(
      (t) => campaignIds.includes(t.campaignId) && t.status === 'success',
    );
    const cumulativeRaised = allSuccessfulTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalFees = cumulativeRaised * PLATFORM_FEE_PERCENT;

    const successfulWithdrawals = mockWithdrawals.filter(
      (w) => w.userId === userId && w.status === 'success',
    );
    const totalWithdrawn = successfulWithdrawals.reduce((acc, w) => acc + w.amount, 0);

    const withdrawable = Math.max(0, cumulativeRaised - totalFees - totalWithdrawn);

    // 3. Total Campaigns (Published only as per recommendation)
    const totalCampaigns = userCampaigns.filter((c) => c.status === 'published').length;

    // 4. Campaign Views
    const totalViews = mockCampaignViews.filter(
      (v) => campaignIds.includes(v.campaignId) && (!filterDate || v.timestamp >= filterDate),
    ).length;

    return {
      totalRaised,
      withdrawable,
      totalCampaigns,
      totalViews,
      currency: '₦',
    };
  },

  // Seed data helpers (for demo)
  seedUserActivity: (userId: string) => {
    const campId = 'camp_1';
    mockCampaigns.push({
      id: campId,
      userId,
      title: 'First Venture',
      status: 'published',
      createdAt: new Date(),
    });
    mockTransactions.push({
      id: 'tx_1',
      campaignId: campId,
      amount: 50000,
      status: 'success',
      createdAt: new Date(),
    });
    mockTransactions.push({
      id: 'tx_2',
      campaignId: campId,
      amount: 25000,
      status: 'success',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });
    for (let i = 0; i < 15; i++) {
      mockCampaignViews.push({ id: `v_${i}`, campaignId: campId, timestamp: new Date() });
    }
  },
};
