const prisma = require('../config/prisma');

/**
 * Get members of a kingdom, restricted by requester's role and kingdom.
 * Allowed roles: KING, MINISTER, GENERAL.
 */
async function getMembers(kingdomId, requesterId) {
    if (!kingdomId || !requesterId) {
        const err = new Error('Kingdom ID dan Requester ID harus disertakan');
        err.status = 400;
        throw err;
    }

    const requester = await prisma.player.findUnique({
        where: { id: parseInt(requesterId) }
    });

    if (!requester) {
        const err = new Error('Requester tidak ditemukan');
        err.status = 404;
        throw err;
    }

    // Must be from the same kingdom
    if (requester.kingdom_id !== parseInt(kingdomId)) {
        const err = new Error('Anda tidak memiliki akses ke daftar warga kerajaan lain');
        err.status = 403;
        throw err;
    }

    // Role check
    const allowedRoles = ['KING', 'MINISTER', 'GENERAL'];
    if (!allowedRoles.includes(requester.role)) {
        const err = new Error('Hanya Raja dan Petinggi (Menteri/Jenderal) yang dapat melihat daftar warga');
        err.status = 403;
        throw err;
    }

    // Fetch members
    const members = await prisma.player.findMany({
        where: { kingdom_id: parseInt(kingdomId) },
        select: {
            id: true,
            username: true,
            level: true,
            role: true,
            score: true,
            created_at: true
        },
        orderBy: [
            { role: 'asc' }, // KING first, etc. (string sort: GENERAL, KING, MEMBER, MINISTER)
            { score: 'desc' }
        ]
    });

    return members;
}

/**
 * Update a member's role. Only KING can perform this action.
 */
async function updateRole(requesterId, targetPlayerId, newRole) {
    if (!requesterId || !targetPlayerId || !newRole) {
        const err = new Error('Data tidak lengkap');
        err.status = 400;
        throw err;
    }

    const validRoles = ['MINISTER', 'GENERAL', 'MEMBER'];
    if (!validRoles.includes(newRole)) {
        const err = new Error('Jabatan tidak valid. Hanya bisa diangkat menjadi MINISTER, GENERAL, atau MEMBER');
        err.status = 400;
        throw err;
    }

    const requester = await prisma.player.findUnique({
        where: { id: parseInt(requesterId) }
    });

    if (!requester || requester.role !== 'KING') {
        const err = new Error('Hanya Raja yang dapat mengangkat atau mengubah jabatan');
        err.status = 403;
        throw err;
    }

    const target = await prisma.player.findUnique({
        where: { id: parseInt(targetPlayerId) }
    });

    if (!target) {
        const err = new Error('Pemain tidak ditemukan');
        err.status = 404;
        throw err;
    }

    if (target.kingdom_id !== requester.kingdom_id) {
        const err = new Error('Tidak dapat mengubah jabatan dari warga kerajaan lain');
        err.status = 403;
        throw err;
    }

    if (target.role === 'KING') {
        const err = new Error('Jabatan Raja tidak dapat diubah secara langsung');
        err.status = 403;
        throw err;
    }

    const updatedPlayer = await prisma.player.update({
        where: { id: parseInt(targetPlayerId) },
        data: { role: newRole },
        select: {
            id: true,
            username: true,
            role: true
        }
    });

    return updatedPlayer;
}

module.exports = { getMembers, updateRole };
