import axios from 'axios';
import * as cheerio from 'cheerio';

import { MENU_URL, META } from '../config.js';
import { generateId } from '../utils/generateId.js';
import { translateFood } from '../utils/translateFood.js';

export async function fetchAndParseMenu() {
    const response = await axios.get(MENU_URL);
    const $ = cheerio.load(response.data);

    const foods = new Map();
    const menus = [];

    let currentDate = null;
    let currentItems = [];

    $('h5, h6').each((_, element) => {
        const $el = $(element);
        const tagName = element.tagName.toLowerCase();
        const text = $el.text().replace(/\s+/g, ' ').trim();

        if (tagName === 'h5') {
            const dateMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})/);

            if (dateMatch) {
                if (currentDate && currentItems.length > 0) {
                    menus.push({ date: currentDate, items: [...currentItems] });
                }

                const [, day, month, year] = dateMatch;
                currentDate = `${year}-${month}-${day}`;
                currentItems = [];
                return;
            }

            if (text && !text.match(/^\d/) && text !== 'YEMEKHANE' && text !== 'MENÜ') {
                const foodName = text.replace(/\*+/g, '').trim();
                const id = generateId(foodName);

                if (!foods.has(id)) {
                    const translation = translateFood(foodName);
                    foods.set(id, {
                        id,
                        name: {
                            tr: foodName,
                            ru: translation.ru,
                            en: translation.en
                        },
                        caloriesKcal: 0
                    });
                }

                currentItems.push(id);
            }
        }

        if (tagName === 'h6') {
            const calorieMatch = text.match(/Kalori:\s*(\d+)/i);

            if (calorieMatch && currentItems.length > 0) {
                const calories = parseInt(calorieMatch[1], 10);
                const lastItemId = currentItems[currentItems.length - 1];
                const food = foods.get(lastItemId);

                if (food && food.caloriesKcal === 0) {
                    food.caloriesKcal = calories;
                }
            }
        }
    });

    if (currentDate && currentItems.length > 0) {
        menus.push({ date: currentDate, items: [...currentItems] });
    }

    return {
        foods: Array.from(foods.values()),
        menus,
        meta: {
            ...META,
            lastUpdated: new Date().toISOString()
        }
    };
}
