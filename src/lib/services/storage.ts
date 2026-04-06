import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface UploadParams {
  bucket: string;
  path: string;
  file: File | Buffer;
  contentType: string;
}

export interface StorageService {
  upload(params: UploadParams): Promise<{ data: { path: string } | null; error: string | null }>;
  getPublicUrl(
    bucket: string,
    path: string,
  ): Promise<{ data: { url: string } | null; error: string | null }>;
  remove(bucket: string, path: string): Promise<{ data: null; error: string | null }>;
}

export function createSupabaseStorageService(client: SupabaseClient<Database>): StorageService {
  return {
    async upload(
      params: UploadParams,
    ): Promise<{ data: { path: string } | null; error: string | null }> {
      try {
        const { data, error } = await client.storage
          .from(params.bucket)
          .upload(params.path, params.file, {
            contentType: params.contentType,
            upsert: true,
          });

        if (error) return { data: null, error: error.message };
        return { data: { path: data.path }, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown storage error';
        return { data: null, error: message };
      }
    },

    async getPublicUrl(
      bucket: string,
      path: string,
    ): Promise<{ data: { url: string } | null; error: string | null }> {
      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return { data: { url: data.publicUrl }, error: null };
    },

    async remove(bucket: string, path: string): Promise<{ data: null; error: string | null }> {
      try {
        const { error } = await client.storage.from(bucket).remove([path]);
        if (error) return { data: null, error: error.message };
        return { data: null, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown storage error';
        return { data: null, error: message };
      }
    },
  };
}
