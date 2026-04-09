"use client";

import { useState } from "react";
import { UploadSimple, Star, Trash, Images } from "@phosphor-icons/react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

type PhotoItem = {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
};

export function PhotosForm() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 10 - photos.length;
    const newPhotos: PhotoItem[] = Array.from(files)
      .slice(0, remaining)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        isPrimary: photos.length === 0,
      }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length > 0 && !next.some((p) => p.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  }

  function setPrimary(id: string) {
    setPhotos((prev) =>
      prev.map((p) => ({ ...p, isPrimary: p.id === id })),
    );
  }

  return (
    <form action="/portal/setup" method="get" className="flex flex-col gap-6">
      <input type="hidden" name="just" value="photos" />

      {/* Drop zone */}
      <label
        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors hover:bg-[var(--color-warm-gray-50)]"
        style={{ borderColor: "var(--color-warm-gray-200)" }}
      >
        <UploadSimple size={32} weight="duotone" style={{ color: "var(--color-text-tertiary)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Drag and drop photos here, or click to browse
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          Up to 10 photos. JPG or PNG. {photos.length}/10 uploaded.
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border"
              style={{
                borderColor: photo.isPrimary ? "var(--color-brand)" : "var(--color-warm-gray-200)",
                boxShadow: photo.isPrimary ? "0 0 0 2px var(--color-brand)" : "none",
              }}
            >
              <img
                src={photo.preview}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPrimary(photo.id)}
                  title="Set as primary"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90"
                >
                  <Star
                    size={14}
                    weight={photo.isPrimary ? "fill" : "regular"}
                    style={{ color: photo.isPrimary ? "#f59e0b" : "#666" }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  title="Remove"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90"
                >
                  <Trash size={14} style={{ color: "#dc2626" }} />
                </button>
              </div>
              {photo.isPrimary && (
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold"
                  style={{ color: "var(--color-brand)" }}>
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8" style={{ color: "var(--color-text-tertiary)" }}>
          <Images size={40} weight="duotone" />
          <p className="text-sm">No photos uploaded yet</p>
        </div>
      )}

      <StepSaveBar pending={false} />
    </form>
  );
}
