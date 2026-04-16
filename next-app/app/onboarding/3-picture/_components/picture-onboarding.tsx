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
import { upsertUserPrivateInfo } from "@/lib/supabase/user-private-info";
import { initialDraft, PICTURE_STEP_STORAGE_KEY, USER_INFO_STORAGE_KEY } from "./picture-data";
import { CameraCaptureCard } from "./camera-capture-card";
import { PictureHero } from "./picture-hero";
import { PictureLayout } from "./picture-layout";
import { PicturePreviewCard } from "./picture-preview-card";
import { PictureSourcePicker } from "./picture-source-picker";
import { fileToDataUrl, renderStylizedPortrait } from "./picture-image-utils";
import { hasPictureDraftContent, isPictureReady, readStoredPictureState } from "./picture-storage";
import { StylizingCard } from "./stylizing-card";
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
  const [isRenderingPortrait, setIsRenderingPortrait] = useState(false);

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

  const canContinue = useMemo(
    () => isPictureReady(draft) && !isRenderingPortrait,
    [draft, isRenderingPortrait],
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

  const applyPortrait = useCallback(
    async (dataUrl: string, source: PictureSource, fileName: string, mimeType: string) => {
      clearSaveFeedback();
      setCameraError("");
      setIsRenderingPortrait(true);

      try {
        const portrait = await renderStylizedPortrait(dataUrl);

        setDraft({
          source,
          originalDataUrl: portrait.originalDataUrl,
          stylizedDataUrl: portrait.stylizedDataUrl,
          previewDataUrl: portrait.previewDataUrl,
          fileName,
          mimeType,
          width: portrait.width,
          height: portrait.height,
          stylizedAt: new Date().toISOString(),
        });
        setCurrentStep(0);
      } catch (error) {
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "We couldn't stylize that photo right now.",
        );
      } finally {
        setIsRenderingPortrait(false);
      }
    },
    [clearSaveFeedback, setCurrentStep, setDraft, setSaveError],
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
        const dataUrl = await fileToDataUrl(file);
        await applyPortrait(dataUrl, "upload", file.name, file.type);
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
    [applyPortrait, setSaveError],
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
    await applyPortrait(
      captureCanvas.toDataURL("image/jpeg", 0.92),
      "camera",
      `camera-capture-${Date.now()}.jpg`,
      "image/jpeg",
    );
  }, [applyPortrait, stopCamera]);

  const resetPhoto = useCallback(() => {
    clearSaveFeedback();
    setCameraError("");
    stopCamera();
    setCaptureSource("");
    setDraft(initialDraft);
    setCurrentStep(0);
  }, [clearSaveFeedback, setCurrentStep, setDraft, stopCamera]);

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

      await upsertUserPrivateInfo(user.id, userInfo);
      writeStoredUserInfo(USER_INFO_STORAGE_KEY, userInfo);
      setSaveMessage("Picture saved. Your stylized profile image is ready.");
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
  ]);

  const interactionDisabled = isRenderingPortrait || isSavingSection;

  return (
    <PictureLayout
      draftStatus={draftStatus}
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

        {isRenderingPortrait ? <StylizingCard /> : null}

        {draft.previewDataUrl ? <PicturePreviewCard draft={draft} onReset={resetPhoto} /> : null}
      </div>
    </PictureLayout>
  );
}
