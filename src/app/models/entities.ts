export type MealType = 'Reggeli' | 'Ebéd' | 'Vacsora' | 'Snack';
export type ExerciseIntensity = 'low' | 'medium' | 'high';
export type GoalType = 'lose' | 'gain' | 'maintain';
export type EntityId = string | number;

export interface UserProfile {
  id: EntityId;
  displayName: string;
  email: string;
  passwordHash?: string | null;
  role: 'guest' | 'user' | 'admin';
  dailyCalorieTarget: number;
  waterDailyTargetMl: number;
  waterGlassSizeMl: number;
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  goalType?: GoalType | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MealEntry {
  id: EntityId;
  userId: EntityId;
  date: string;
  name: string;
  mealType: MealType;
  when: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string | null;
  timestamp?: string;
  title?: string;
  amount?: number | null;
  amountUnit?: string | null;
  proteinGrams?: number | null;
  carbGrams?: number | null;
  fatGrams?: number | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseEntry {
  id: EntityId;
  userId: EntityId;
  date: string;
  exerciseTypeId: EntityId;
  name: string;
  intensity: ExerciseIntensity;
  durationMinutes: number;
  caloriesBurned: number;
  timestamp?: string;
  type?: string;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WaterIntakeEntry {
  id: EntityId;
  userId: EntityId;
  timestamp: string;
  amountMl: number;
  source: string | null;
  createdAt: string;
}

export interface FoodPreset {
  id: EntityId;
  name: string;
  category?: MealType;
  userId?: EntityId | null;
  defaultAmount?: number | null;
  defaultAmountUnit?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  imageUrl?: string | null;
  createdByUserId?: EntityId | null;
  createdAt?: string;
  updatedAt?: string;
}

export type FoodCatalogItem = FoodPreset;

export interface ExercisePreset {
  id: EntityId;
  name: string;
  intensity: ExerciseIntensity;
  caloriesPerHour: number;
  userId?: EntityId | null;
  icon?: string;
  imageUrl?: string | null;
  createdByUserId?: EntityId | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ExerciseType = ExercisePreset;

export interface ForumTopic {
  id: EntityId;
  title: string;
  body: string;
  description?: string | null;
  authorUserId: EntityId;
  updatedAt: string;
  replyCount: number;
  createdAt?: string;
  isLocked?: boolean;
}

export interface ForumPost {
  id: EntityId;
  topicId: EntityId;
  authorUserId: EntityId;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

export interface ForumReply extends ForumPost {
  body: string;
}
