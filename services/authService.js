const prisma = require('../config/prisma');
const { hashPassword } = require('../utils/gameHelpers');

/**
 * Register a new player
 */
async function register({ username, password, kingdom_id }) {
    if (!username || !password || !kingdom_id) {
        const err = new Error('Username, password, dan kingdom harus diisi');
        err.status = 400;
        throw err;
    }

    const existing = await prisma.player.findUnique({ where: { username } });
    if (existing) {
        const err = new Error('Username sudah digunakan');
        err.status = 400;
        throw err;
    }

    const kingdomPlayersCount = await prisma.player.count({
        where: { kingdom_id: parseInt(kingdom_id) }
    });
    const role = kingdomPlayersCount === 0 ? 'KING' : 'MEMBER';

    return prisma.player.create({
        data: {
            username,
            password: hashPassword(password),
            kingdom_id: parseInt(kingdom_id),
            role
        },
        include: { kingdom: true }
    });
}

/**
 * Login a player, returns player data on success
 */
async function login({ username, password }) {
    const player = await prisma.player.findUnique({
        where: { username },
        include: { kingdom: true }
    });

    if (!player || player.password !== hashPassword(password)) {
        const err = new Error('Username atau password salah');
        err.status = 401;
        throw err;
    }

    return player;
}

/**
 * Get a player by ID, with stamina/energy regeneration applied
 */
async function getPlayer(id) {
    const { regenerateResources } = require('../utils/gameHelpers');

    const player = await prisma.player.findUnique({
        where: { id: parseInt(id) },
        include: {
            kingdom: true,
            equipments: { orderBy: { created_at: 'desc' } }
        }
    });

    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    return regenerateResources(player);
}

/**
 * Get all kingdoms
 */
async function getKingdoms() {
    return prisma.kingdom.findMany();
}

/**
 * Upgrade a skill for a player
 */
async function upgradeSkill({ player_id, skill_name }) {
    const validSkills = ['atk', 'def', 'agi', 'crit_rate', 'crit_dmg', 'eco'];
    if (!validSkills.includes(skill_name)) {
        const err = new Error('Skill tidak valid');
        err.status = 400;
        throw err;
    }

    const player = await prisma.player.findUnique({ where: { id: parseInt(player_id) } });
    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    if (player.skill_points < 1) {
        const err = new Error('Skill Point tidak cukup! Butuh 1 Skill Point.');
        err.status = 400;
        throw err;
    }

    const skillField = `${skill_name}_level`;
    const currentLevel = player[skillField] || 1;

    return prisma.player.update({
        where: { id: player.id },
        data: {
            skill_points: player.skill_points - 1,
            [skillField]: currentLevel + 1
        },
        include: {
            kingdom: true,
            equipments: { orderBy: { created_at: 'desc' } }
        }
    });
}

module.exports = { register, login, getPlayer, getKingdoms, upgradeSkill };
