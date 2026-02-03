import { Category } from "../types/category";
import { getStorage } from "./mmkv";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const CATEGORIES_KEY = "categories";

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { label: "Debt", icon: "CreditCard" },
  { label: "Saving", icon: "PiggyBank" },
  { label: "Housing", icon: "Home" },
  { label: "Utilities", icon: "Zap" },
  { label: "Groceries", icon: "ShoppingCart" },
  { label: "Transportation", icon: "Car" },
  { label: "Eat Out", icon: "Utensils" },
  { label: "Entertainment", icon: "Tv" },
  { label: "Holiday", icon: "Plane" },
  { label: "Health", icon: "Heart" },
  { label: "Personal Care", icon: "Sparkles" },
  { label: "Gift & Donation", icon: "Gift" },
];

export function initializeCategories(): void {
  const storage = getStorage();
  const existing = storage.getString(CATEGORIES_KEY);
  if (!existing) {
    const categories: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
      id: generateId(),
      ...cat,
    }));
    storage.set(CATEGORIES_KEY, JSON.stringify(categories));
  }
}

export function getCategories(): Category[] {
  const storage = getStorage();
  const data = storage.getString(CATEGORIES_KEY);
  if (!data) {
    return [];
  }
  return JSON.parse(data) as Category[];
}

export function saveCategories(categories: Category[]): void {
  const storage = getStorage();
  storage.set(CATEGORIES_KEY, JSON.stringify(categories));
}
