import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceApi } from '../lib/marketplaceApi';
import { useAuth } from '../context/AuthContext';

export function useMyPurchases() {
  const { user, isAdmin } = useAuth();
  return useQuery({
    queryKey: ['purchases', user?.id, isAdmin ? 'admin' : 'user'],
    queryFn: async () => {
      if (!user || isAdmin) return [];
      const library = await marketplaceApi.getMyLibrary();
      return library.map((album) => String(album.id).trim()).filter(Boolean);
    },
    enabled: !!user,
  });
}

/** Compare with `album.id` from the catalog — coerces string/number mismatches. */
export function usePurchasedAlbumIdSet(): Set<string> {
  const { data: purchasedIds = [] } = useMyPurchases();
  return useMemo(
    () => new Set((purchasedIds ?? []).map((id) => String(id).trim()).filter(Boolean)),
    [purchasedIds]
  );
}

export function useMyLibrary() {
  const { user, isAdmin } = useAuth();
  return useQuery({
    queryKey: ['library', user?.id, isAdmin ? 'admin' : 'user'],
    queryFn: async () => {
      if (!user || isAdmin) return [];
      return marketplaceApi.getMyLibrary();
    },
    enabled: !!user,
  });
}

export function usePurchaseAlbum() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  return useMutation({
    mutationFn: async (albumId: string) => {
      if (!user) throw new Error('Not signed in');
      if (isAdmin) throw new Error('Administrator accounts cannot purchase albums');
      await marketplaceApi.purchaseAlbum(albumId);
    },
    onSuccess: (_, albumId) => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['albums'] });
      qc.invalidateQueries({ queryKey: ['album', albumId] });
      toast.success('Album purchased successfully');
    },
    onError: (error) => toast.error(error.message || 'Purchase failed'),
  });
}
