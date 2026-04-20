import "server-only";

import { logPictureError } from "./picture-logging";

type Likelihood =
  | "UNKNOWN"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY";

type PictureModerationResult = {
  allowed: boolean;
  reason: string | null;
  safeSearch: {
    adult: Likelihood;
    violence: Likelihood;
    racy: Likelihood;
    medical: Likelihood;
    spoof: Likelihood;
  };
};

const BLOCKED_LIKELIHOODS = new Set<Likelihood>(["LIKELY", "VERY_LIKELY"]);

function parseServiceAccount() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJson) {
    throw new Error("Google Vision credentials are not configured.");
  }

  try {
    return JSON.parse(credentialsJson) as {
      client_email: string;
      private_key: string;
      token_uri?: string;
    };
  } catch {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON.");
  }
}

async function getGoogleAccessToken() {
  const credentials = parseServiceAccount();

  if (!credentials?.client_email || !credentials.private_key) {
    throw new Error("Google Vision credentials are not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: credentials.token_uri ?? "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  ).toString("base64url");
  const signer = await import("node:crypto");
  const unsignedToken = `${header}.${claimSet}`;
  const signature = signer
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(credentials.private_key, "base64url");

  const response = await fetch(credentials.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${signature}`,
    }),
  });

  if (!response.ok) {
    throw new Error("We couldn't authenticate with Google Vision.");
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("We couldn't authenticate with Google Vision.");
  }

  return payload.access_token;
}

function normalizeLikelihood(value: string | undefined): Likelihood {
  switch (value) {
    case "VERY_UNLIKELY":
    case "UNLIKELY":
    case "POSSIBLE":
    case "LIKELY":
    case "VERY_LIKELY":
      return value;
    default:
      return "UNKNOWN";
  }
}

export async function moderatePictureBuffer(buffer: Buffer): Promise<PictureModerationResult> {
  try {
    const accessToken = await getGoogleAccessToken();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!projectId) {
      throw new Error("Missing Google Vision environment variable: GOOGLE_CLOUD_PROJECT_ID");
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-goog-user-project": projectId,
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: buffer.toString("base64"),
            },
            features: [{ type: "SAFE_SEARCH_DETECTION" }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("We couldn't run the image safety check right now.");
    }

    const payload = (await response.json()) as {
      responses?: Array<{
        safeSearchAnnotation?: {
          adult?: string;
          violence?: string;
          racy?: string;
          medical?: string;
          spoof?: string;
        };
      }>;
    };
    const annotation = payload.responses?.[0]?.safeSearchAnnotation;
    const safeSearch = {
      adult: normalizeLikelihood(annotation?.adult),
      violence: normalizeLikelihood(annotation?.violence),
      racy: normalizeLikelihood(annotation?.racy),
      medical: normalizeLikelihood(annotation?.medical),
      spoof: normalizeLikelihood(annotation?.spoof),
    };
    const blocked =
      BLOCKED_LIKELIHOODS.has(safeSearch.adult) ||
      BLOCKED_LIKELIHOODS.has(safeSearch.violence) ||
      BLOCKED_LIKELIHOODS.has(safeSearch.racy);

    return {
      allowed: !blocked,
      reason: blocked
        ? "This photo could not be uploaded because it appears to contain unsafe content."
        : null,
      safeSearch,
    };
  } catch (error) {
    logPictureError("Google Vision moderation failed.", error);
    return {
      allowed: false,
      reason: "We couldn't verify this photo for safety right now. Please try again later.",
      safeSearch: {
        adult: "UNKNOWN",
        violence: "UNKNOWN",
        racy: "UNKNOWN",
        medical: "UNKNOWN",
        spoof: "UNKNOWN",
      },
    };
  }
}
