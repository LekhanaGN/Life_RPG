// THE OTHER SIDE - Evidence Validation Engine (Phase 9)
// Secure image and text observation validation with magic-byte checking and strict limits.

export interface EvidenceValidationOptions {
  maxSizeBytes?: number; // Default 5 MB
  allowedMimeTypes?: string[];
  maxDescriptionLength?: number;
}

export const EVIDENCE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 Megabytes
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_DESCRIPTION_LENGTH: 3,
};

/**
 * Validates image buffer magic bytes against common spoofing
 */
export function validateImageMagicBytes(buffer: Buffer | Uint8Array): {
  isValid: boolean;
  detectedType?: "jpeg" | "png" | "webp";
  error?: string;
} {
  if (buffer.length < 12) {
    return { isValid: false, error: "Evidence payload too small or truncated." };
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { isValid: true, detectedType: "png" };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedType: "jpeg" };
  }

  // WEBP: 'RIFF' .... 'WEBP'
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return { isValid: true, detectedType: "webp" };
  }

  return {
    isValid: false,
    error: "Invalid file format. Only authentic JPEG, PNG, and WEBP images are accepted.",
  };
}

/**
 * Validates text-only observation note
 */
export function validateTextEvidence(description: string): {
  isValid: boolean;
  cleanText?: string;
  error?: string;
} {
  const trimmed = description.trim();
  if (trimmed.length < EVIDENCE_LIMITS.MIN_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Observation note must be at least ${EVIDENCE_LIMITS.MIN_DESCRIPTION_LENGTH} characters.`,
    };
  }
  if (trimmed.length > EVIDENCE_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Observation note cannot exceed ${EVIDENCE_LIMITS.MAX_DESCRIPTION_LENGTH} characters.`,
    };
  }
  return { isValid: true, cleanText: trimmed };
}
