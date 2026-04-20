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
import {
  deleteGalleryPictureRequest,
  listGalleryPicturesRequest,
  uploadGalleryPictureRequest,
  uploadProfilePictureRequest,
} from "@/lib/pictures/picture-api";
import {
  initialDraft,
  MAX_GALLERY_PHOTOS,
  PICTURE_STEP_STORAGE_KEY,
  USER_INFO_STORAGE_KEY,
} from "./picture-data";
import { CameraCaptureCard } from "./camera-capture-card";
import { PictureGalleryCard } from "./picture-gallery-card";
import { PictureHero } from "./picture-hero";
import { PictureLayout } from "./picture-layout";
import { PicturePreviewCard } from "./picture-preview-card";
import { PictureSourcePicker } from "./picture-source-picker";
import { usePictureDraftFiles } from "./picture-draft-files";
import { preparePictureFile, transformPictureWithAi } from "./picture-file-utils";
import { hasPictureDraftContent, isPictureReady, readStoredPictureState } from "./picture-storage";
import type { GalleryPictureSlot, PictureDraft, PictureSource } from "./picture-types";

function createEmptyGallerySlots(): GalleryPictureSlot[] {
  return Array.from({ length: MAX_GALLERY_PHOTOS }, (_, index) => ({
    slot: index + 1,
    path: null,
    previewUrl: null,
    isUploading: false,
    isDeleting: false,
  }));
}

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
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryUploadSlotRef = useRef<number | null>(null);
  const [captureSource, setCaptureSource] = useState<PictureSource>("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isTransformingImage, setIsTransformingImage] = useState(false);
  const [gallerySlots, setGallerySlots] = useState<GalleryPictureSlot[]>(() => createEmptyGallerySlots());
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);

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
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setIsCameraReady(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        if (isCancelled) {
          return;
        }

        const { photos } = await listGalleryPicturesRequest();

        if (isCancelled) {
          return;
        }

        setGallerySlots((current) =>
          current.map((slot) => {
            const photo = photos.find((entry) => entry.slot === slot.slot);

            if (!photo) {
              return {
                ...slot,
                path: null,
                previewUrl: null,
              };
            }

            return {
              ...slot,
              path: photo.path,
              previewUrl: photo.signedUrl,
            };
          }),
        );
      } catch {
        if (!isCancelled) {
          setSaveError("We couldn't load your extra photo gallery right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingGallery(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [setSaveError]);

  useEffect(() => {
    if (!isCameraOpen || !streamRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    const markReady = () => {
      setIsCameraReady(video.videoWidth > 0 && video.videoHeight > 0);
    };

    video.onloadedmetadata = markReady;
    void video.play().then(markReady).catch(() => {
      setCameraError("We couldn't start the live camera preview.");
      setIsCameraReady(false);
    });

    return () => {
      video.onloadedmetadata = null;
    };
  }, [isCameraOpen]);

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

  const onGalleryFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const slot = galleryUploadSlotRef.current;
      const file = event.target.files?.[0];

      event.target.value = "";
      galleryUploadSlotRef.current = null;

      if (!slot || !file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setSaveError("Please choose an image file for this gallery slot.");
        return;
      }

      try {
        clearSaveFeedback();
        setGallerySlots((current) =>
          current.map((entry) =>
            entry.slot === slot ? { ...entry, isUploading: true } : entry,
          ),
        );

        const prepared = await preparePictureFile(file);
        const uploadedPhoto = await uploadGalleryPictureRequest(slot, prepared.file);

        setGallerySlots((current) =>
          current.map((entry) =>
            entry.slot === slot
              ? {
                  ...entry,
                  path: uploadedPhoto.path,
                  previewUrl: uploadedPhoto.signedUrl,
                  isUploading: false,
                }
              : entry,
          ),
        );
        setSaveMessage(`Photo ${slot} saved to your private gallery.`);
      } catch (error) {
        setGallerySlots((current) =>
          current.map((entry) =>
            entry.slot === slot ? { ...entry, isUploading: false } : entry,
          ),
        );
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "We couldn't upload that gallery photo right now.",
        );
      }
    },
    [clearSaveFeedback, setSaveError, setSaveMessage],
  );

  const openCamera = useCallback(async () => {
    clearSaveFeedback();
    setCameraError("");
    setIsCameraReady(false);

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

    if (!video || !isCameraReady || !video.videoWidth || !video.videoHeight) {
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
  }, [applyPicture, isCameraReady, stopCamera]);

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

  const openGalleryUpload = useCallback((slot: number) => {
    galleryUploadSlotRef.current = slot;
    galleryInputRef.current?.click();
  }, []);

  const removeGalleryPhoto = useCallback(
    async (slot: number) => {
      try {
        clearSaveFeedback();
        setGallerySlots((current) =>
          current.map((entry) =>
            entry.slot === slot ? { ...entry, isDeleting: true } : entry,
          ),
        );

        await deleteGalleryPictureRequest(slot);

        setGallerySlots((current) =>
          current.map((entry) =>
            entry.slot === slot
              ? {
                  ...entry,
                  path: null,
                  previewUrl: null,
                  isDeleting: false,
                }
              : entry,
          ),
        );
        setSaveMessage(`Photo ${slot} was removed from your private gallery.`);
      } catch (error) {
        setGallerySlots((current) =>
          current.map((entry) =>
            entry.slot === slot ? { ...entry, isDeleting: false } : entry,
          ),
        );
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "We couldn't remove that gallery photo right now.",
        );
      }
    },
    [clearSaveFeedback, setSaveError, setSaveMessage],
  );

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

      await uploadProfilePictureRequest(fileToUpload);
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
          onChange={onFileChange}
          hidden
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={onGalleryFileChange}
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

        {originalPreviewUrl ? (
          <PictureGalleryCard
            slots={gallerySlots}
            disabled={isTransformingImage || isSavingSection}
            isLoading={isLoadingGallery}
            onUploadClick={openGalleryUpload}
            onDeleteClick={removeGalleryPhoto}
          />
        ) : null}
      </div>
    </PictureLayout>
  );
}
