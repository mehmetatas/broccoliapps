import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { getAvailablePurchases, initConnection, requestPurchase } from "react-native-iap";
import { COURSE_PRODUCT_ID } from "../data/course-data";

const STORAGE_KEY = "serophin:purchase";

type PurchaseState = {
  hasCourseAccess: boolean;
  purchasedAt?: number;
  platform?: "ios" | "android";
};

export const usePurchase = () => {
  const [purchase, setPurchase] = useState<PurchaseState>({ hasCourseAccess: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPurchase(JSON.parse(raw) as PurchaseState);
      }
    } catch (err) {
      console.error("[purchase] Failed to load:", err);
      setError("Failed to load purchase status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const restore = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await initConnection();
      const purchases = await getAvailablePurchases();
      const hasCourse = purchases.some((p) => p.productId === COURSE_PRODUCT_ID);

      const state: PurchaseState = {
        hasCourseAccess: hasCourse,
        purchasedAt: hasCourse ? Date.now() : undefined,
        platform: Platform.OS as "ios" | "android",
      };

      setPurchase(state);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("[purchase] Failed to restore:", err);
      setError("Failed to restore purchases");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const buy = useCallback(async () => {
    try {
      setIsPurchasing(true);
      setError(null);
      await initConnection();
      await requestPurchase({ sku: COURSE_PRODUCT_ID });
      // After successful purchase, restore to confirm
      await restore();
    } catch (err) {
      console.error("[purchase] Purchase failed:", err);
      setError("Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  }, [restore]);

  const refresh = useCallback(() => {
    restore();
  }, [restore]);

  return {
    purchase,
    hasCourseAccess: purchase.hasCourseAccess,
    isLoading,
    isPurchasing,
    error,
    buy,
    restore,
    refresh,
  };
};
