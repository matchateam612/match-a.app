import Image from "next/image";

import styles from "../../1-basics/page.module.scss";
import type { PictureDraft } from "./picture-types";

type PicturePreviewCardProps = {
  draft: PictureDraft;
  originalPreviewUrl: string;
  generatedPreviewUrl: string | null;
  onReset: () => void;
};

export function PicturePreviewCard({
  draft,
  originalPreviewUrl,
  generatedPreviewUrl,
  onReset,
}: PicturePreviewCardProps) {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Photo preview</span>
      <div className={styles.selectionSummary}>
        {draft.source === "camera" ? "Captured on camera" : "Uploaded from device"}
      </div>
      <div
        style={{
          display: "grid",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div style={{ display: "grid", gap: "10px" }}>
            <span className={styles.helper}>Original</span>
            <Image
              src={originalPreviewUrl}
              alt="Original profile upload preview"
              width={Math.max(draft.width, 1)}
              height={Math.max(draft.height, 1)}
              unoptimized
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "22px",
                aspectRatio: "3 / 4",
                objectFit: "cover",
              }}
            />
          </div>
          {generatedPreviewUrl ? (
            <div style={{ display: "grid", gap: "10px" }}>
              <span className={styles.helper}>AI result</span>
              <Image
                src={generatedPreviewUrl}
                alt="AI-generated profile preview"
                width={Math.max(draft.width, 1)}
                height={Math.max(draft.height, 1)}
                unoptimized
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "22px",
                  aspectRatio: "3 / 4",
                  objectFit: "cover",
                }}
              />
            </div>
          ) : null}
        </div>
        <p className={styles.helper}>
          {generatedPreviewUrl
            ? "The AI result uses your current image plus your prompt. If no image API key is configured, we keep your original JPEG."
            : "Your original JPEG preview is ready. You can keep it as-is or run the AI transform first."}
        </p>
        <button className={styles.backButton} type="button" onClick={onReset}>
          Choose a different photo
        </button>
      </div>
    </div>
  );
}
