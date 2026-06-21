const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');
const { regenerateResources, getLevelRequirement, getRandomDuration } = require('../utils/gameHelpers');
const { EQUIPMENT_NAMES, EQUIPMENT_STAT_RANGES, RARITY_SELL_PRICE, CRAFTING_RECIPES, SHOP_ITEMS } = require('../utils/itemData');

const CHEST_RATES_PATH = path.join(__dirname, '../config/chest_rates.json');
const DEFAULT_RATES = { COMMON: 60, RARE: 25, EPIC: 12, LEGENDARY: 3 };

/**
 * Load chest rates from config file (falls back to defaults)
 */
function loadChestRates() {
    try {
        if (fs.existsSync(CHEST_RATES_PATH)) {
            return JSON.parse(fs.readFileSync(CHEST_RATES_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('Error reading chest rates', e);
    }
    return { ...DEFAULT_RATES };
}

/**
 * Get chest rates
 */
function getChestRates() {
    return loadChestRates();
}

/**
 * Update chest rates
 */
function updateChestRates({ COMMON, RARE, EPIC, LEGENDARY }) {
    const rates = {
        COMMON: parseInt(COMMON),
        RARE: parseInt(RARE),
        EPIC: parseInt(EPIC),
        LEGENDARY: parseInt(LEGENDARY)
    };

    for (const [key, val] of Object.entries(rates)) {
        if (isNaN(val)) {
            const err = new Error('Semua nilai rate harus berupa angka');
            err.status = 400;
            throw err;
        }
        if (val < 0) {
            const err = new Error('Nilai rate tidak boleh negatif');
            err.status = 400;
            throw err;
        }
    }

    if (rates.COMMON + rates.RARE + rates.EPIC + rates.LEGENDARY !== 100) {
        const err = new Error('Total persentase rate harus tepat 100%');
        err.status = 400;
        throw err;
    }

    fs.writeFileSync(CHEST_RATES_PATH, JSON.stringify(rates, null, 2), 'utf8');
    return rates;
}

/**
 * Roll rarity based on configured rates
 */
function rollRarity(rates) {
    const rand = Math.random() * 100;
    if (rand < rates.LEGENDARY) return 'LEGENDARY';
    if (rand < rates.LEGENDARY + rates.EPIC) return 'EPIC';
    if (rand < rates.LEGENDARY + rates.EPIC + rates.RARE) return 'RARE';
    return 'COMMON';
}

/**
 * Generate equipment stats based on type and rarity
 */
function generateEquipmentStats(type, rarity) {
    const ranges = EQUIPMENT_STAT_RANGES[type]?.[rarity] || {};
    const stats = { atk_bonus: 0, def_bonus: 0, agi_bonus: 0, crit_rate_bonus: 0 };
    for (const [stat, [min, max]] of Object.entries(ranges)) {
        stats[stat] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const names = EQUIPMENT_NAMES[type]?.[rarity] || [];
    const name = names[Math.floor(Math.random() * names.length)] || 'Item Tidak Dikenal';
    return { name, ...stats };
}

/**
 * Open a chest (costs 50 gold, gives random equipment)
 */
async function openChest({ player_id }) {
    const player = await prisma.player.findUnique({ where: { id: parseInt(player_id) } });
    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    const cost = 50;
    if (player.gold < cost) {
        const err = new Error(`Gold tidak cukup! Chest seharga ${cost} gold.`);
        err.status = 400;
        throw err;
    }

    const rates = loadChestRates();
    const rarity = rollRarity(rates);
    const types = ['WEAPON', 'ARMOR', 'BOOTS', 'HELMET', 'ARMS', 'LEG'];
    const type = types[Math.floor(Math.random() * types.length)];
    const { name, atk_bonus, def_bonus, agi_bonus, crit_rate_bonus } = generateEquipmentStats(type, rarity);
    const sellPrice = RARITY_SELL_PRICE[rarity];

    const [updatedPlayer, newEquipment] = await prisma.$transaction([
        prisma.player.update({ where: { id: player.id }, data: { gold: player.gold - cost } }),
        prisma.equipment.create({
            data: {
                player_id: player.id,
                name,
                type,
                rarity,
                atk_bonus,
                def_bonus,
                agi_bonus,
                crit_rate_bonus,
                durability: 100,
                max_durability: 100,
                sell_price: sellPrice
            }
        })
    ]);

    return { equipment: newEquipment, player: updatedPlayer, message: `Membuka Chest! Mendapatkan: ${name} (${rarity})` };
}

/**
 * Harvest resources from a territory
 */
async function harvest({ player_id, territory_id }) {
    const pId = parseInt(player_id);
    const tId = parseInt(territory_id);

    const player = await prisma.player.findUnique({
        where: { id: pId },
        include: { equipments: true }
    });
    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    let territory = await prisma.territory.findUnique({ where: { id: tId } });
    if (!territory) {
        const err = new Error('Wilayah tidak ditemukan');
        err.status = 404;
        throw err;
    }

    // Refresh resource if expired
    const now = new Date();
    if (!territory.resource_expires_at || new Date(territory.resource_expires_at) < now) {
        const hasResource = Math.random() < 0.50;
        const resourceType = hasResource
            ? ['wood', 'iron', 'spices'][Math.floor(Math.random() * 3)]
            : null;
        territory = await prisma.territory.update({
            where: { id: tId },
            data: { resource_type: resourceType, resource_expires_at: getRandomDuration() }
        });
    }

    if (!territory.resource_type) {
        const err = new Error('Tidak ada sumber daya alam aktif di wilayah ini saat ini!');
        err.status = 400;
        throw err;
    }

    if (territory.kingdom_id !== player.kingdom_id) {
        const err = new Error('Anda hanya dapat memanen di wilayah milik kerajaan Anda sendiri!');
        err.status = 400;
        throw err;
    }

    const playerRefreshed = await regenerateResources(player);
    if (playerRefreshed.energy < 10) {
        const err = new Error('Energi Kerja Anda tidak mencukupi (Butuh 10 Energi)!');
        err.status = 400;
        throw err;
    }

    const resourceType = territory.resource_type;
    const resourceLabels = { wood: 'Kayu 🪵', iron: 'Besi ⚙️', spices: 'Rempah-rempah 🌶️' };
    const resourceLabel = resourceLabels[resourceType] || resourceType;

    const count = Math.floor(Math.random() * 5) + 3;
    const gainedExp = 5;
    const goldGain = 2;

    let newExp = playerRefreshed.exp + gainedExp;
    let newLevel = playerRefreshed.level;
    let gainedPoints = 0;
    let leveledUp = false;
    while (newExp >= getLevelRequirement(newLevel)) {
        newExp -= getLevelRequirement(newLevel);
        newLevel += 1;
        gainedPoints += 5;
        leveledUp = true;
    }

    const updatedPlayer = await prisma.player.update({
        where: { id: pId },
        data: {
            energy: playerRefreshed.energy - 10,
            last_energy_regen: new Date(),
            gold: playerRefreshed.gold + goldGain,
            level: newLevel,
            exp: newExp,
            skill_points: playerRefreshed.skill_points + gainedPoints,
            [resourceType]: playerRefreshed[resourceType] + count
        },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });

    return {
        player: updatedPlayer,
        harvested: { type: resourceType, label: resourceLabel, count },
        leveledUp
    };
}

/**
 * Craft an equipment using a recipe
 */
async function craftEquipment({ player_id, recipe_key }) {
    const pId = parseInt(player_id);
    const recipe = CRAFTING_RECIPES[recipe_key];
    if (!recipe) {
        const err = new Error('Resep tidak valid');
        err.status = 400;
        throw err;
    }

    const player = await prisma.player.findUnique({ where: { id: pId } });
    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    const checks = [
        [player.gold < recipe.cost_gold, 'Koin emas Anda tidak mencukupi!'],
        [player.wood < recipe.cost_wood, 'Bahan Kayu Anda tidak mencukupi!'],
        [player.iron < recipe.cost_iron, 'Bahan Besi Anda tidak mencukupi!'],
        [player.spices < recipe.cost_spices, 'Bahan Rempah Anda tidak mencukupi!']
    ];
    for (const [condition, message] of checks) {
        if (condition) {
            const err = new Error(message);
            err.status = 400;
            throw err;
        }
    }

    const [, newEquipment] = await prisma.$transaction([
        prisma.player.update({
            where: { id: pId },
            data: {
                gold: player.gold - recipe.cost_gold,
                wood: player.wood - recipe.cost_wood,
                iron: player.iron - recipe.cost_iron,
                spices: player.spices - recipe.cost_spices
            }
        }),
        prisma.equipment.create({
            data: {
                player_id: pId,
                name: recipe.name,
                type: recipe.type,
                rarity: recipe.rarity,
                atk_bonus: recipe.atk_bonus,
                def_bonus: recipe.def_bonus,
                agi_bonus: recipe.agi_bonus,
                crit_rate_bonus: recipe.crit_rate_bonus,
                durability: 100,
                max_durability: 100,
                sell_price: recipe.sell_price,
                equipped: false,
                on_market: false
            }
        })
    ]);

    const finalPlayer = await prisma.player.findUnique({
        where: { id: pId },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });

    return { player: finalPlayer, equipment: newEquipment, recipe };
}

/**
 * Buy from the in-game shop (basic items)
 */
async function buyFromShop({ player_id, item_key }) {
    const item = SHOP_ITEMS[item_key];
    if (!item) {
        const err = new Error('Item tidak valid');
        err.status = 400;
        throw err;
    }

    const player = await prisma.player.findUnique({ where: { id: parseInt(player_id) } });
    if (!player) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }

    const cost = 30;
    if (player.gold < cost) {
        const err = new Error(`Gold tidak cukup! Item toko seharga ${cost} gold.`);
        err.status = 400;
        throw err;
    }

    const [updatedPlayer, newEquipment] = await prisma.$transaction([
        prisma.player.update({ where: { id: player.id }, data: { gold: player.gold - cost } }),
        prisma.equipment.create({
            data: {
                player_id: player.id,
                name: item.name,
                type: item.type,
                rarity: 'COMMON',
                atk_bonus: item.atk_bonus,
                def_bonus: item.def_bonus,
                agi_bonus: item.agi_bonus,
                crit_rate_bonus: item.crit_rate_bonus,
                durability: 100,
                max_durability: 100,
                sell_price: 10
            }
        })
    ]);

    return { equipment: newEquipment, player: updatedPlayer };
}

/**
 * Equip an item
 */
async function equipItem({ player_id, equipment_id }) {
    const equipment = await prisma.equipment.findUnique({ where: { id: parseInt(equipment_id) } });
    if (!equipment || equipment.player_id !== parseInt(player_id)) {
        const err = new Error('Peralatan tidak ditemukan');
        err.status = 404;
        throw err;
    }

    // Unequip same-type items first
    await prisma.equipment.updateMany({
        where: { player_id: parseInt(player_id), type: equipment.type, equipped: true },
        data: { equipped: false }
    });

    await prisma.equipment.update({ where: { id: equipment.id }, data: { equipped: true } });

    const player = await prisma.player.findUnique({
        where: { id: parseInt(player_id) },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });
    return { player: await regenerateResources(player), equipment };
}

/**
 * Unequip an item
 */
async function unequipItem({ player_id, equipment_id }) {
    const equipment = await prisma.equipment.findUnique({ where: { id: parseInt(equipment_id) } });
    if (!equipment || equipment.player_id !== parseInt(player_id)) {
        const err = new Error('Peralatan tidak ditemukan');
        err.status = 404;
        throw err;
    }

    await prisma.equipment.update({ where: { id: equipment.id }, data: { equipped: false } });

    const player = await prisma.player.findUnique({
        where: { id: parseInt(player_id) },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });
    return { player: await regenerateResources(player), equipment };
}

module.exports = {
    getChestRates,
    updateChestRates,
    openChest,
    harvest,
    craftEquipment,
    buyFromShop,
    equipItem,
    unequipItem,
    EQUIPMENT_NAMES // expose for market templates
};
