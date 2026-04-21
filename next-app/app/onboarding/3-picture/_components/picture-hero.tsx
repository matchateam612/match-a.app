import styles from "../../1-basics/page.module.scss";
import pictureStyles from "./picture.module.scss";

type PictureHeroProps = {
  currentStep: number;
};

const STEP_COPY = [
  {
    eyebrow: "Step 1",
    title: "Add your main profile photo.",
    copy:
      "Use a real photo of yourself. On phones this step stays focused on just getting one strong image in place.",
  },
  {
    eyebrow: "Step 2",
    title: "Generate an AI version if you want one.",
    copy:
      "Try a polished AI pass, then choose whether you want to keep the original or use the generated version.",
  },
  {
    eyebrow: "Step 3",
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
