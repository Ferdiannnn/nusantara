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

        let message = 'Serangan berhasil!';
        if (result.tick_triggered) {
            if (result.round_winner === 'ATTACKER') message = `⚔️ Ronde ${result.roundNumber} DIMENANGKAN PENYERANG! +${result.tick_attacker_pts} poin`;
            else if (result.round_winner === 'DEFENDER') message = `🛡️ Ronde ${result.roundNumber} DIMENANGKAN BERTAHAN! +${result.tick_defender_pts} poin`;
        }
        if (result.battle_result?.status === 'ATTACKER_WON') message = '🏆 MENANG! Wilayah berhasil dikuasai penyerang!';
        if (result.battle_result?.status === 'DEFENDER_WON') message = '🛡️ Pertahanan menang! Wilayah berhasil dipertahankan!';

        res.json({ status: 'success', message, ...result });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal menyerang' });
    }
};

const defendTerritory = async (req, res) => {
    try {
        const result = await battleService.defendTerritory(req.body);

        let message = 'Pertahanan berhasil!';
        if (result.tick_triggered) {
            if (result.round_winner === 'DEFENDER') message = `🛡️ Ronde ${result.roundNumber} DIMENANGKAN BERTAHAN! +${result.tick_defender_pts} poin`;
            else if (result.round_winner === 'ATTACKER') message = `⚔️ Ronde ${result.roundNumber} DIMENANGKAN PENYERANG! +${result.tick_attacker_pts} poin`;
        }
        if (result.battle_result?.status === 'ATTACKER_WON') message = '🏆 Penyerang menang! Wilayah berhasil dikuasai!';
        if (result.battle_result?.status === 'DEFENDER_WON') message = '🛡️ MENANG! Wilayah berhasil dipertahankan!';

        res.json({ status: 'success', message, ...result });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mempertahankan wilayah' });
    }
};

const getBattleStatus = async (req, res) => {
    try {
        const { territory_code } = req.params;
        const result = await battleService.getBattleStatus(territory_code);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mengambil status pertempuran' });
    }
};

const processTick = async (req, res) => {
    try {
        const { territory_code } = req.params;
        const result = await battleService.processTick(territory_code);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal memproses tick' });
    }
};

module.exports = { declareWar, helpAttack, defendTerritory, getBattleStatus, processTick };
