import Image from "next/image";

import styles from "../../_shared/onboarding-shell.module.scss";
import pictureStyles from "./picture.module.scss";
import type { PictureDraft } from "./picture-types";

type PicturePhotoReviewCardProps = {
  draft: PictureDraft;
  previewUrl: string;
};

export function PicturePhotoReviewCard({
  draft,
  previewUrl,
}: PicturePhotoReviewCardProps) {
  return (
    <div className={`${styles.stackCard} ${pictureStyles.photoReviewCard}`.trim()}>
      <span className={styles.inlineLabel}>Your selected photo</span>
      <div className={styles.selectionSummary}>
        {draft.source === "camera" ? "Taken with camera" : "Chosen from device"}
      </div>
      <Image
        src={previewUrl}
        alt="Selected profile photo preview"
        width={Math.max(draft.width, 1)}
        height={Math.max(draft.height, 1)}
        unoptimized
        className={pictureStyles.reviewImage}
      />
      <p className={styles.helper}>
        This photo becomes the base for your avatar set. You can replace it before generating, and
        your existing avatars will only be reused if this same local photo stays selected.
      </p>
    </div>
  );
}
