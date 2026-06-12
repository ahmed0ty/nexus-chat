"use client";

import { useState, useCallback } from "react";
import api from "@/lib/axios";
import { MediaContent, UploadProgress } from "@/types";
import { generateTempId } from "@/lib/utils";
import imageCompression from "browser-image-compression";

export const useMediaUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const updateProgress = (fileId: string, data: Partial<UploadProgress>) => {
    setUploads((prev) =>
      prev.map((u) => (u.fileId === fileId ? { ...u, ...data } : u))
    );
  };

  const uploadFile = useCallback(async (file: File): Promise<MediaContent | null> => {
    const fileId = generateTempId();

    setUploads((prev) => [
      ...prev,
      { fileId, fileName: file.name, progress: 0, status: "uploading" },
    ]);

    try {
      let fileToUpload = file;

      if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (p) => updateProgress(fileId, { progress: p / 2 }),
        });
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const { data } = await api.post<{ data: MediaContent }>("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e: { loaded: number; total?: number }) => {
  const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
  updateProgress(fileId, { progress: 50 + progress / 2 });
},
      });

      updateProgress(fileId, { progress: 100, status: "done", url: data.data.url });
      return data.data;
    } catch {
      updateProgress(fileId, { status: "error" });
      return null;
    }
  }, []);

  const uploadMultiple = useCallback(async (files: File[]): Promise<(MediaContent | null)[]> => {
    return Promise.all(files.map(uploadFile));
  }, [uploadFile]);

  const clearUploads = useCallback(() => setUploads([]), []);

  return { uploads, uploadFile, uploadMultiple, clearUploads };
};