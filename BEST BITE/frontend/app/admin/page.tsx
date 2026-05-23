'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Search, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ADMIN_EMAIL = 'admin@bitebest.com';
const ADMIN_PASSWORD = 'bitebest123';
const ADMIN_SESSION_KEY = 'bitebestAdmin';
const ADMIN_SESSION_TOKEN = 'bitebest-admin-session';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/foodprices`;
const ANALYTICS_URL = `${API_BASE_URL}/api/analytics/top-searches`;
const chartColors = ['#556B2F', '#8A9A5B', '#C2A86B', '#7D8F69', '#B68D40', '#A3B18A'];

type FoodPrice = {
  _id: string;
  restaurant: string;
  item: string;
  platform: string;
  rating?: number;
  eta?: string;
  foodPrice: number;
  deliveryFee?: number;
  packagingFee?: number;
  offerType?: string;
  offerValue?: number;
  minOrder?: number;
};

type FoodPriceForm = {
  restaurant: string;
  item: string;
  platform: string;
  rating: string;
  eta: string;
  foodPrice: string;
  deliveryFee: string;
  packagingFee: string;
  offerType: string;
  offerValue: string;
  minOrder: string;
};

type TopSearch = {
  searchTerm: string;
  count: number;
};

type PlatformAggregate = {
  count: number;
  totalFinalPrice: number;
  ratingTotal: number;
  ratingCount: number;
  etaTotal: number;
  etaCount: number;
};

const emptyForm: FoodPriceForm = {
  restaurant: '',
  item: '',
  platform: '',
  rating: '',
  eta: '',
  foodPrice: '',
  deliveryFee: '0',
  packagingFee: '0',
  offerType: 'none',
  offerValue: '0',
  minOrder: '0',
};

const adminHeaders = {
  'Content-Type': 'application/json',
  'x-admin-session': ADMIN_SESSION_TOKEN,
};

const formatCurrency = (amount: number) => `\u20b9${amount}`;

const parseEtaMinutes = (eta?: string) => {
  if (!eta) {
    return 0;
  }

  const minutes = Number.parseInt(eta, 10);
  return Number.isNaN(minutes) ? 0 : minutes;
};

const getEstimatedFinalPrice = (record: FoodPrice) => {
  const foodPrice = record.foodPrice || 0;
  const deliveryFee = record.deliveryFee || 0;
  const packagingFee = record.packagingFee || 0;
  const offerValue = record.offerValue || 0;
  const minOrder = record.minOrder || 0;
  const canApplyOffer = foodPrice >= minOrder;
  let discount = 0;

  if (canApplyOffer && record.offerType === 'percentage') {
    discount = (foodPrice * offerValue) / 100;
  }

  if (canApplyOffer && record.offerType === 'flat') {
    discount = offerValue;
  }

  if (canApplyOffer && record.offerType === 'freeDelivery') {
    discount = deliveryFee;
  }

  return Math.max(foodPrice + deliveryFee + packagingFee - discount, 0);
};

const ChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-[22px] border border-[#DDD2BD] bg-[#FFFDF7] p-5 shadow-[0_12px_28px_rgba(85,107,47,0.06)]">
    <h2 className="text-lg font-semibold text-[#243119]">{title}</h2>
    <div className="mt-4 h-[260px]">{children}</div>
  </section>
);

export default function AdminPage() {
  const [records, setRecords] = useState<FoodPrice[]>([]);
  const [form, setForm] = useState<FoodPriceForm>(emptyForm);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topSearches, setTopSearches] = useState<TopSearch[]>([]);

  const loadRecords = async () => {
    const response = await fetch(API_URL);
    const data = await response.json();
    setRecords(data);
  };

  const loadTopSearches = async () => {
    const response = await fetch(`${ANALYTICS_URL}?limit=5`, {
      headers: {
        'x-admin-session': ADMIN_SESSION_TOKEN,
      },
    });
    const data = await response.json();
    setTopSearches(data);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Admin data must load only after the localStorage auth gate passes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([loadRecords(), loadTopSearches()])
      .catch(() => setMessage('Unable to load food price records'))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const filteredRecords = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();

    if (!cleanQuery) {
      return records;
    }

    return records.filter((record) =>
      [record.restaurant, record.item, record.platform].some((value) => value.toLowerCase().includes(cleanQuery))
    );
  }, [records, searchQuery]);

  const stats = useMemo(
    () => [
      { label: 'Total Records', value: records.length },
      { label: 'Platforms Covered', value: new Set(records.map((record) => record.platform)).size },
      { label: 'Restaurants Covered', value: new Set(records.map((record) => record.restaurant)).size },
      { label: 'Most Searched Item', value: topSearches[0]?.searchTerm || '-' },
    ],
    [records, topSearches]
  );

  const {
    averageFinalPriceByPlatform,
    platformDistribution,
    averageRatingByPlatform,
    averageEtaByPlatform,
    offerTypeDistribution,
    topSavingsOpportunities,
  } = useMemo(() => {
    const platformAggregates = records.reduce<Record<string, PlatformAggregate>>((aggregates, record) => {
      const platform = record.platform || 'Unknown';
      const finalPrice = getEstimatedFinalPrice(record);
      const etaMinutes = parseEtaMinutes(record.eta);

      aggregates[platform] = aggregates[platform] || {
        count: 0,
        totalFinalPrice: 0,
        ratingTotal: 0,
        ratingCount: 0,
        etaTotal: 0,
        etaCount: 0,
      };

      aggregates[platform].count += 1;
      aggregates[platform].totalFinalPrice += finalPrice;

      if (typeof record.rating === 'number') {
        aggregates[platform].ratingTotal += record.rating;
        aggregates[platform].ratingCount += 1;
      }

      if (etaMinutes > 0) {
        aggregates[platform].etaTotal += etaMinutes;
        aggregates[platform].etaCount += 1;
      }

      return aggregates;
    }, {});

    const averageFinalPriceByPlatform = Object.entries(platformAggregates).map(([name, aggregate]) => ({
      name,
      value: Math.round(aggregate.totalFinalPrice / aggregate.count),
    }));

    const platformDistribution = Object.entries(platformAggregates).map(([name, aggregate]) => ({
      name,
      value: aggregate.count,
    }));

    const averageRatingByPlatform = Object.entries(platformAggregates)
      .filter(([, aggregate]) => aggregate.ratingCount > 0)
      .map(([name, aggregate]) => ({
        name,
        value: Number((aggregate.ratingTotal / aggregate.ratingCount).toFixed(1)),
      }));

    const averageEtaByPlatform = Object.entries(platformAggregates)
      .filter(([, aggregate]) => aggregate.etaCount > 0)
      .map(([name, aggregate]) => ({
        name,
        value: Math.round(aggregate.etaTotal / aggregate.etaCount),
      }));

    const offerCounts = records.reduce<Record<string, number>>((counts, record) => {
      const offerType = record.offerType || 'none';
      counts[offerType] = (counts[offerType] || 0) + 1;
      return counts;
    }, {});

    const offerTypeDistribution = Object.entries(offerCounts).map(([name, value]) => ({ name, value }));

    const pricesByItem = records.reduce<Record<string, number[]>>((groups, record) => {
      groups[record.item] = groups[record.item] || [];
      groups[record.item].push(getEstimatedFinalPrice(record));
      return groups;
    }, {});

    const topSavingsOpportunities = Object.entries(pricesByItem)
      .map(([item, prices]) => ({
        item,
        savings: Math.max(...prices) - Math.min(...prices),
      }))
      .filter((opportunity) => opportunity.savings > 0)
      .sort((firstOpportunity, secondOpportunity) => secondOpportunity.savings - firstOpportunity.savings)
      .slice(0, 5);

    return {
      averageFinalPriceByPlatform,
      platformDistribution,
      averageRatingByPlatform,
      averageEtaByPlatform,
      offerTypeDistribution,
      topSavingsOpportunities,
    };
  }, [records]);

  const updateForm = (field: keyof FoodPriceForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setMessage('');
  };

  const openAddModal = () => {
    setEditingId('');
    setForm(emptyForm);
    setMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (record: FoodPrice) => {
    setEditingId(record._id);
    setForm({
      restaurant: record.restaurant,
      item: record.item,
      platform: record.platform,
      rating: typeof record.rating === 'number' ? String(record.rating) : '',
      eta: record.eta || '',
      foodPrice: String(record.foodPrice),
      deliveryFee: String(record.deliveryFee || 0),
      packagingFee: String(record.packagingFee || 0),
      offerType: record.offerType || 'none',
      offerValue: String(record.offerValue || 0),
      minOrder: String(record.minOrder || 0),
    });
    setMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId('');
    setForm(emptyForm);
  };

  const getPayload = () => ({
    restaurant: form.restaurant.trim(),
    item: form.item.trim(),
    platform: form.platform.trim(),
    rating: form.rating.trim() ? Number(form.rating) : undefined,
    eta: form.eta.trim(),
    foodPrice: Number(form.foodPrice),
    deliveryFee: Number(form.deliveryFee || 0),
    packagingFee: Number(form.packagingFee || 0),
    offerType: form.offerType,
    offerValue: Number(form.offerValue || 0),
    minOrder: Number(form.minOrder || 0),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: adminHeaders,
      body: JSON.stringify(getPayload()),
    });

    if (!response.ok) {
      setMessage('Unable to save record');
      return;
    }

    closeModal();
    setMessage(editingId ? 'Record updated' : 'Record added');
    await loadRecords();
  };

  const deleteRecord = async (record: FoodPrice) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this record?');

    if (!shouldDelete) {
      return;
    }

    const response = await fetch(`${API_URL}/${record._id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });

    if (!response.ok) {
      setMessage('Unable to delete record');
      return;
    }

    setMessage('Record deleted');
    await loadRecords();
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setEditingId('');
    setMessage('');
    setIsModalOpen(false);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loginEmail !== ADMIN_EMAIL || loginPassword !== ADMIN_PASSWORD) {
      setLoginError('Invalid admin email or password');
      return;
    }

    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setIsAuthenticated(true);
    setIsLoading(true);
    setLoginError('');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F7F3EA] p-6 text-[#1F2A1D]">
        <p>Loading admin dashboard...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EA] px-6 py-8 text-[#1F2A1D]">
        <section className="w-full max-w-[420px] rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] p-6 shadow-[0_20px_50px_rgba(85,107,47,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#556B2F]">Admin Login</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#243119]">BiteBest Admin</h1>
          <p className="mt-2 text-sm text-[#6B6B5F]">Login to manage food comparison records.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className="text-sm font-medium text-[#6B6B5F]">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={loginEmail}
                onChange={(event) => {
                  setLoginEmail(event.target.value);
                  setLoginError('');
                }}
                className="mt-2 w-full rounded-[18px] border border-[#DDD2BD] bg-[#F7F3EA] px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="text-sm font-medium text-[#6B6B5F]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={loginPassword}
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                  setLoginError('');
                }}
                className="mt-2 w-full rounded-[18px] border border-[#DDD2BD] bg-[#F7F3EA] px-4 py-3 outline-none"
              />
            </div>

            {loginError && <p className="text-sm font-medium text-red-700">{loginError}</p>}

            <button
              type="submit"
              className="w-full rounded-[18px] bg-[#556B2F] px-5 py-3 text-sm font-semibold text-[#F7F3EA] transition hover:bg-[#4a5f24]"
            >
              Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-6 py-8 text-[#1F2A1D]">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#556B2F]">BiteBest Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#243119]">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-[#6B6B5F]">Manage BiteBest food comparison database</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#556B2F] px-5 py-3 text-sm font-semibold text-[#F7F3EA] transition hover:bg-[#4a5f24]"
            >
              <Plus size={16} />
              Add Food Record
            </button>
            <button onClick={logout} className="rounded-full bg-[#E8DDC8] px-5 py-3 text-sm font-semibold text-[#243119]">
              Logout
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[18px] border border-[#DDD2BD] bg-[#FFFDF7] p-5 shadow-[0_12px_28px_rgba(85,107,47,0.06)]">
              <p className="text-sm font-medium text-[#6B6B5F]">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#243119]">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 grid gap-5 lg:grid-cols-2">
          <ChartCard title="Average Final Price by Platform">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={averageFinalPriceByPlatform}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B6B5F', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B6B5F', fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#556B2F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Platform Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformDistribution} dataKey="value" nameKey="name" outerRadius={88} label>
                  {platformDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Average Restaurant Rating by Platform">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={averageRatingByPlatform} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: '#6B6B5F', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B6B5F', fontSize: 12 }} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)} rating`} />
                <Bar dataKey="value" fill="#8A9A5B" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Average ETA Comparison">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={averageEtaByPlatform}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B6B5F', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B6B5F', fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value} mins`} />
                <Bar dataKey="value" fill="#C2A86B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Offer Type Distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={offerTypeDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} label>
                  {offerTypeDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <section className="rounded-[22px] border border-[#DDD2BD] bg-[#FFFDF7] p-5 shadow-[0_12px_28px_rgba(85,107,47,0.06)]">
            <h2 className="text-lg font-semibold text-[#243119]">Top Savings Opportunities</h2>
            <div className="mt-4 space-y-3">
              {topSavingsOpportunities.length > 0 ? (
                topSavingsOpportunities.map((opportunity, index) => (
                  <div key={opportunity.item} className="flex items-center justify-between rounded-[16px] bg-[#F7F3EA] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-[#556B2F]">#{index + 1}</p>
                      <p className="font-semibold text-[#243119]">{opportunity.item}</p>
                    </div>
                    <p className="text-lg font-semibold text-[#556B2F]">{formatCurrency(opportunity.savings)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-[16px] bg-[#F7F3EA] px-4 py-3 text-sm text-[#6B6B5F]">
                  Add multiple platform prices for the same item to reveal savings opportunities.
                </p>
              )}
            </div>
          </section>
        </section>

        <section className="mb-6 rounded-[22px] border border-[#DDD2BD] bg-[#FFFDF7] p-5 shadow-[0_12px_28px_rgba(85,107,47,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#243119]">Top Searches</h2>
              <p className="mt-1 text-sm text-[#6B6B5F]">Most searched food items from public search activity.</p>
            </div>
          </div>
          {topSearches.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {topSearches.map((topSearch) => (
                <div key={topSearch.searchTerm} className="rounded-[16px] bg-[#F7F3EA] px-4 py-3">
                  <p className="font-semibold text-[#243119]">{topSearch.searchTerm}</p>
                  <p className="mt-1 text-sm font-medium text-[#556B2F]">{topSearch.count} searches</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-[16px] bg-[#F7F3EA] px-4 py-3 text-sm text-[#6B6B5F]">No searches tracked yet.</p>
          )}
        </section>

        <section className="rounded-[22px] border border-[#DDD2BD] bg-[#FFFDF7] shadow-[0_16px_36px_rgba(85,107,47,0.07)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDD2BD] p-5">
            <div>
              <h2 className="text-xl font-semibold text-[#243119]">Food Records</h2>
              <p className="mt-1 text-sm text-[#6B6B5F]">Edit platform pricing without exposing raw database fields.</p>
            </div>
            <label className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B5F]" size={16} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search records..."
                className="w-full rounded-full border border-[#DDD2BD] bg-[#F7F3EA] py-2.5 pl-10 pr-4 text-sm outline-none"
              />
            </label>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#E8DDC8] text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6B5F]">
                <tr>
                  <th className="px-5 py-3">Restaurant</th>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Final Price</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="border-t border-[#DDD2BD]">
                    <td className="px-5 py-3 font-medium">{record.restaurant}</td>
                    <td className="px-5 py-3">{record.item}</td>
                    <td className="px-5 py-3">{record.platform}</td>
                    <td className="px-5 py-3 font-semibold text-[#243119]">{formatCurrency(getEstimatedFinalPrice(record))}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(record)} className="rounded-full bg-[#E8DDC8] px-3 py-1.5 text-xs font-semibold">
                          Edit
                        </button>
                        <button onClick={() => deleteRecord(record)} className="rounded-full bg-[#556B2F] px-3 py-1.5 text-xs font-semibold text-[#F7F3EA]">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#DDD2BD] md:hidden">
            {filteredRecords.map((record) => (
              <article key={record._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#243119]">{record.item}</p>
                    <p className="mt-1 text-xs text-[#6B6B5F]">{record.restaurant} • {record.platform}</p>
                    <p className="mt-2 text-lg font-semibold text-[#556B2F]">{formatCurrency(getEstimatedFinalPrice(record))}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(record)} className="rounded-full bg-[#E8DDC8] px-3 py-1.5 text-xs font-semibold">
                      Edit
                    </button>
                    <button onClick={() => deleteRecord(record)} className="rounded-full bg-[#556B2F] px-3 py-1.5 text-xs font-semibold text-[#F7F3EA]">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {message && (
          <div className="fixed bottom-6 right-6 z-40 rounded-full border border-[#D8CFBF] bg-[#FFFDF7] px-5 py-3 text-sm font-semibold text-[#556B2F] shadow-sm">
            {message}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243119]/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] p-6 shadow-[0_24px_70px_rgba(36,49,25,0.22)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#556B2F]">
                  {editingId ? 'Edit Record' : 'Add Record'}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#243119]">
                  {editingId ? 'Update food price' : 'Add food record'}
                </h2>
              </div>
              <button onClick={closeModal} className="rounded-full bg-[#E8DDC8] p-2 text-[#243119]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['restaurant', 'Restaurant'],
                  ['item', 'Food Item'],
                  ['platform', 'Platform'],
                  ['rating', 'Rating'],
                  ['eta', 'ETA'],
                  ['foodPrice', 'Food Price'],
                  ['deliveryFee', 'Delivery Fee'],
                  ['packagingFee', 'Packaging Fee'],
                  ['offerValue', 'Offer Value'],
                  ['minOrder', 'Minimum Order'],
                ].map(([field, label]) => (
                  <label key={field} className="block text-sm font-medium text-[#6B6B5F]">
                    {label}
                    <input
                      type={['foodPrice', 'deliveryFee', 'packagingFee', 'offerValue', 'minOrder', 'rating'].includes(field) ? 'number' : 'text'}
                      step={field === 'rating' ? '0.1' : undefined}
                      min={field === 'rating' ? '0' : undefined}
                      max={field === 'rating' ? '5' : undefined}
                      value={form[field as keyof FoodPriceForm]}
                      onChange={(event) => updateForm(field as keyof FoodPriceForm, event.target.value)}
                      className="mt-2 w-full rounded-[16px] border border-[#DDD2BD] bg-[#F7F3EA] px-4 py-3 text-[#1F2A1D] outline-none"
                      required={['restaurant', 'item', 'platform', 'foodPrice'].includes(field)}
                    />
                  </label>
                ))}

                <label className="block text-sm font-medium text-[#6B6B5F]">
                  Offer Type
                  <select
                    value={form.offerType}
                    onChange={(event) => updateForm('offerType', event.target.value)}
                    className="mt-2 w-full rounded-[16px] border border-[#DDD2BD] bg-[#F7F3EA] px-4 py-3 text-[#1F2A1D] outline-none"
                  >
                    <option value="none">none</option>
                    <option value="percentage">percentage</option>
                    <option value="flat">flat</option>
                    <option value="freeDelivery">freeDelivery</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="rounded-[18px] bg-[#E8DDC8] px-5 py-3 text-sm font-semibold text-[#243119]">
                  Cancel
                </button>
                <button type="submit" className="rounded-[18px] bg-[#556B2F] px-5 py-3 text-sm font-semibold text-[#F7F3EA]">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
