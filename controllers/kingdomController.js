const kingdomService = require('../services/kingdomService');

const getMembers = async (req, res) => {
    try {
        // Kingdom ID comes from params, Requester ID from query
        const kingdomId = req.params.id;
        const requesterId = req.query.playerId;
        
        const members = await kingdomService.getMembers(kingdomId, requesterId);
        res.json({ status: 'success', data: members });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mengambil daftar warga' });
    }
};

const updateRole = async (req, res) => {
    try {
        const { requesterId, targetPlayerId, newRole } = req.body;
        const result = await kingdomService.updateRole(requesterId, targetPlayerId, newRole);
        res.json({ status: 'success', message: 'Jabatan berhasil diperbarui', data: result });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal mengubah jabatan' });
    }
};

module.exports = { getMembers, updateRole };
