"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { OnboardingSectionStatus } from "@/app/onboarding/_shared/onboarding-section-status";
import { useSectionSaveFeedback } from "@/app/onboarding/_shared/use-section-save-feedback";
import { getCurrentUser } from "@/lib/supabase/auth";
import { upsertUserMatchesInfo } from "@/lib/supabase/user-matches-info";
import { getUserPfpPath } from "@/lib/supabase/user-picture";
import {
  deleteGalleryPictureRequest,
  listGalleryPicturesRequest,
  uploadGalleryPictureRequest,
  uploadProfilePictureRequest,
} from "@/lib/pictures/picture-api";
import {
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

type GeneratedAvatarOption = {
  file: File;
  previewUrl: string;
};

const AVATAR_PROMPTS = [
  "Turn this real profile photo into a clean, flattering dating profile portrait. Keep the same person, facial structure, skin tone, hair color, and overall identity. Improve lighting, keep the framing mobile-friendly, and make the result warm and natural.",
  "Turn this real profile photo into a polished dating profile portrait. Keep the same person and identity, brighten the face slightly, refine the crop, soften the background, and keep the result realistic and believable.",
  "Turn this real profile photo into a premium-looking dating profile portrait. Keep the same person, preserve facial structure and skin tone, add crisp but natural detail, even lighting, and a confident modern portrait feel without looking fake.",
] as const;

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
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const galleryUploadSlotRef = useRef<number | null>(null);
  const [generatedAvatarOptions, setGeneratedAvatarOptions] = useState<GeneratedAvatarOption[]>([]);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [gallerySlots, setGallerySlots] = useState<GalleryPictureSlot[]>(() => createEmptyGallerySlots());
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isHydratingMeta, setIsHydratingMeta] = useState(true);
  const [draft, setDraft] = useState<PictureDraft>(initialDraft);
  const [progress, setCurrentStep] = useState(0);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isTransformingImage, setIsTransformingImage] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const { clearSaveFeedback } = useSectionSaveFeedback({
    setSaveError,
    setSaveMessage,
  });
  const {
    isHydratingFiles,
    originalFile,
    generatedFile,
    originalPreviewUrl,
    setOriginalFile,
    setGeneratedFile,
    clearFiles,
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
        setHasSavedDraft(storedState.hasSavedDraft);
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

    const selectedVariant = draft.hasGeneratedImage ? "aiTransformed" : "original";
    const nextHasSavedDraft = hasPictureDraftContent(draft);

    setHasSavedDraft(nextHasSavedDraft);

    void persistPictureStateToIdb({
      draft,
      progress,
      selectedVariant,
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
    if (isHydratingFiles) {
      return;
    }

    if (draft.fileName && !originalFile) {
      setSaveError("Your saved picture metadata was found, but the local photo draft is unavailable.");
    }
  }, [draft.fileName, isHydratingFiles, originalFile, setSaveError]);

  useEffect(() => {
    if (currentStep > 0 && !originalFile && !isHydratingFiles) {
      setCurrentStep(0);
    }
  }, [currentStep, isHydratingFiles, originalFile]);

  useEffect(() => {
    const selectedOption = generatedAvatarOptions[selectedAvatarIndex];

    if (!selectedOption) {
      return;
    }

    void setGeneratedFile(selectedOption.file);
  }, [generatedAvatarOptions, selectedAvatarIndex, setGeneratedFile]);

  useEffect(() => {
    return () => {
      generatedAvatarOptions.forEach((option) => URL.revokeObjectURL(option.previewUrl));
    };
  }, [generatedAvatarOptions]);

  const draftStatus = useMemo(() => {
    if (isHydratingMeta) {
      return "Preparing your saved picture draft...";
    }

    return hasSavedDraft
      ? "Saved on this device as you go."
      : "Your picture draft will be saved on this device.";
  }, [hasSavedDraft, isHydratingMeta]);

  const canGoToReview = Boolean(originalFile) && !isHydratingFiles && !isHydratingMeta;
  const canGenerateAvatars =
    Boolean(originalFile) &&
    !isTransformingImage &&
    !isSavingSection &&
    !isHydratingFiles &&
    !isHydratingMeta;
  const canGoToGallery =
    generatedAvatarOptions.length === AVATAR_PROMPTS.length && !isTransformingImage;
  const canContinue = useMemo(
    () =>
      isPictureReady(draft) &&
      Boolean(originalFile) &&
      Boolean(generatedAvatarOptions[selectedAvatarIndex] ?? generatedFile ?? originalFile) &&
      !isTransformingImage &&
      !isHydratingFiles &&
      !isHydratingMeta,
    [
      draft,
      generatedAvatarOptions,
      generatedFile,
      isHydratingFiles,
      isHydratingMeta,
      isTransformingImage,
      originalFile,
      selectedAvatarIndex,
    ],
  );

  const resetGeneratedAvatars = useCallback(() => {
    setGeneratedAvatarOptions((current) => {
      current.forEach((option) => URL.revokeObjectURL(option.previewUrl));
      return [];
    });
    setSelectedAvatarIndex(0);
  }, []);

  const applyPicture = useCallback(
    async (file: File, source: PictureSource) => {
      clearSaveFeedback();

      try {
        const prepared = await preparePictureFile(file);

        await setOriginalFile(prepared.file);
        await setGeneratedFile(null);
        resetGeneratedAvatars();
        setDraft({
          source,
          prompt: initialDraft.prompt,
          fileName: prepared.file.name,
          mimeType: prepared.file.type,
          width: prepared.width,
          height: prepared.height,
          transformedAt: "",
          hasGeneratedImage: false,
        });
        setCurrentStep(1);
      } catch (error) {
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "We couldn't prepare that photo right now.",
        );
      }
    },
    [clearSaveFeedback, resetGeneratedAvatars, setGeneratedFile, setOriginalFile, setSaveError],
  );

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, source: PictureSource) => {
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
        await applyPicture(file, source);
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

  const runAiTransform = useCallback(async () => {
    if (!originalFile || isTransformingImage || isSavingSection) {
      return;
    }

    clearSaveFeedback();
    setIsTransformingImage(true);

    try {
      const nextOptions: GeneratedAvatarOption[] = [];

      for (const prompt of AVATAR_PROMPTS) {
        const transformed = await transformPictureWithAi(originalFile, prompt);
        nextOptions.push({
          file: transformed,
          previewUrl: URL.createObjectURL(transformed),
        });
      }

      resetGeneratedAvatars();
      setGeneratedAvatarOptions(nextOptions);
      setSelectedAvatarIndex(0);
      await setGeneratedFile(nextOptions[0]?.file ?? null);
      setDraft((current) => ({
        ...current,
        prompt: AVATAR_PROMPTS[0],
        transformedAt: new Date().toISOString(),
        hasGeneratedImage: true,
      }));
      setSaveMessage("Your avatar set is ready. Pick the version you like best.");
      setCurrentStep(2);
    } catch (error) {
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't generate the avatar set right now.",
      );
    } finally {
      setIsTransformingImage(false);
    }
  }, [
    clearSaveFeedback,
    isSavingSection,
    isTransformingImage,
    originalFile,
    resetGeneratedAvatars,
    setGeneratedFile,
    setSaveError,
    setSaveMessage,
  ]);

  const resetPhoto = useCallback(() => {
    clearSaveFeedback();
    void clearFiles();
    resetGeneratedAvatars();
    setDraft(initialDraft);
    setCurrentStep(0);
  }, [clearFiles, clearSaveFeedback, resetGeneratedAvatars]);

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

      const fileToUpload =
        generatedAvatarOptions[selectedAvatarIndex]?.file ?? generatedFile ?? originalFile;

      if (!fileToUpload) {
        throw new Error("Please add a photo before finishing this section.");
      }

      await uploadProfilePictureRequest(fileToUpload);
      await upsertUserMatchesInfo({
        userId: user.id,
        profilePicturePath: getUserPfpPath(user.id),
      });
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
    canContinue,
    generatedAvatarOptions,
    generatedFile,
    isSavingSection,
    originalFile,
    router,
    selectedAvatarIndex,
  ]);

  const goBack = useCallback(() => {
    if (currentStep === 0) {
      router.push("/onboarding/2-mentality");
      return;
    }

    if (currentStep === 1) {
      resetPhoto();
      return;
    }

    setCurrentStep(currentStep - 1);
  }, [currentStep, resetPhoto, router]);

  const goNext = useCallback(() => {
    if (currentStep === 0) {
      if (!canGoToReview) {
        return;
      }

      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      if (!canGenerateAvatars) {
        return;
      }

      void runAiTransform();
      return;
    }

    if (currentStep === 2) {
      if (!canGoToGallery) {
        return;
      }

      setCurrentStep(3);
    }
  }, [canGenerateAvatars, canGoToGallery, canGoToReview, currentStep, runAiTransform]);

  const interactionDisabled =
    isTransformingImage || isSavingSection || isHydratingFiles || isHydratingMeta;

  return (
    <div className={pictureStyles.mobilePanel}>
      <PictureLayout
        currentStep={currentStep}
        draftStatus={
          isHydratingFiles
            ? "Restoring your saved photo draft..."
            : draftStatus
        }
        panelClassName={pictureStyles.panelCard}
        questionBlockClassName={pictureStyles.questionBlock}
        footerClassName={pictureStyles.footerCompact}
        status={
          <OnboardingSectionStatus
            errorMessage={saveError}
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
            {currentStep < TOTAL_STEPS - 1 ? (
              <button
                className={`${styles.nextButton} ${pictureStyles.compactButton} ${pictureStyles.compactNextButton}`.trim()}
                type="button"
                onClick={goNext}
                disabled={
                  currentStep === 0
                    ? !canGoToReview || isSavingSection
                    : currentStep === 1
                      ? !canGenerateAvatars || isSavingSection
                      : !canGoToGallery || isSavingSection
                }
              >
                {currentStep === 0
                  ? "Review photo"
                  : currentStep === 1
                    ? (isTransformingImage ? "Generating..." : "Generate avatar based on this photo")
                    : "Proceed to gallery"}
              </button>
            ) : (
              <button
                className={`${styles.nextButton} ${pictureStyles.compactButton} ${pictureStyles.compactNextButton}`.trim()}
                type="button"
                onClick={finishPicture}
                disabled={!canContinue || isSavingSection}
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
            onChange={(event) => void onFileChange(event, "upload")}
            hidden
          />
          <input
            ref={captureInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={(event) => void onFileChange(event, "camera")}
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
            <PictureSourcePicker
              disabled={interactionDisabled}
              onTakePhotoClick={() => captureInputRef.current?.click()}
              onChooseLibraryClick={() => fileInputRef.current?.click()}
            />
          ) : null}

          {currentStep === 1 && originalPreviewUrl ? (
            <PicturePhotoReviewCard
              draft={draft}
              previewUrl={originalPreviewUrl}
            />
          ) : null}

          {currentStep === 2 ? (
            generatedAvatarOptions.length > 0 ? (
              <PictureAvatarPicker
                options={generatedAvatarOptions}
                selectedIndex={selectedAvatarIndex}
                onSelect={setSelectedAvatarIndex}
              />
            ) : (
              <div className={`${styles.stackCard} ${pictureStyles.stackCard}`.trim()}>
                <span className={styles.inlineLabel}>Avatar set</span>
                <p className={styles.helper}>Generate your three avatar options to continue.</p>
              </div>
            )
          ) : null}

          {currentStep === 3 ? (
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
    </div>
  );
}
