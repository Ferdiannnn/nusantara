const marketService = require('../services/marketService');

const getOrders = async (req, res) => {
    try {
        const data = await marketService.getOrders();
        res.json({ status: 'success', data });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data pasar' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await marketService.getMyOrders(req.params.playerId);
        res.json({ status: 'success', data: orders });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil order saya' });
    }
};

const placeSellOrder = async (req, res) => {
    try {
        const result = await marketService.placeSellOrder(req.body);
        res.json({ status: 'success', matched: result.matched, message: result.message, data: result.data });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal membuat order jual' });
    }
};

const placeBuyOrder = async (req, res) => {
    try {
        const result = await marketService.placeBuyOrder(req.body);
        res.json({ status: 'success', matched: result.matched, message: result.message, data: result.data });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal membuat order beli' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const player = await marketService.cancelOrder(req.body);
        res.json({ status: 'success', message: 'Order berhasil dibatalkan.', data: player });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal membatalkan order' });
    }
};

module.exports = { getOrders, getMyOrders, placeSellOrder, placeBuyOrder, cancelOrder };
