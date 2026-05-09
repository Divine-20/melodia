import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceApi, type ListAlbumsParams } from '../lib/marketplaceApi';
import { getErrorMessage } from '../lib/errors';
import type { Album } from '../lib/database.types';

function normalizeListParams(input?: ListAlbumsParams | string): ListAlbumsParams | undefined {
  if (input === undefined) return undefined;
  if (typeof input === 'string') {
    const t = input.trim();
    return t ? { search: t } : undefined;
  }
  return input;
}

export function useAlbums(params?: ListAlbumsParams | string) {
  const normalized = normalizeListParams(params);
  return useQuery({
    queryKey: [
      'albums',
      normalized?.search,
      normalized?.genre,
      normalized?.minAverageRating,
      normalized?.sort,
      normalized?.order,
    ],
    queryFn: async () => marketplaceApi.listAlbums(normalized),
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: ['album', id],
    queryFn: async () => marketplaceApi.getAlbumById(id),
    enabled: !!id,
  });
}

export function useAlbumsByArtist(artistId: string) {
  return useQuery({
    queryKey: ['albums', 'artist', artistId],
    queryFn: async () => marketplaceApi.listAlbumsByArtist(artistId),
    enabled: !!artistId,
  });
}

export function useCreateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (album: Omit<Album, 'id' | 'created_at' | 'updated_at'>) =>
      marketplaceApi.createAlbum(album),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album created');
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Could not create the album. Please try again.')),
  });
}

export function useUpdateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...album }: Partial<Album> & { id: string }) =>
      marketplaceApi.updateAlbum({ id, ...album }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album updated');
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Could not update the album. Please try again.')),
  });
}

export function useDeleteAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await marketplaceApi.deleteAlbum(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album deleted');
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, 'Could not delete the album. Please try again.')),
  });
}
