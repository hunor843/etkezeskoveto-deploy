import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EntityId, ExerciseType, FoodCatalogItem, MealEntry, ExerciseEntry } from '../models/entities';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getFoods() {
    return forkJoin({
      foods: this.getCollection<FoodCatalogItem>('foods'),
      foodPresets: this.getCollection<FoodCatalogItem>('foodPresets'),
    }).pipe(map((result) => this.deduplicateById([...result.foods, ...result.foodPresets])));
  }

  getExerciseTypes() {
    return forkJoin({
      exerciseTypes: this.getCollection<ExerciseType>('exerciseTypes'),
      exercisePresets: this.getCollection<ExerciseType>('exercisePresets'),
    }).pipe(map((result) => this.deduplicateById([...result.exerciseTypes, ...result.exercisePresets])));
  }

  ensureFoodPresetFromMeal(
    userId: EntityId,
    meal: Pick<MealEntry, 'name' | 'mealType' | 'calories' | 'protein' | 'carbs' | 'fat'> & {
      imageUrl?: string | null;
    },
  ) {
    return this.getFoods().pipe(
      switchMap((foods) => {
        const normalizedName = this.normalizeName(meal.name);
        const existing = foods.find((food) => this.normalizeName(food.name) === normalizedName);
        if (existing) {
          return of(existing);
        }

        const payload: Omit<FoodCatalogItem, 'id'> = {
          name: meal.name,
          category: meal.mealType,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          imageUrl: meal.imageUrl ?? null,
          defaultAmount: 100,
          defaultAmountUnit: 'g',
          createdByUserId: userId,
          userId,
        };
        return this.http.post<FoodCatalogItem>(`${this.baseUrl}/foods`, payload);
      }),
      catchError(() => of(null)),
    );
  }

  ensureExercisePresetFromEntry(
    userId: EntityId,
    exercise: Pick<ExerciseEntry, 'name' | 'intensity' | 'durationMinutes' | 'caloriesBurned'>,
  ) {
    return this.getExerciseTypes().pipe(
      switchMap((exerciseTypes) => {
        const normalizedName = this.normalizeName(exercise.name);
        const existing = exerciseTypes.find((item) => this.normalizeName(item.name) === normalizedName);
        if (existing) {
          return of(existing);
        }

        const duration = Math.max(1, exercise.durationMinutes);
        const caloriesPerHour = Math.round((exercise.caloriesBurned / duration) * 60);
        const payload: Omit<ExerciseType, 'id'> = {
          name: exercise.name,
          intensity: exercise.intensity,
          caloriesPerHour,
          createdByUserId: userId,
          userId,
          icon: '🏃',
        };
        return this.http.post<ExerciseType>(`${this.baseUrl}/exerciseTypes`, payload);
      }),
      catchError(() => of(null)),
    );
  }

  private getCollection<T>(collectionName: string) {
    return this.http.get<T[]>(`${this.baseUrl}/${collectionName}`).pipe(catchError(() => of([] as T[])));
  }

  private deduplicateById<T extends { id: EntityId }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const normalizedId = String(item.id);
      if (seen.has(normalizedId)) {
        return false;
      }
      seen.add(normalizedId);
      return true;
    });
  }

  private normalizeName(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('hu-HU');
  }
}
