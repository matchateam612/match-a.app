"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../1-basics/page.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import {
  writeStoredProgressValue,
  writeStoredUserInfo,
} from "@/app/onboarding/_shared/onboarding-persistence";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useOnboardingSectionState } from "@/app/onboarding/_shared/use-onboarding-section-state";
import { useSectionSaveFeedback } from "@/app/onboarding/_shared/use-section-save-feedback";
import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import { getCurrentUser } from "@/lib/supabase/auth";
import { uploadUserPfp } from "@/lib/supabase/user-picture";
import { initialDraft, PICTURE_STEP_STORAGE_KEY, USER_INFO_STORAGE_KEY } from "./picture-data";
import { CameraCaptureCard } from "./camera-capture-card";
import { PictureHero } from "./picture-hero";
import { PictureLayout } from "./picture-layout";
import { PicturePreviewCard } from "./picture-preview-card";
import { PictureSourcePicker } from "./picture-source-picker";
import { usePictureDraftFiles } from "./picture-draft-files";
import { preparePictureFile, transformPictureWithAi } from "./picture-file-utils";
import { hasPictureDraftContent, isPictureReady, readStoredPictureState } from "./picture-storage";
import type { PictureDraft, PictureSource } from "./picture-types";

export function PictureOnboarding() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <PictureLayout
        draftStatus="Preparing your saved draft..."
        footer={
          <>
            <button className={styles.backButton} type="button" disabled>
              Back
            </button>
            <button className={styles.nextButton} type="button" disabled>
              Finish picture
            </button>
          </>
        }
      >
        <div />
      </PictureLayout>
    );
  }

  return <PictureOnboardingClient />;
}

function PictureOnboardingClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captureSource, setCaptureSource] = useState<PictureSource>("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isTransformingImage, setIsTransformingImage] = useState(false);

  const buildUserInfo = useCallback(
    ({
      draft,
      storedUserInfo,
    }: {
      draft: PictureDraft;
      progress: number;
      storedUserInfo: UserInfo;
    }) => ({
      ...storedUserInfo,
      picture: draft,
    }),
    [],
  );

  const persistState = useCallback(
    ({ progress, userInfo }: { draft: PictureDraft; progress: number; userInfo: UserInfo }) => {
      writeStoredUserInfo(USER_INFO_STORAGE_KEY, userInfo);
      writeStoredProgressValue(PICTURE_STEP_STORAGE_KEY, String(progress));
    },
    [],
  );

  const {
    draft,
    setDraft,
    setProgress: setCurrentStep,
    userInfo,
    draftStatus,
    isSavingSection,
    setIsSavingSection,
    saveMessage,
    setSaveMessage,
    saveError,
    setSaveError,
  } = useOnboardingSectionState({
    readStoredState: readStoredPictureState,
    hasDraftContent: hasPictureDraftContent,
    buildUserInfo,
    persistState,
  });

  const { clearSaveFeedback } = useSectionSaveFeedback({
    setSaveError,
    setSaveMessage,
  });
  const {
    isHydratingFiles,
    originalFile,
    generatedFile,
    originalPreviewUrl,
    generatedPreviewUrl,
    setOriginalFile,
    setGeneratedFile,
    clearFiles,
  } = usePictureDraftFiles({
    enabled: true,
  });

  const canContinue = useMemo(
    () => isPictureReady(draft) && Boolean(originalFile) && !isTransformingImage && !isHydratingFiles,
    [draft, isHydratingFiles, isTransformingImage, originalFile],
  );

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (isHydratingFiles) {
      return;
    }

    if (draft.fileName && !originalFile) {
      setSaveError("Your saved picture metadata was found, but the local photo draft is unavailable.");
    }
  }, [draft.fileName, isHydratingFiles, originalFile, setSaveError]);

  const applyPicture = useCallback(
    async (file: File, source: PictureSource) => {
      clearSaveFeedback();
      setCameraError("");

      try {
        const prepared = await preparePictureFile(file);

        await setOriginalFile(prepared.file);
        setDraft({
          source,
          prompt: draft.prompt,
          fileName: prepared.file.name,
          mimeType: prepared.file.type,
          width: prepared.width,
          height: prepared.height,
          transformedAt: "",
          hasGeneratedImage: false,
        });
        setCurrentStep(0);
      } catch (error) {
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "We couldn't prepare that photo right now.",
        );
      }
    },
    [clearSaveFeedback, draft.prompt, setCurrentStep, setDraft, setOriginalFile, setSaveError],
  );

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setSaveError("Please choose an image file for your profile photo.");
        return;
      }

      try {
        setCaptureSource("upload");
        await applyPicture(file, "upload");
      } catch (error) {
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "We couldn't read that photo right now.",
        );
      } finally {
        event.target.value = "";
      }
    },
    [applyPicture, setSaveError],
  );

  const openCamera = useCallback(async () => {
    clearSaveFeedback();
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera capture.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCaptureSource("camera");
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      setCameraError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't access your front camera.",
      );
    }
  }, [clearSaveFeedback, stopCamera]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const captureContext = captureCanvas.getContext("2d");

    if (!captureContext) {
      setCameraError("We couldn't capture your camera frame.");
      return;
    }

    captureContext.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    stopCamera();
    const blob = await new Promise<Blob | null>((resolve) =>
      captureCanvas.toBlob(resolve, "image/jpeg", 0.92),
    );

    if (!blob) {
      setCameraError("We couldn't capture your camera frame.");
      return;
    }

    await applyPicture(
      new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" }),
      "camera",
    );
  }, [applyPicture, stopCamera]);

  const runAiTransform = useCallback(async () => {
    if (!originalFile || isTransformingImage || isSavingSection) {
      return;
    }

    clearSaveFeedback();
    setCameraError("");
    setIsTransformingImage(true);

    try {
      const transformed = await transformPictureWithAi(originalFile, draft.prompt);
      await setGeneratedFile(transformed);
      setDraft((current) => ({
        ...current,
        transformedAt: new Date().toISOString(),
        hasGeneratedImage: true,
      }));
      setSaveMessage("AI image ready. You can finish with this version.");
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't generate the AI image right now.",
      );
    } finally {
      setIsTransformingImage(false);
    }
  }, [
    clearSaveFeedback,
    draft.prompt,
    isSavingSection,
    isTransformingImage,
    originalFile,
    setDraft,
    setGeneratedFile,
    setSaveError,
    setSaveMessage,
  ]);

  const resetPhoto = useCallback(() => {
    clearSaveFeedback();
    setCameraError("");
    stopCamera();
    setCaptureSource("");
    void clearFiles();
    setDraft(initialDraft);
    setCurrentStep(0);
  }, [clearFiles, clearSaveFeedback, setCurrentStep, setDraft, stopCamera]);

  const finishPicture = useCallback(async () => {
    if (!canContinue || isSavingSection) {
      return;
    }

    setIsSavingSection(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const user = await getCurrentUser();

      if (!user) {
        throw new Error("Please sign in before finishing this section.");
      }

      const fileToUpload = generatedFile ?? originalFile;

      if (!fileToUpload) {
        throw new Error("Please add a photo before finishing this section.");
      }

      await uploadUserPfp(user.id, fileToUpload);
      writeStoredUserInfo(USER_INFO_STORAGE_KEY, userInfo);
      setSaveMessage("Picture saved. Your profile image is ready.");
      router.push("/onboarding");
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't save your picture right now.",
      );
    } finally {
      setIsSavingSection(false);
    }
  }, [
    canContinue,
    isSavingSection,
    router,
    setIsSavingSection,
    setSaveError,
    setSaveMessage,
    userInfo,
    generatedFile,
    originalFile,
  ]);

  const interactionDisabled = isTransformingImage || isSavingSection || isHydratingFiles;

  return (
      <PictureLayout
      draftStatus={isHydratingFiles ? "Restoring your saved photo draft..." : draftStatus}
      status={
        <OnboardingSectionStatus
          errorMessage={cameraError || saveError}
          successMessage={saveMessage}
          errorClassName={`${styles.statusMessage} ${styles.statusError}`}
          successClassName={`${styles.statusMessage} ${styles.statusSuccess}`}
        />
      }
      footer={
        <>
          <button
            className={styles.backButton}
            type="button"
            onClick={() => router.push("/onboarding/2-mentality")}
            disabled={interactionDisabled}
          >
            Back
          </button>
          <button
            className={styles.nextButton}
            type="button"
            onClick={finishPicture}
            disabled={!canContinue || isSavingSection}
          >
            {isSavingSection ? "Saving..." : "Finish picture"}
          </button>
        </>
      }
    >
      <PictureHero />

      <div className={styles.fieldStack}>
        <PictureSourcePicker
          draft={draft}
          captureSource={captureSource}
          disabled={interactionDisabled}
          onUploadClick={() => {
            setCaptureSource("upload");
            fileInputRef.current?.click();
          }}
          onCameraClick={openCamera}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={onFileChange}
          hidden
        />

        {isCameraOpen ? (
          <CameraCaptureCard
            videoRef={videoRef}
            onCancel={stopCamera}
            onCapture={capturePhoto}
          />
        ) : null}

        <div className={styles.stackCard}>
          <span className={styles.inlineLabel}>AI prompt</span>
          <textarea
            className={styles.input}
            value={draft.prompt}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                prompt: event.target.value,
              }))
            }
            rows={5}
            disabled={interactionDisabled}
            placeholder="Describe how the AI should polish this profile photo."
            style={{
              minHeight: "140px",
              paddingTop: "18px",
              paddingBottom: "18px",
              resize: "vertical",
            }}
          />
          <p className={styles.helper}>
            This prompt is sent with your current image to the AI image converter. If no API key
            is configured, the original JPEG is kept.
          </p>
          <button
            className={styles.nextButton}
            type="button"
            onClick={runAiTransform}
            disabled={
              !originalFile || isTransformingImage || isSavingSection || isHydratingFiles || !draft.prompt.trim()
            }
          >
            {isTransformingImage ? "Generating..." : "Generate AI version"}
          </button>
        </div>

        {originalPreviewUrl ? (
          <PicturePreviewCard
            draft={draft}
            originalPreviewUrl={originalPreviewUrl}
            generatedPreviewUrl={generatedPreviewUrl}
            onReset={resetPhoto}
          />
        ) : null}
      </div>
    </PictureLayout>
  );
}
