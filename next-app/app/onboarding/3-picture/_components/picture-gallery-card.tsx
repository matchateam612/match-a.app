import Image from "next/image";

import styles from "../../1-basics/page.module.scss";
import { MAX_GALLERY_PHOTOS } from "./picture-data";
import type { GalleryPictureSlot } from "./picture-types";

type PictureGalleryCardProps = {
  slots: GalleryPictureSlot[];
  disabled: boolean;
  onUploadClick: (slot: number) => void;
  onDeleteClick: (slot: number) => void;
};

export function PictureGalleryCard({
  slots,
  disabled,
  onUploadClick,
  onDeleteClick,
}: PictureGalleryCardProps) {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>More photos</span>
      <p className={styles.helper}>
        Add up to {MAX_GALLERY_PHOTOS} extra private photos. Empty slots stay empty until you use
        them.
      </p>
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {slots.map((slot) => (
          <div
            key={slot.slot}
            style={{
              display: "grid",
              gap: "12px",
              padding: "16px",
              borderRadius: "20px",
              border: "1px solid rgba(148, 163, 184, 0.24)",
              background: "rgba(255, 255, 255, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span className={styles.helper}>Photo {slot.slot}</span>
              <span className={styles.helper}>{slot.path ? "Saved" : "Empty"}</span>
            </div>

            {slot.previewUrl ? (
              <Image
                src={slot.previewUrl}
                alt={`Gallery photo slot ${slot.slot}`}
                width={300}
                height={400}
                unoptimized
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "18px",
                  aspectRatio: "3 / 4",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  minHeight: "220px",
                  borderRadius: "18px",
                  aspectRatio: "3 / 4",
                  border: "1px dashed rgba(148, 163, 184, 0.36)",
                  color: "rgba(226, 232, 240, 0.78)",
                  textAlign: "center",
                  padding: "16px",
                }}
              >
                Choose a photo for this slot
              </div>
            )}

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              <button
                className={styles.nextButton}
                type="button"
                onClick={() => onUploadClick(slot.slot)}
                disabled={disabled || slot.isUploading || slot.isDeleting}
              >
                {slot.isUploading ? "Uploading..." : slot.path ? "Replace photo" : "Upload photo"}
              </button>
              <button
                className={styles.backButton}
                type="button"
                onClick={() => onDeleteClick(slot.slot)}
                disabled={disabled || slot.isUploading || slot.isDeleting || !slot.path}
              >
                {slot.isDeleting ? "Removing..." : "Remove photo"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
