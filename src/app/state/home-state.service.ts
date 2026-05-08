import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { CatalogService } from '../services/catalog.service';
import { ExerciseEntryService, ExerciseUpsert } from '../services/exercise-entry.service';
import { MealService, MealUpsert } from '../services/meal.service';
import { WaterIntakeService, WaterIntakeUpsert } from '../services/water-intake.service';
import { AuthService } from '../services/auth.service';
import { EntityId, ExerciseEntry, ExerciseType, FoodCatalogItem, MealEntry, WaterIntakeEntry } from '../models/entities';

@Injectable({ providedIn: 'root' })
export class HomeStateService {
  private readonly mealService = inject(MealService);
  private readonly exerciseEntryService = inject(ExerciseEntryService);
  private readonly catalogService = inject(CatalogService);
  private readonly waterIntakeService = inject(WaterIntakeService);
  private readonly auth = inject(AuthService);

  readonly currentUserId = computed<EntityId>(() => this.auth.userId() ?? 'guest');
  readonly selectedDate = signal(this.formatDate(new Date()));

  readonly meals = signal<MealEntry[]>([]);
  readonly exercises = signal<ExerciseEntry[]>([]);
  readonly waterIntakeEntries = signal<WaterIntakeEntry[]>([]);
  readonly foods = signal<FoodCatalogItem[]>([]);
  readonly exerciseTypes = signal<ExerciseType[]>([]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly mealSearch = signal('');
  readonly mealTypeFilter = signal<'all' | 'Reggeli' | 'Ebéd' | 'Vacsora' | 'Snack'>('all');
  readonly mealSort = signal<'timeDesc' | 'timeAsc' | 'calDesc' | 'calAsc'>('timeDesc');

  private readonly guestMealsByDate = new Map<string, MealEntry[]>();
  private readonly guestExercisesByDate = new Map<string, ExerciseEntry[]>();
  private readonly guestWaterByDate = new Map<string, WaterIntakeEntry[]>();

  readonly filteredMeals = computed(() => {
    const term = this.normalizeText(this.mealSearch().trim());
    const mealType = this.mealTypeFilter();
    const sorted = [...this.meals()].filter((meal) => {
      const matchesSearch = !term || this.normalizeText(meal.name).includes(term);
      const matchesType = mealType === 'all' || meal.mealType === mealType;
      return matchesSearch && matchesType;
    });

    const sortKey = this.mealSort();
    sorted.sort((a, b) => {
      if (sortKey === 'timeAsc') {
        return a.when.localeCompare(b.when);
      }
      if (sortKey === 'timeDesc') {
        return b.when.localeCompare(a.when);
      }
      if (sortKey === 'calAsc') {
        return a.calories - b.calories;
      }
      return b.calories - a.calories;
    });

    return sorted;
  });

  readonly totalCaloriesIn = computed(() => this.meals().reduce((sum, meal) => sum + meal.calories, 0));
  readonly totalProtein = computed(() => this.meals().reduce((sum, meal) => sum + meal.protein, 0));
  readonly totalCarbs = computed(() => this.meals().reduce((sum, meal) => sum + meal.carbs, 0));
  readonly totalFat = computed(() => this.meals().reduce((sum, meal) => sum + meal.fat, 0));
  readonly caloriesBurnedToday = computed(() =>
    this.exercises().reduce((sum, exercise) => sum + exercise.caloriesBurned, 0),
  );
  readonly exerciseMinutesToday = computed(() =>
    this.exercises().reduce((sum, exercise) => sum + exercise.durationMinutes, 0),
  );

  readonly waterConsumedMlToday = computed(() =>
    this.waterIntakeEntries().reduce((sum, entry) => sum + (Number(entry.amountMl) || 0), 0),
  );

  initCatalogData() {
    this.loading.set(true);
    this.error.set(null);

    return forkJoin({
      foods: this.catalogService.getFoods(),
      exerciseTypes: this.catalogService.getExerciseTypes(),
    }).pipe(
      map((result) => {
        this.foods.set(result.foods);
        this.exerciseTypes.set(result.exerciseTypes);
        return result;
      }),
      catchError(() => {
        this.error.set('A katalógus betöltése nem sikerült. Próbáld meg újra később.');
        return of({ foods: [], exerciseTypes: [] });
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  loadDailyData() {
    this.loading.set(true);
    this.error.set(null);

    if (!this.isRegisteredUser()) {
      const date = this.selectedDate();
      this.meals.set(this.guestMealsByDate.get(date) ?? []);
      this.exercises.set(this.guestExercisesByDate.get(date) ?? []);
      this.waterIntakeEntries.set(this.guestWaterByDate.get(date) ?? []);
      this.loading.set(false);
      return of({ meals: this.meals(), exercises: this.exercises(), water: this.waterIntakeEntries() });
    }

    const userId = this.currentUserId();
    const date = this.selectedDate();
    const normalizedUserId = String(userId);

    return forkJoin({
      meals: this.mealService.listByDate(userId, date),
      exercises: this.exerciseEntryService.listByDate(userId, date),
      water: this.waterIntakeService.listAll().pipe(
        map((entries) => (entries ?? [])
          .filter((entry) => String(entry.userId) === normalizedUserId)
          .filter((entry) => (entry.timestamp ?? '').startsWith(date)),
        ),
        catchError(() => of([])),
      ),
    }).pipe(
      map((result) => {
        this.meals.set(result.meals);
        this.exercises.set(result.exercises);
        this.waterIntakeEntries.set(result.water);
        return result;
      }),
      catchError(() => {
        this.error.set('A napi adatok betöltése nem sikerült. Próbáld meg újra később.');
        return of({ meals: [], exercises: [], water: [] });
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  createWaterIntakeEntry(payload: WaterIntakeUpsert) {
    if (!this.isRegisteredUser()) {
      const created: WaterIntakeEntry = { ...payload, id: this.generateLocalId('water') };
      const date = this.selectedDate();
      const next = [...(this.guestWaterByDate.get(date) ?? []), created];
      this.guestWaterByDate.set(date, next);
      this.waterIntakeEntries.set(next);
      return of(created);
    }

    return this.waterIntakeService.create(payload).pipe(
      map((created) => {
        const current = this.waterIntakeEntries();
        const next = [...current, created];
        this.waterIntakeEntries.set(next);
        return created;
      }),
    );
  }

  createMeal(payload: MealUpsert) {
    if (!this.isRegisteredUser()) {
      const created: MealEntry = { ...payload, id: this.generateLocalId('meal') };
      const date = this.selectedDate();
      const next = [...(this.guestMealsByDate.get(date) ?? []), created];
      this.guestMealsByDate.set(date, next);
      this.meals.set(next);
      return of(created);
    }

    return this.mealService.create(payload);
  }

  updateMeal(id: EntityId, payload: MealUpsert) {
    if (!this.isRegisteredUser()) {
      const date = this.selectedDate();
      const current = this.guestMealsByDate.get(date) ?? this.meals();
      const next = current.map((meal) => (String(meal.id) === String(id) ? ({ ...meal, ...payload, id } as MealEntry) : meal));
      this.guestMealsByDate.set(date, next);
      this.meals.set(next);
      const updated = next.find((meal) => String(meal.id) === String(id)) ?? ({ ...payload, id } as MealEntry);
      return of(updated);
    }

    return this.mealService.update(id, payload);
  }

  deleteMeal(id: EntityId) {
    if (!this.isRegisteredUser()) {
      const date = this.selectedDate();
      const current = this.guestMealsByDate.get(date) ?? this.meals();
      const next = current.filter((meal) => String(meal.id) !== String(id));
      this.guestMealsByDate.set(date, next);
      this.meals.set(next);
      return of(void 0);
    }

    return this.mealService.delete(id);
  }

  createExercise(payload: ExerciseUpsert) {
    if (!this.isRegisteredUser()) {
      const created: ExerciseEntry = { ...payload, id: this.generateLocalId('exercise') };
      const date = this.selectedDate();
      const next = [...(this.guestExercisesByDate.get(date) ?? []), created];
      this.guestExercisesByDate.set(date, next);
      this.exercises.set(next);
      return of(created);
    }

    return this.exerciseEntryService.create(payload);
  }

  ensureFoodPresetFromMeal(
    payload: Pick<MealEntry, 'userId' | 'name' | 'mealType' | 'calories' | 'protein' | 'carbs' | 'fat'> & {
      imageUrl?: string | null;
    },
  ) {
    return this.catalogService.ensureFoodPresetFromMeal(payload.userId, payload);
  }

  ensureExercisePresetFromEntry(
    payload: Pick<ExerciseEntry, 'userId' | 'name' | 'intensity' | 'durationMinutes' | 'caloriesBurned'>,
  ) {
    return this.catalogService.ensureExercisePresetFromEntry(payload.userId, payload);
  }

  updateExercise(id: EntityId, payload: ExerciseUpsert) {
    if (!this.isRegisteredUser()) {
      const date = this.selectedDate();
      const current = this.guestExercisesByDate.get(date) ?? this.exercises();
      const next = current.map((exercise) =>
        (String(exercise.id) === String(id) ? ({ ...exercise, ...payload, id } as ExerciseEntry) : exercise),
      );
      this.guestExercisesByDate.set(date, next);
      this.exercises.set(next);
      const updated = next.find((exercise) => String(exercise.id) === String(id)) ?? ({ ...payload, id } as ExerciseEntry);
      return of(updated);
    }

    return this.exerciseEntryService.update(id, payload);
  }

  deleteExercise(id: EntityId) {
    if (!this.isRegisteredUser()) {
      const date = this.selectedDate();
      const current = this.guestExercisesByDate.get(date) ?? this.exercises();
      const next = current.filter((exercise) => String(exercise.id) !== String(id));
      this.guestExercisesByDate.set(date, next);
      this.exercises.set(next);
      return of(void 0);
    }

    return this.exerciseEntryService.delete(id);
  }

  setSelectedDate(date: Date) {
    this.selectedDate.set(this.formatDate(date));
  }

  private isRegisteredUser(): boolean {
    return this.auth.isAuthenticated();
  }

  private generateLocalId(prefix: string): string {
    try {
      const uuid = (globalThis.crypto as Crypto | undefined)?.randomUUID?.();
      if (uuid) {
        return `${prefix}-${uuid}`;
      }
    } catch {
      // ignore
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('hu-HU');
  }
}
