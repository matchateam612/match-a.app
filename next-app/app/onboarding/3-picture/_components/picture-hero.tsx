import styles from "../../_shared/onboarding-shell.module.scss";
import pictureStyles from "./picture.module.scss";

type PictureHeroProps = {
  currentStep: number;
};

const STEP_COPY = [
  {
    eyebrow: "Step 1",
    title: "Start with one strong photo.",
    copy:
      "On mobile, this step should feel simple: take a photo now or pick one from your device.",
  },
  {
    eyebrow: "Step 2",
    title: "Review the photo full screen.",
    copy:
      "Make sure the base image feels right before we generate your avatar set from it.",
  },
  {
    eyebrow: "Step 3",
    title: "Choose your avatar look.",
    copy:
      "We generate three polished versions from the same photo so you can pick the one that fits best.",
  },
  {
    eyebrow: "Step 4",
    title: "Fill your extra gallery.",
    copy:
      "Add up to nine private photos in a denser gallery layout that is easier to scan on mobile.",
  },
] as const;

export function PictureHero({ currentStep }: PictureHeroProps) {
  const step = STEP_COPY[currentStep] ?? STEP_COPY[0];

  return (
    <div className={`${styles.questionMeta} ${pictureStyles.stepMeta}`.trim()}>
      <span className={pictureStyles.stepEyebrow}>{step.eyebrow}</span>
      <h2 className={pictureStyles.stepTitle}>{step.title}</h2>
      <p className={pictureStyles.stepCopy}>
        {step.copy}
      </p>
    </div>
  );
}
