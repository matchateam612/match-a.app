import Image from "next/image";

import styles from "../../_shared/onboarding-shell.module.scss";
import pictureStyles from "./picture.module.scss";
import { MAX_GALLERY_PHOTOS } from "./picture-data";
import type { GalleryPictureSlot } from "./picture-types";

type PictureGalleryCardProps = {
  slots: GalleryPictureSlot[];
  disabled: boolean;
  isLoading: boolean;
  onUploadClick: (slot: number) => void;
  onDeleteClick: (slot: number) => void;
};

export function PictureGalleryCard({
  slots,
  disabled,
  isLoading,
  onUploadClick,
  onDeleteClick,
}: PictureGalleryCardProps) {
  const filledSlots = slots.filter((slot) => slot.path);
  const nextAvailableSlot = slots.find((slot) => !slot.path)?.slot ?? null;

  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>More photos</span>
      <p className={styles.helper}>
        Add up to {MAX_GALLERY_PHOTOS} extra photos. The next empty slot shows a plus button, and
        the rest stay blank until you need them.
      </p>
      <div className={pictureStyles.galleryOverview}>
        <div className={styles.selectionSummary}>
          {filledSlots.length} of {MAX_GALLERY_PHOTOS} added
        </div>
      </div>
      {isLoading ? <p className={styles.helper}>Loading your saved extra photos...</p> : null}
      <div className={pictureStyles.galleryGrid}>
        {slots.map((slot) => (
          <div key={slot.slot} className={pictureStyles.gallerySlot}>
            {slot.previewUrl ? (
              <button
                className={pictureStyles.galleryFilledButton}
                type="button"
                onClick={() => onUploadClick(slot.slot)}
                disabled={disabled || isLoading || slot.isUploading || slot.isDeleting}
                aria-label={`Replace photo ${slot.slot}`}
              >
                <Image
                  src={slot.previewUrl}
                  alt={`Gallery photo slot ${slot.slot}`}
                  width={180}
                  height={180}
                  unoptimized
                  className={pictureStyles.galleryImage}
                />
                <span className={pictureStyles.gallerySlotBadge}>
                  {slot.isUploading ? "..." : slot.slot}
                </span>
              </button>
            ) : nextAvailableSlot === slot.slot ? (
              <button
                className={pictureStyles.galleryAddButton}
                type="button"
                onClick={() => onUploadClick(slot.slot)}
                disabled={disabled || isLoading || slot.isUploading || slot.isDeleting}
                aria-label={`Add photo ${slot.slot}`}
              >
                <span className={pictureStyles.galleryPlus}>+</span>
              </button>
            ) : (
              <div className={pictureStyles.galleryEmpty} aria-hidden="true" />
            )}

            {slot.path ? (
              <button
                className={pictureStyles.galleryRemoveButton}
                type="button"
                onClick={() => onDeleteClick(slot.slot)}
                disabled={disabled || isLoading || slot.isUploading || slot.isDeleting}
                aria-label={`Remove photo ${slot.slot}`}
              >
                {slot.isDeleting ? "..." : "×"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
