const battleService = require('../services/battleService');
const fs = require('fs');
const path = require('path');

// Load adjacency data once at startup
let adjacencyData = null;
try {
    adjacencyData = JSON.parse(fs.readFileSync(path.join(__dirname, '../maps/adjacency.json')));
} catch (e) {
    console.error('Adjacency data not found!', e.message);
}

const declareWar = async (req, res) => {
    try {
        const result = await battleService.declareWar({ ...req.body, adjacencyData });
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mendeklarasikan perang' });
    }
};

const helpAttack = async (req, res) => {
    try {
        const result = await battleService.helpAttack(req.body);
        res.json({
            status: 'success',
            message: result.conquered ? 'Wilayah berhasil dikuasai!' : 'Serangan berhasil!',
            ...result
        });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal menyerang' });
    }
};

const defendTerritory = async (req, res) => {
    try {
        const result = await battleService.defendTerritory(req.body);
        res.json({
            status: 'success',
            message: result.defended ? 'Wilayah berhasil dipertahankan secara penuh!' : 'Pertahanan berhasil!',
            ...result
        });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mempertahankan wilayah' });
    }
};

module.exports = { declareWar, helpAttack, defendTerritory };
