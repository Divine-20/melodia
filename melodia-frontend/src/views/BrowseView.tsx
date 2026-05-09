import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Disc3,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAlbums } from '../hooks/useAlbums';
import { usePurchasedAlbumIdSet } from '../hooks/usePurchases';
import { useMyRatings } from '../hooks/useRatings';
import { usePurchaseAlbum } from '../hooks/usePurchases';
import { useRateAlbum } from '../hooks/useRatings';
import { useFavoriteAlbumIds, useSetFavoriteAlbum } from '../hooks/useFavorites';
import { AlbumCard } from '../components/AlbumCard';
import { AlbumDetailModal } from '../components/AlbumDetailModal';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import type { AlbumWithRating } from '../lib/database.types';
import { marketplaceApi, type AlbumListSort, type ListAlbumsParams } from '../lib/marketplaceApi';
import { getErrorMessage } from '../lib/errors';

interface Props {
  onRequireAuth: () => void;
}

const SORT_PRESETS: Record<string, { sort: AlbumListSort; order: 'asc' | 'desc' }> = {
  name_asc: { sort: 'name', order: 'asc' },
  name_desc: { sort: 'name', order: 'desc' },
  price_asc: { sort: 'price', order: 'asc' },
  price_desc: { sort: 'price', order: 'desc' },
  newest: { sort: 'created_at', order: 'desc' },
  oldest: { sort: 'created_at', order: 'asc' },
  rating: { sort: 'average_rating', order: 'desc' },
};

const MIN_RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any rating' },
  { value: 3, label: '3+ stars' },
  { value: 4, label: '4+ stars' },
  { value: 4.5, label: '4.5+ stars' },
];

type PriceBucket = 'any' | 'under15' | '15_25' | 'over25';
type YearBucket = 'any' | '2020s' | '2010s' | 'older';

const PRICE_OPTIONS: { id: PriceBucket; label: string }[] = [
  { id: 'any', label: 'Any price' },
  { id: 'under15', label: 'Under $15' },
  { id: '15_25', label: '$15 – $25' },
  { id: 'over25', label: 'Over $25' },
];

const YEAR_OPTIONS: { id: YearBucket; label: string }[] = [
  { id: 'any', label: 'Any release year' },
  { id: '2020s', label: '2020s' },
  { id: '2010s', label: '2010s' },
  { id: 'older', label: 'Before 2010' },
];

function albumMatchesPrice(p: number, bucket: PriceBucket): boolean {
  switch (bucket) {
    case 'under15':
      return p < 15;
    case '15_25':
      return p >= 15 && p <= 25;
    case 'over25':
      return p > 25;
    default:
      return true;
  }
}

function albumMatchesYear(releaseYear: number | undefined, bucket: YearBucket): boolean {
  if (bucket === 'any') return true;
  if (!releaseYear || releaseYear <= 0) return false;
  switch (bucket) {
    case '2020s':
      return releaseYear >= 2020 && releaseYear <= 2029;
    case '2010s':
      return releaseYear >= 2010 && releaseYear <= 2019;
    case 'older':
      return releaseYear < 2010;
    default:
      return true;
  }
}

export function BrowseView({ onRequireAuth }: Props) {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortPreset, setSortPreset] = useState<string>('name_asc');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [priceBucket, setPriceBucket] = useState<PriceBucket>('any');
  const [yearBucket, setYearBucket] = useState<YearBucket>('any');
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithRating | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    if (isAdmin) setFavoritesOnly(false);
  }, [isAdmin]);

  const listParams = useMemo((): ListAlbumsParams => {
    const sp = SORT_PRESETS[sortPreset] ?? SORT_PRESETS.name_asc;
    return {
      search: search.trim() || undefined,
      genre: genre.trim() || undefined,
      minAverageRating: minRating > 0 ? minRating : undefined,
      sort: sp.sort,
      order: sp.order,
    };
  }, [search, genre, minRating, sortPreset]);

  const { data: albums, isLoading, isError, error, refetch, isRefetching } =
    useAlbums(listParams);
  const { data: genreSource } = useQuery({
    queryKey: ['albums', 'filter-options'],
    queryFn: () => marketplaceApi.listAlbums({ sort: 'name', order: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });

  const genreOptions = useMemo(() => {
    const s = new Set<string>();
    for (const a of genreSource ?? []) {
      if (a.genre?.trim()) s.add(a.genre.trim());
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [genreSource]);

  const purchasedAlbumIds = usePurchasedAlbumIdSet();
  const albumIsPurchased = (albumId: string) => purchasedAlbumIds.has(String(albumId).trim());
  const { data: myRatings = {} } = useMyRatings();
  const { data: favoriteIdSet } = useFavoriteAlbumIds();
  const purchaseMutation = usePurchaseAlbum();
  const rateMutation = useRateAlbum();
  const setFavoriteMutation = useSetFavoriteAlbum();

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(genre.trim()) ||
    minRating > 0 ||
    (!isAdmin && favoritesOnly) ||
    sortPreset !== 'name_asc' ||
    priceBucket !== 'any' ||
    yearBucket !== 'any';

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n++;
    if (genre.trim()) n++;
    if (minRating > 0) n++;
    if (!isAdmin && favoritesOnly) n++;
    if (sortPreset !== 'name_asc') n++;
    if (priceBucket !== 'any') n++;
    if (yearBucket !== 'any') n++;
    return n;
  }, [
    search,
    genre,
    minRating,
    favoritesOnly,
    isAdmin,
    sortPreset,
    priceBucket,
    yearBucket,
  ]);

  const displayedAlbums = useMemo(() => {
    let rows = albums ?? [];
    rows = rows.filter((a) => albumMatchesPrice(a.price, priceBucket));
    rows = rows.filter((a) => albumMatchesYear(a.release_year, yearBucket));
    if (favoritesOnly && favoriteIdSet && !isAdmin) {
      rows = rows.filter((a) => favoriteIdSet.has(String(a.id)));
    }
    return rows;
  }, [albums, favoritesOnly, favoriteIdSet, isAdmin, priceBucket, yearBucket]);

  async function handlePurchase(albumId: string) {
    if (!user) {
      onRequireAuth();
      return;
    }
    setPurchasingId(albumId);
    try {
      await purchaseMutation.mutateAsync(albumId);
    } finally {
      setPurchasingId(null);
    }
  }

  async function handleRate(albumId: string, score: number) {
    await rateMutation.mutateAsync({ albumId, score });
  }

  function handleToggleFavorite(albumId: string) {
    if (isAdmin) return;
    if (!user) {
      onRequireAuth();
      return;
    }
    const isFav = favoriteIdSet?.has(String(albumId)) ?? false;
    setFavoriteMutation.mutate({ albumId, favorite: !isFav });
  }

  const catalogForHighlights = albums ?? [];
  const featured = !hasActiveFilters ? catalogForHighlights.slice(0, 1)[0] : undefined;
  const topRated =
    !hasActiveFilters && catalogForHighlights.length > 0
      ? catalogForHighlights
          .filter((a) => a.rating_count > 0)
          .sort((a, b) => b.avg_rating - a.avg_rating)
          .slice(0, 4)
      : [];

  const allAlbums = displayedAlbums;

  const selectClass =
    'w-full min-h-[48px] bg-gray-800 border border-gray-700 rounded-xl px-3 sm:px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 touch-manipulation';

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950 overscroll-y-contain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10 max-md:pl-[3.25rem]">
        {/* Header + Search */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Discover Music</h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                {isAdmin ? 'Browse the catalog (admin)' : 'Browse and purchase from our catalog'}
              </p>
            </div>
            <div className="w-full sm:w-80 min-w-0">
              <SearchBar value={search} onChange={setSearch} />
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/50 shadow-lg shadow-black/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left touch-manipulation hover:bg-gray-800/40 transition-colors"
            >
              <span className="flex items-center gap-2 sm:gap-3 min-w-0">
                <SlidersHorizontal size={20} className="text-rose-400 shrink-0" />
                <span className="text-gray-100 text-base sm:text-lg font-semibold truncate">
                  Filters & sorting
                </span>
                {activeFilterCount > 0 && (
                  <span
                    className="shrink-0 rounded-full bg-rose-500/25 text-rose-300 text-xs font-bold px-2.5 py-0.5 tabular-nums border border-rose-500/35"
                    title={`${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 shrink-0 text-gray-400 text-sm">
                <span className="hidden sm:inline">{filtersOpen ? 'Hide' : 'Show'}</span>
                {filtersOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </span>
            </button>
            {filtersOpen && (
              <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0 space-y-4 border-t border-gray-800/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-5">
              <div className="min-w-0">
                <label className="text-sm text-gray-400 mb-1.5 block font-medium">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className={selectClass}
                >
                  <option value="">All genres</option>
                  {genreOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-gray-400 mb-1.5 block font-medium">Community rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className={selectClass}
                >
                  {MIN_RATING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-gray-400 mb-1.5 block font-medium">Price</label>
                <select
                  value={priceBucket}
                  onChange={(e) => setPriceBucket(e.target.value as PriceBucket)}
                  className={selectClass}
                >
                  {PRICE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="text-sm text-gray-400 mb-1.5 block font-medium">Release era</label>
                <select
                  value={yearBucket}
                  onChange={(e) => setYearBucket(e.target.value as YearBucket)}
                  className={selectClass}
                >
                  {YEAR_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 sm:col-span-2 xl:col-span-1 2xl:col-span-1">
                <label className="text-sm text-gray-400 mb-1.5 block font-medium">Sort by</label>
                <select
                  value={sortPreset}
                  onChange={(e) => setSortPreset(e.target.value)}
                  className={selectClass}
                >
                  <option value="name_asc">Name (A–Z)</option>
                  <option value="name_desc">Name (Z–A)</option>
                  <option value="price_asc">Price (low to high)</option>
                  <option value="price_desc">Price (high to low)</option>
                  <option value="newest">Date added (newest)</option>
                  <option value="oldest">Date added (oldest)</option>
                  <option value="rating">Average rating (highest)</option>
                </select>
              </div>
              {!isAdmin && (
                <label className="flex items-center gap-3 cursor-pointer select-none min-h-[48px] sm:col-span-2 xl:col-span-1 2xl:col-span-1 pt-6 xl:pt-0 2xl:pt-6 self-end 2xl:self-center">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-600 bg-gray-800 text-rose-500 focus:ring-rose-500 focus:ring-offset-0 focus:ring-offset-gray-950 touch-manipulation"
                    checked={favoritesOnly}
                    disabled={!user}
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                  />
                  <span className={`text-base font-medium ${user ? 'text-gray-300' : 'text-gray-500'}`}>
                    Favorites only
                  </span>
                </label>
              )}
            </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured hero */}
        {!isError && !hasActiveFilters && featured && (
          <div
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[14rem] h-52 sm:h-64 cursor-pointer group"
            onClick={() => setSelectedAlbum(featured)}
          >
            <img
              src={
                featured.cover_url ||
                'https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg'
              }
              alt={featured.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Sparkles size={14} className="text-rose-400 shrink-0" />
                <span className="text-rose-400 text-xs font-semibold uppercase tracking-wider">
                  Featured Album
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-1 leading-tight">{featured.name}</h2>
              <p className="text-gray-300 text-base sm:text-lg">{featured.artist_name}</p>
              <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-white">${featured.price}</span>
                {!isAdmin && albumIsPurchased(featured.id) && (
                  <span className="bg-emerald-500/90 text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-xl">
                    Purchased
                  </span>
                )}
                {!isAdmin && !albumIsPurchased(featured.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(featured.id);
                    }}
                    disabled={purchasingId === featured.id}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {purchasingId === featured.id ? 'Purchasing...' : 'Purchase'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Rated */}
        {!isError && !hasActiveFilters && topRated.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={20} className="text-rose-400" />
              <h2 className="text-xl font-bold text-white">Top Rated</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {topRated.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isPurchased={albumIsPurchased(album.id)}
                  myRating={myRatings[album.id]}
                  isFavorite={favoriteIdSet?.has(String(album.id)) ?? false}
                  onPurchase={() => handlePurchase(album.id)}
                  onRate={(score) => handleRate(album.id, score)}
                  onOpenDetail={() => setSelectedAlbum(album)}
                  onToggleFavorite={
                    isAdmin ? undefined : () => handleToggleFavorite(album.id)
                  }
                  purchasing={purchasingId === album.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Albums */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Disc3 size={20} className="text-rose-400" />
            <h2 className="text-xl font-bold text-white">
              {hasActiveFilters || search.trim() ? 'Matching albums' : 'All Albums'}
            </h2>
            {albums && (
              <span className="text-gray-500 text-sm ml-1">
                ({favoritesOnly ? allAlbums.length : albums.length})
              </span>
            )}
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div
              className="rounded-2xl border border-red-500/35 bg-red-950/40 px-5 py-10 text-center max-w-lg mx-auto"
              role="alert"
            >
              <AlertCircle size={44} className="mx-auto mb-4 text-red-400" aria-hidden />
              <h3 className="text-lg font-semibold text-white mb-2">Couldn’t load albums</h3>
              <p className="text-sm text-red-100/90 mb-6 leading-relaxed">
                {getErrorMessage(
                  error,
                  'The catalog could not be loaded. Check that the API is running, then try again.'
                )}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 touch-manipulation"
              >
                {isRefetching ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          )}

          {!isLoading && !isError && allAlbums.length === 0 && (
            <div className="text-center py-16">
              <Disc3 size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">
                No albums found
                {search.trim() ? ` for “${search.trim()}”` : ''}.
              </p>
            </div>
          )}

          {!isLoading && !isError && allAlbums.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {allAlbums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isPurchased={albumIsPurchased(album.id)}
                  myRating={myRatings[album.id]}
                  isFavorite={favoriteIdSet?.has(String(album.id)) ?? false}
                  onPurchase={() => handlePurchase(album.id)}
                  onRate={(score) => handleRate(album.id, score)}
                  onOpenDetail={() => setSelectedAlbum(album)}
                  onToggleFavorite={
                    isAdmin ? undefined : () => handleToggleFavorite(album.id)
                  }
                  purchasing={purchasingId === album.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          isPurchased={albumIsPurchased(selectedAlbum.id)}
          myRating={myRatings[selectedAlbum.id]}
          isFavorite={favoriteIdSet?.has(String(selectedAlbum.id)) ?? false}
          onPurchase={() => handlePurchase(selectedAlbum.id)}
          onRate={(score) => handleRate(selectedAlbum.id, score)}
          onToggleFavorite={
            isAdmin ? undefined : () => handleToggleFavorite(selectedAlbum.id)
          }
          onClose={() => setSelectedAlbum(null)}
          purchasing={purchasingId === selectedAlbum.id}
          onRequireAuth={onRequireAuth}
        />
      )}
    </div>
  );
}
