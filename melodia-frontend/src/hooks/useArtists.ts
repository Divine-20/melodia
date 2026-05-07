import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceApi } from '../lib/marketplaceApi';
import type { Artist } from '../lib/database.types';

export function useArtists(search?: string) {
  return useQuery({
    queryKey: ['artists', search],
    queryFn: async () => marketplaceApi.listArtists(search),
  });
}

export function useArtist(id: string) {
  return useQuery({
    queryKey: ['artist', id],
    queryFn: async () => marketplaceApi.getArtistById(id),
    enabled: !!id,
  });
}

export function useCreateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (artist: Omit<Artist, 'id' | 'created_at' | 'updated_at'>) =>
      marketplaceApi.createArtist(artist),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artists'] });
      toast.success('Artist created');
    },
    onError: (error) => toast.error(error.message || 'Failed to create artist'),
  });
}

export function useUpdateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...artist }: Partial<Artist> & { id: string }) =>
      marketplaceApi.updateArtist({ id, ...artist }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artists'] });
      qc.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Artist updated');
    },
    onError: (error) => toast.error(error.message || 'Failed to update artist'),
  });
}

export function useDeleteArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await marketplaceApi.deleteArtist(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artists'] });
      qc.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Artist deleted');
    },
    onError: (error) => toast.error(error.message || 'Failed to delete artist'),
  });
}
