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
