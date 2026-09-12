// THE OTHER SIDE - Mission Validation Engine
// GuardLink Annotated Client & Server Schema Validation

import {
  MissionCategory,
  MissionDifficulty,
  MissionFrequency,
  MissionStatus,
  VerificationType,
} from "./types";

export interface CreateMissionInput {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  difficulty?: unknown;
  frequency?: unknown;
  dueDate?: unknown;
  verificationType?: unknown;
  focusDurationMinutes?: unknown;
}

export interface UpdateMissionInput extends Partial<CreateMissionInput> {
  status?: unknown;
}

export type ValidationResult<T> =
  | { isValid: true; errors: Record<string, string>; data: T }
  | { isValid: false; errors: Record<string, string>; data?: undefined };

export interface ValidatedMissionData {
  title: string;
  description: string | null;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  frequency: MissionFrequency;
  dueDate: Date | null;
  status?: MissionStatus;
  verificationType?: VerificationType;
  focusDurationMinutes?: number | null;
}

const VALID_CATEGORIES: readonly MissionCategory[] = [
  "MIND",
  "BODY",
  "FOCUS",
  "SPIRIT",
  "CONNECTION",
];

const VALID_DIFFICULTIES: readonly MissionDifficulty[] = [
  "EASY",
  "MEDIUM",
  "HARD",
  "EPIC",
];

const VALID_FREQUENCIES: readonly MissionFrequency[] = [
  "ONCE",
  "DAILY",
  "WEEKLY",
];

const VALID_STATUSES: readonly MissionStatus[] = ["ACTIVE", "ARCHIVED"];

const VALID_VERIFICATION_TYPES: readonly VerificationType[] = [
  "SELF_REPORT",
  "EVIDENCE",
  "FOCUS_SESSION",
];

/**
 * @flows Client -> validateCreateMission via Input -- "Validates inbound new mission payload"
 * @mitigates validateCreateMission against #input-validation-failure using #input-validation -- "Sanitizes and enforces field constraints"
 * @handles internal on validateCreateMission -- "Parses title, description, category, difficulty, frequency, and dueDate"
 * @comment -- "Ensures title length between 2 and 100 characters and valid enum types"
 */
export function validateCreateMission(
  input: CreateMissionInput
): ValidationResult<ValidatedMissionData> {
  const errors: Record<string, string> = {};

  // 1. Title Validation
  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (!rawTitle) {
    errors.title = "Mission callsign / title is required.";
  } else if (rawTitle.length < 2) {
    errors.title = "Mission title must be at least 2 characters.";
  } else if (rawTitle.length > 100) {
    errors.title = "Mission title cannot exceed 100 characters.";
  }

  // 2. Description Validation (optional)
  let cleanDescription: string | null = null;
  if (input.description !== undefined && input.description !== null && input.description !== "") {
    if (typeof input.description !== "string") {
      errors.description = "Mission description must be a string.";
    } else {
      const trimmed = input.description.trim();
      if (trimmed.length > 1000) {
        errors.description = "Description cannot exceed 1000 characters.";
      } else {
        cleanDescription = trimmed || null;
      }
    }
  }

  // 3. Category Validation
  const rawCategory = typeof input.category === "string" ? input.category.toUpperCase().trim() : "";
  if (!rawCategory) {
    errors.category = "Category selection is required.";
  } else if (!VALID_CATEGORIES.includes(rawCategory as MissionCategory)) {
    errors.category = "Invalid category. Select MIND, BODY, FOCUS, SPIRIT, or CONNECTION.";
  }

  // 4. Difficulty Validation
  const rawDifficulty =
    typeof input.difficulty === "string" ? input.difficulty.toUpperCase().trim() : "";
  if (!rawDifficulty) {
    errors.difficulty = "Difficulty rating is required.";
  } else if (!VALID_DIFFICULTIES.includes(rawDifficulty as MissionDifficulty)) {
    errors.difficulty = "Invalid difficulty. Select EASY, MEDIUM, HARD, or EPIC.";
  }

  // 5. Frequency Validation
  const rawFrequency =
    typeof input.frequency === "string" ? input.frequency.toUpperCase().trim() : "";
  if (!rawFrequency) {
    errors.frequency = "Frequency cadence is required.";
  } else if (!VALID_FREQUENCIES.includes(rawFrequency as MissionFrequency)) {
    errors.frequency = "Invalid frequency. Select ONCE, DAILY, or WEEKLY.";
  }

  // 6. Due Date Validation (optional)
  let parsedDueDate: Date | null = null;
  if (input.dueDate !== undefined && input.dueDate !== null && input.dueDate !== "") {
    const d = new Date(input.dueDate as string);
    if (isNaN(d.getTime())) {
      errors.dueDate = "Please provide a valid due date and time.";
    } else {
      parsedDueDate = d;
    }
  }

  // 7. Verification Type Validation (optional)
  let cleanVerificationType: VerificationType = "SELF_REPORT";
  if (
    input.verificationType !== undefined &&
    input.verificationType !== null &&
    input.verificationType !== ""
  ) {
    const rawVType =
      typeof input.verificationType === "string"
        ? input.verificationType.toUpperCase().trim()
        : "";
    if (!VALID_VERIFICATION_TYPES.includes(rawVType as VerificationType)) {
      errors.verificationType =
        "Invalid verification type. Select SELF_REPORT, EVIDENCE, or FOCUS_SESSION.";
    } else {
      cleanVerificationType = rawVType as VerificationType;
    }
  }

  // 8. Focus Duration Validation (optional)
  let cleanFocusDurationMinutes: number | null = null;
  if (cleanVerificationType === "FOCUS_SESSION") {
    cleanFocusDurationMinutes = 25;
    if (
      input.focusDurationMinutes !== undefined &&
      input.focusDurationMinutes !== null &&
      input.focusDurationMinutes !== ""
    ) {
      const parsedNum = Number(input.focusDurationMinutes);
      if (isNaN(parsedNum) || parsedNum < 1 || parsedNum > 240) {
        errors.focusDurationMinutes = "Focus duration must be between 1 and 240 minutes.";
      } else {
        cleanFocusDurationMinutes = Math.round(parsedNum);
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    data: {
      title: rawTitle,
      description: cleanDescription,
      category: rawCategory as MissionCategory,
      difficulty: rawDifficulty as MissionDifficulty,
      frequency: rawFrequency as MissionFrequency,
      dueDate: parsedDueDate,
      verificationType: cleanVerificationType,
      focusDurationMinutes: cleanFocusDurationMinutes,
    },
  };
}

/**
 * @flows Client -> validateUpdateMission via Input -- "Validates mission update request"
 * @mitigates validateUpdateMission against #input-validation-failure using #input-validation -- "Guards against malformed fields during patch"
 * @handles internal on validateUpdateMission -- "Supports partial updates for all editable mission attributes"
 * @comment -- "Validates status field when transitioning between ACTIVE and ARCHIVED"
 */
export function validateUpdateMission(
  input: UpdateMissionInput
): ValidationResult<Partial<ValidatedMissionData>> {
  const errors: Record<string, string> = {};
  const data: Partial<ValidatedMissionData> = {};

  if (input.title !== undefined) {
    const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
    if (!rawTitle) {
      errors.title = "Mission title cannot be empty.";
    } else if (rawTitle.length < 2) {
      errors.title = "Mission title must be at least 2 characters.";
    } else if (rawTitle.length > 100) {
      errors.title = "Mission title cannot exceed 100 characters.";
    } else {
      data.title = rawTitle;
    }
  }

  if (input.description !== undefined) {
    if (input.description === null || input.description === "") {
      data.description = null;
    } else if (typeof input.description !== "string") {
      errors.description = "Mission description must be text.";
    } else {
      const trimmed = input.description.trim();
      if (trimmed.length > 1000) {
        errors.description = "Description cannot exceed 1000 characters.";
      } else {
        data.description = trimmed || null;
      }
    }
  }

  if (input.category !== undefined) {
    const rawCategory =
      typeof input.category === "string" ? input.category.toUpperCase().trim() : "";
    if (!VALID_CATEGORIES.includes(rawCategory as MissionCategory)) {
      errors.category = "Invalid category.";
    } else {
      data.category = rawCategory as MissionCategory;
    }
  }

  if (input.difficulty !== undefined) {
    const rawDifficulty =
      typeof input.difficulty === "string" ? input.difficulty.toUpperCase().trim() : "";
    if (!VALID_DIFFICULTIES.includes(rawDifficulty as MissionDifficulty)) {
      errors.difficulty = "Invalid difficulty.";
    } else {
      data.difficulty = rawDifficulty as MissionDifficulty;
    }
  }

  if (input.frequency !== undefined) {
    const rawFrequency =
      typeof input.frequency === "string" ? input.frequency.toUpperCase().trim() : "";
    if (!VALID_FREQUENCIES.includes(rawFrequency as MissionFrequency)) {
      errors.frequency = "Invalid frequency.";
    } else {
      data.frequency = rawFrequency as MissionFrequency;
    }
  }

  if (input.dueDate !== undefined) {
    if (input.dueDate === null || input.dueDate === "") {
      data.dueDate = null;
    } else {
      const d = new Date(input.dueDate as string);
      if (isNaN(d.getTime())) {
        errors.dueDate = "Please provide a valid due date.";
      } else {
        data.dueDate = d;
      }
    }
  }

  if (input.status !== undefined) {
    const rawStatus =
      typeof input.status === "string" ? input.status.toUpperCase().trim() : "";
    if (!VALID_STATUSES.includes(rawStatus as MissionStatus)) {
      errors.status = "Invalid status. Select ACTIVE or ARCHIVED.";
    } else {
      data.status = rawStatus as MissionStatus;
    }
  }

  if (input.verificationType !== undefined) {
    const rawVType =
      typeof input.verificationType === "string"
        ? input.verificationType.toUpperCase().trim()
        : "";
    if (!VALID_VERIFICATION_TYPES.includes(rawVType as VerificationType)) {
      errors.verificationType = "Invalid verification type.";
    } else {
      data.verificationType = rawVType as VerificationType;
    }
  }

  if (input.focusDurationMinutes !== undefined) {
    if (input.focusDurationMinutes === null || input.focusDurationMinutes === "") {
      data.focusDurationMinutes = null;
    } else {
      const parsedNum = Number(input.focusDurationMinutes);
      if (isNaN(parsedNum) || parsedNum < 1 || parsedNum > 240) {
        errors.focusDurationMinutes = "Focus duration must be between 1 and 240 minutes.";
      } else {
        data.focusDurationMinutes = Math.round(parsedNum);
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {}, data };
}
