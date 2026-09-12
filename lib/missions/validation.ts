// THE OTHER SIDE - Mission Validation Engine
// GuardLink Annotated Client & Server Schema Validation

import {
  MissionCategory,
  MissionDifficulty,
  MissionFrequency,
  MissionStatus,
} from "./types";

export interface CreateMissionInput {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  difficulty?: unknown;
  frequency?: unknown;
  dueDate?: unknown;
}

export interface UpdateMissionInput extends Partial<CreateMissionInput> {
  status?: unknown;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export interface ValidatedMissionData {
  title: string;
  description: string | null;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  frequency: MissionFrequency;
  dueDate: Date | null;
  status?: MissionStatus;
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

/**
 * @flows Client -> validateCreateMission -> API.Missions -- "Validates inbound new mission payload"
 * @mitigates validateCreateMission against #input-validation-failure using #input-validation -- "Sanitizes and enforces field constraints"
 * @handles #mission-data on validateCreateMission -- "Parses title, description, category, difficulty, frequency, and dueDate"
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
    },
  };
}

/**
 * @flows Client -> validateUpdateMission -> API.Missions -- "Validates mission update request"
 * @mitigates validateUpdateMission against #input-validation-failure using #input-validation -- "Guards against malformed fields during patch"
 * @handles #mission-data on validateUpdateMission -- "Supports partial updates for all editable mission attributes"
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

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {}, data };
}
