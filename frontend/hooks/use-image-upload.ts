"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiClient } from "@/api-hooks/api-hooks"
import type { UploadImageResponse } from "@/lib/types/dashboard"

export function useImageUploadMutation() {
  return useMutation({
    mutationKey: ["upload", "image"],
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const { data } = await apiClient.post<UploadImageResponse>(
        "/image/upload",
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
      toast.success("Image uploaded")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
