import type { RefObject } from "react";

import styles from "../../_shared/onboarding-shell.module.scss";

type CameraCaptureCardProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  onCancel: () => void;
  onCapture: () => void;
};

export function CameraCaptureCard({
  videoRef,
  onCancel,
  onCapture,
}: CameraCaptureCardProps) {
  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Live camera</span>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          borderRadius: "22px",
          background: "#1b1c1c",
          aspectRatio: "3 / 4",
          objectFit: "cover",
        }}
      />
      <div className={styles.splitCard}>
        <button className={styles.backButton} type="button" onClick={onCancel}>
          Cancel camera
        </button>
        <button className={styles.nextButton} type="button" onClick={onCapture}>
          Take picture
        </button>
      </div>
    </div>
  );
}
