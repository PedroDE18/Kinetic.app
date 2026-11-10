export interface BarcodeFoodItem {
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  barcode: string;
}

export interface BarcodeLookupResult {
  found: boolean;
  code: string;
  food?: BarcodeFoodItem;
  error?: string;
}

/**
 * Parses raw OpenFoodFacts JSON response into a normalized BarcodeFoodItem
 */
export function parseOpenFoodFactsProduct(data: any, code: string): BarcodeLookupResult {
  if (!data || data.status === 0 || !data.product) {
    return {
      found: false,
      code,
      error: data?.status_verbose || 'Product not found in OpenFoodFacts database',
    };
  }

  const p = data.product;
  const name = p.product_name || p.product_name_en || p.generic_name || 'Scanned Product';
  const brand = p.brands || p.brand_owner || undefined;

  const nutriments = p.nutriments || {};

  // Serving size resolution
  let servingSize = 100;
  let servingUnit = 'g';

  if (p.serving_quantity) {
    const qty = parseFloat(p.serving_quantity);
    if (!isNaN(qty) && qty > 0) {
      servingSize = qty;
    }
  } else if (p.serving_size && typeof p.serving_size === 'string') {
    const match = p.serving_size.match(/([\d.,]+)\s*([a-zA-Z]+)/);
    if (match) {
      const parsed = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        servingSize = parsed;
        servingUnit = match[2].toLowerCase();
      }
    }
  }

  // Determine if we use per-serving or per-100g
  // OpenFoodFacts provides energy-kcal_serving or energy-kcal_100g
  const hasServingCals = typeof nutriments['energy-kcal_serving'] === 'number';
  const has100gCals = typeof nutriments['energy-kcal_100g'] === 'number';

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber: number | undefined = undefined;

  if (hasServingCals && nutriments['energy-kcal_serving'] !== undefined) {
    calories = Math.round(Number(nutriments['energy-kcal_serving']) || 0);
    protein = Number((Number(nutriments.proteins_serving) || 0).toFixed(1));
    carbs = Number((Number(nutriments.carbohydrates_serving) || 0).toFixed(1));
    fat = Number((Number(nutriments.fat_serving) || 0).toFixed(1));
    if (nutriments.fiber_serving !== undefined) {
      fiber = Number((Number(nutriments.fiber_serving) || 0).toFixed(1));
    }
  } else if (has100gCals || typeof nutriments['energy-kcal'] === 'number') {
    const rawCals100 = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0);
    const rawP100 = Number(nutriments.proteins_100g ?? nutriments.proteins ?? 0);
    const rawC100 = Number(nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0);
    const rawF100 = Number(nutriments.fat_100g ?? nutriments.fat ?? 0);
    const rawFiber100 = nutriments.fiber_100g ?? nutriments.fiber;

    // If serving size is 100g, direct map, otherwise scale if servingSize differs
    const ratio = servingSize === 100 ? 1 : servingSize / 100;

    calories = Math.round(rawCals100 * ratio);
    protein = Number((rawP100 * ratio).toFixed(1));
    carbs = Number((rawC100 * ratio).toFixed(1));
    fat = Number((rawF100 * ratio).toFixed(1));
    if (rawFiber100 !== undefined && rawFiber100 !== null) {
      fiber = Number((Number(rawFiber100) * ratio).toFixed(1));
    }
  } else if (nutriments['energy_100g']) {
    // Energy in kJ converted to kcal (1 kcal = 4.184 kJ)
    const kcalFromKj = (Number(nutriments['energy_100g']) || 0) / 4.184;
    const ratio = servingSize / 100;
    calories = Math.round(kcalFromKj * ratio);
    protein = Number(((Number(nutriments.proteins_100g) || 0) * ratio).toFixed(1));
    carbs = Number(((Number(nutriments.carbohydrates_100g) || 0) * ratio).toFixed(1));
    fat = Number(((Number(nutriments.fat_100g) || 0) * ratio).toFixed(1));
  }

  return {
    found: true,
    code,
    food: {
      name: name.trim(),
      brand: brand?.trim() || undefined,
      servingSize,
      servingUnit,
      calories: Math.max(0, calories),
      protein: Math.max(0, protein),
      carbs: Math.max(0, carbs),
      fat: Math.max(0, fat),
      fiber: fiber !== undefined ? Math.max(0, fiber) : undefined,
      barcode: code,
    },
  };
}

/**
 * Queries OpenFoodFacts public REST API for free product lookup.
 * Zero API keys or subscriptions required.
 */
export async function lookupBarcodeOpenFoodFacts(
  barcode: string,
  fetchFn: typeof fetch = fetch
): Promise<BarcodeLookupResult> {
  const cleanCode = barcode.trim().replace(/\s+/g, '');
  if (!cleanCode || cleanCode.length < 5) {
    return {
      found: false,
      code: cleanCode,
      error: 'Please enter a valid barcode (minimum 5 digits).',
    };
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetchFn(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'KineticFitnessApp/3.0 (athletic-grade open source fitness)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        found: false,
        code: cleanCode,
        error: `Database responded with status ${response.status}`,
      };
    }

    const json = await response.json();
    return parseOpenFoodFactsProduct(json, cleanCode);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        found: false,
        code: cleanCode,
        error: 'Network request timed out. Please check your connection.',
      };
    }
    return {
      found: false,
      code: cleanCode,
      error: err?.message || 'Failed to query barcode database.',
    };
  }
}

/**
 * Searches OpenFoodFacts public REST API by free-text keywords.
 * Zero API keys or subscriptions required ($0 cost guarantee).
 */
export async function searchFoodsOpenFoodFacts(
  query: string,
  limit: number = 8,
  fetchFn: typeof fetch = fetch
): Promise<BarcodeFoodItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  const url = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(
    cleanQuery
  )}&search_simple=1&action=process&json=1&page_size=${Math.min(limit, 20)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetchFn(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EunoiaFitnessApp/3.0 (athletic-grade open source fitness)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.products)) {
      return [];
    }

    const items: BarcodeFoodItem[] = [];
    for (const p of data.products) {
      const code = p.code || p._id || `off-${Math.random().toString(36).substring(2, 9)}`;
      const parsed = parseOpenFoodFactsProduct({ status: 1, product: p }, code);
      if (parsed.found && parsed.food && parsed.food.name && (parsed.food.calories > 0 || parsed.food.protein > 0)) {
        items.push(parsed.food);
      }
      if (items.length >= limit) break;
    }

    return items;
  } catch {
    return [];
  }
}
