import express from 'express';
import {fetchAndParseMenu} from './parsers/menuParser.js';
import {fetchAndParseKiraathane} from './parsers/kiraathaneParser.js';
import {saveJsonFiles} from './services/saveJsonFiles.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/menu', async (req, res) => {
    try {
        const data = await fetchAndParseMenu();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.get('/kiraathane', async (req, res) => {
    try {
        const data = await fetchAndParseKiraathane();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});

/*app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});*/

// если нужно автообновление JSON
saveJsonFiles();
