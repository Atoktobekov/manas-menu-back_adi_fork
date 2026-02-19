import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3020;

const MENU_URL = 'https://beslenme.manas.edu.kg/menu';
const KIRAATHANE_URL = 'https://beslenme.manas.edu.kg/1';

// Category translations for kiraathane
const categoryTranslations = {
  'SICAK İÇECEK': {id: 'hot_drinks', title: 'Горячие напитки'},
  'PİZZA VE PİDELER': {id: 'pizza_and_pide', title: 'Пицца и пиде'},
  'UNLU MAMÜLLER': {id: 'flour_products', title: 'Мучные изделия'},
  'KAHVALTILIKAR': {id: 'breakfast', title: 'Завтраки'},
  'KAHVALTILIKLAR': {id: 'breakfast', title: 'Завтраки'},
  'SALATALAR': {id: 'salads', title: 'Салаты'},
  'TATLILAR': {id: 'desserts', title: 'Десерты'},
  'KÖFTE VE DÖNERLER': {id: 'meatballs_and_doner', title: 'Котлеты и донеры'},
  'SOĞUK İÇECEKLER': {id: 'cold_drinks', title: 'Холодные напитки'},
  'YOĞURTLAR': {id: 'yogurts', title: 'Йогурты'}
};

// Simple translation mapping for common food terms
const translations = {
  // Soups
  'Çorba': {ru: 'Суп', en: 'Soup'},
  'Arpa Şehriye Çorbası': {ru: 'Суп с ячменной лапшой', en: 'Barley Vermicelli Soup'},
  'Yayla Çorbası': { ru: 'Суп Яйла', en: 'Yayla Soup' },
  'Ezogelin Çorbası': { ru: 'Суп Эзогелин', en: 'Ezogelin Soup' },
  'Mercimek Çorbası': { ru: 'Чечевичный суп', en: 'Lentil Soup' },
  'Tarhana Çorbası': { ru: 'Суп Тархана', en: 'Tarhana Soup' },
  'Domates Çorbası': { ru: 'Томатный суп', en: 'Tomato Soup' },
  'Şehriye Çorbası': { ru: 'Суп с вермишелью', en: 'Vermicelli Soup' },
  'Tavuk Suyu Çorbası': { ru: 'Куриный бульон', en: 'Chicken Broth Soup' },
  'Sebze Çorbası': { ru: 'Овощной суп', en: 'Vegetable Soup' },
  'Tel Şehriyeli Yeşil Mercimek Çorbası': { ru: 'Суп из зеленой чечевицы с вермишелью', en: 'Green Lentil Soup with Vermicelli' },
  'Tutmaç Çorbası': { ru: 'Суп Тутмач', en: 'Tutmac Soup' },
  'Elvan Çorbası': { ru: 'Суп Эльван', en: 'Elvan Soup' },
  'Un Çorbası': { ru: 'Мучной суп', en: 'Flour Soup' },
  'Erişte Çorbası': { ru: 'Суп с лапшой', en: 'Noodle Soup' },
  'Toyga Çorbası': { ru: 'Суп Тойга', en: 'Toyga Soup' },

  // Main dishes
  'Et Haşlama': { ru: 'Отварное мясо', en: 'Boiled Meat' },
  'Et Sote': { ru: 'Мясное соте', en: 'Meat Sauté' },
  'Tavuk Sote': { ru: 'Куриное соте', en: 'Chicken Sauté' },
  'Elbasan Tava': { ru: 'Эльбасан тава', en: 'Elbasan Tava' },
  'Izgara Tavuk': { ru: 'Курица гриль', en: 'Grilled Chicken' },
  'Kadınbudu Köfte': { ru: 'Котлеты Кадынбуду', en: 'Kadinbudu Meatballs' },
  'İzmir Köfte': { ru: 'Измирские котлеты', en: 'Izmir Meatballs' },
  'Köfte': { ru: 'Котлеты', en: 'Meatballs' },
  'Tavuk Şnitzel': { ru: 'Куриный шницель', en: 'Chicken Schnitzel' },
  'Fırın Tavuk': { ru: 'Запеченная курица', en: 'Baked Chicken' },
  'Kuru Fasulye': { ru: 'Фасоль', en: 'White Beans' },
  'Etli Kuru Fasulye': { ru: 'Фасоль с мясом', en: 'White Beans with Meat' },
  'Mevsim Türlüsü': { ru: 'Овощное рагу (сезонное)', en: 'Seasonal Vegetable Stew' },
  'Cacık': { ru: 'Джаджик', en: 'Cacik (Yogurt Dip)' },
  'Karnabahar Musakka': { ru: 'Мусака из цветной капусты', en: 'Cauliflower Moussaka' },
  'Kekikli Kebap': { ru: 'Кебаб с тимьяном', en: 'Thyme Kebab' },
  'Ankara Tava': { ru: 'Анкарская сковорода', en: 'Ankara Style Pan' },
  'Tavuk Baget-Fırın Patates': { ru: 'Куриные голени с запеченным картофелем', en: 'Chicken Drumstick with Baked Potato' },
  'Mantı': { ru: 'Манты', en: 'Turkish Dumplings' },
  'Patlıcan Musakka': { ru: 'Мусака из баклажанов', en: 'Eggplant Moussaka' },
  'Orman Kebabı': { ru: 'Лесной кебаб', en: 'Forest Kebab' },
  'Kapama': { ru: 'Капама', en: 'Kapama (Slow Cooked Lamb)' },
  'Karnıyarık': { ru: 'Карныярык', en: 'Stuffed Eggplant' },
  'Tas Kebabı': { ru: 'Тас кебаб', en: 'Tas Kebab' },
  'Sac Kavurma': { ru: 'Жаркое на садже', en: 'Sac Kavurma' },
  'Biber Dolması': { ru: 'Фаршированный перец', en: 'Stuffed Peppers' },

  // Side dishes
  'Pilav': { ru: 'Плов', en: 'Pilaf' },
  'Pirinç Pilavı': { ru: 'Рисовый плов', en: 'Rice Pilaf' },
  'Şehriyeli Pirinç Pilavı': { ru: 'Рисовый плов с вермишелью', en: 'Vermicelli Rice Pilaf' },
  'Bulgur Pilavı': { ru: 'Булгур плов', en: 'Bulgur Pilaf' },
  'Soslu Bulgur Pilavı': { ru: 'Булгур плов с соусом', en: 'Bulgur Pilaf with Sauce' },
  'Safranlı Pilav': { ru: 'Шафрановый плов', en: 'Saffron Rice' },
  'Soslu Makarna': { ru: 'Макароны с соусом', en: 'Pasta with Sauce' },
  'Makarna': { ru: 'Макароны', en: 'Pasta' },
  'Börek': { ru: 'Бурек', en: 'Börek' },
  'Patatesli Börek': { ru: 'Бурек с картофелем', en: 'Potato Börek' },
  'Patatesli Gül Böreği': { ru: 'Розовый бурек с картофелем', en: 'Rose Shaped Potato Börek' },
  'Peynirli Börek': { ru: 'Бурек с сыром', en: 'Cheese Börek' },
  'Erişte': { ru: 'Эриште (лапша)', en: 'Eriste (Noodles)' },

  // Desserts and accompaniments
  'Meyve': { ru: 'Фрукты', en: 'Fruit' },
  'Ayran': { ru: 'Айран', en: 'Ayran' },
  'Yoğurt': { ru: 'Йогурт', en: 'Yogurt' },
  'Komposto': { ru: 'Компот', en: 'Compote' },
  'Karışık Komposto': { ru: 'Смешанный компот', en: 'Mixed Compote' },
  'Şeker Pare': { ru: 'Шекерпаре', en: 'Sekerpare' },
  'Sütlaç': { ru: 'Сютлач (рисовый пудинг)', en: 'Rice Pudding' },
  'Islak Kek': { ru: 'Влажный кекс', en: 'Moist Cake' },
  'Revani': { ru: 'Ревани', en: 'Revani Cake' },
  'Revani Tatlısı': { ru: 'Ревани', en: 'Revani Cake' },
  'Kadayıf': { ru: 'Кадаиф', en: 'Kadayif' },
  'Baklava': { ru: 'Пахлава', en: 'Baklava' },
  'Helva': { ru: 'Халва', en: 'Halva' },
  'Tatlı': { ru: 'Десерт', en: 'Dessert' },
  'Trileçe': { ru: 'Трилече', en: 'Tres Leches Cake' },
  'Kazandibi': { ru: 'Казандиби', en: 'Kazandibi (Caramelized Pudding)' },
  'Keşkül': { ru: 'Кешкюль', en: 'Keskul (Almond Pudding)' }
};

function generateId(name) {
    return name
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i')
        .toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}


function translateFood(turkishName) {
  // Try exact match first
  if (translations[turkishName]) {
    return translations[turkishName];
  }

  // Try partial matching
  for (const [key, value] of Object.entries(translations)) {
    if (turkishName.includes(key) || key.includes(turkishName)) {
      return value;
    }
  }

  // Default: transliterate
  return {
    ru: turkishName,
    en: turkishName
  };
}

async function fetchAndParseMenu() {
    const response = await axios.get(MENU_URL);
    const $ = cheerio.load(response.data);

    const foods = new Map();
    const menus = [];

    let currentDate = null;
    let currentItems = [];

    // Parse the page content
    $('h5, h6').each((_, element) => {
        const $el = $(element);
        const tagName = element.tagName.toLowerCase();

        // Очищаем текст от множественных пробелов и переносов строк,
        // которые видны в коде страницы вокруг даты и внутри span
        const text = $el.text().replace(/\s+/g, ' ').trim();

        if (tagName === 'h5') {
            // Ищем только паттерн даты DD.MM.YYYY в начале строки.
            // Игнорируем всё, что идет после года (названия дней недели и т.д.)
            const dateMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})/);

            if (dateMatch) {
                // Если встретили новую дату — сохраняем накопленное меню предыдущего дня
                if (currentDate && currentItems.length > 0) {
                    menus.push({
                        date: currentDate,
                        items: [...currentItems]
                    });
                }

                // Форматируем дату в ISO (YYYY-MM-DD)
                const [, day, month, year] = dateMatch;
                currentDate = `${year}-${month}-${day}`;
                currentItems = [];

                // Прекращаем обработку текущего h5, так как это заголовок даты
                return;
            }

            // Если это не дата, проверяем, не является ли текст названием блюда
            // Исключаем пустые строки, строки начинающиеся с цифр и технические заголовки
            if (text && !text.match(/^\d/) && text !== 'YEMEKHANE' && text !== 'MENÜ') {
                const foodName = text.replace(/\*+/g, '').trim();

                if (foodName) {
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
        } else if (tagName === 'h6') {
            // Логика калорий остается прежней, но используем очищенный текст
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

    // Добавляем последний обработанный день
    if (currentDate && currentItems.length > 0) {
        menus.push({
            date: currentDate,
            items: [...currentItems]
        });
    }

    return {
        foods: Array.from(foods.values()),
        menus,
        meta: {
            timezone: 'Asia/Bishkek',
            source: 'manas_kantin',
            lastUpdated: new Date().toISOString()
        }
    };
}

async function fetchAndParseKiraathane() {
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

app.get('/menu', async (req, res) => {
  try {
    const data = await fetchAndParseMenu();
    res.json(data);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      error: 'Failed to fetch menu',
      message: error.message
    });
  }
});

app.get('/kiraathane', async (req, res) => {
  try {
    const data = await fetchAndParseKiraathane();
    res.json(data);
  } catch (error) {
    console.error('Error fetching kiraathane menu:', error);
    res.status(500).json({
      error: 'Failed to fetch kiraathane menu',
      message: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Используем 0.0.0.0 чтобы быть доступным извне (особенно важно для Docker/WSL)
/*
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running!`);
    console.log(`🏠 Local: http://localhost:${PORT}`);
    console.log(`- Menu: http://localhost:${PORT}/menu`);
    console.log(`- Kiraathane: http://localhost:${PORT}/kiraathane`);
});
*/

async function saveJsonFiles() {
    try {
        const menuData = await fetchAndParseMenu();
        const kiraathaneData = await fetchAndParseKiraathane();

        await fs.writeFile('public/menu.json', JSON.stringify(menuData, null, 2));
        await fs.writeFile('public/buffet.json', JSON.stringify(kiraathaneData, null, 2));

        console.log('Files updated successfully');
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

saveJsonFiles();
