const prisma = require('../config/prisma');
const { getRandomDuration } = require('../utils/gameHelpers');

/**
 * Get all territories (and refresh expired resources)
 */
async function getTerritories() {
    let territories = await prisma.territory.findMany({
        include: {
            kingdom: true,
            battles: {
                where: { status: 'ONGOING' },
                orderBy: { started_at: 'desc' },
                take: 1,
                include: { attacker_kingdom: true }
            }
        }
    });

    const now = new Date();
    for (let i = 0; i < territories.length; i++) {
        const t = territories[i];
        if (!t.resource_expires_at || new Date(t.resource_expires_at) < now) {
            const hasResource = Math.random() < 0.50;
            const resourceType = hasResource
                ? ['wood', 'iron', 'spices'][Math.floor(Math.random() * 3)]
                : null;
            const expiresAt = getRandomDuration();

            territories[i] = await prisma.territory.update({
                where: { id: t.id },
                data: { resource_type: resourceType, resource_expires_at: expiresAt },
                include: {
                    kingdom: true,
                    battles: {
                        where: { status: 'ONGOING' },
                        orderBy: { started_at: 'desc' },
                        take: 1,
                        include: { attacker_kingdom: true }
                    }
                }
            });
        }
    }

    return territories;
}

module.exports = { getTerritories };
