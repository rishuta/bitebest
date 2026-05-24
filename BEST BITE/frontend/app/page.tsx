'use client';

import Image from 'next/image';
import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDownUp, BrainCircuit, Database, MonitorUp, Search, Sparkles } from 'lucide-react';
import BiteBestLogo from '@/components/BiteBestLogo';

const popularSearches = ['Chicken Biryani', 'Pizza', 'Burger', 'Paneer Tikka', 'Chole Bhature'];
const platformFilters = ['All', 'Swiggy', 'Zomato', 'EatSure', 'Magicpin'];

const initialVisibleRows = 10;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const ADMIN_SESSION_KEY = 'bitebestAdmin';
const RECENT_SEARCHES_KEY = 'bitebestRecentSearches';

const howItWorksSteps = [
  {
    step: '01',
    title: 'User Query',
    description: 'The user searches by food item, restaurant, or platform name.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Frontend Request',
    description: 'The Next.js frontend sends an API request to the Express backend using the search query.',
    icon: MonitorUp,
  },
  {
    step: '03',
    title: 'Database Retrieval',
    description: 'The backend queries MongoDB Atlas using a case-insensitive search on restaurant, item, and platform fields.',
    icon: Database,
  },
  {
    step: '04',
    title: 'Price Engine',
    description: 'The backend calculates final payable cost using: foodPrice + deliveryFee + packagingFee - discountApplied',
    icon: BrainCircuit,
  },
  {
    step: '05',
    title: 'Result Ranking',
    description: 'Results are sorted by finalPrice and the lowest cost option is marked as Best Deal.',
    icon: ArrowDownUp,
  },
];

const aboutChips = ['Next.js Frontend', 'Express REST API', 'MongoDB Atlas', 'Admin CRUD', 'Offer Engine', 'Best Deal Ranking'];

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
  discountApplied?: number;
  finalPrice?: number;
  bestDeal?: boolean;
  updatedAt?: string;
  lastUpdated?: string;
};

const formatCurrency = (amount: number) => `\u20b9${amount}`;

const formatRating = (rating?: number) => (typeof rating === 'number' ? `\u2b50${rating.toFixed(1)}` : 'New');

const getFinalPrice = (foodPrice: FoodPrice) =>
  foodPrice.finalPrice ?? foodPrice.foodPrice + (foodPrice.deliveryFee || 0) + (foodPrice.packagingFee || 0);

const getOfferLabel = (foodPrice: FoodPrice) => {
  if (!foodPrice.discountApplied || foodPrice.discountApplied <= 0 || !foodPrice.offerType || foodPrice.offerType === 'none') {
    return 'None';
  }

  if (foodPrice.offerType === 'percentage') {
    return `${foodPrice.offerValue || 0}% OFF`;
  }

  if (foodPrice.offerType === 'flat') {
    return `${formatCurrency(foodPrice.discountApplied)} OFF`;
  }

  if (foodPrice.offerType === 'freeDelivery') {
    return 'Free delivery';
  }

  return foodPrice.offerType;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FoodPrice[]>([]);
  const [groupedResults, setGroupedResults] = useState<FoodPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [expandedResultId, setExpandedResultId] = useState('');
  const [expandedRestaurantItem, setExpandedRestaurantItem] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [visibleRows, setVisibleRows] = useState(initialVisibleRows);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(
    () =>
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
        : []
  );
  const [isAdminLoggedIn] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  );

  const searchFoodPrices = async (query: string) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setResults([]);
      setHasSearched(false);
      setError('');
      setSearchMessage('Search for a restaurant or food item');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setError('');
    setSearchMessage('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/foodprices/search?query=${encodeURIComponent(cleanQuery)}`
      );

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      // API returns { grouped, entries } - use entries for individual records to display
      const flatResults = !Array.isArray(data) && data.entries ? data.entries : (Array.isArray(data) ? data : []);
      setResults(flatResults || []);
      setGroupedResults(flatResults || []);
      setExpandedResultId('');
      setSelectedPlatform('All');
      setVisibleRows(initialVisibleRows);
      setSuggestions([]);
      saveRecentSearch(cleanQuery);
    } catch {
      setResults([]);
      setError('Unable to fetch comparisons. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecentSearch = (searchTerm: string) => {
    const nextRecentSearches = [
      searchTerm,
      ...recentSearches.filter((recentSearch) => recentSearch.toLowerCase() !== searchTerm.toLowerCase()),
    ].slice(0, 5);

    setRecentSearches(nextRecentSearches);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecentSearches));
  };

  const loadSuggestions = async (query: string) => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/foodprices/suggestions?query=${encodeURIComponent(cleanQuery)}`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchFoodPrices(searchQuery);
  };

  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
    setSearchMessage('');
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = '/';
  };

  const platformCounts = useMemo(
    () =>
      platformFilters.reduce<Record<string, number>>((counts, platform) => {
        counts[platform] =
          platform === 'All'
            ? (results || []).length
            : (results || []).filter((result) => result?.platform?.toLowerCase() === platform.toLowerCase()).length;
        return counts;
      }, {}),
    [results]
  );

  const filteredResults = useMemo(
    () =>
      (results || [])
        .filter(
          (result) => selectedPlatform === 'All' || result.platform?.toLowerCase() === selectedPlatform.toLowerCase()
        )
        .sort((firstResult, secondResult) => getFinalPrice(firstResult) - getFinalPrice(secondResult)),
    [results, selectedPlatform]
  );

  const restaurantQuery = searchQuery.trim().toLowerCase();
  const restaurantMatchCount = (filteredResults || []).filter((result) =>
    result?.restaurant?.toLowerCase().includes(restaurantQuery)
  ).length;
  const itemMatchCount = (filteredResults || []).filter((result) =>
    result?.item?.toLowerCase().includes(restaurantQuery)
  ).length;
  const isRestaurantSearch =
    restaurantQuery.length > 0 && restaurantMatchCount >= itemMatchCount && restaurantMatchCount > 0;

  const restaurantResults = useMemo(
    () =>
      isRestaurantSearch
        ? (filteredResults || []).filter((result) => result.restaurant?.toLowerCase().includes(restaurantQuery))
        : [],
    [filteredResults, isRestaurantSearch, restaurantQuery]
  );

  const restaurantItems = useMemo(() => {
    const groups = new Map<string, FoodPrice[]>();

    (restaurantResults || []).forEach((result) => {
      const itemKey = result?.item || 'Unknown item';
      const group = groups.get(itemKey);

      if (group) {
        group.push(result);
      } else {
        groups.set(itemKey, [result]);
      }
    });

    return Array.from(groups.entries())
      .map(([item, itemGroup]) => [
        item,
        itemGroup.sort((a, b) => getFinalPrice(a) - getFinalPrice(b)),
      ] as [string, FoodPrice[]])
      .sort(([leftItem], [rightItem]) => leftItem.localeCompare(rightItem));
  }, [restaurantResults]);

  const cheapestRestaurantItem = (restaurantItems || []).length
    ? (restaurantItems || [])
        .map(([, itemGroup]) => itemGroup[0])
        .sort((a, b) => getFinalPrice(a) - getFinalPrice(b))[0]
    : undefined;

  const restaurantItemCount = (restaurantItems || []).length;
  const restaurantName = restaurantResults?.[0]?.restaurant || '';
  const restaurantHighestCheapestPrice = Math.max(
    0,
    ...(restaurantItems || []).map(([, itemGroup]) => getFinalPrice(itemGroup[0]))
  );
  const restaurantSavingsVsHighest = cheapestRestaurantItem
    ? restaurantHighestCheapestPrice - getFinalPrice(cheapestRestaurantItem)
    : 0;

  const visibleResults = (filteredResults || []).slice(0, visibleRows);
  const bestDeal = (filteredResults || [])[0];
  const bestDealPrice = bestDeal ? getFinalPrice(bestDeal) : 0;
  const highestPrice = (filteredResults || []).reduce(
    (highestTotal, result) => Math.max(highestTotal, getFinalPrice(result)),
    bestDealPrice
  );
  const savingsVsHighest = Math.max(highestPrice - bestDealPrice, 0);
  const comparedRestaurants = new Set((results || []).map((result) => result?.restaurant));
  const hasComparison = filteredResults.length > 1;

  const visibleResultsByItem = useMemo(() => {
    const groups = new Map<string, FoodPrice[]>();

    (visibleResults || []).forEach((result) => {
      const itemKey = result?.item || 'Unknown item';
      const group = groups.get(itemKey);

      if (group) {
        group.push(result);
      } else {
        groups.set(itemKey, [result]);
      }
    });

    return Array.from(groups.entries())
      .map(([item, itemGroup]) => [
        item,
        itemGroup.sort((a, b) => getFinalPrice(a) - getFinalPrice(b)),
      ] as [string, FoodPrice[]])
      .sort(([leftItem], [rightItem]) => leftItem.localeCompare(rightItem));
  }, [visibleResults]);
  const comparisonTitle =
    isRestaurantSearch && restaurantName
      ? `${restaurantName} • ${restaurantItemCount} item${restaurantItemCount === 1 ? '' : 's'} available`
      : results.length > 0 && comparedRestaurants.size === 1
        ? `${results[0].item} • ${results[0].restaurant}`
        : results.length > 0
          ? `${results[0].item} • Price Comparison`
          : 'Food price matches';

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#1F2A1D]">
      <header className="border-b border-[#DDD2BD] bg-[#FFFDF7]">
        <div className="mx-auto grid h-[72px] max-w-[1200px] grid-cols-[auto_1fr_auto] items-center gap-5 px-6">
          <BiteBestLogo />
          <nav className="flex justify-end gap-6 text-sm font-medium text-[#1F2A1D]">
            {[
              ['Home', '#home'],
              ['How It Works', '#workflow'],
              ['About', '#about'],
            ].map(([link, href]) => (
              <a key={link} href={href} className="transition hover:text-[#556B2F]">
                {link}
              </a>
            ))}
          </nav>
          {isAdminLoggedIn && (
            <div className="ml-auto flex items-center gap-3">
              <a
                href="/admin"
                className="rounded-full bg-[#556B2F] px-4 py-2.5 text-sm font-semibold text-[#F7F3EA] transition hover:bg-[#4a5f24]"
              >
                Admin Dashboard
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[#E8DDC8] px-4 py-2.5 text-sm font-semibold text-[#243119] transition hover:bg-[#DDD2BD]"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <section id="home" className="py-14">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div className="max-w-xl">
              <p className="mb-5 inline-flex rounded-full bg-[#E8DDC8] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#556B2F]">
                Premium food-tech startup experience
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-[#1F2A1D] sm:text-[3rem]">
                Compare Smarter.
                <span className="block text-[#556B2F]">Save Better.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#6B6B5F] sm:text-lg">
                Compare delivery fees, packaging fees, offers and final prices across top platforms in one premium experience.
              </p>

              <div className="mt-10 space-y-5">
                <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label htmlFor="food-search" className="sr-only">
                    Search restaurant or food item
                  </label>
                  <input
                    id="food-search"
                    type="text"
                    value={searchQuery}
                    autoComplete="off"
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setSearchQuery(nextQuery);
                      setSearchMessage('');
                      loadSuggestions(nextQuery);
                    }}
                    placeholder="Search restaurant or food item..."
                    className="min-w-0 flex-1 rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] px-5 py-4 text-base text-[#1F2A1D] outline-none placeholder:text-[#6B6B5F]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-[#556B2F] px-5 py-4 text-sm font-semibold text-[#F7F3EA] transition hover:bg-[#4a5f24] sm:w-auto"
                  >
                    <Search size={16} />
                    <span>Search</span>
                  </button>
                </form>
                <p className="text-sm text-[#6B6B5F] sm:max-w-xl">
                  Examples: Chicken Biryani • Burger • Meghana Foods • Pizza
                </p>

                {suggestions.length > 0 && (
                  <div className="rounded-[18px] border border-[#DDD2BD] bg-[#FFFDF7] p-2 shadow-sm">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setSuggestions([]);
                        }}
                        className="block w-full rounded-[14px] px-3 py-2 text-left text-sm font-medium text-[#243119] hover:bg-[#E8DDC8]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {searchMessage && <p className="text-sm font-medium text-[#556B2F]">{searchMessage}</p>}

                {recentSearches.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B6B5F]">Recent Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((recentSearch) => (
                        <button
                        key={recentSearch}
                        type="button"
                          onClick={() => {
                            setSearchQuery(recentSearch);
                            searchFoodPrices(recentSearch);
                          }}
                          className="rounded-full bg-[#E8DDC8] px-3 py-1.5 text-xs font-semibold text-[#243119] hover:bg-[#DDD2BD]"
                        >
                          {recentSearch}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handlePopularSearch(term)}
                      className="rounded-full bg-[#FFFDF7] px-4 py-2 text-sm font-medium text-[#1F2A1D] shadow-sm shadow-[#556B2F]/10 transition hover:bg-[#E8DDC8]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-center">
              <div className="flex w-full items-center justify-center">
                <Image
                  src="/hero-food.jpg"
                  alt="Food comparison"
                  width={560}
                  height={420}
                  className="h-[420px] w-full max-w-[560px] rounded-[32px] border-2 border-[#DDD2BD] object-cover shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasSearched && (
        <section className="pb-12">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#556B2F]">Search Results</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#1F2A1D]">{comparisonTitle}</h2>
                {results.length > 0 && (
                  <p className="mt-1 text-sm font-medium text-[#6B6B5F]">
                    {results.length} option{results.length === 1 ? '' : 's'} compared
                  </p>
                )}
              </div>
            </div>

            {isLoading && (
              <div className="rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] p-8 text-center text-base font-medium text-[#6B6B5F]">
                Finding best deals...
              </div>
            )}

            {!isLoading && error && (
              <div className="rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] p-8 text-center text-base font-medium text-[#6B6B5F]">
                {error}
              </div>
            )}

            {!isLoading && !error && results.length === 0 && (
              <div className="rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEE8DA] text-[#556B2F]">
                  <Sparkles size={28} />
                </div>
                <p className="text-base font-semibold text-[#243119]">No food comparison available yet.</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B6B5F]">
                  Try another food item, restaurant, or platform name.
                </p>
              </div>
            )}

            {!isLoading && !error && results.length > 0 && (
              <div className="space-y-2">
                <div className="rounded-[24px] border border-[#A8B879] bg-[#EEF3DF] p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#556B2F]">Best overall deal today</p>
                      <p className="mt-3 text-4xl font-semibold tracking-tight text-[#243119]">{bestDeal ? formatCurrency(getFinalPrice(bestDeal)) : '—'}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#556B2F]">
                        <span className="font-medium text-[#243119]">Platform: {bestDeal?.platform || '-'}</span>
                        <span className="font-medium text-[#243119]">Item: {bestDeal?.item || '-'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-right sm:items-end">
                      <span className="rounded-full bg-[#556B2F] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F7F3EA]">
                        BEST DEAL
                      </span>
                      <p className="text-sm font-semibold text-[#243119]">
                        Savings {formatCurrency(savingsVsHighest)} vs highest
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {platformFilters.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setVisibleRows(initialVisibleRows);
                        setExpandedResultId('');
                      }}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selectedPlatform === platform
                          ? 'border-[#556B2F] bg-[#556B2F] text-[#F7F3EA]'
                          : 'border-[#DDD2BD] bg-[#FFFDF7] text-[#243119] hover:bg-[#EEE8DA]'
                      }`}
                    >
                      {platform} ({platformCounts[platform] || 0})
                    </button>
                  ))}
                </div>

                <div className="rounded-[18px] border border-[#DDD2BD] bg-[#FFFDF7] p-3 shadow-[0_12px_28px_rgba(85,107,47,0.08)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD2BD] bg-[#FFFDF7] px-4 py-3">
                    <p className="text-sm font-semibold text-[#243119]">
                      Showing {filteredResults.length} option{filteredResults.length === 1 ? '' : 's'} compared
                    </p>
                    {visibleRows < filteredResults.length && (
                      <p className="text-xs font-medium text-[#6B6B5F]">First {visibleResults.length} visible</p>
                    )}
                  </div>
                  <div className="space-y-6 pt-3">
                    {!hasComparison ? (
                      <div className="rounded-[24px] border border-[#D8CFBF] bg-[#FFF9EE] p-6 text-center shadow-sm">
                        <p className="text-sm font-semibold text-[#556B2F]">No comparison available</p>
                        <p className="mt-2 text-sm text-[#6B6B5F]">
                          Only one platform option exists for this search.
                        </p>
                      </div>
                    ) : (
                      <>
                        {visibleResultsByItem.map(([item, itemGroup]) => {
                          const cheapestOption = itemGroup[0];
                          const cheapestPrice = getFinalPrice(cheapestOption);
                          
                          return (
                            <section key={item} className="rounded-[24px] border border-[#DDD2BD] bg-[#FFFDF7] p-6 shadow-sm">
                              {/* Header: Restaurant • Item */}
                              <div className="border-b border-[#DDD2BD] pb-4">
                                <h3 className="text-lg font-semibold text-[#243119]">
                                  {itemGroup[0].restaurant} <span className="text-[#6B6B5F]">•</span> {item}
                                </h3>
                              </div>

                              {/* Best Price Today Section */}
                              <div className="mt-5 rounded-[20px] border-2 border-[#A8B879] bg-[#EEF3DF] p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#556B2F]">Best Price Today</p>
                                <p className="mt-3 text-4xl font-bold text-[#243119]">{formatCurrency(cheapestPrice)}</p>
                                <p className="mt-2 text-sm font-semibold text-[#556B2F]">{cheapestOption.platform}</p>
                              </div>

                              {/* Platform Comparison Rows */}
                              <div className="mt-5 space-y-2">
                                {itemGroup.map((result) => {
                                  const priceDiff = getFinalPrice(result) - cheapestPrice;
                                  const isCheapest = priceDiff === 0;
                                  
                                  return (
                                    <div
                                      key={result._id}
                                      className={`rounded-[16px] border px-4 py-3 transition ${
                                        isCheapest
                                          ? 'border-[#A8B879] bg-[#EEF3DF] shadow-sm'
                                          : 'border-[#DDD2BD] bg-[#FFFDF7]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-[#243119]">{result.platform}</p>
                                          {isCheapest && (
                                            <span className="mt-1 inline-block rounded-full bg-[#556B2F] px-2.5 py-0.5 text-[0.65rem] font-semibold text-[#F7F3EA]">
                                              Best Deal
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-base font-bold text-[#243119]">{formatCurrency(getFinalPrice(result))}</p>
                                          {!isCheapest && (
                                            <p className="mt-0.5 text-xs font-semibold text-[#E74C3C]">
                                              +{formatCurrency(priceDiff)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Savings Statement */}
                              {itemGroup.length > 1 && (
                                <div className="mt-5 rounded-[16px] bg-[#F7F3EA] p-4 text-center">
                                  <p className="text-sm font-semibold text-[#243119]">
                                    You save {formatCurrency(Math.max(...itemGroup.map(r => getFinalPrice(r))) - cheapestPrice)} by choosing {cheapestOption.platform}
                                  </p>
                                </div>
                              )}
                            </section>
                          );
                        })}
                      </>
                    )}
                  </div>

                {visibleRows < filteredResults.length && (
                  <div className="border-t border-[#DDD2BD] bg-[#FFFDF7] px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleRows((currentRows) => currentRows + initialVisibleRows)}
                      className="rounded-full bg-[#556B2F] px-5 py-2.5 text-sm font-semibold text-[#F7F3EA] transition hover:bg-[#4a5f24]"
                    >
                      Show More Results
                    </button>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section id="workflow" className="scroll-mt-24 pb-[120px]">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-[#243119] sm:text-4xl">System Workflow</h2>
              <p className="mt-3 text-base leading-7 text-[#6B6B5F]">
                BiteBest follows a full-stack request-response workflow to compare food delivery prices using stored
                platform data.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {howItWorksSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-[18px] border border-[#DDD2BD] bg-[#FFFDF7] p-5 shadow-[0_12px_28px_rgba(85,107,47,0.06)]"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#556B2F] text-[#F5F1E8]">
                      <Icon size={18} />
                    </div>
                    <span className="text-xs font-semibold tracking-[0.18em] text-[#6B6B5F]">{step.step}</span>
                  </div>
                  <h3 className="text-base font-semibold leading-6 text-[#243119]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B6B5F]">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto mb-[120px] h-px w-[calc(100%-48px)] max-w-[1200px] bg-[#DDD2BD]" />

      <section id="about" className="scroll-mt-24 pb-14">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid gap-6 rounded-3xl border border-[#D8CFBF] bg-[#EEE8DA] p-7 text-[#243119] shadow-sm md:grid-cols-[0.8fr_1.2fr] md:p-9">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#556B2F]">Project Overview</p>
              <h2 className="mt-2 text-3xl font-semibold">About the Project</h2>
            </div>
            <div>
              <p className="text-base leading-8 text-[#243119]/80">
                BiteBest is a full-stack food price comparison system designed to reduce the effort of checking multiple
                food delivery platforms manually.
              </p>
              <p className="mt-4 text-base leading-8 text-[#243119]/80">
                The application demonstrates modern application development concepts such as frontend-backend
                separation, REST API integration, MongoDB database management, admin-controlled CRUD operations,
                offer-aware price calculation, and dynamic result rendering.
              </p>
              <p className="mt-4 text-base leading-8 text-[#243119]/80">
                Unlike a simple static comparison page, BiteBest uses a maintained database and backend pricing logic to
                calculate the final payable amount before displaying ranked results to the user.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {aboutChips.map((chip) => (
                  <span key={chip} className="rounded-full bg-[#F5F1E8] px-4 py-2 text-sm font-semibold text-[#556B2F]">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
