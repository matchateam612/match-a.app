"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useSectionSaveFeedback } from "@/app/onboarding/_shared/use-section-save-feedback";
import { getCurrentUser } from "@/lib/supabase/auth";
import { updateOnboardingStatusRequest } from "@/lib/supabase/onboarding-status-api";
import { upsertUserMatchesInfo } from "@/lib/supabase/user-matches-info";
import { getUserPfpPath } from "@/lib/supabase/user-picture";
import {
  deleteGalleryPictureRequest,
  listGalleryPicturesRequest,
  uploadGalleryPictureRequest,
  uploadProfilePictureRequest,
} from "@/lib/pictures/picture-api";
import {
  AVATAR_GENERATION_PROMPTS,
  initialDraft,
  MAX_GALLERY_PHOTOS,
  TOTAL_STEPS,
} from "./picture-data";
import {
  hasPictureDraftContent,
  isPictureReady,
  persistPictureStateToIdb,
  readStoredPictureStateFromIdb,
} from "./picture-idb";
import { PictureAvatarPicker } from "./picture-avatar-picker";
import { PictureGalleryCard } from "./picture-gallery-card";
import { PictureHero } from "./picture-hero";
import { PictureLayout } from "./picture-layout";
import { PicturePhotoReviewCard } from "./picture-photo-review-card";
import { PictureSourcePicker } from "./picture-source-picker";
import { usePictureDraftFiles } from "./picture-draft-files";
import { preparePictureFile, transformPictureWithAi } from "./picture-file-utils";
import type { GalleryPictureSlot, PictureDraft, PictureSource } from "./picture-types";
import pictureStyles from "./picture.module.scss";

function createEmptyGallerySlots(): GalleryPictureSlot[] {
  return Array.from({ length: MAX_GALLERY_PHOTOS }, (_, index) => ({
    slot: index + 1,
    path: null,
    previewUrl: null,
    isUploading: false,
    isDeleting: false,
  }));
}

function createPictureAssetKey(file: File) {
  return [file.name, file.size, file.lastModified, file.type].join(":");
}

export function PictureOnboarding() {
  const isClientReady = useClientReady();

  if (!isClientReady) {
    return (
      <PictureLayout
        currentStep={0}
        draftStatus="Preparing your saved draft..."
        panelClassName={pictureStyles.panelCard}
        questionBlockClassName={pictureStyles.questionBlock}
        footerClassName={pictureStyles.footerCompact}
        footer={
          <>
            <button
              className={`${styles.backButton} ${pictureStyles.compactButton} ${pictureStyles.compactBackButton}`.trim()}
              type="button"
              disabled
            >
              Back
            </button>
            <button
              className={`${styles.nextButton} ${pictureStyles.compactButton} ${pictureStyles.compactNextButton}`.trim()}
              type="button"
              disabled
            >
              Continue
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
  const galleryUploadSlotRef = useRef<number | null>(null);
  const [gallerySlots, setGallerySlots] = useState<GalleryPictureSlot[]>(() => createEmptyGallerySlots());
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isHydratingMeta, setIsHydratingMeta] = useState(true);
  const [draft, setDraft] = useState<PictureDraft>(initialDraft);
  const [progress, setCurrentStep] = useState(0);
  const [restoredHasSavedDraft, setRestoredHasSavedDraft] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isUploadingNewPhoto, setIsUploadingNewPhoto] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const { clearSaveFeedback } = useSectionSaveFeedback({
    setSaveError,
    setSaveMessage,
  });
  const {
    isHydratingFiles,
    originalFile,
    generatedFiles,
    originalPreviewUrl,
    generatedPreviewUrls,
    replaceFiles,
  } = usePictureDraftFiles({
    enabled: true,
  });
  const currentStep = Math.min(Math.max(progress, 0), TOTAL_STEPS - 1);

  useEffect(() => {
    let isCancelled = false;

    void readStoredPictureStateFromIdb()
      .then((storedState) => {
        if (isCancelled) {
          return;
        }

        setDraft(storedState.draft);
        setCurrentStep(storedState.progress);
        setRestoredHasSavedDraft(storedState.hasSavedDraft);
      })
      .catch(() => {
        if (!isCancelled) {
          setSaveError("We couldn't restore your saved picture draft.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsHydratingMeta(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [setSaveError]);

  useEffect(() => {
    if (isHydratingMeta) {
      return;
    }

    void persistPictureStateToIdb({
      draft,
      progress,
    }).catch(() => {
      setSaveError("We couldn't save your picture draft on this device.");
    });
  }, [draft, isHydratingMeta, progress, setSaveError]);

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
    if (isHydratingFiles || isHydratingMeta) {
      return;
    }

    if (restoredHasSavedDraft && draft.fileName && !originalFile) {
      setSaveError("Your saved picture metadata was found, but the local photo draft is unavailable.");
    }
  }, [draft.fileName, isHydratingFiles, isHydratingMeta, originalFile, restoredHasSavedDraft, setSaveError]);

  useEffect(() => {
    if (currentStep > 0 && !originalFile && !isHydratingFiles) {
      setCurrentStep(0);
    }
  }, [currentStep, isHydratingFiles, originalFile]);

  const hasSavedDraft = useMemo(() => hasPictureDraftContent(draft), [draft]);
  const draftStatus = useMemo(() => {
    if (isHydratingMeta) {
      return "Preparing your saved picture draft...";
    }

    return hasSavedDraft
      ? "Saved on this device as you go."
      : "Your picture draft will be saved on this device.";
  }, [hasSavedDraft, isHydratingMeta]);

  const hasGeneratedAvatars = useMemo(
    () =>
      draft.generatedAssetKey.length > 0 &&
      draft.generatedAssetKey === draft.originalAssetKey &&
      generatedFiles.some((file) => Boolean(file)),
    [draft.generatedAssetKey, draft.originalAssetKey, generatedFiles],
  );

  const selectedAvatarIndex = Math.min(
    Math.max(draft.selectedAvatarIndex, 0),
    Math.max(generatedPreviewUrls.length - 1, 0),
  );
  const selectedAvatarFile =
    generatedFiles[selectedAvatarIndex] ?? generatedFiles.find((file) => Boolean(file)) ?? null;
  const canGenerate = Boolean(originalFile) && !isUploadingNewPhoto && !isSavingSection && !isHydratingFiles;
  const canContinueFromAvatarPage =
    draft.generationStatus === "success" && generatedPreviewUrls.some((url) => Boolean(url));
  const canFinish = useMemo(
    () =>
      isPictureReady(draft) &&
      Boolean(selectedAvatarFile ?? originalFile) &&
      draft.generationStatus === "success" &&
      !isSavingSection,
    [draft, isSavingSection, originalFile, selectedAvatarFile],
  );

  const syncGeneratedState = useCallback(
    (updates: Partial<PictureDraft>) => {
      setDraft((current) => ({
        ...current,
        ...updates,
      }));
    },
    [],
  );

  const applyPicture = useCallback(
    async (file: File, source: PictureSource) => {
      clearSaveFeedback();
      setIsUploadingNewPhoto(true);

      try {
        const prepared = await preparePictureFile(file);
        const originalAssetKey = createPictureAssetKey(prepared.file);

        await replaceFiles({
          original: prepared.file,
          generated: [null, null, null],
        });

        setDraft({
          ...initialDraft,
          source,
          fileName: prepared.file.name,
          mimeType: prepared.file.type,
          width: prepared.width,
          height: prepared.height,
          originalAssetKey,
        });
        setCurrentStep(0);
      } catch (error) {
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "We couldn't prepare that photo right now.",
        );
      } finally {
        setIsUploadingNewPhoto(false);
      }
    },
    [clearSaveFeedback, replaceFiles, setSaveError],
  );

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setSaveError("Please choose an image file for your profile photo.");
        event.target.value = "";
        return;
      }

      try {
        const source: PictureSource = file.name ? "upload" : "camera";
        await applyPicture(file, source);
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

  const startAvatarGeneration = useCallback(async () => {
    if (!originalFile || isSavingSection || isUploadingNewPhoto) {
      return;
    }

    clearSaveFeedback();
    setCurrentStep(1);

    if (hasGeneratedAvatars) {
      syncGeneratedState({
        generationStatus: "success",
        generationError: "",
      });
      return;
    }

    syncGeneratedState({
      generationStatus: "loading",
      generationError: "",
      generatedAssetKey: "",
      selectedAvatarIndex: 0,
    });

    try {
      const nextFiles = (await Promise.all(
        AVATAR_GENERATION_PROMPTS.map((prompt) => transformPictureWithAi(originalFile, prompt)),
      )) as [File, File, File];

      await replaceFiles({
        original: originalFile,
        generated: nextFiles,
      });

      syncGeneratedState({
        generationStatus: "success",
        generationError: "",
        generatedAssetKey: draft.originalAssetKey,
        selectedAvatarIndex: 0,
      });
      setSaveMessage("Your avatar set is ready.");
    } catch (error) {
      syncGeneratedState({
        generationStatus: "error",
        generationError:
          error instanceof Error && error.message
            ? error.message
            : "We couldn't generate avatars right now.",
      });
    }
  }, [
    clearSaveFeedback,
    draft.originalAssetKey,
    hasGeneratedAvatars,
    isSavingSection,
    isUploadingNewPhoto,
    originalFile,
    replaceFiles,
    setSaveMessage,
    syncGeneratedState,
  ]);

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
    if (!canFinish || isSavingSection) {
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

      const fileToUpload = selectedAvatarFile ?? originalFile;

      if (!fileToUpload) {
        throw new Error("Please add a photo before finishing this section.");
      }

      await uploadProfilePictureRequest(fileToUpload);
      await upsertUserMatchesInfo({
        userId: user.id,
        profilePicturePath: getUserPfpPath(user.id),
      });
      await updateOnboardingStatusRequest("4-agent");
      setSaveMessage("Your main photo is saved.");
      router.push("/onboarding/4-agent");
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
    canFinish,
    isSavingSection,
    originalFile,
    router,
    selectedAvatarFile,
  ]);

  const goBack = useCallback(() => {
    if (currentStep === 0) {
      router.push("/onboarding/2-mentality");
      return;
    }

    if (currentStep === 1) {
      setCurrentStep(0);
      return;
    }

    setCurrentStep(1);
  }, [currentStep, router]);

  const choosePhotoLabel = originalFile ? "Replace photo" : "Take photo / Upload photo";
  const interactionDisabled = isSavingSection || isHydratingFiles || isHydratingMeta || isUploadingNewPhoto;

  return (
    <div className={pictureStyles.mobilePanel}>
      <PictureLayout
        currentStep={currentStep}
        draftStatus={isHydratingFiles ? "Restoring your saved photo draft..." : draftStatus}
        panelClassName={pictureStyles.panelCard}
        questionBlockClassName={pictureStyles.questionBlock}
        footerClassName={pictureStyles.footerCompact}
        status={
          <OnboardingSectionStatus
            errorMessage={saveError || (draft.generationStatus === "error" ? draft.generationError : "")}
            successMessage={saveMessage}
            errorClassName={`${styles.statusMessage} ${styles.statusError}`}
            successClassName={`${styles.statusMessage} ${styles.statusSuccess}`}
          />
        }
        footer={
          <>
            <button
              className={`${styles.backButton} ${pictureStyles.compactButton} ${pictureStyles.compactBackButton}`.trim()}
              type="button"
              onClick={goBack}
              disabled={interactionDisabled}
            >
              Back
            </button>
            {currentStep === 0 ? (
              <button
                className={`${styles.nextButton} ${pictureStyles.compactButton} ${pictureStyles.compactNextButton}`.trim()}
                type="button"
                onClick={() => void startAvatarGeneration()}
                disabled={!canGenerate}
              >
                {isUploadingNewPhoto ? "Preparing..." : "Generate AI"}
              </button>
            ) : currentStep === 1 ? (
              draft.generationStatus === "success" ? (
                <button
                  className={`${styles.nextButton} ${pictureStyles.compactButton} ${pictureStyles.compactNextButton}`.trim()}
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!canContinueFromAvatarPage}
                >
                  Continue to gallery
                </button>
              ) : (
                <button
                  className={`${styles.nextButton} ${pictureStyles.compactButton} ${pictureStyles.compactNextButton}`.trim()}
                  type="button"
                  onClick={() => void startAvatarGeneration()}
                  disabled={draft.generationStatus === "loading" || !originalFile}
                >
                  {draft.generationStatus === "loading" ? "Generating..." : "Retry"}
                </button>
              )
            ) : (
              <button
                className={`${styles.nextButton} ${pictureStyles.compactButton} ${pictureStyles.compactNextButton}`.trim()}
                type="button"
                onClick={finishPicture}
                disabled={!canFinish}
              >
                {isSavingSection ? "Saving..." : "Finish picture"}
              </button>
            )}
          </>
        }
      >
        <PictureHero currentStep={currentStep} />

        <div className={`${styles.fieldStack} ${pictureStyles.fieldStack}`.trim()}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
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

          {currentStep === 0 ? (
            <div className={pictureStyles.photoStepStack}>
              <PictureSourcePicker
                disabled={interactionDisabled}
                onChoosePhotoClick={() => fileInputRef.current?.click()}
              />
              {originalPreviewUrl ? (
                <PicturePhotoReviewCard draft={draft} previewUrl={originalPreviewUrl} />
              ) : (
                <div className={`${styles.stackCard} ${pictureStyles.photoPlaceholderCard}`.trim()}>
                  <span className={styles.inlineLabel}>Your photo preview</span>
                  <p className={styles.helper}>
                    Pick a clear photo with your face visible. We will use it as the base for your
                    avatar set.
                  </p>
                  <button
                    className={`${styles.secondaryButton} ${pictureStyles.inlinePhotoButton}`.trim()}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={interactionDisabled}
                  >
                    {choosePhotoLabel}
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {currentStep === 1 ? (
            draft.generationStatus === "loading" ? (
              <div className={`${styles.stackCard} ${pictureStyles.loadingCard}`.trim()}>
                <span className={styles.inlineLabel}>Generating avatars</span>
                <div className={pictureStyles.loadingOrb} aria-hidden="true" />
                <p className={pictureStyles.loadingTitle}>We’re building your avatar set now.</p>
                <p className={styles.helper}>
                  This usually takes a moment. Stay on this page while we prepare the three versions.
                </p>
              </div>
            ) : draft.generationStatus === "success" ? (
              <PictureAvatarPicker
                options={generatedPreviewUrls
                  .filter((previewUrl): previewUrl is string => Boolean(previewUrl))
                  .map((previewUrl) => ({ previewUrl }))}
                selectedIndex={selectedAvatarIndex}
                onSelect={(index) =>
                  setDraft((current) => ({
                    ...current,
                    selectedAvatarIndex: index,
                  }))
                }
              />
            ) : (
              <div className={`${styles.stackCard} ${pictureStyles.loadingCard}`.trim()}>
                <span className={styles.inlineLabel}>Avatar generation</span>
                <p className={pictureStyles.loadingTitle}>We couldn’t finish your avatar set.</p>
                <p className={styles.helper}>
                  Retry from here, or go back to swap the photo while keeping your current draft.
                </p>
              </div>
            )
          ) : null}

          {currentStep === 2 ? (
            <PictureGalleryCard
              slots={gallerySlots}
              disabled={isSavingSection}
              isLoading={isLoadingGallery}
              onUploadClick={(slot) => {
                galleryUploadSlotRef.current = slot;
                galleryInputRef.current?.click();
              }}
              onDeleteClick={removeGalleryPhoto}
            />
          ) : null}
        </div>
      </PictureLayout>
    </div>
  );
}
