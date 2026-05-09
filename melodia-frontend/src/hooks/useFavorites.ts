import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceApi } from '../lib/marketplaceApi';
import { getErrorMessage } from '../lib/errors';
import { useAuth } from '../context/AuthContext';

export function useFavoriteAlbumIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => marketplaceApi.getFavoriteAlbumIds(),
    enabled: !!user,
    select: (ids: number[]) => new Set(ids.map((id) => String(id))),
  });
}

export function useSetFavoriteAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ albumId, favorite }: { albumId: string; favorite: boolean }) => {
      if (favorite) await marketplaceApi.addFavoriteAlbum(albumId);
      else await marketplaceApi.removeFavoriteAlbum(albumId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, 'Could not update your favorites. Please try again.')
      ),
  });
}
