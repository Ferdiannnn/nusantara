const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const player = await authService.register(req.body);
        res.json({ status: 'success', data: player });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mendaftar' });
    }
};

const login = async (req, res) => {
    try {
        const player = await authService.login(req.body);
        res.json({ status: 'success', data: player });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal login' });
    }
};

const getPlayer = async (req, res) => {
    try {
        const player = await authService.getPlayer(req.params.id);
        res.json({ status: 'success', data: player });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mengambil data player' });
    }
};

const getKingdoms = async (req, res) => {
    try {
        const kingdoms = await authService.getKingdoms();
        res.json({ status: 'success', data: kingdoms });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal memuat kerajaan' });
    }
};

const upgradeSkill = async (req, res) => {
    try {
        const player = await authService.upgradeSkill(req.body);
        res.json({ status: 'success', message: 'Skill berhasil ditingkatkan!', data: player });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal meningkatkan skill' });
    }
};

module.exports = { register, login, getPlayer, getKingdoms, upgradeSkill };
