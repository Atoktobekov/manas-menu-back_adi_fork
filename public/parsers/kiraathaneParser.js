import axios from 'axios';
import * as cheerio from 'cheerio';

import {KIRAATHANE_URL} from '../config.js';
import { generateId } from '../utils/generateId.js';
import {categoryTranslations} from "../utils/translateFood.js";


export async function fetchAndParseKiraathane() {
    const response = await axios.get(KIRAATHANE_URL);
    const $ = cheerio.load(response.data);

    const categories = [];
    let currentCategory = null;

    // Parse the page content - h4 for categories, h5 for items, h6 for prices
    $('h4, h5, h6').each((_, element) => {
        const $el = $(element);
        const tagName = element.tagName.toLowerCase();
        const text = $el.text().trim();

        if (tagName === 'h4') {
            // Category header
            const categoryName = text.trim().toLocaleUpperCase('tr-TR');
            const translation = categoryTranslations[categoryName];

            if (translation) {
                currentCategory = {
                    id: translation.id,
                    title: translation.title,
                    items: []
                };
                categories.push(currentCategory);
            } else if (categoryName && categoryName !== 'KIRAATHANEMİZ' && !categoryName.includes('MENÜ')) {
                // Unknown category - use generated id
                currentCategory = {
                    id: generateId(categoryName),
                    title: categoryName,
                    items: []
                };
                categories.push(currentCategory);
            }
        } else if (tagName === 'h5' && currentCategory) {
            // Item name
            const itemName = text.toUpperCase();
            if (itemName && !itemName.includes('FİYATI')) {
                currentCategory.items.push({
                    id: generateId(itemName),
                    name: itemName,
                    price: 0 // Will be updated from h6
                });
            }
        } else if (tagName === 'h6' && currentCategory && currentCategory.items.length > 0) {
            // Price - extract number
            const priceMatch = text.match(/(\d+)/);
            if (priceMatch) {
                const lastItem = currentCategory.items[currentCategory.items.length - 1];
                if (lastItem.price === 0) {
                    lastItem.price = parseInt(priceMatch[1], 10);
                }
            }
        }
    });

    // Filter out empty categories
    const filteredCategories = categories.filter(cat => cat.items.length > 0);

    return {
        categories: filteredCategories,
        meta: {
            timezone: 'Asia/Bishkek',
            currency: 'KGS',
            lastUpdated: new Date().toISOString()
        }
    };
}