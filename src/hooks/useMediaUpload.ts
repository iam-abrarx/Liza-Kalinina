"use client";
import { useState } from 'react';

export function useMediaUpload(password: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const performUpload = (file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', '/api/upload', true);
      xhr.setRequestHeader('x-admin-password', password);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress?.(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await performUpload(file, (percent) => {
          setUploadProgress(Math.round(((i * 100) + percent) / files.length));
        });
        if (res.url) uploadedUrls.push(res.url);
      }
      return uploadedUrls;
    } catch (err) {
      console.error('Local Upload error:', err);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const uploadThumbnail = async (file: File) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const res = await performUpload(file);
      return res.url;
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, uploadFiles, uploadThumbnail };
}
