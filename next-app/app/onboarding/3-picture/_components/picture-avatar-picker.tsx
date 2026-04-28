import Image from "next/image";

import styles from "../../_shared/onboarding-shell.module.scss";
import pictureStyles from "./picture.module.scss";

type AvatarOption = {
  previewUrl: string;
};

type PictureAvatarPickerProps = {
  options: AvatarOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function PictureAvatarPicker({
  options,
  selectedIndex,
  onSelect,
}: PictureAvatarPickerProps) {
  const selectedOption = options[selectedIndex] ?? options[0] ?? null;

  if (!selectedOption) {
    return null;
  }

  return (
    <div className={`${styles.stackCard} ${pictureStyles.avatarPickerCard}`.trim()}>
      <span className={styles.inlineLabel}>Choose your avatar</span>
      <div className={styles.selectionSummary}>Version {selectedIndex + 1} selected</div>
      <Image
        src={selectedOption.previewUrl}
        alt={`Generated avatar version ${selectedIndex + 1}`}
        width={1024}
        height={1024}
        unoptimized
        className={pictureStyles.reviewImage}
      />
      <div className={pictureStyles.avatarSwitchRow} aria-label="Avatar variations">
        {options.map((_, index) => {
          const isActive = index === selectedIndex;

          return (
            <button
              key={index}
              className={`${pictureStyles.avatarSwitchButton} ${
                isActive ? pictureStyles.avatarSwitchButtonActive : ""
              }`.trim()}
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={isActive}
              aria-label={`Show avatar version ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <p className={styles.helper}>
        Swipe through the looks by tapping 1, 2, or 3, then continue with the one that feels most
        like you.
      </p>
    </div>
  );
}
