import styles from "../../_shared/onboarding-shell.module.scss";
import pictureStyles from "./picture.module.scss";

type PictureSourcePickerProps = {
  disabled: boolean;
  onChoosePhotoClick: () => void;
};

export function PictureSourcePicker({
  disabled,
  onChoosePhotoClick,
}: PictureSourcePickerProps) {
  return (
    <div className={`${styles.splitCard} ${pictureStyles.pickerCard}`.trim()}>
      <button
        className={`${styles.chip} ${pictureStyles.sourceChip} ${pictureStyles.sourceSingleButton}`.trim()}
        type="button"
        onClick={onChoosePhotoClick}
        disabled={disabled}
      >
        <span className={styles.chipTitle}>Take photo / Upload photo</span>
        <span className={styles.chipCopy}>
          On your phone this opens the native camera or photo picker. On desktop it opens the
          regular file picker.
        </span>
      </button>
    </div>
  );
}
