"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiClient } from "@/api-hooks/api-hooks"
import type { UploadImageResponse } from "@/lib/types/dashboard"

export function useFileUploadMutation() {
  return useMutation({
    mutationKey: ["upload", "file"],
    mutationFn: async ({ file, category }: { file: File; category?: string }) => {
      const formData = new FormData()
      formData.append("file", file)
      if (category) {
        formData.append("category", category)
      }

      const { data } = await apiClient.post<UploadImageResponse>(
        "/uploads",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      return data
    },
    onSuccess: () => {
      toast.success("File uploaded")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
