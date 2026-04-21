import Image from "next/image";

import styles from "../../_shared/onboarding-shell.module.scss";
import pictureStyles from "./picture.module.scss";
import type { PictureDraft } from "./picture-types";

type PicturePreviewCardProps = {
  draft: PictureDraft;
  originalPreviewUrl: string;
  generatedPreviewUrl: string | null;
  useGeneratedImage: boolean;
  onChooseOriginal: () => void;
  onChooseGenerated: () => void;
  onReset: () => void;
};

export function PicturePreviewCard({
  draft,
  originalPreviewUrl,
  generatedPreviewUrl,
  useGeneratedImage,
  onChooseOriginal,
  onChooseGenerated,
  onReset,
}: PicturePreviewCardProps) {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Choose your final image</span>
      <div className={styles.selectionSummary}>
        {useGeneratedImage && generatedPreviewUrl ? "AI version selected" : "Original selected"}
      </div>
      <div className={pictureStyles.choiceGrid}>
        <div className={pictureStyles.previewGrid}>
          <div
            className={`${pictureStyles.choiceCard} ${
              !useGeneratedImage || !generatedPreviewUrl ? pictureStyles.choiceCardActive : ""
            }`.trim()}
          >
            <span className={styles.helper}>
              Original {draft.source === "camera" ? "camera photo" : "uploaded photo"}
            </span>
            <Image
              src={originalPreviewUrl}
              alt="Original profile upload preview"
              width={Math.max(draft.width, 1)}
              height={Math.max(draft.height, 1)}
              unoptimized
              className={pictureStyles.choiceImage}
            />
            <button
              className={`${styles.backButton} ${pictureStyles.choiceButton}`.trim()}
              type="button"
              onClick={onChooseOriginal}
            >
              Use original
            </button>
          </div>
          {generatedPreviewUrl ? (
            <div
              className={`${pictureStyles.choiceCard} ${
                useGeneratedImage ? pictureStyles.choiceCardActive : ""
              }`.trim()}
            >
              <span className={styles.helper}>AI result</span>
              <Image
                src={generatedPreviewUrl}
                alt="AI-generated profile preview"
                width={Math.max(draft.width, 1)}
                height={Math.max(draft.height, 1)}
                unoptimized
                className={pictureStyles.choiceImage}
              />
              <button
                className={`${styles.nextButton} ${pictureStyles.choiceButton}`.trim()}
                type="button"
                onClick={onChooseGenerated}
              >
                Use AI version
              </button>
            </div>
          ) : null}
        </div>
        <p className={styles.helper}>
          {generatedPreviewUrl
            ? "Choose the original if the AI result feels too edited. You can still go back and regenerate."
            : "Your original JPEG is ready. If you want, generate an AI version and compare both before continuing."}
        </p>
        <button className={styles.backButton} type="button" onClick={onReset}>
          Choose a different photo
        </button>
      </div>
    </div>
  );
}
