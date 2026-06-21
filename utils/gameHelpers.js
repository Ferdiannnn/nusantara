const crypto = require('crypto');
const prisma = require('../config/prisma');

// Custom JSON serialization for BigInt
BigInt.prototype.toJSON = function () {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
};

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function getLevelRequirement(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

function getRandomDuration() {
    const choices = ['1d', '2d', '3d', 'hours'];
    const choice = choices[Math.floor(Math.random() * choices.length)];
    const now = new Date();
    if (choice === '1d') {
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (choice === '2d') {
        return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    } else if (choice === '3d') {
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    } else {
        const hours = Math.floor(Math.random() * 23) + 1;
        return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
}

async function regenerateStamina(player) {
    if (!player) return null;
    const defLevel = player.def_level || 1;
    const maxStamina = 100 + (defLevel - 1) * 10;
    const intervalSeconds = 2100 * Math.pow(0.95, defLevel - 1);

    if (player.stamina >= maxStamina) {
        if (new Date() - new Date(player.last_stamina_regen) > intervalSeconds * 1000) {
            await prisma.player.update({
                where: { id: player.id },
                data: { last_stamina_regen: new Date() }
            });
        }
        return player;
    }
    const now = new Date();
    const lastRegen = new Date(player.last_stamina_regen || now);
    const secondsDiff = Math.floor((now - lastRegen) / 1000);
    
    if (secondsDiff >= intervalSeconds) {
        const regenAmount = Math.floor(secondsDiff / intervalSeconds);
        const newStamina = Math.min(maxStamina, player.stamina + regenAmount);
        const remainingMs = (secondsDiff % intervalSeconds) * 1000;
        const newRegenTime = new Date(now.getTime() - remainingMs);
        
        return await prisma.player.update({
            where: { id: player.id },
            data: {
                stamina: newStamina,
                last_stamina_regen: newRegenTime
            },
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
    }
    return player;
}

async function regenerateEnergy(player) {
    if (!player) return null;
    const ecoLevel = player.eco_level || 1;
    const maxEnergy = 100 + (ecoLevel - 1) * 10;
    const intervalSeconds = 2100 * Math.pow(0.95, ecoLevel - 1);

    if (player.energy >= maxEnergy) {
        if (new Date() - new Date(player.last_energy_regen) > intervalSeconds * 1000) {
            await prisma.player.update({
                where: { id: player.id },
                data: { last_energy_regen: new Date() }
            });
        }
        return player;
    }
    const now = new Date();
    const lastRegen = new Date(player.last_energy_regen || now);
    const secondsDiff = Math.floor((now - lastRegen) / 1000);
    
    if (secondsDiff >= intervalSeconds) {
        const regenAmount = Math.floor(secondsDiff / intervalSeconds);
        const newEnergy = Math.min(maxEnergy, player.energy + regenAmount);
        const remainingMs = (secondsDiff % intervalSeconds) * 1000;
        const newRegenTime = new Date(now.getTime() - remainingMs);
        
        return await prisma.player.update({
            where: { id: player.id },
            data: {
                energy: newEnergy,
                last_energy_regen: newRegenTime
            },
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
    }
    return player;
}

async function regenerateResources(player) {
    if (!player) return null;
    let p = await regenerateStamina(player);
    p = await regenerateEnergy(p);
    return p;
}

module.exports = {
    hashPassword,
    getLevelRequirement,
    getRandomDuration,
    regenerateStamina,
    regenerateEnergy,
    regenerateResources
};
