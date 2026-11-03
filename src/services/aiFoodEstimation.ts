import { GoogleGenAI, Type } from '@google/genai';
import { ParsedAiFoodItem } from '../types';

export interface AiEstimationResult {
  items: ParsedAiFoodItem[];
  source: 'model' | 'offline';
  error?: string;
}

/**
 * Sanitize and enforce realistic bounds on individual AI/parsed food items.
 */
export function sanitizeAiFoodItem(
  raw: Partial<ParsedAiFoodItem>,
  index: number
): ParsedAiFoodItem {
  const sanitizeNum = (v: unknown, fallback: number, min = 0, max = 5000): number => {
    let num: number;
    if (typeof v === 'number' && Number.isFinite(v)) {
      num = v;
    } else {
      const parsed = parseFloat(String(v ?? ''));
      num = Number.isFinite(parsed) ? parsed : fallback;
    }
    if (num <= 0 && fallback > 0 && min > 0) {
      return fallback;
    }
    return Math.min(max, Math.max(min, num));
  };

  const name = typeof raw.name === 'string' && raw.name.trim().length > 0
    ? raw.name.trim()
    : `Food Item ${index + 1}`;

  const servingCount = sanitizeNum(raw.servingCount, 1, 0.1, 50);
  const servingSize = sanitizeNum(raw.servingSize, 100, 0.1, 5000);
  const servingUnit = typeof raw.servingUnit === 'string' && raw.servingUnit.trim().length > 0
    ? raw.servingUnit.trim()
    : 'portion';

  const calories = Math.round(sanitizeNum(raw.calories, 150, 0, 10000));
  const protein = Number(sanitizeNum(raw.protein, 5, 0, 1000).toFixed(1));
  const carbs = Number(sanitizeNum(raw.carbs, 15, 0, 1000).toFixed(1));
  const fat = Number(sanitizeNum(raw.fat, 3, 0, 1000).toFixed(1));

  return {
    id: raw.id || `ai-part-${Date.now()}-${index}`,
    name,
    servingCount,
    servingSize,
    servingUnit,
    calories,
    protein,
    carbs,
    fat,
  };
}

/**
 * Deterministic offline rule-based heuristic estimator.
 * Runs 100% locally with zero cost, zero subscriptions, and zero network dependency.
 */
export function estimateMealOffline(prompt: string): ParsedAiFoodItem[] {
  const text = (prompt || '').toLowerCase().trim();
  if (!text) return [];

  const parts: ParsedAiFoodItem[] = [];

  // Match optional count prefix like "2 eggs", "3 slices", "200g"
  const extractCount = (regex: RegExp, fallback = 1): number => {
    const match = text.match(regex);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(',', '.'));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return fallback;
  };

  // Eggs
  if (text.includes('egg') || text.includes('omelet') || text.includes('ovo') || text.includes('ovos') || text.includes('omelete')) {
    const count = extractCount(/(\d+)\s*(?:large\s*)?(?:egg|ovo)/i, 2);
    parts.push(
      sanitizeAiFoodItem(
        {
          name: count === 1 ? 'Ovo Cozido / Egg' : `${count} Ovos / Whole Eggs`,
          servingCount: 1,
          servingSize: count * 50,
          servingUnit: count === 1 ? 'ovo (50g)' : `ovos (${count * 50}g)`,
          calories: Math.round(count * 72),
          protein: Number((count * 6.3).toFixed(1)),
          carbs: Number((count * 0.4).toFixed(1)),
          fat: Number((count * 4.9).toFixed(1)),
        },
        parts.length
      )
    );
  }

  // Greek Yogurt / Skyr
  if (text.includes('yogurt') || text.includes('skyr') || text.includes('quark')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Greek Yogurt 0% (Plain)',
          servingCount: 1,
          servingSize: 200,
          servingUnit: 'g',
          calories: 110,
          protein: 20.6,
          carbs: 6.0,
          fat: 0.4,
        },
        parts.length
      )
    );
  }

  // Toast / Bread / Sourdough / Bagel
  if (text.includes('toast') || text.includes('bread') || text.includes('sourdough') || text.includes('bagel')) {
    const isBagel = text.includes('bagel');
    const slices = isBagel ? 1 : extractCount(/(\d+)\s*(?:slice|slices|piece|pieces)/i, 1);
    parts.push(
      sanitizeAiFoodItem(
        {
          name: isBagel ? 'Plain Bagel' : slices > 1 ? `${slices} Slices Toast` : 'Whole Wheat Toast',
          servingCount: 1,
          servingSize: isBagel ? 95 : slices * 40,
          servingUnit: isBagel ? 'bagel (95g)' : `${slices} slice(s)`,
          calories: isBagel ? 260 : slices * 100,
          protein: isBagel ? 9.5 : slices * 4.0,
          carbs: isBagel ? 51.0 : slices * 18.5,
          fat: isBagel ? 1.5 : slices * 1.2,
        },
        parts.length
      )
    );
  }

  // Banana
  if (text.includes('banana')) {
    const count = extractCount(/(\d+)\s*banana/i, 1);
    parts.push(
      sanitizeAiFoodItem(
        {
          name: count > 1 ? `${count} Bananas` : 'Fresh Banana',
          servingCount: 1,
          servingSize: count * 118,
          servingUnit: count === 1 ? 'medium (118g)' : `${count} medium`,
          calories: Math.round(count * 105),
          protein: Number((count * 1.3).toFixed(1)),
          carbs: Number((count * 27.0).toFixed(1)),
          fat: Number((count * 0.3).toFixed(1)),
        },
        parts.length
      )
    );
  }

  // Berries
  if (text.includes('berr') || text.includes('blueberry') || text.includes('strawberry')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Mixed Fresh Berries',
          servingCount: 1,
          servingSize: 100,
          servingUnit: 'g',
          calories: 57,
          protein: 0.7,
          carbs: 14.5,
          fat: 0.3,
        },
        parts.length
      )
    );
  }

  // Seeds / Nuts / Peanut Butter
  if (text.includes('peanut butter') || text.includes('almond butter')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Natural Peanut Butter',
          servingCount: 1,
          servingSize: 32,
          servingUnit: 'g (2 tbsp)',
          calories: 190,
          protein: 8.0,
          carbs: 7.0,
          fat: 16.0,
        },
        parts.length
      )
    );
  } else if (text.includes('seed') || text.includes('chia') || text.includes('flax')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Chia & Flax Seed Mix',
          servingCount: 1,
          servingSize: 20,
          servingUnit: 'g (2 tbsp)',
          calories: 105,
          protein: 4.2,
          carbs: 4.8,
          fat: 7.2,
        },
        parts.length
      )
    );
  } else if (text.includes('nut') || text.includes('almond') || text.includes('walnut')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Raw Mixed Nuts',
          servingCount: 1,
          servingSize: 30,
          servingUnit: 'g',
          calories: 180,
          protein: 6.0,
          carbs: 5.5,
          fat: 16.0,
        },
        parts.length
      )
    );
  }

  // Avocado
  if (text.includes('avocado')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Fresh Avocado',
          servingCount: 1,
          servingSize: 75,
          servingUnit: 'half fruit (75g)',
          calories: 120,
          protein: 1.5,
          carbs: 6.5,
          fat: 11.0,
        },
        parts.length
      )
    );
  }

  // Chicken / Turkey / Poultry / Frango
  if (text.includes('chicken') || text.includes('turkey') || text.includes('poultry') || text.includes('breast') || text.includes('frango')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: text.includes('frango') ? 'Filé de Frango Grelhado (Chicken Breast)' : 'Grilled Chicken Breast',
          servingCount: 1,
          servingSize: 150,
          servingUnit: 'g',
          calories: 248,
          protein: 46.5,
          carbs: 0,
          fat: 5.4,
        },
        parts.length
      )
    );
  }

  // Beef / Steak / Picanha / Bife Acebolado / Carne Moída
  if (text.includes('beef') || text.includes('steak') || text.includes('ground beef') || text.includes('burger') || text.includes('bife') || text.includes('carne') || text.includes('picanha') || text.includes('alcatra')) {
    const isPicanha = text.includes('picanha');
    const isAcebolado = text.includes('acebolado');
    parts.push(
      sanitizeAiFoodItem(
        {
          name: isPicanha ? 'Picanha Bovina Grelhada' : isAcebolado ? 'Bife Acebolado' : 'Bife de Carne Bovina (Alcatra)',
          servingCount: 1,
          servingSize: 120,
          servingUnit: 'g',
          calories: isPicanha ? 285 : isAcebolado ? 225 : 228,
          protein: isPicanha ? 32.0 : 36.0,
          carbs: isAcebolado ? 2.4 : 0,
          fat: isPicanha ? 17.0 : 8.4,
        },
        parts.length
      )
    );
  }

  // Brazilian Feijão (Carioca / Preto) / Beans
  if (text.includes('feijao') || text.includes('feijão') || text.includes('beans')) {
    const isPreto = text.includes('preto');
    parts.push(
      sanitizeAiFoodItem(
        {
          name: isPreto ? 'Feijão Preto Cozido' : 'Feijão Carioca Cozido',
          servingCount: 1,
          servingSize: 100,
          servingUnit: 'concha (100g)',
          calories: 76,
          protein: 4.8,
          carbs: 13.6,
          fat: 0.5,
        },
        parts.length
      )
    );
  }

  // Feijoada
  if (text.includes('feijoada')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Feijoada Completa Tradicional',
          servingCount: 1,
          servingSize: 250,
          servingUnit: 'concha (250g)',
          calories: 342,
          protein: 24.5,
          carbs: 19.8,
          fat: 18.2,
        },
        parts.length
      )
    );
  }

  // Tapioca
  if (text.includes('tapioca')) {
    const hasCoalho = text.includes('coalho') || text.includes('queijo');
    parts.push(
      sanitizeAiFoodItem(
        {
          name: hasCoalho ? 'Tapioca com Queijo Coalho' : 'Tapioca Simples (Goma)',
          servingCount: 1,
          servingSize: hasCoalho ? 100 : 60,
          servingUnit: 'disco',
          calories: hasCoalho ? 265 : 140,
          protein: hasCoalho ? 9.8 : 0.2,
          carbs: 34.0,
          fat: hasCoalho ? 10.4 : 0.1,
        },
        parts.length
      )
    );
  }

  // Pão de Queijo
  if (text.includes('pao de queijo') || text.includes('pão de queijo')) {
    const count = extractCount(/(\d+)\s*p[aã]o\s*(?:de\s*)?queijo/i, 2);
    parts.push(
      sanitizeAiFoodItem(
        {
          name: count === 1 ? 'Pão de Queijo Mineiro' : `${count} Pães de Queijo Mineiros`,
          servingCount: 1,
          servingSize: count * 40,
          servingUnit: `${count} unidades (${count * 40}g)`,
          calories: count * 110,
          protein: Number((count * 2.6).toFixed(1)),
          carbs: Number((count * 14.8).toFixed(1)),
          fat: Number((count * 4.6).toFixed(1)),
        },
        parts.length
      )
    );
  }

  // Pão Francês / Cacetinho / Pão na Chapa
  if (text.includes('pao frances') || text.includes('pão francês') || text.includes('cacetinho') || text.includes('pao na chapa') || text.includes('pão na chapa')) {
    const isChapa = text.includes('chapa') || text.includes('manteiga');
    parts.push(
      sanitizeAiFoodItem(
        {
          name: isChapa ? 'Pão Francês na Chapa com Manteiga' : 'Pão Francês Tradicional',
          servingCount: 1,
          servingSize: isChapa ? 60 : 50,
          servingUnit: 'unidade (50g)',
          calories: isChapa ? 225 : 150,
          protein: 4.5,
          carbs: 29.3,
          fat: isChapa ? 10.2 : 1.5,
        },
        parts.length
      )
    );
  }

  // Açaí
  if (text.includes('acai') || text.includes('açaí')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Açaí na Tigela com Banana e Granola',
          servingCount: 1,
          servingSize: 200,
          servingUnit: 'tigela (200g)',
          calories: 295,
          protein: 5.4,
          carbs: 54.0,
          fat: 7.2,
        },
        parts.length
      )
    );
  }

  // Farofa
  if (text.includes('farofa')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Farofa de Mandioca Tradicional',
          servingCount: 1,
          servingSize: 30,
          servingUnit: '2 colheres (30g)',
          calories: 122,
          protein: 0.8,
          carbs: 22.5,
          fat: 3.4,
        },
        parts.length
      )
    );
  }

  // Cuscuz Nordestino
  if (text.includes('cuscuz')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Cuscuz Nordestino com Manteiga',
          servingCount: 1,
          servingSize: 100,
          servingUnit: 'fatia (100g)',
          calories: 162,
          protein: 3.2,
          carbs: 28.5,
          fat: 4.2,
        },
        parts.length
      )
    );
  }

  // Mandioca / Aipim / Macaxeira
  if (text.includes('mandioca') || text.includes('aipim') || text.includes('macaxeira')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Mandioca / Aipim Cozido',
          servingCount: 1,
          servingSize: 100,
          servingUnit: 'g (2 pedaços)',
          calories: 125,
          protein: 0.6,
          carbs: 30.1,
          fat: 0.3,
        },
        parts.length
      )
    );
  }

  // Café com leite / Pingado
  if (text.includes('cafe com leite') || text.includes('café com leite') || text.includes('pingado')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Café com Leite (Pingado)',
          servingCount: 1,
          servingSize: 150,
          servingUnit: 'copo americano (150ml)',
          calories: 65,
          protein: 4.2,
          carbs: 6.5,
          fat: 2.4,
        },
        parts.length
      )
    );
  }

  // Salmon / Tuna / Fish / Peixe
  if (text.includes('salmon') || text.includes('tuna') || text.includes('fish') || text.includes('peixe') || text.includes('tilapia') || text.includes('tilápia')) {
    const isSalmon = text.includes('salmon');
    parts.push(
      sanitizeAiFoodItem(
        {
          name: isSalmon ? 'Atlantic Salmon Fillet' : 'Filé de Peixe Grelhado',
          servingCount: 1,
          servingSize: 140,
          servingUnit: 'g',
          calories: isSalmon ? 280 : 130,
          protein: isSalmon ? 34.0 : 29.0,
          carbs: 0,
          fat: isSalmon ? 16.0 : 1.0,
        },
        parts.length
      )
    );
  }

  // Rice / Potato / Oats / Pasta / Arroz
  if (text.includes('rice') || text.includes('arroz')) {
    const isBrown = text.includes('brown') || text.includes('integral');
    parts.push(
      sanitizeAiFoodItem(
        {
          name: isBrown ? 'Brown Rice (Arroz Integral)' : 'Cooked White Rice (Arroz Branco)',
          servingCount: 1,
          servingSize: 120,
          servingUnit: 'g (4 colheres de sopa)',
          calories: isBrown ? 149 : 154,
          protein: isBrown ? 3.1 : 3.0,
          carbs: isBrown ? 31.0 : 33.7,
          fat: isBrown ? 1.2 : 0.3,
        },
        parts.length
      )
    );
  } else if (text.includes('oat') || text.includes('oatmeal') || text.includes('porridge') || text.includes('aveia')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Rolled Oats (Dry measure)',
          servingCount: 1,
          servingSize: 50,
          servingUnit: 'g (1/2 cup)',
          calories: 190,
          protein: 6.5,
          carbs: 34.0,
          fat: 3.2,
        },
        parts.length
      )
    );
  } else if (text.includes('potato') || text.includes('sweet potato')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Baked Potato with skin',
          servingCount: 1,
          servingSize: 200,
          servingUnit: 'medium (200g)',
          calories: 186,
          protein: 4.3,
          carbs: 42.0,
          fat: 0.2,
        },
        parts.length
      )
    );
  } else if (text.includes('pasta') || text.includes('spaghetti')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Cooked Pasta',
          servingCount: 1,
          servingSize: 160,
          servingUnit: 'g (1 cup cooked)',
          calories: 220,
          protein: 8.0,
          carbs: 43.0,
          fat: 1.3,
        },
        parts.length
      )
    );
  }

  // Protein Shake / Whey
  if (text.includes('whey') || text.includes('protein shake') || text.includes('protein powder')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Whey Protein Isolate',
          servingCount: 1,
          servingSize: 30,
          servingUnit: 'scoop (30g)',
          calories: 120,
          protein: 25.0,
          carbs: 2.0,
          fat: 1.0,
        },
        parts.length
      )
    );
  }

  // Milk / Coffee
  if (text.includes('milk') || text.includes('latte')) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: 'Whole Milk',
          servingCount: 1,
          servingSize: 240,
          servingUnit: 'ml (1 cup)',
          calories: 150,
          protein: 8.0,
          carbs: 12.0,
          fat: 8.0,
        },
        parts.length
      )
    );
  }

  // If no recognized foods matched, fallback to a single custom estimate for the entire input
  if (parts.length === 0) {
    parts.push(
      sanitizeAiFoodItem(
        {
          name: prompt.trim().slice(0, 60),
          servingCount: 1,
          servingSize: 1,
          servingUnit: 'portion',
          calories: 450,
          protein: 25.0,
          carbs: 45.0,
          fat: 15.0,
        },
        0
      )
    );
  }

  return parts;
}

/**
 * Main meal estimation entry point.
 * Prioritizes Gemini 2.5 Flash if an API key is available (Google AI Studio Free Tier).
 * Automatically and gracefully falls back to the deterministic offline heuristic parser.
 *
 * GUARANTEE: NEVER incurs any paid cost. Uses the free-tier Gemini API or pure offline computation.
 */
export async function estimateMealWithAi(
  prompt: string,
  apiKeyOverride?: string
): Promise<AiEstimationResult> {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    return { items: [], source: 'offline' };
  }

  const apiKey =
    (apiKeyOverride && apiKeyOverride.trim()) ||
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_GEMINI_API_KEY &&
      import.meta.env.VITE_GEMINI_API_KEY.trim()) ||
    '';

  // If no API key configured, use free offline parser immediately
  if (!apiKey) {
    return {
      items: estimateMealOffline(cleanPrompt),
      source: 'offline',
    };
  }

  // API key present: Call Gemini 2.5 Flash Free Tier
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Estimate the itemized food breakdown and realistic nutritional content for this meal or food description:\n"${cleanPrompt}"`,
      config: {
        systemInstruction:
          'You are an athletic nutrition database estimator with native expertise in both international and Brazilian cultural foods (arroz, feijão carioca/preto, bife acebolado, picanha, mandioca, farofa, tapioca, pão de queijo, açaí, cuscuz nordestino, feijoada, etc., and Brazilian culinary portions like colheres de sopa, concha, escumadeira, gramas, fatias). Given a meal or food description in English or Brazilian Portuguese, break it down into realistic individual ingredients with serving sizes and macronutrient estimations based on TACO (Tabela Brasileira de Composição de Alimentos) and USDA standards. Be physiologically accurate (1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal). Do not hallucinate negative numbers or absurd values.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'List of individual food components in the meal',
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Descriptive name of the ingredient or food item' },
              servingCount: { type: Type.NUMBER, description: 'Number of servings, typically 1 or 1.5' },
              servingSize: { type: Type.NUMBER, description: 'Numerical portion size' },
              servingUnit: { type: Type.STRING, description: 'Unit of measure, e.g. g, ml, slice, medium' },
              calories: { type: Type.NUMBER, description: 'Total calories in kcal' },
              protein: { type: Type.NUMBER, description: 'Protein in grams' },
              carbs: { type: Type.NUMBER, description: 'Carbohydrates in grams' },
              fat: { type: Type.NUMBER, description: 'Fat in grams' },
            },
            required: ['name', 'servingCount', 'servingSize', 'servingUnit', 'calories', 'protein', 'carbs', 'fat'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from model');
    }

    const parsedArray = JSON.parse(text);
    if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
      throw new Error('Model did not return a valid list of food items');
    }

    const sanitizedItems: ParsedAiFoodItem[] = parsedArray.map((raw, idx) =>
      sanitizeAiFoodItem(raw, idx)
    );

    return {
      items: sanitizedItems,
      source: 'model',
    };
  } catch (err: any) {
    // Graceful offline fallback on any error (network offline, quota exhausted, invalid key)
    const offlineItems = estimateMealOffline(cleanPrompt);
    return {
      items: offlineItems,
      source: 'offline',
      error: err?.message || 'AI request failed; fell back to offline engine',
    };
  }
}
