import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceApi } from '../lib/marketplaceApi';
import type { Album } from '../lib/database.types';

export function useAlbums(search?: string) {
  return useQuery({
    queryKey: ['albums', search],
    queryFn: async () => marketplaceApi.listAlbums(search),
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
    onError: (error) => toast.error(error.message || 'Failed to create album'),
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
    onError: (error) => toast.error(error.message || 'Failed to update album'),
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
    onError: (error) => toast.error(error.message || 'Failed to delete album'),
  });
}
