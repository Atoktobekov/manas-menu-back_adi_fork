import fs from 'fs/promises';

import { fetchAndParseMenu } from '../parsers/menuParser.js';
import { fetchAndParseKiraathane } from '../parsers/kiraathaneParser.js';

export async function saveJsonFiles() {
    const menuData = await fetchAndParseMenu();
    const kiraathaneData = await fetchAndParseKiraathane();

    await fs.writeFile('menu.json', JSON.stringify(menuData, null, 2));
    await fs.writeFile('buffet.json', JSON.stringify(kiraathaneData, null, 2));

    console.log('Files updated successfully');
}
