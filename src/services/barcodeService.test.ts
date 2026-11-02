import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseOpenFoodFactsProduct, lookupBarcodeOpenFoodFacts } from './barcodeService';

describe('barcodeService - OpenFoodFacts Parsing & Lookup', () => {
  it('correctly handles not-found status', () => {
    const raw = {
      status: 0,
      status_verbose: 'product not found',
    };
    const res = parseOpenFoodFactsProduct(raw, '000000000000');
    assert.equal(res.found, false);
    assert.equal(res.code, '000000000000');
    assert.ok(res.error?.includes('not found'));
  });

  it('correctly parses product with 100g values and scales to serving size', () => {
    const raw = {
      status: 1,
      product: {
        product_name: 'Rolled Oats',
        brands: 'Quaker',
        serving_size: '40 g',
        nutriments: {
          'energy-kcal_100g': 375,
          proteins_100g: 12.5,
          carbohydrates_100g: 65,
          fat_100g: 7,
          fiber_100g: 10,
        },
      },
    };

    const res = parseOpenFoodFactsProduct(raw, '12345678');
    assert.equal(res.found, true);
    assert.ok(res.food);
    assert.equal(res.food.name, 'Rolled Oats');
    assert.equal(res.food.brand, 'Quaker');
    assert.equal(res.food.servingSize, 40);
    assert.equal(res.food.servingUnit, 'g');
    // 375 * 0.4 = 150 kcal
    assert.equal(res.food.calories, 150);
    // 12.5 * 0.4 = 5g protein
    assert.equal(res.food.protein, 5);
    // 65 * 0.4 = 26g carbs
    assert.equal(res.food.carbs, 26);
    // 7 * 0.4 = 2.8g fat
    assert.equal(res.food.fat, 2.8);
    // 10 * 0.4 = 4g fiber
    assert.equal(res.food.fiber, 4);
  });

  it('prefers serving-based nutrition if provided', () => {
    const raw = {
      status: 1,
      product: {
        product_name: 'Protein Bar',
        brands: 'Quest',
        serving_quantity: 60,
        serving_size: '60g',
        nutriments: {
          'energy-kcal_serving': 200,
          proteins_serving: 21,
          carbohydrates_serving: 22,
          fat_serving: 7,
          fiber_serving: 14,
        },
      },
    };

    const res = parseOpenFoodFactsProduct(raw, '99999999');
    assert.equal(res.found, true);
    assert.ok(res.food);
    assert.equal(res.food.name, 'Protein Bar');
    assert.equal(res.food.calories, 200);
    assert.equal(res.food.protein, 21);
    assert.equal(res.food.carbs, 22);
    assert.equal(res.food.fat, 7);
    assert.equal(res.food.fiber, 14);
  });

  it('lookupBarcodeOpenFoodFacts rejects invalid short barcodes early without fetch', async () => {
    const res = await lookupBarcodeOpenFoodFacts('123');
    assert.equal(res.found, false);
    assert.ok(res.error?.includes('valid barcode'));
  });

  it('lookupBarcodeOpenFoodFacts uses custom fetch function and succeeds', async () => {
    const mockFetch = async () =>
      ({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: 'Whey Isolate',
            brands: 'Dymatize',
            serving_size: '30 g',
            nutriments: {
              'energy-kcal_100g': 366.7,
              proteins_100g: 83.3,
              carbohydrates_100g: 3.3,
              fat_100g: 1.7,
            },
          },
        }),
      } as any);

    const res = await lookupBarcodeOpenFoodFacts('748927028645', mockFetch);
    assert.equal(res.found, true);
    assert.equal(res.food?.name, 'Whey Isolate');
    assert.equal(res.food?.brand, 'Dymatize');
    assert.equal(res.food?.servingSize, 30);
    assert.equal(res.food?.calories, 110);
    assert.equal(res.food?.protein, 25);
  });
});
