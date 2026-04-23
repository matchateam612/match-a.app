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
  const emptySlots = slots.filter((slot) => !slot.path);
  const featuredSlots = [...filledSlots, ...emptySlots].slice(0, 4);
  const remainingSlots = slots.slice(4);
  const hasRemainingSlots = remainingSlots.length > 0;

  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>More photos</span>
      <p className={styles.helper}>
        Add up to {MAX_GALLERY_PHOTOS} extra photos to round out your profile. Start with a few
        strong ones, then add more if you want.
      </p>
      <div className={pictureStyles.galleryOverview}>
        <div className={styles.selectionSummary}>
          {filledSlots.length} of {MAX_GALLERY_PHOTOS} added
        </div>
        <p className={styles.helper}>
          Your first few photos stay front and center so this screen feels lighter on phones.
        </p>
      </div>
      {isLoading ? <p className={styles.helper}>Loading your saved extra photos...</p> : null}
      <div className={pictureStyles.galleryGrid}>
        {featuredSlots.map((slot) => (
          <div key={slot.slot} className={pictureStyles.gallerySlot}>
            <div className={pictureStyles.gallerySlotHeader}>
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
                  borderRadius: "16px",
                  aspectRatio: "3 / 4",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div className={pictureStyles.galleryEmpty}>Choose a photo for this slot</div>
            )}

            <div className={pictureStyles.galleryActions}>
              <button
                className={styles.nextButton}
                type="button"
                onClick={() => onUploadClick(slot.slot)}
                disabled={disabled || isLoading || slot.isUploading || slot.isDeleting}
              >
                {slot.isUploading ? "Uploading..." : slot.path ? "Replace photo" : "Upload photo"}
              </button>
              <button
                className={styles.backButton}
                type="button"
                onClick={() => onDeleteClick(slot.slot)}
                disabled={disabled || isLoading || slot.isUploading || slot.isDeleting || !slot.path}
              >
                {slot.isDeleting ? "Removing..." : "Remove photo"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasRemainingSlots ? (
        <details className={pictureStyles.galleryMore}>
          <summary className={pictureStyles.galleryMoreSummary}>
            Manage all {MAX_GALLERY_PHOTOS} slots
          </summary>
          <div className={pictureStyles.galleryGridExpanded}>
            {remainingSlots.map((slot) => (
              <div key={slot.slot} className={pictureStyles.gallerySlot}>
                <div className={pictureStyles.gallerySlotHeader}>
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
                      borderRadius: "16px",
                      aspectRatio: "3 / 4",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div className={pictureStyles.galleryEmpty}>Choose a photo for this slot</div>
                )}

                <div className={pictureStyles.galleryActions}>
                  <button
                    className={styles.nextButton}
                    type="button"
                    onClick={() => onUploadClick(slot.slot)}
                    disabled={disabled || isLoading || slot.isUploading || slot.isDeleting}
                  >
                    {slot.isUploading ? "Uploading..." : slot.path ? "Replace photo" : "Upload photo"}
                  </button>
                  <button
                    className={styles.backButton}
                    type="button"
                    onClick={() => onDeleteClick(slot.slot)}
                    disabled={disabled || isLoading || slot.isUploading || slot.isDeleting || !slot.path}
                  >
                    {slot.isDeleting ? "Removing..." : "Remove photo"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
