import Image from "next/image";

import styles from "../../1-basics/page.module.scss";
import type { PictureDraft } from "./picture-types";

type PicturePreviewCardProps = {
  draft: PictureDraft;
  onReset: () => void;
};

export function PicturePreviewCard({ draft, onReset }: PicturePreviewCardProps) {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Portrait preview</span>
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
              src={draft.originalDataUrl}
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
          <div style={{ display: "grid", gap: "10px" }}>
            <span className={styles.helper}>Stylized preview</span>
            <Image
              src={draft.previewDataUrl}
              alt="Stylized profile preview"
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
        </div>
        <p className={styles.helper}>
          This is a lightweight in-browser stylization pass. It is meant to reduce harsh
          first-impression judgments, not to hide who someone is.
        </p>
        <button className={styles.backButton} type="button" onClick={onReset}>
          Choose a different photo
        </button>
      </div>
    </div>
  );
}
