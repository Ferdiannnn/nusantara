const prisma = require('../config/prisma');
const { regenerateResources, getLevelRequirement } = require('../utils/gameHelpers');

/**
 * Calculate total equipment bonuses for active equipped items
 */
function calcEquipmentBonuses(equipments) {
    let totalAtkBonus = 0;
    let totalDefBonus = 0;
    let totalAgiBonus = 0;
    let totalCritRateBonus = 0;

    const activeEquipments = equipments.filter(e => e.equipped && e.durability > 0);
    for (const eq of activeEquipments) {
        totalAtkBonus += eq.atk_bonus;
        totalDefBonus += eq.def_bonus;
        totalAgiBonus += eq.agi_bonus;
        totalCritRateBonus += eq.crit_rate_bonus;
    }
    return { totalAtkBonus, totalDefBonus, totalAgiBonus, totalCritRateBonus, activeEquipments };
}

/**
 * Roll agility check – returns whether equipment durability is lost
 */
function rollAgilityAndDurability(player, activeEquipments, totalAgiBonus) {
    let agiTriggered = false;
    let updatedEquipmentId = null;
    let newDurability = 0;
    let durabilityLostItem = '';

    if (activeEquipments.length > 0) {
        const agiRate = Math.min(85, (player.agi_level * 5) + totalAgiBonus);
        if (Math.random() * 100 < agiRate) {
            agiTriggered = true;
        } else {
            const randomEq = activeEquipments[Math.floor(Math.random() * activeEquipments.length)];
            updatedEquipmentId = randomEq.id;
            newDurability = Math.max(0, randomEq.durability - 5);
            durabilityLostItem = randomEq.name;
        }
    }
    return { agiTriggered, updatedEquipmentId, newDurability, durabilityLostItem };
}

/**
 * Apply leveling: compute new level, exp, and gained skill points
 */
function applyLeveling(currentExp, currentLevel, gainedExp) {
    let newExp = currentExp + gainedExp;
    let newLevel = currentLevel;
    let gainedPoints = 0;
    let leveledUp = false;

    while (newExp >= getLevelRequirement(newLevel)) {
        newExp -= getLevelRequirement(newLevel);
        newLevel += 1;
        gainedPoints += 5;
        leveledUp = true;
    }
    return { newExp, newLevel, gainedPoints, leveledUp };
}

/**
 * Declare war on a territory
 */
async function declareWar({ territory_code, attacker_kingdom_id, player_id, adjacencyData }) {
    const player = await prisma.player.findUnique({ where: { id: player_id } });
    if (!player || player.role !== 'KING') {
        const err = new Error('Hanya Raja yang dapat mendeklarasikan perang!');
        err.status = 403;
        throw err;
    }

    const ownedTerritories = await prisma.territory.findMany({
        where: { kingdom_id: attacker_kingdom_id }
    });

    if (ownedTerritories.length > 0 && adjacencyData) {
        let isAdjacent = false;
        for (const t of ownedTerritories) {
            const neighbors = adjacencyData[t.code] || [];
            if (neighbors.includes(territory_code) || t.code === territory_code) {
                isAdjacent = true;
                break;
            }
        }
        if (!isAdjacent) {
            const err = new Error('Terlalu jauh! Anda hanya dapat menyerang wilayah yang bersebelahan dengan wilayah kekuasaan Anda.');
            err.status = 400;
            throw err;
        }
    }

    let territory = await prisma.territory.findUnique({ where: { code: territory_code } });

    if (!territory) {
        territory = await prisma.territory.create({
            data: { code: territory_code, name: 'Provinsi', troops_count: 100 }
        });
    } else if (territory.kingdom_id === attacker_kingdom_id) {
        const err = new Error('Wilayah ini sudah dikuasai!');
        err.status = 400;
        throw err;
    } else {
        territory = await prisma.territory.update({
            where: { code: territory_code },
            data: { troops_count: territory.troops_count === 0 ? 100 : territory.troops_count }
        });
    }

    const existingBattle = await prisma.battle.findFirst({
        where: { territory_id: territory.id, status: 'ONGOING' }
    });
    if (existingBattle) {
        const err = new Error('Wilayah ini sedang dalam peperangan!');
        err.status = 400;
        throw err;
    }

    const battle = await prisma.battle.create({
        data: {
            territory_id: territory.id,
            attacker_kingdom_id,
            defender_kingdom_id: territory.kingdom_id,
            status: 'ONGOING'
        }
    });

    return { territory, battle };
}

/**
 * Execute an attack action on a territory
 */
async function helpAttack({ territory_code, player_id }) {
    let territory = await prisma.territory.findUnique({
        where: { code: territory_code },
        include: {
            battles: {
                where: { status: 'ONGOING' },
                orderBy: { started_at: 'desc' },
                take: 1
            }
        }
    });

    if (!territory || territory.battles.length === 0) {
        const err = new Error('Tidak ada peperangan aktif di wilayah ini.');
        err.status = 400;
        throw err;
    }

    const player = await prisma.player.findUnique({
        where: { id: parseInt(player_id) },
        include: { equipments: true }
    });
    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    const playerRefreshed = await regenerateResources(player);
    const { totalAtkBonus, totalDefBonus, totalAgiBonus, totalCritRateBonus, activeEquipments } =
        calcEquipmentBonuses(playerRefreshed.equipments);

    const staminaCost = Math.max(2, 10 - (playerRefreshed.def_level - 1) - Math.floor(totalDefBonus / 2));
    if (playerRefreshed.stamina < staminaCost) {
        const err = new Error(`Stamina tidak cukup! Butuh ${staminaCost} stamina untuk menyerang.`);
        err.status = 400;
        throw err;
    }

    const hitCost = Math.max(1, 5 - (playerRefreshed.def_level - 1) - totalDefBonus);
    if (playerRefreshed.gold < hitCost) {
        const err = new Error(`Gold tidak cukup! Butuh ${hitCost} gold untuk menyerang.`);
        err.status = 400;
        throw err;
    }

    const { agiTriggered, updatedEquipmentId, newDurability, durabilityLostItem } =
        rollAgilityAndDurability(playerRefreshed, activeEquipments, totalAgiBonus);

    const baseDmg = Math.floor(Math.random() * 11) + 10;
    let damage = baseDmg + (playerRefreshed.atk_level - 1) * 2 + totalAtkBonus;

    let isCrit = false;
    const critRate = Math.min(75, playerRefreshed.crit_rate_level * 4 + totalCritRateBonus);
    if (Math.random() * 100 < critRate) {
        isCrit = true;
        const critMultiplier = 1.5 + (playerRefreshed.crit_dmg_level - 1) * 0.1;
        damage = Math.round(damage * critMultiplier);
    }

    const newHP = Math.max(0, territory.troops_count - damage);
    const goldGain = Math.floor(Math.random() * 7) + 2;
    const conquered = newHP <= 0;
    let goldChange = -hitCost + goldGain + (conquered ? 50 : 0);
    const gainedExp = 10 + (conquered ? 50 : 0);
    const { newExp, newLevel, gainedPoints, leveledUp } = applyLeveling(
        playerRefreshed.exp, playerRefreshed.level, gainedExp
    );

    if (updatedEquipmentId) {
        await prisma.equipment.update({
            where: { id: updatedEquipmentId },
            data: { durability: newDurability }
        });
    }

    const updatedPlayer = await prisma.player.update({
        where: { id: playerRefreshed.id },
        data: {
            gold: playerRefreshed.gold + goldChange,
            stamina: playerRefreshed.stamina - staminaCost,
            last_stamina_regen: new Date(),
            level: newLevel,
            exp: newExp,
            skill_points: playerRefreshed.skill_points + gainedPoints
        },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });

    const ongoingBattle = territory.battles[0];
    const actualAttackerId = ongoingBattle.attacker_kingdom_id;

    if (conquered) {
        territory = await prisma.territory.update({
            where: { code: territory_code },
            data: { kingdom_id: actualAttackerId, troops_count: 100 }
        });
        await prisma.battle.update({
            where: { id: ongoingBattle.id },
            data: { status: 'ATTACKER_WON', ended_at: new Date() }
        });
    } else {
        territory = await prisma.territory.update({
            where: { code: territory_code },
            data: { troops_count: newHP }
        });
    }

    return {
        conquered,
        hp: territory.troops_count,
        damage,
        isCrit,
        agiTriggered,
        durabilityLostItem,
        goldChange,
        staminaCost,
        expGained: gainedExp,
        leveledUp,
        newLevel,
        newExp,
        gainedPoints,
        player: updatedPlayer
    };
}

/**
 * Execute a defend action on a territory
 */
async function defendTerritory({ territory_code, player_id }) {
    let territory = await prisma.territory.findUnique({
        where: { code: territory_code },
        include: {
            battles: {
                where: { status: 'ONGOING' },
                orderBy: { started_at: 'desc' },
                take: 1
            }
        }
    });

    if (!territory || territory.battles.length === 0) {
        const err = new Error('Tidak ada peperangan aktif di wilayah ini.');
        err.status = 400;
        throw err;
    }

    const player = await prisma.player.findUnique({
        where: { id: parseInt(player_id) },
        include: { equipments: true }
    });
    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    const playerRefreshed = await regenerateResources(player);
    const { totalDefBonus, totalAgiBonus, activeEquipments } =
        calcEquipmentBonuses(playerRefreshed.equipments);

    const staminaCost = Math.max(2, 10 - (playerRefreshed.def_level - 1) - Math.floor(totalDefBonus / 2));
    if (playerRefreshed.stamina < staminaCost) {
        const err = new Error(`Stamina tidak cukup! Butuh ${staminaCost} stamina untuk bertahan.`);
        err.status = 400;
        throw err;
    }

    const hitCost = Math.max(1, 5 - (playerRefreshed.def_level - 1) - totalDefBonus);
    if (playerRefreshed.gold < hitCost) {
        const err = new Error(`Gold tidak cukup! Butuh ${hitCost} gold untuk bertahan.`);
        err.status = 400;
        throw err;
    }

    const { agiTriggered, updatedEquipmentId, newDurability, durabilityLostItem } =
        rollAgilityAndDurability(playerRefreshed, activeEquipments, totalAgiBonus);

    const baseHeal = Math.floor(Math.random() * 11) + 10;
    const heal = baseHeal + (playerRefreshed.def_level - 1) + totalDefBonus;
    const newHP = Math.min(100, territory.troops_count + heal);

    const goldGain = Math.floor(Math.random() * 7) + 2;
    const defended = newHP >= 100;
    let goldChange = -hitCost + goldGain + (defended ? 30 : 0);
    const gainedExp = 10 + (defended ? 30 : 0);
    const { newExp, newLevel, gainedPoints, leveledUp } = applyLeveling(
        playerRefreshed.exp, playerRefreshed.level, gainedExp
    );

    if (updatedEquipmentId) {
        await prisma.equipment.update({
            where: { id: updatedEquipmentId },
            data: { durability: newDurability }
        });
    }

    const updatedPlayer = await prisma.player.update({
        where: { id: playerRefreshed.id },
        data: {
            gold: playerRefreshed.gold + goldChange,
            stamina: playerRefreshed.stamina - staminaCost,
            last_stamina_regen: new Date(),
            level: newLevel,
            exp: newExp,
            skill_points: playerRefreshed.skill_points + gainedPoints
        },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });

    const ongoingBattle = territory.battles[0];

    if (defended) {
        territory = await prisma.territory.update({
            where: { code: territory_code },
            data: { troops_count: 100 }
        });
        await prisma.battle.update({
            where: { id: ongoingBattle.id },
            data: { status: 'DEFENDER_WON', ended_at: new Date() }
        });
    } else {
        territory = await prisma.territory.update({
            where: { code: territory_code },
            data: { troops_count: newHP }
        });
    }

    return {
        defended,
        hp: territory.troops_count,
        heal,
        agiTriggered,
        durabilityLostItem,
        goldChange,
        staminaCost,
        expGained: gainedExp,
        leveledUp,
        newLevel,
        newExp,
        gainedPoints,
        player: updatedPlayer
    };
}

module.exports = { declareWar, helpAttack, defendTerritory };
