const mapService = require('../services/mapService');

const getTerritories = async (req, res) => {
    try {
        const territories = await mapService.getTerritories();
        res.json({ status: 'success', data: territories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Gagal memuat wilayah' });
    }
};

module.exports = { getTerritories };
