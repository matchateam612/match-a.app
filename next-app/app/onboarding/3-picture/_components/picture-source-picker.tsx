import styles from "../../1-basics/page.module.scss";
import type { PictureDraft, PictureSource } from "./picture-types";

type PictureSourcePickerProps = {
  draft: PictureDraft;
  captureSource: PictureSource;
  disabled: boolean;
  onUploadClick: () => void;
  onCameraClick: () => void;
};

export function PictureSourcePicker({
  draft,
  captureSource,
  disabled,
  onUploadClick,
  onCameraClick,
}: PictureSourcePickerProps) {
  return (
    <div className={styles.splitCard}>
      <button
        className={`${styles.chip} ${draft.source === "upload" ? styles.chipActive : ""}`.trim()}
        type="button"
        onClick={onUploadClick}
        disabled={disabled}
      >
        <span className={styles.chipTitle}>Upload a photo</span>
        <span className={styles.chipCopy}>
          Pick an image from this device and we will stylize it for your profile.
        </span>
      </button>

      <button
        className={`${styles.chip} ${captureSource === "camera" ? styles.chipActive : ""}`.trim()}
        type="button"
        onClick={onCameraClick}
        disabled={disabled}
      >
        <span className={styles.chipTitle}>Use front camera</span>
        <span className={styles.chipCopy}>
          Open the selfie camera, capture one frame, and turn it into your onboarding portrait.
        </span>
      </button>
    </div>
  );
}
