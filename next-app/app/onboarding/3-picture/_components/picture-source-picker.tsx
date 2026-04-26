import styles from "../../_shared/onboarding-shell.module.scss";
import pictureStyles from "./picture.module.scss";

type PictureSourcePickerProps = {
  disabled: boolean;
  onTakePhotoClick: () => void;
  onChooseLibraryClick: () => void;
};

export function PictureSourcePicker({
  disabled,
  onTakePhotoClick,
  onChooseLibraryClick,
}: PictureSourcePickerProps) {
  return (
    <div className={`${styles.splitCard} ${pictureStyles.pickerCard}`.trim()}>
      <button
        className={`${styles.chip} ${pictureStyles.sourceChip}`.trim()}
        type="button"
        onClick={onTakePhotoClick}
        disabled={disabled}
      >
        <span className={styles.chipTitle}>Take a photo</span>
        <span className={styles.chipCopy}>
          Open your phone&apos;s camera UI, capture a selfie, and use it as the base for your avatar.
        </span>
      </button>

      <button
        className={`${styles.chip} ${pictureStyles.sourceChip}`.trim()}
        type="button"
        onClick={onChooseLibraryClick}
        disabled={disabled}
      >
        <span className={styles.chipTitle}>Choose from library</span>
        <span className={styles.chipCopy}>
          Pick an existing photo from this device and we will prepare it for your main profile.
        </span>
      </button>
    </div>
  );
}
