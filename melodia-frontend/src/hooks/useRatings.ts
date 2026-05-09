import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceApi } from '../lib/marketplaceApi';
import { getErrorMessage } from '../lib/errors';
import { useAuth } from '../context/AuthContext';

export function useMyRatings() {
  const { user, isAdmin } = useAuth();
  return useQuery<Record<string, number>>({
    queryKey: ['ratings', user?.id, isAdmin ? 'admin' : 'user'],
    queryFn: async () => {
      if (!user || isAdmin) return {};
      return marketplaceApi.getMyRatingsMap();
    },
    enabled: !!user,
  });
}

export function useRateAlbum() {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  return useMutation({
    mutationFn: async ({ albumId, score }: { albumId: string; score: number }) => {
      if (!user) throw new Error('Not signed in');
      if (isAdmin) throw new Error('Administrator accounts cannot rate albums');
      await marketplaceApi.upsertRating(albumId, score);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ratings'] });
      qc.invalidateQueries({ queryKey: ['albums'] });
      qc.invalidateQueries({ queryKey: ['library'] });
      toast.success('Rating saved');
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Could not save your rating. Please try again.')),
  });
}
