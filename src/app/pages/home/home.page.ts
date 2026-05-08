import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { HomeStateService } from '../../state/home-state.service';
import { ToastService } from '../../toast.service';
import { EntityId, ExerciseType, FoodCatalogItem, MealType } from '../../models/entities';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class HomePageComponent {
  private static readonly FOOD_PLACEHOLDER_IMAGE = 'images/foods/placeholder-food.svg';

  private readonly state = inject(HomeStateService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userProfileService = inject(UserProfileService);
  private readonly auth = inject(AuthService);

  protected readonly loading = this.state.loading;
  protected readonly loadError = this.state.error;

  protected readonly currentDate = this.state.selectedDate;
  protected readonly meals = this.state.filteredMeals;
  protected readonly exercises = this.state.exercises;
  protected readonly foods = this.state.foods;
  protected readonly exerciseTypes = this.state.exerciseTypes;

  protected readonly totalCaloriesIn = this.state.totalCaloriesIn;
  protected readonly totalProtein = this.state.totalProtein;
  protected readonly totalCarbs = this.state.totalCarbs;
  protected readonly totalFat = this.state.totalFat;
  protected readonly caloriesBurnedToday = this.state.caloriesBurnedToday;
  protected readonly exerciseMinutesToday = this.state.exerciseMinutesToday;

  protected readonly mealSearch = this.state.mealSearch;
  protected readonly mealTypeFilter = this.state.mealTypeFilter;
  protected readonly mealSort = this.state.mealSort;

  protected readonly dailyCalorieTarget = signal(2200);
  protected readonly waterTargetMl = signal(2400);
  protected readonly waterGlassSizeMl = signal(300);
  protected readonly waterConsumedMl = this.state.waterConsumedMlToday;

  protected readonly editingMealId = signal<EntityId | null>(null);
  protected readonly editingExerciseId = signal<EntityId | null>(null);
  protected readonly mealEntryMode = signal<'preset' | 'custom'>('preset');
  protected readonly exerciseEntryMode = signal<'preset' | 'custom'>('preset');
  protected readonly selectedFoodPresetId = signal('');
  protected readonly selectedExercisePresetId = signal('');
  protected readonly selectedMealPresetGrams = signal(100);
  protected readonly selectedExercisePresetDuration = signal(30);
  protected readonly customMealImageDataUrl = signal<string | null>(null);

  protected readonly submittingMeal = signal(false);
  protected readonly submittingExercise = signal(false);
  protected readonly submittingWater = signal(false);

  protected readonly currentDateLabel = computed(() => {
    const [year, month, day] = this.currentDate().split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('hu-HU', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  });

  protected readonly caloriesRemaining = computed(
    () => this.dailyCalorieTarget() - this.totalCaloriesIn() + this.caloriesBurnedToday(),
  );

  protected readonly waterGlassStates = computed(() => {
    const glassSize = this.waterGlassSizeMl();
    const target = this.waterTargetMl();
    if (glassSize <= 0 || target <= 0) {
      return [] as boolean[];
    }
    const totalGlasses = Math.max(1, Math.round(target / glassSize));
    const filledGlasses = Math.min(totalGlasses, Math.round(this.waterConsumedMl() / glassSize));
    return Array.from({ length: totalGlasses }, (_, index) => index < filledGlasses);
  });

  protected readonly mealForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    mealType: ['Reggeli' as MealType, [Validators.required]],
    when: ['08:00', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
    calories: [300, [Validators.required, Validators.min(1)]],
    protein: [10, [Validators.required, Validators.min(0)]],
    carbs: [30, [Validators.required, Validators.min(0)]],
    fat: [8, [Validators.required, Validators.min(0)]],
  });

  protected readonly exerciseForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    intensity: ['medium' as 'low' | 'medium' | 'high', [Validators.required]],
    durationMinutes: [30, [Validators.required, Validators.min(1)]],
    caloriesBurned: [220, [Validators.required, Validators.min(1)]],
  });

  protected readonly mealPresetForm = this.fb.group({
    mealType: ['Reggeli' as MealType, [Validators.required]],
    when: ['08:00', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
    grams: [100, [Validators.required, Validators.min(1)]],
  });

  protected readonly exercisePresetForm = this.fb.group({
    durationMinutes: [30, [Validators.required, Validators.min(1)]],
  });

  protected readonly selectedFoodPreset = computed<FoodCatalogItem | null>(() => {
    const selectedId = this.selectedFoodPresetId();
    if (!selectedId) {
      return null;
    }
    return this.foods().find((food) => String(food.id) === selectedId) ?? null;
  });

  protected readonly selectedExercisePreset = computed<ExerciseType | null>(() => {
    const selectedId = this.selectedExercisePresetId();
    if (!selectedId) {
      return null;
    }
    return this.exerciseTypes().find((exerciseType) => String(exerciseType.id) === selectedId) ?? null;
  });

  protected readonly mealPresetPreview = computed(() => {
    const food = this.selectedFoodPreset();
    const grams = this.selectedMealPresetGrams();
    if (!food || !Number.isFinite(grams) || grams <= 0) {
      return null;
    }

    const baseAmount = Number(food.defaultAmount ?? 100) || 100;
    const factor = grams / baseAmount;
    return {
      calories: Math.round(food.calories * factor),
      protein: Math.round(food.protein * factor),
      carbs: Math.round(food.carbs * factor),
      fat: Math.round(food.fat * factor),
      baseAmount,
    };
  });

  protected readonly exercisePresetPreviewCalories = computed(() => {
    const exerciseType = this.selectedExercisePreset();
    const durationMinutes = this.selectedExercisePresetDuration();
    if (!exerciseType || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return null;
    }
    return Math.round((exerciseType.caloriesPerHour * durationMinutes) / 60);
  });

  private mealSearchDebounceId: number | null = null;

  constructor() {
    this.bindPreferencesEvents();
    this.bootstrapData();
    this.bindQueryParams();
  }

  private bindPreferencesEvents(): void {
    const applyFromDom = () => {
      const root = document.documentElement;
      const targetAttr = root.getAttribute('data-water-target-ml');
      const glassAttr = root.getAttribute('data-water-glass-ml');

      const parsedTarget = targetAttr ? Number(targetAttr) : NaN;
      if (Number.isFinite(parsedTarget) && parsedTarget > 0) {
        this.waterTargetMl.set(Math.round(parsedTarget));
      }

      const parsedGlass = glassAttr ? Number(glassAttr) : NaN;
      if (Number.isFinite(parsedGlass) && parsedGlass > 0) {
        this.waterGlassSizeMl.set(Math.round(parsedGlass));
      }
    };

    const onPrefsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ waterTargetMl?: number; waterGlassSizeMl?: number }>).detail;
      const target = detail?.waterTargetMl;
      const glass = detail?.waterGlassSizeMl;

      if (typeof target === 'number' && Number.isFinite(target) && target > 0) {
        this.waterTargetMl.set(Math.round(target));
      }
      if (typeof glass === 'number' && Number.isFinite(glass) && glass > 0) {
        this.waterGlassSizeMl.set(Math.round(glass));
      }
    };

    window.addEventListener('macroTrackerPrefsChanged', onPrefsChanged);
    window.addEventListener('storage', applyFromDom);
    applyFromDom();

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('macroTrackerPrefsChanged', onPrefsChanged);
      window.removeEventListener('storage', applyFromDom);
    });
  }

  protected changeDay(offsetDays: number): void {
    const [year, month, day] = this.currentDate().split('-').map(Number);
    const nextDate = new Date(year, month - 1, day + offsetDays);
    this.state.setSelectedDate(nextDate);
    this.loadDailyData();
  }

  protected onMealSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.mealSearch.set(value);

    if (this.mealSearchDebounceId !== null) {
      window.clearTimeout(this.mealSearchDebounceId);
    }
    this.mealSearchDebounceId = window.setTimeout(() => {
      this.syncUrlState();
    }, 300);
  }

  protected onMealTypeFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | MealType;
    this.state.mealTypeFilter.set(value);
    this.syncUrlState();
  }

  protected onMealSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as
      | 'timeDesc'
      | 'timeAsc'
      | 'calDesc'
      | 'calAsc';
    this.state.mealSort.set(value);
    this.syncUrlState();
  }

  protected submitMeal(): void {
    const nowIso = new Date().toISOString();

    if (this.mealEntryMode() === 'preset' && this.editingMealId() === null) {
      if (this.mealPresetForm.invalid) {
        this.mealPresetForm.markAllAsTouched();
        return;
      }

      const presetValue = this.mealPresetForm.getRawValue();
      const food = this.selectedFoodPreset();
      const preview = this.mealPresetPreview();
      if (!food || !preview) {
        this.toast.show(
          `Válassz előre betáplált ételt és adj meg grammot. (betöltött: ${this.foods().length})`,
        );
        return;
      }

      const timestamp = this.buildIsoTimestampForSelectedDate(presetValue.when ?? '08:00');

      const payload = {
        userId: this.state.currentUserId(),
        date: this.currentDate(),
        name: `${food.name} (${this.selectedMealPresetGrams()} g)`,
        mealType: presetValue.mealType ?? 'Reggeli',
        when: presetValue.when ?? '08:00',
        calories: preview.calories,
        protein: preview.protein,
        carbs: preview.carbs,
        fat: preview.fat,
        imageUrl: this.getFoodImageUrl(food),
        title: food.name,
        amount: this.selectedMealPresetGrams(),
        amountUnit: 'g',
        proteinGrams: preview.protein,
        carbGrams: preview.carbs,
        fatGrams: preview.fat,
        timestamp,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.submittingMeal.set(true);
      this.state.createMeal(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.submittingMeal.set(false);
            this.resetMealPresetForm();
            this.afterWriteSuccess('Étkezés mentve előre betáplált ételből.');
          },
          error: () => {
            this.submittingMeal.set(false);
            this.toast.show('Nem sikerült menteni az étkezést.');
          },
        });
      return;
    }

    if (this.mealForm.invalid) {
      this.mealForm.markAllAsTouched();
      return;
    }

    const value = this.mealForm.getRawValue();

    const editingId = this.editingMealId();
    const existingMeal = editingId === null
      ? null
      : this.state.meals().find((meal) => String(meal.id) === String(editingId)) ?? null;

    const timestamp = this.buildIsoTimestampForSelectedDate(value.when);
    const payload = {
      userId: this.state.currentUserId(),
      date: this.currentDate(),
      name: value.name,
      mealType: value.mealType,
      when: value.when,
      calories: Number(value.calories),
      protein: Number(value.protein),
      carbs: Number(value.carbs),
      fat: Number(value.fat),
      imageUrl: this.resolveCustomMealImageUrl(),
      title: value.name,
      proteinGrams: Number(value.protein),
      carbGrams: Number(value.carbs),
      fatGrams: Number(value.fat),
      timestamp,
      createdAt: existingMeal?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    this.submittingMeal.set(true);
    const request$ = editingId === null
      ? this.state.createMeal(payload)
      : this.state.updateMeal(editingId, payload);

    if (editingId === null && this.mealEntryMode() === 'custom' && this.isRegisteredUser()) {
      request$
        .pipe(
          switchMap(() => this.state.ensureFoodPresetFromMeal({
            ...payload,
            imageUrl: payload.imageUrl,
          })),
          switchMap(() => this.state.initCatalogData()),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.submittingMeal.set(false);
            this.resetMealForm();
            this.afterWriteSuccess('Étkezés mentve.');
          },
          error: () => {
            this.submittingMeal.set(false);
            this.toast.show('Nem sikerült menteni az étkezést.');
          },
        });
      return;
    }

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submittingMeal.set(false);
          this.resetMealForm();
          this.afterWriteSuccess('Étkezés mentve.');
        },
        error: () => {
          this.submittingMeal.set(false);
          this.toast.show('Nem sikerült menteni az étkezést.');
        },
      });
  }

  protected editMeal(mealId: EntityId): void {
    const meal = this.state.meals().find((item) => item.id === mealId);
    if (!meal) {
      return;
    }

    this.mealEntryMode.set('custom');
    this.editingMealId.set(meal.id);
    this.customMealImageDataUrl.set(meal.imageUrl ?? null);
    this.mealForm.setValue({
      name: meal.name,
      mealType: meal.mealType,
      when: meal.when,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    });
  }

  protected deleteMeal(mealId: EntityId): void {
    if (!window.confirm('Biztosan törlöd ezt az étkezést?')) {
      return;
    }

    this.state.deleteMeal(mealId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterWriteSuccess('Étkezés törölve.'),
        error: () => this.toast.show('Nem sikerült törölni az étkezést.'),
      });
  }

  protected cancelMealEdit(): void {
    this.resetMealForm();
  }

  protected submitExercise(): void {
    const nowIso = new Date().toISOString();

    if (this.exerciseEntryMode() === 'preset' && this.editingExerciseId() === null) {
      if (this.exercisePresetForm.invalid) {
        this.exercisePresetForm.markAllAsTouched();
        return;
      }

      const presetValue = this.exercisePresetForm.getRawValue();
      const exerciseType = this.selectedExercisePreset();
      const previewCalories = this.exercisePresetPreviewCalories();
      if (!exerciseType || previewCalories === null) {
        this.toast.show(
          `Válassz előre betáplált mozgásformát és adj meg időtartamot. (betöltött: ${this.exerciseTypes().length})`,
        );
        return;
      }

      const timestamp = this.buildIsoTimestampForSelectedDate(null);

      const payload = {
        userId: this.state.currentUserId(),
        date: this.currentDate(),
        exerciseTypeId: exerciseType.id,
        name: exerciseType.name,
        intensity: exerciseType.intensity,
        durationMinutes: this.selectedExercisePresetDuration(),
        caloriesBurned: previewCalories,
        type: exerciseType.name,
        timestamp,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.submittingExercise.set(true);
      this.state.createExercise(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.submittingExercise.set(false);
            this.resetExercisePresetForm();
            this.afterWriteSuccess('Edzés mentve előre betáplált mozgásformából.');
          },
          error: () => {
            this.submittingExercise.set(false);
            this.toast.show('Nem sikerült menteni az edzést.');
          },
        });
      return;
    }

    if (this.exerciseForm.invalid) {
      this.exerciseForm.markAllAsTouched();
      return;
    }

    const value = this.exerciseForm.getRawValue();
    const editingId = this.editingExerciseId();
    const existingExercise = editingId === null
      ? null
      : this.exercises().find((exercise) => String(exercise.id) === String(editingId)) ?? null;

    const timestamp = this.buildIsoTimestampForSelectedDate(null);
    const payload = {
      userId: this.state.currentUserId(),
      date: this.currentDate(),
      exerciseTypeId: 0,
      name: value.name,
      intensity: value.intensity,
      durationMinutes: Number(value.durationMinutes),
      caloriesBurned: Number(value.caloriesBurned),
      type: value.name,
      timestamp,
      createdAt: existingExercise?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    this.submittingExercise.set(true);
    const request$ = editingId === null
      ? this.state.createExercise(payload)
      : this.state.updateExercise(editingId, payload);

    if (editingId === null && this.exerciseEntryMode() === 'custom' && this.isRegisteredUser()) {
      request$
        .pipe(
          switchMap(() => this.state.ensureExercisePresetFromEntry(payload)),
          switchMap(() => this.state.initCatalogData()),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.submittingExercise.set(false);
            this.resetExerciseForm();
            this.afterWriteSuccess('Edzés mentve.');
          },
          error: () => {
            this.submittingExercise.set(false);
            this.toast.show('Nem sikerült menteni az edzést.');
          },
        });
      return;
    }

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submittingExercise.set(false);
          this.resetExerciseForm();
          this.afterWriteSuccess('Edzés mentve.');
        },
        error: () => {
          this.submittingExercise.set(false);
          this.toast.show('Nem sikerült menteni az edzést.');
        },
      });
  }

  protected editExercise(exerciseId: EntityId): void {
    const exercise = this.exercises().find((item) => item.id === exerciseId);
    if (!exercise) {
      return;
    }

    this.exerciseEntryMode.set('custom');
    this.editingExerciseId.set(exercise.id);
    this.exerciseForm.setValue({
      name: exercise.name,
      intensity: exercise.intensity,
      durationMinutes: exercise.durationMinutes,
      caloriesBurned: exercise.caloriesBurned,
    });
  }

  protected deleteExercise(exerciseId: EntityId): void {
    if (!window.confirm('Biztosan törlöd ezt az edzést?')) {
      return;
    }

    this.state.deleteExercise(exerciseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterWriteSuccess('Edzés törölve.'),
        error: () => this.toast.show('Nem sikerült törölni az edzést.'),
      });
  }

  protected cancelExerciseEdit(): void {
    this.resetExerciseForm();
  }

  protected setMealEntryMode(mode: 'preset' | 'custom'): void {
    if (this.editingMealId() !== null) {
      return;
    }
    this.mealEntryMode.set(mode);
  }

  protected setExerciseEntryMode(mode: 'preset' | 'custom'): void {
    if (this.editingExerciseId() !== null) {
      return;
    }
    this.exerciseEntryMode.set(mode);
  }

  protected addWaterGlass(): void {
    const glassSize = this.waterGlassSizeMl();
    if (!Number.isFinite(glassSize) || glassSize <= 0) {
      this.toast.show('A pohár mérete érvénytelen.');
      return;
    }

    const nowIso = new Date().toISOString();
    const payload = {
      userId: this.state.currentUserId(),
      timestamp: this.buildIsoTimestampForSelectedDate(null),
      amountMl: glassSize,
      source: 'pohár',
      createdAt: nowIso,
    };

    this.submittingWater.set(true);
    this.state.createWaterIntakeEntry(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submittingWater.set(false);
          if (!this.isRegisteredUser()) {
            this.toast.show('Vízbevitel hozzáadva (vendég mód).');
          }
        },
        error: () => {
          this.submittingWater.set(false);
          this.toast.show('Nem sikerült menteni a vízbevitelt.');
        },
      });
  }

  private buildIsoTimestampForSelectedDate(timeHHmm: string | null): string {
    const now = new Date();
    const [year, month, day] = this.currentDate().split('-').map(Number);

    let hours = now.getHours();
    let minutes = now.getMinutes();

    if (timeHHmm && /^\d{2}:\d{2}$/.test(timeHHmm)) {
      const [h, m] = timeHHmm.split(':').map(Number);
      if (Number.isFinite(h) && Number.isFinite(m)) {
        hours = h;
        minutes = m;
      }
    }

    const date = new Date(year, month - 1, day, hours, minutes, now.getSeconds(), now.getMilliseconds());

    const pad2 = (value: number) => String(value).padStart(2, '0');
    const pad3 = (value: number) => String(value).padStart(3, '0');

    const offsetTotalMinutes = -date.getTimezoneOffset();
    const offsetSign = offsetTotalMinutes >= 0 ? '+' : '-';
    const offsetAbsMinutes = Math.abs(offsetTotalMinutes);
    const offsetHours = Math.floor(offsetAbsMinutes / 60);
    const offsetMinutes = offsetAbsMinutes % 60;

    return `${pad2(date.getFullYear())}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
      + `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}.${pad3(date.getMilliseconds())}`
      + `${offsetSign}${pad2(offsetHours)}:${pad2(offsetMinutes)}`;
  }

  protected hasMealFieldError(fieldName: 'name' | 'when' | 'calories' | 'protein' | 'carbs' | 'fat'): boolean {
    const control = this.mealForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected hasMealPresetFieldError(fieldName: 'when' | 'grams'): boolean {
    const control = this.mealPresetForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected hasExerciseFieldError(fieldName: 'name' | 'durationMinutes' | 'caloriesBurned'): boolean {
    const control = this.exerciseForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected hasExercisePresetFieldError(fieldName: 'durationMinutes'): boolean {
    const control = this.exercisePresetForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected onMealPresetFoodChange(event: Event): void {
    this.selectedFoodPresetId.set((event.target as HTMLSelectElement).value);
  }

  protected onMealPresetGramsInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.selectedMealPresetGrams.set(Number.isFinite(value) && value > 0 ? value : 0);
  }

  protected onExercisePresetTypeChange(event: Event): void {
    this.selectedExercisePresetId.set((event.target as HTMLSelectElement).value);
  }

  protected onExercisePresetDurationInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.selectedExercisePresetDuration.set(Number.isFinite(value) && value > 0 ? value : 0);
  }

  protected onCustomMealImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) {
      this.customMealImageDataUrl.set(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toast.show('Csak képfájl tölthető fel.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.customMealImageDataUrl.set(result);
    };
    reader.onerror = () => this.toast.show('Nem sikerült beolvasni a képet.');
    reader.readAsDataURL(file);
  }

  protected removeCustomMealImage(): void {
    this.customMealImageDataUrl.set(null);
  }

  protected getFoodImageUrl(food: FoodCatalogItem): string {
    if (food.imageUrl) {
      return food.imageUrl;
    }

    const normalized = food.name.toLocaleLowerCase('hu-HU');
    if (normalized.includes('zab')) {
      return 'images/foods/oatmeal.svg';
    }
    if (normalized.includes('csirke')) {
      return 'images/foods/chicken-rice.svg';
    }
    if (normalized.includes('alma')) {
      return 'images/foods/apple.svg';
    }
    if (normalized.includes('saláta') || normalized.includes('salata')) {
      return 'images/foods/tuna-salad.svg';
    }
    return HomePageComponent.FOOD_PLACEHOLDER_IMAGE;
  }

  protected getMealImageUrl(meal: { name: string; title?: string; imageUrl?: string | null }): string {
    if (meal.imageUrl) {
      return meal.imageUrl;
    }

    const title = meal.title?.trim();
    const nameWithoutAmount = meal.name.replace(/\s*\([^)]*\)\s*$/u, '').trim();
    const matchedFood = this.foods().find((food) => {
      const candidate = food.name.trim();
      return candidate === title || candidate === nameWithoutAmount || candidate === meal.name.trim();
    });

    if (matchedFood) {
      return this.getFoodImageUrl(matchedFood);
    }

    return HomePageComponent.FOOD_PLACEHOLDER_IMAGE;
  }

  private bootstrapData(): void {
    const userId = this.auth.userId();
    if (this.isRegisteredUser() && userId) {
      this.userProfileService.getById(userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (user) => {
            this.dailyCalorieTarget.set(user.dailyCalorieTarget);
            this.waterTargetMl.set(user.waterDailyTargetMl);
            this.waterGlassSizeMl.set(user.waterGlassSizeMl);
          },
          error: () => {
            this.toast.show('Nem sikerült betölteni a felhasználói profilt.');
          },
        });
    }

    this.state.initCatalogData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadDailyData(),
      });
  }

  private isRegisteredUser(): boolean {
    return this.auth.isAuthenticated();
  }

  private afterWriteSuccess(message: string): void {
    if (this.isRegisteredUser()) {
      this.loadDailyData(message);
      return;
    }
    this.toast.show(`${message} (vendég mód)`);
  }

  private bindQueryParams(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.state.mealSearch.set(params.get('q') ?? '');

        const type = params.get('mealType');
        if (type === 'all' || type === 'Reggeli' || type === 'Ebéd' || type === 'Vacsora' || type === 'Snack') {
          this.state.mealTypeFilter.set(type);
        }

        const sort = params.get('mealSort');
        if (sort === 'timeDesc' || sort === 'timeAsc' || sort === 'calDesc' || sort === 'calAsc') {
          this.state.mealSort.set(sort);
        }
      });
  }

  private syncUrlState(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.state.mealSearch() || null,
        mealType: this.state.mealTypeFilter() === 'all' ? null : this.state.mealTypeFilter(),
        mealSort: this.state.mealSort(),
      },
      queryParamsHandling: 'merge',
    });
  }

  private loadDailyData(successToast?: string): void {
    this.state.loadDailyData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (successToast) {
            this.toast.show(successToast);
          }
        },
      });
  }

  private resetMealForm(): void {
    this.editingMealId.set(null);
    this.mealForm.reset({
      name: '',
      mealType: 'Reggeli',
      when: '08:00',
      calories: 300,
      protein: 10,
      carbs: 30,
      fat: 8,
    });
    this.customMealImageDataUrl.set(null);
  }

  private resolveCustomMealImageUrl(): string {
    return this.customMealImageDataUrl() ?? HomePageComponent.FOOD_PLACEHOLDER_IMAGE;
  }

  private resetMealPresetForm(): void {
    this.mealPresetForm.reset({
      mealType: 'Reggeli',
      when: '08:00',
      grams: 100,
    });
    this.selectedFoodPresetId.set('');
    this.selectedMealPresetGrams.set(100);
  }

  private resetExerciseForm(): void {
    this.editingExerciseId.set(null);
    this.exerciseForm.reset({
      name: '',
      intensity: 'medium',
      durationMinutes: 30,
      caloriesBurned: 220,
    });
  }

  private resetExercisePresetForm(): void {
    this.exercisePresetForm.reset({
      durationMinutes: 30,
    });
    this.selectedExercisePresetId.set('');
    this.selectedExercisePresetDuration.set(30);
  }
}
