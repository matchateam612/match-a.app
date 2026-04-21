"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import styles from "../../_shared/onboarding-shell.module.scss";
import { useClientReady } from "@/app/onboarding/_shared/onboarding-storage";
import { buildExtractorPreview } from "../_lib/agent-extractor";
import {
  readTestingCriteriaDefinitions,
  writeTestingCriteriaDefinitions,
} from "../_lib/agent-storage";
import { AgentLayout } from "./agent-layout";

export function AgentTestingPage() {
  const isClientReady = useClientReady();
  const [criteriaJson, setCriteriaJson] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const parsedPreview = useMemo(() => {
    try {
      const definitions = criteriaJson
        ? (JSON.parse(criteriaJson) as ReturnType<typeof readTestingCriteriaDefinitions>)
        : readTestingCriteriaDefinitions();

      return JSON.stringify(buildExtractorPreview(definitions.map((criterion) => ({
        id: criterion.id,
        label: criterion.label,
        description: criterion.description,
        required: Boolean(criterion.required),
        summary: null,
        structuredValue: null,
        confidence: 0,
        status: "missing" as const,
        source: "unknown" as const,
        evidence: [],
        needsConfirmation: false,
        updatedAt: null,
      }))), null, 2);
    } catch {
      return "";
    }
  }, [criteriaJson]);

  if (!isClientReady) {
    return (
      <AgentLayout
        eyebrow="Testing"
        title="Agent testing playground"
        description="Preparing local testing tools..."
      >
        <div />
      </AgentLayout>
    );
  }

  return (
    <AgentTestingPageClient
      initialCriteriaJson={JSON.stringify(readTestingCriteriaDefinitions(), null, 2)}
      criteriaJson={criteriaJson}
      parsedPreview={parsedPreview}
      saveError={saveError}
      saveMessage={saveMessage}
      setCriteriaJson={setCriteriaJson}
      setSaveError={setSaveError}
      setSaveMessage={setSaveMessage}
    />
  );
}

type AgentTestingPageClientProps = {
  initialCriteriaJson: string;
  criteriaJson: string;
  parsedPreview: string;
  saveError: string;
  saveMessage: string;
  setCriteriaJson: (value: string) => void;
  setSaveError: (value: string) => void;
  setSaveMessage: (value: string) => void;
};

function AgentTestingPageClient({
  initialCriteriaJson,
  criteriaJson,
  parsedPreview,
  saveError,
  saveMessage,
  setCriteriaJson,
  setSaveError,
  setSaveMessage,
}: AgentTestingPageClientProps) {
  const displayedJson = criteriaJson || initialCriteriaJson;

  return (
    <AgentLayout
      eyebrow="Testing"
      title="Agent testing playground"
      description="Use this page to experiment with flexible criteria definitions before we lock in the real extractor contract."
      status={
        saveError ? (
          <p className={`${styles.statusMessage} ${styles.statusError}`}>{saveError}</p>
        ) : saveMessage ? (
          <p className={`${styles.statusMessage} ${styles.statusSuccess}`}>{saveMessage}</p>
        ) : null
      }
      footer={
        <>
          <Link href="/onboarding/4-agent" className={styles.backButton}>
            Back to section
          </Link>
          <button
            type="button"
            className={styles.nextButton}
            onClick={() => {
              try {
                const parsed = JSON.parse(displayedJson);

                if (!Array.isArray(parsed) || !parsed.length) {
                  throw new Error("Criteria must be a non-empty JSON array.");
                }

                writeTestingCriteriaDefinitions(parsed);
                setSaveError("");
                setSaveMessage("Criteria definitions saved locally. Reload the section page to see the updated scaffold.");
              } catch (error) {
                setSaveMessage("");
                setSaveError(
                  error instanceof Error ? error.message : "Could not save criteria JSON.",
                );
              }
            }}
          >
            Save criteria JSON
          </button>
        </>
      }
    >
      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Criteria JSON</span>
        <textarea
          className={styles.input}
          value={displayedJson}
          rows={16}
          onChange={(event) => {
            setSaveError("");
            setSaveMessage("");
            setCriteriaJson(event.target.value);
          }}
          style={{ minHeight: 320, fontFamily: "monospace", resize: "vertical" }}
        />
        <p className={styles.helper}>
          Keep this flexible. Each criterion only needs `id`, `label`, and `description`. `required` is optional.
        </p>
      </div>

      <div className={styles.stackCard}>
        <span className={styles.inlineLabel}>Extractor preview</span>
        <textarea
          className={styles.input}
          value={parsedPreview || "Fix the JSON above to preview the scaffolded extractor shape."}
          readOnly
          rows={14}
          style={{ minHeight: 260, fontFamily: "monospace", resize: "vertical" }}
        />
      </div>
    </AgentLayout>
  );
}
