"use client"

import Image from "next/image"
import { useId, useState } from "react"
import { ImagePlus } from "lucide-react"
import { UploadFieldSkeleton, WithBone } from "@/components/dashboard/dashboard-loading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useImageUploadMutation } from "@/hooks/use-image-upload"

export function ImageUploadField() {
  const inputId = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const { mutate, isPending } = useImageUploadMutation()

  return (
    <WithBone
      name="shared-image-upload"
      loading={isPending}
      fallback={<UploadFieldSkeleton />}
    >
      <div className="rounded-xl border p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-950">
          <ImagePlus className="size-4" />
          Reusable image upload
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={inputId}>Choose image</Label>
            <Input
              id={inputId}
              type="file"
              accept="image/*"
              className="h-12"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return

                setPreview(URL.createObjectURL(file))
                mutate(file, {
                  onSuccess: (data) => {
                    setUploadedUrl(data.url)
                  },
                })
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed p-3">
              <p className="mb-2 text-xs text-slate-600">Preview</p>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                {preview ? (
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    Image preview
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border p-3">
              <p className="mb-2 text-xs text-slate-600">Uploaded URL</p>
              <div className="min-h-24 rounded-lg bg-muted p-3 text-xs break-all text-slate-700">
                {isPending ? "Uploading..." : uploadedUrl ?? "No upload yet"}
              </div>
              {uploadedUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full shadow-none"
                  onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                >
                  Copy URL
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </WithBone>
  )
}
