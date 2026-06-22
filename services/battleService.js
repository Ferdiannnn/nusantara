const prisma = require('../config/prisma');
const { regenerateResources, getLevelRequirement } = require('../utils/gameHelpers');

const POINTS_TO_WIN_ROUND = 500;
const TICK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
const ROUND_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes timeout per round

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
 * Process a 2-minute tick for the current round.
 * Awards points based on damage ratio + random 1-5 bonus.
 * Returns tick result and whether the round (or battle) ended.
 */
async function _processTick(round, battle) {
    const atkDmg = round.attacker_dmg_since_tick;
    const defDmg = round.defender_dmg_since_tick;
    const totalDmg = atkDmg + defDmg;
    const tickNumber = round.ticks.length + 1;

    let atkPts = 0;
    let defPts = 0;
    const randomBonus = Math.floor(Math.random() * 5) + 1; // 1-5

    if (totalDmg === 0) {
        // Nobody attacked in 2 minutes — draw tick, each gets 1 bonus point
        atkPts = 1;
        defPts = 1;
    } else if (atkDmg === defDmg) {
        // Perfect tie — each gets the random bonus
        atkPts = randomBonus;
        defPts = randomBonus;
    } else if (atkDmg > defDmg) {
        // Attacker wins this tick
        const ratio = atkDmg / totalDmg; // e.g. 0.6
        atkPts = Math.round(ratio * 20) + randomBonus;
        defPts = 0;
    } else {
        // Defender wins this tick
        const ratio = defDmg / totalDmg;
        defPts = Math.round(ratio * 20) + randomBonus;
        atkPts = 0;
    }

    const newAtkPoints = round.attacker_points + atkPts;
    const newDefPoints = round.defender_points + defPts;

    // Log the tick
    await prisma.battleTick.create({
        data: {
            round_id: round.id,
            tick_number: tickNumber,
            attacker_dmg: atkDmg,
            defender_dmg: defDmg,
            attacker_pts: atkPts,
            defender_pts: defPts
        }
    });

    // Check if round is over (500 points target or 30-min timeout)
    const now = new Date();
    const roundDuration = now - new Date(round.started_at);
    const timedOut = roundDuration >= ROUND_TIMEOUT_MS;

    let roundWinner = null;

    if (newAtkPoints >= POINTS_TO_WIN_ROUND && newDefPoints >= POINTS_TO_WIN_ROUND) {
        // Both reached 500 in the same tick — whoever is higher wins; if equal, draw
        if (newAtkPoints > newDefPoints) roundWinner = 'ATTACKER';
        else if (newDefPoints > newAtkPoints) roundWinner = 'DEFENDER';
        else roundWinner = 'DRAW';
    } else if (newAtkPoints >= POINTS_TO_WIN_ROUND) {
        roundWinner = 'ATTACKER';
    } else if (newDefPoints >= POINTS_TO_WIN_ROUND) {
        roundWinner = 'DEFENDER';
    } else if (timedOut) {
        // Timeout: whoever has more points wins; tie = draw
        if (newAtkPoints > newDefPoints) roundWinner = 'ATTACKER';
        else if (newDefPoints > newAtkPoints) roundWinner = 'DEFENDER';
        else roundWinner = 'DRAW';
    }

    // Update round with new points and reset tick accumulators
    const updatedRound = await prisma.battleRound.update({
        where: { id: round.id },
        data: {
            attacker_points: newAtkPoints,
            defender_points: newDefPoints,
            attacker_dmg_since_tick: 0,
            defender_dmg_since_tick: 0,
            last_tick_at: now,
            status: roundWinner
                ? (roundWinner === 'ATTACKER' ? 'ATTACKER_WON'
                    : roundWinner === 'DEFENDER' ? 'DEFENDER_WON'
                    : 'DRAW')
                : 'ONGOING',
            ended_at: roundWinner ? now : null
        }
    });

    let battleResult = null;

    if (roundWinner) {
        // Update battle rounds_won counters
        const newBattleData = {
            attacker_rounds_won: battle.attacker_rounds_won + (roundWinner === 'ATTACKER' ? 1 : 0),
            defender_rounds_won: battle.defender_rounds_won + (roundWinner === 'DEFENDER' ? 1 : 0)
        };

        const updatedBattle = await prisma.battle.update({
            where: { id: battle.id },
            data: newBattleData,
            include: { territory: true }
        });

        // Check if battle is over (best of 3: first to 2 round wins)
        if (updatedBattle.attacker_rounds_won >= 2) {
            battleResult = await _endBattle(updatedBattle, 'ATTACKER_WON');
        } else if (updatedBattle.defender_rounds_won >= 2) {
            battleResult = await _endBattle(updatedBattle, 'DEFENDER_WON');
        } else {
            // Start next round
            const nextRoundNumber = round.round_number + 1;
            if (nextRoundNumber <= 3) {
                await _startNewRound(battle.id, nextRoundNumber);
            }
            battleResult = { status: 'ROUND_ENDED', roundWinner, nextRound: nextRoundNumber };
        }
    }

    return {
        tickTriggered: true,
        tickNumber,
        tickWinner: atkPts > defPts ? 'attacker' : defPts > atkPts ? 'defender' : 'draw',
        atkPts,
        defPts,
        roundWinner,
        newAtkPoints,
        newDefPoints,
        battleResult,
        updatedRound
    };
}

/**
 * Start a new round for an ongoing battle.
 */
async function _startNewRound(battleId, roundNumber) {
    return await prisma.battleRound.create({
        data: {
            battle_id: battleId,
            round_number: roundNumber,
            status: 'ONGOING'
        }
    });
}

/**
 * End the entire battle: update territory ownership and mark battle as finished.
 */
async function _endBattle(battle, finalStatus) {
    const territory = battle.territory;

    if (finalStatus === 'ATTACKER_WON') {
        await prisma.territory.update({
            where: { id: territory.id },
            data: { kingdom_id: battle.attacker_kingdom_id, troops_count: 100 }
        });
    }
    // Defender won → territory stays as is, just restore troops
    else {
        await prisma.territory.update({
            where: { id: territory.id },
            data: { troops_count: 100 }
        });
    }

    await prisma.battle.update({
        where: { id: battle.id },
        data: { status: finalStatus, ended_at: new Date() }
    });

    return { status: finalStatus };
}

/**
 * Get the active round for a battle, including recent ticks.
 */
async function _getActiveRound(battleId) {
    return await prisma.battleRound.findFirst({
        where: { battle_id: battleId, status: 'ONGOING' },
        include: {
            ticks: { orderBy: { tick_number: 'desc' }, take: 5 }
        }
    });
}

/**
 * Declare war on a territory — creates Battle + first BattleRound
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

    // Create battle and first round together
    const battle = await prisma.battle.create({
        data: {
            territory_id: territory.id,
            attacker_kingdom_id,
            defender_kingdom_id: territory.kingdom_id,
            status: 'ONGOING',
            rounds: {
                create: {
                    round_number: 1,
                    status: 'ONGOING'
                }
            }
        },
        include: { rounds: true }
    });

    return { territory, battle };
}

/**
 * Execute an attack action on a territory.
 * Accumulates damage on the active round and triggers a tick if 2 minutes have passed.
 */
async function helpAttack({ territory_code, player_id }) {
    let territory = await prisma.territory.findUnique({
        where: { code: territory_code },
        include: {
            battles: {
                where: { status: 'ONGOING' },
                orderBy: { started_at: 'desc' },
                take: 1,
                include: { rounds: { where: { status: 'ONGOING' }, take: 1, include: { ticks: { orderBy: { tick_number: 'desc' }, take: 5 } } } }
            }
        }
    });

    if (!territory || territory.battles.length === 0) {
        const err = new Error('Tidak ada peperangan aktif di wilayah ini.');
        err.status = 400;
        throw err;
    }

    const ongoingBattle = territory.battles[0];
    const activeRound = ongoingBattle.rounds[0];

    if (!activeRound) {
        const err = new Error('Ronde pertempuran tidak ditemukan.');
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

    const goldGain = Math.floor(Math.random() * 7) + 2;
    const gainedExp = 10;
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
            gold: playerRefreshed.gold - hitCost + goldGain,
            stamina: playerRefreshed.stamina - staminaCost,
            last_stamina_regen: new Date(),
            level: newLevel,
            exp: newExp,
            skill_points: playerRefreshed.skill_points + gainedPoints
        },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });

    // Accumulate attacker damage on the active round
    const updatedRoundData = await prisma.battleRound.update({
        where: { id: activeRound.id },
        data: { attacker_dmg_since_tick: { increment: damage } },
        include: { ticks: { orderBy: { tick_number: 'desc' }, take: 5 } }
    });

    // Check if 2 minutes have passed since last tick → trigger tick
    const now = new Date();
    const lastTick = new Date(updatedRoundData.last_tick_at);
    const elapsed = now - lastTick;

    let tickResult = null;
    if (elapsed >= TICK_INTERVAL_MS) {
        const freshBattle = await prisma.battle.findUnique({
            where: { id: ongoingBattle.id }
        });
        tickResult = await _processTick(updatedRoundData, freshBattle);
    }

    // Refresh round data to return current state
    const currentRound = tickResult
        ? tickResult.updatedRound
        : updatedRoundData;

    return {
        damage,
        isCrit,
        agiTriggered,
        durabilityLostItem,
        goldChange: -hitCost + goldGain,
        staminaCost,
        expGained: gainedExp,
        leveledUp,
        newLevel,
        newExp,
        gainedPoints,
        player: updatedPlayer,
        // Round & battle state
        roundNumber: activeRound.round_number,
        attacker_points: currentRound.attacker_points,
        defender_points: currentRound.defender_points,
        attacker_dmg_since_tick: currentRound.attacker_dmg_since_tick,
        defender_dmg_since_tick: currentRound.defender_dmg_since_tick,
        points_to_win: POINTS_TO_WIN_ROUND,
        attacker_rounds_won: ongoingBattle.attacker_rounds_won,
        defender_rounds_won: ongoingBattle.defender_rounds_won,
        tick_triggered: tickResult ? tickResult.tickTriggered : false,
        tick_winner: tickResult ? tickResult.tickWinner : null,
        tick_attacker_pts: tickResult ? tickResult.atkPts : null,
        tick_defender_pts: tickResult ? tickResult.defPts : null,
        round_winner: tickResult ? tickResult.roundWinner : null,
        battle_result: tickResult ? tickResult.battleResult : null
    };
}

/**
 * Execute a defend action on a territory.
 * Accumulates defender damage on the active round and triggers a tick if 2 minutes have passed.
 */
async function defendTerritory({ territory_code, player_id }) {
    let territory = await prisma.territory.findUnique({
        where: { code: territory_code },
        include: {
            battles: {
                where: { status: 'ONGOING' },
                orderBy: { started_at: 'desc' },
                take: 1,
                include: { rounds: { where: { status: 'ONGOING' }, take: 1, include: { ticks: { orderBy: { tick_number: 'desc' }, take: 5 } } } }
            }
        }
    });

    if (!territory || territory.battles.length === 0) {
        const err = new Error('Tidak ada peperangan aktif di wilayah ini.');
        err.status = 400;
        throw err;
    }

    const ongoingBattle = territory.battles[0];
    const activeRound = ongoingBattle.rounds[0];

    if (!activeRound) {
        const err = new Error('Ronde pertempuran tidak ditemukan.');
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

    const goldGain = Math.floor(Math.random() * 7) + 2;
    const gainedExp = 10;
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
            gold: playerRefreshed.gold - hitCost + goldGain,
            stamina: playerRefreshed.stamina - staminaCost,
            last_stamina_regen: new Date(),
            level: newLevel,
            exp: newExp,
            skill_points: playerRefreshed.skill_points + gainedPoints
        },
        include: { kingdom: true, equipments: { orderBy: { created_at: 'desc' } } }
    });

    // Accumulate defender damage on the active round
    const updatedRoundData = await prisma.battleRound.update({
        where: { id: activeRound.id },
        data: { defender_dmg_since_tick: { increment: heal } },
        include: { ticks: { orderBy: { tick_number: 'desc' }, take: 5 } }
    });

    // Check if 2 minutes have passed since last tick → trigger tick
    const now = new Date();
    const lastTick = new Date(updatedRoundData.last_tick_at);
    const elapsed = now - lastTick;

    let tickResult = null;
    if (elapsed >= TICK_INTERVAL_MS) {
        const freshBattle = await prisma.battle.findUnique({
            where: { id: ongoingBattle.id }
        });
        tickResult = await _processTick(updatedRoundData, freshBattle);
    }

    const currentRound = tickResult
        ? tickResult.updatedRound
        : updatedRoundData;

    return {
        heal,
        agiTriggered,
        durabilityLostItem,
        goldChange: -hitCost + goldGain,
        staminaCost,
        expGained: gainedExp,
        leveledUp,
        newLevel,
        newExp,
        gainedPoints,
        player: updatedPlayer,
        // Round & battle state
        roundNumber: activeRound.round_number,
        attacker_points: currentRound.attacker_points,
        defender_points: currentRound.defender_points,
        attacker_dmg_since_tick: currentRound.attacker_dmg_since_tick,
        defender_dmg_since_tick: currentRound.defender_dmg_since_tick,
        points_to_win: POINTS_TO_WIN_ROUND,
        attacker_rounds_won: ongoingBattle.attacker_rounds_won,
        defender_rounds_won: ongoingBattle.defender_rounds_won,
        tick_triggered: tickResult ? tickResult.tickTriggered : false,
        tick_winner: tickResult ? tickResult.tickWinner : null,
        tick_attacker_pts: tickResult ? tickResult.atkPts : null,
        tick_defender_pts: tickResult ? tickResult.defPts : null,
        round_winner: tickResult ? tickResult.roundWinner : null,
        battle_result: tickResult ? tickResult.battleResult : null
    };
}

/**
 * Force-process the current tick for a territory's active battle.
 * Called when frontend countdown reaches 0.
 * If the 2-minute interval has NOT actually passed yet, this is a no-op.
 */
async function processTick(territory_code) {
    const territory = await prisma.territory.findUnique({
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
        return { active: false };
    }

    const battle = territory.battles[0];

    const activeRound = await prisma.battleRound.findFirst({
        where: { battle_id: battle.id, status: 'ONGOING' },
        include: { ticks: { orderBy: { tick_number: 'desc' }, take: 5 } }
    });

    if (!activeRound) {
        return { active: false };
    }

    const now = new Date();
    const elapsed = now - new Date(activeRound.last_tick_at);

    // Only process if 2 minutes have actually passed (allow 1s grace period)
    if (elapsed < TICK_INTERVAL_MS - 1000) {
        const secondsLeft = Math.ceil((TICK_INTERVAL_MS - elapsed) / 1000);
        return { active: true, tick_processed: false, secondsLeft };
    }

    const freshBattle = await prisma.battle.findUnique({ where: { id: battle.id } });
    const tickResult = await _processTick(activeRound, freshBattle);

    // Fetch updated battle status
    const battleStatus = await getBattleStatus(territory_code);

    return {
        active: true,
        tick_processed: true,
        tick_winner: tickResult.tickWinner,
        attacker_pts: tickResult.atkPts,
        defender_pts: tickResult.defPts,
        round_winner: tickResult.roundWinner,
        battle_result: tickResult.battleResult,
        battleStatus
    };
}

/**
 * Get current battle status for a territory (for polling from frontend)
 */
async function getBattleStatus(territory_code) {
    const territory = await prisma.territory.findUnique({
        where: { code: territory_code },
        include: {
            battles: {
                where: { status: 'ONGOING' },
                orderBy: { started_at: 'desc' },
                take: 1,
                include: {
                    attacker_kingdom: true,
                    defender_kingdom: true,
                    rounds: {
                        orderBy: { round_number: 'desc' },
                        take: 3,
                        include: {
                            ticks: { orderBy: { tick_number: 'desc' }, take: 5 }
                        }
                    }
                }
            },
            kingdom: true
        }
    });

    if (!territory || territory.battles.length === 0) {
        return { active: false };
    }

    const battle = territory.battles[0];
    const activeRound = battle.rounds.find(r => r.status === 'ONGOING');
    const now = new Date();

    let secondsUntilNextTick = null;
    if (activeRound) {
        const elapsed = now - new Date(activeRound.last_tick_at);
        secondsUntilNextTick = Math.max(0, Math.ceil((TICK_INTERVAL_MS - elapsed) / 1000));
    }

    return {
        active: true,
        battle_id: battle.id,
        attacker_kingdom: battle.attacker_kingdom,
        defender_kingdom: battle.defender_kingdom,
        attacker_rounds_won: battle.attacker_rounds_won,
        defender_rounds_won: battle.defender_rounds_won,
        rounds: battle.rounds,
        activeRound: activeRound || null,
        secondsUntilNextTick,
        points_to_win: POINTS_TO_WIN_ROUND
    };
}

module.exports = { declareWar, helpAttack, defendTerritory, getBattleStatus, processTick };
