import { useState } from 'react';
import { upload } from "@vercel/blob/client";

export function useMediaUpload(password: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uniqueName = `${Date.now()}-${file.name}`;
        const newBlob = await upload(uniqueName, file, {
          access: 'public',
          handleUploadUrl: `/api/upload?password=${encodeURIComponent(password)}`,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round(((i * 100) + progress.percentage) / files.length));
          }
        });
        if (newBlob.url) uploadedUrls.push(newBlob.url);
      }
      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadThumbnail = async (file: File) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const uniqueName = `${Date.now()}-${file.name}`;
      const newBlob = await upload(uniqueName, file, {
        access: 'public',
        handleUploadUrl: `/api/upload?password=${encodeURIComponent(password)}`,
      });
      return newBlob.url;
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, uploadFiles, uploadThumbnail };
}
