const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); // Impor instansiasi Prisma Client
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

BigInt.prototype.toJSON = function () {
    return this.toString();
};

// Helper untuk hash password sederhana
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper untuk regenerasi stamina otomatis (1 stamina per 5 detik, max 100)
async function regenerateStamina(player) {
    if (!player) return null;
    if (player.stamina >= 100) {
        // Update waktu regen terakhir ke sekarang agar tidak berakumulasi jika full lalu berkurang
        if (new Date() - new Date(player.last_stamina_regen) > 5000) {
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
    
    if (secondsDiff >= 5) {
        const regenAmount = Math.floor(secondsDiff / 5);
        const newStamina = Math.min(100, player.stamina + regenAmount);
        const remainingMs = (secondsDiff % 5) * 1000;
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


// Endpoint GET: Mengambil data user menggunakan Prisma
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { id: 'asc' },
    });
    res.json({ status: 'success', data: users });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data' });
  }
});

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }
    res.json({ status: 'success', data: user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data' });
  }
});

router.post('/users', async (req, res) => {
  const { name } = req.body;
  try {
    const newUser = await prisma.users.create({
      data: { name: name },
    });
    res.status(201).json({
      status: 'success',
      message: 'User berhasil ditambahkan ke database',
      data: newUser
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'error', message: 'Gagal menambah data' });
  }
});

router.get('/products', async (req,res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { id: 'asc' },
        });
        res.json({ status: 'success', data: products });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data' });
    }
});

// GAME ENDPOINTS //
router.get('/game/territories', async (req, res) => {
    try {
        const territories = await prisma.territory.findMany({
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
        res.json({ status: 'success', data: territories });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Gagal memuat kerajaan' });
    }
});

let adjacencyData = null;
try {
    adjacencyData = JSON.parse(fs.readFileSync(path.join(__dirname, '../maps/adjacency.json')));
} catch (e) {
    console.error("Adjacency data not found!", e.message);
}

router.post('/game/declare_war', async (req, res) => {
    const { territory_code, attacker_kingdom_id, player_id } = req.body;
    try {
        const player = await prisma.player.findUnique({ where: { id: player_id } });
        if (!player || player.role !== 'KING') {
            return res.status(403).json({ status: 'error', message: 'Hanya Raja yang dapat mendeklarasikan perang!' });
        }

        const ownedTerritories = await prisma.territory.findMany({
            where: { kingdom_id: attacker_kingdom_id }
        });

        // Logika Adjacency (Batas Wilayah)
        if (ownedTerritories.length > 0 && adjacencyData) {
            let isAdjacent = false;
            for (let t of ownedTerritories) {
                const neighbors = adjacencyData[t.code] || [];
                if (neighbors.includes(territory_code) || t.code === territory_code) {
                    isAdjacent = true;
                    break;
                }
            }
            if (!isAdjacent) {
                return res.status(400).json({ status: 'error', message: 'Terlalu jauh! Anda hanya dapat menyerang wilayah yang bersebelahan dengan wilayah kekuasaan Anda.' });
            }
        }

        let territory = await prisma.territory.findUnique({
            where: { code: territory_code }
        });

        if (!territory) {
            territory = await prisma.territory.create({
                data: {
                    code: territory_code,
                    name: 'Provinsi',
                    troops_count: 100 // Default HP
                }
            });
        } else if (territory.kingdom_id === attacker_kingdom_id) {
            return res.status(400).json({ status: 'error', message: 'Wilayah ini sudah dikuasai!' });
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
            return res.status(400).json({ status: 'error', message: 'Wilayah ini sedang dalam peperangan!' });
        }

        const battle = await prisma.battle.create({
            data: {
                territory_id: territory.id,
                attacker_kingdom_id: attacker_kingdom_id,
                defender_kingdom_id: territory.kingdom_id,
                status: 'ONGOING',
            }
        });

        res.json({ status: 'success', data: { territory, battle } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mendeklarasikan perang' });
    }
});

router.post('/game/help_attack', async (req, res) => {
    const { territory_code, player_id } = req.body;
    try {
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
            return res.status(400).json({ status: 'error', message: 'Tidak ada peperangan aktif di wilayah ini.' });
        }

        const player = await prisma.player.findUnique({
            where: { id: parseInt(player_id) },
            include: { equipments: true }
        });
        if (!player) {
            return res.status(404).json({ status: 'error', message: 'Player tidak ditemukan' });
        }

        const playerRefreshed = await regenerateStamina(player);

        let totalAtkBonus = 0;
        let totalDefBonus = 0;
        let totalAgiBonus = 0;
        let totalCritRateBonus = 0;
        const activeEquipments = playerRefreshed.equipments.filter(e => e.equipped && e.durability > 0);

        for (let eq of activeEquipments) {
            totalAtkBonus += eq.atk_bonus;
            totalDefBonus += eq.def_bonus;
            totalAgiBonus += eq.agi_bonus;
            totalCritRateBonus += eq.crit_rate_bonus;
        }

        const staminaCost = Math.max(2, 10 - (playerRefreshed.def_level - 1) - Math.floor(totalDefBonus / 2));
        if (playerRefreshed.stamina < staminaCost) {
            return res.status(400).json({ status: 'error', message: `Stamina tidak cukup! Butuh ${staminaCost} stamina untuk menyerang.` });
        }

        const hitCost = Math.max(1, 5 - (playerRefreshed.def_level - 1) - totalDefBonus);
        if (playerRefreshed.gold < hitCost) {
            return res.status(400).json({ status: 'error', message: `Gold tidak cukup! Butuh ${hitCost} gold untuk menyerang.` });
        }

        let agiTriggered = false;
        let updatedEquipmentId = null;
        let newDurability = 0;
        let durabilityLostItem = '';

        if (activeEquipments.length > 0) {
            const agiRate = Math.min(85, (playerRefreshed.agi_level * 5) + totalAgiBonus);
            if (Math.random() * 100 < agiRate) {
                agiTriggered = true;
            } else {
                const randomEq = activeEquipments[Math.floor(Math.random() * activeEquipments.length)];
                updatedEquipmentId = randomEq.id;
                newDurability = Math.max(0, randomEq.durability - 5);
                durabilityLostItem = randomEq.name;
            }
        }

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
        let goldChange = -hitCost + goldGain;
        if (newHP <= 0) {
            goldChange += 50;
        }

        const conquered = (newHP <= 0);
        const gainedExp = 10 + (conquered ? 50 : 0);

        let newExp = playerRefreshed.exp + gainedExp;
        let newLevel = playerRefreshed.level;
        let gainedPoints = 0;
        let leveledUp = false;

        while (newExp >= newLevel * 100) {
            newExp -= newLevel * 100;
            newLevel += 1;
            gainedPoints += 5;
            leveledUp = true;
        }

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
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        const ongoingBattle = territory.battles[0];
        const actualAttackerId = ongoingBattle.attacker_kingdom_id;

        if (conquered) {
            const battleId = ongoingBattle.id;
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: {
                    kingdom_id: actualAttackerId,
                    troops_count: 100
                }
            });

            await prisma.battle.update({
                where: { id: battleId },
                data: { status: 'ATTACKER_WON', ended_at: new Date() }
            });
        } else {
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: { troops_count: newHP }
            });
        }

        res.json({
            status: 'success',
            message: conquered ? 'Wilayah berhasil dikuasai!' : 'Serangan berhasil!',
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
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal menyerang' });
    }
});

router.post('/game/defend_territory', async (req, res) => {
    const { territory_code, player_id } = req.body;
    try {
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
            return res.status(400).json({ status: 'error', message: 'Tidak ada peperangan aktif di wilayah ini.' });
        }

        const player = await prisma.player.findUnique({
            where: { id: parseInt(player_id) },
            include: { equipments: true }
        });
        if (!player) {
            return res.status(404).json({ status: 'error', message: 'Player tidak ditemukan' });
        }

        const playerRefreshed = await regenerateStamina(player);

        let totalAtkBonus = 0;
        let totalDefBonus = 0;
        let totalAgiBonus = 0;
        let totalCritRateBonus = 0;
        const activeEquipments = playerRefreshed.equipments.filter(e => e.equipped && e.durability > 0);

        for (let eq of activeEquipments) {
            totalAtkBonus += eq.atk_bonus;
            totalDefBonus += eq.def_bonus;
            totalAgiBonus += eq.agi_bonus;
            totalCritRateBonus += eq.crit_rate_bonus;
        }

        const staminaCost = Math.max(2, 10 - (playerRefreshed.def_level - 1) - Math.floor(totalDefBonus / 2));
        if (playerRefreshed.stamina < staminaCost) {
            return res.status(400).json({ status: 'error', message: `Stamina tidak cukup! Butuh ${staminaCost} stamina untuk bertahan.` });
        }

        const hitCost = Math.max(1, 5 - (playerRefreshed.def_level - 1) - totalDefBonus);
        if (playerRefreshed.gold < hitCost) {
            return res.status(400).json({ status: 'error', message: `Gold tidak cukup! Butuh ${hitCost} gold untuk bertahan.` });
        }

        let agiTriggered = false;
        let updatedEquipmentId = null;
        let newDurability = 0;
        let durabilityLostItem = '';

        if (activeEquipments.length > 0) {
            const agiRate = Math.min(85, (playerRefreshed.agi_level * 5) + totalAgiBonus);
            if (Math.random() * 100 < agiRate) {
                agiTriggered = true;
            } else {
                const randomEq = activeEquipments[Math.floor(Math.random() * activeEquipments.length)];
                updatedEquipmentId = randomEq.id;
                newDurability = Math.max(0, randomEq.durability - 5);
                durabilityLostItem = randomEq.name;
            }
        }

        const baseHeal = Math.floor(Math.random() * 11) + 10;
        const heal = baseHeal + (playerRefreshed.def_level - 1) + totalDefBonus;
        const newHP = Math.min(100, territory.troops_count + heal);

        const goldGain = Math.floor(Math.random() * 7) + 2;
        let goldChange = -hitCost + goldGain;
        if (newHP >= 100) {
            goldChange += 30;
        }

        const defended = (newHP >= 100);
        const gainedExp = 10 + (defended ? 30 : 0);

        let newExp = playerRefreshed.exp + gainedExp;
        let newLevel = playerRefreshed.level;
        let gainedPoints = 0;
        let leveledUp = false;

        while (newExp >= newLevel * 100) {
            newExp -= newLevel * 100;
            newLevel += 1;
            gainedPoints += 5;
            leveledUp = true;
        }

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
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        const ongoingBattle = territory.battles[0];

        if (defended) {
            const battleId = ongoingBattle.id;
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: { troops_count: 100 }
            });

            await prisma.battle.update({
                where: { id: battleId },
                data: { status: 'DEFENDER_WON', ended_at: new Date() }
            });
        } else {
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: { troops_count: newHP }
            });
        }

        res.json({
            status: 'success',
            message: defended ? 'Wilayah berhasil dipertahankan secara penuh!' : 'Pertahanan berhasil!',
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
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mempertahankan wilayah' });
    }
});

router.get('/game/kingdoms', async (req, res) => {
    try {
        const kingdoms = await prisma.kingdom.findMany();
        res.json({ status: 'success', data: kingdoms });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Gagal memuat kerajaan' });
    }
});

router.post('/game/register', async (req, res) => {
    const { username, password, kingdom_id } = req.body;
    try {
        if (!username || !password || !kingdom_id) {
            return res.status(400).json({ status: 'error', message: 'Username, password, dan kingdom harus diisi' });
        }
        
        // Cek apakah username sudah ada
        const existing = await prisma.player.findUnique({ where: { username } });
        if (existing) {
            return res.status(400).json({ status: 'error', message: 'Username sudah digunakan' });
        }

        const kingdomPlayersCount = await prisma.player.count({ where: { kingdom_id: parseInt(kingdom_id) } });
        const role = kingdomPlayersCount === 0 ? 'KING' : 'MEMBER';

        const newPlayer = await prisma.player.create({
            data: {
                username,
                password: hashPassword(password),
                kingdom_id: parseInt(kingdom_id),
                role: role
            },
            include: { kingdom: true }
        });

        res.json({ status: 'success', data: newPlayer });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mendaftar' });
    }
});

router.post('/game/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const player = await prisma.player.findUnique({ 
            where: { username },
            include: { kingdom: true }
        });

        if (!player || player.password !== hashPassword(password)) {
            return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
        }

        res.json({ status: 'success', data: player });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal login' });
    }
});

router.get('/game/player/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const player = await prisma.player.findUnique({
            where: { id: parseInt(id) },
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        if (!player) {
            return res.status(404).json({ status: 'error', message: 'Player tidak ditemukan' });
        }
        const updatedPlayer = await regenerateStamina(player);
        res.json({ status: 'success', data: updatedPlayer });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data player' });
    }
});

router.post('/game/upgrade_skill', async (req, res) => {
    const { player_id, skill_name } = req.body;
    try {
        const player = await prisma.player.findUnique({
            where: { id: parseInt(player_id) }
        });
        if (!player) {
            return res.status(404).json({ status: 'error', message: 'Player tidak ditemukan' });
        }

        const skillField = `${skill_name}_level`;
        const validSkills = ['atk', 'def', 'agi', 'crit_rate', 'crit_dmg'];
        if (!validSkills.includes(skill_name)) {
            return res.status(400).json({ status: 'error', message: 'Skill tidak valid' });
        }

        const currentLevel = player[skillField] || 1;

        if (player.skill_points < 1) {
            return res.status(400).json({ status: 'error', message: 'Skill Point tidak cukup! Butuh 1 Skill Point.' });
        }

        const updatedPlayer = await prisma.player.update({
            where: { id: player.id },
            data: {
                skill_points: player.skill_points - 1,
                [skillField]: currentLevel + 1
            },
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        res.json({ status: 'success', message: 'Skill berhasil ditingkatkan!', data: updatedPlayer });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal meningkatkan skill' });
    }
});

router.post('/game/equip_equipment', async (req, res) => {
    const { player_id, equipment_id } = req.body;
    try {
        const equipment = await prisma.equipment.findUnique({
            where: { id: parseInt(equipment_id) }
        });
        if (!equipment || equipment.player_id !== parseInt(player_id)) {
            return res.status(404).json({ status: 'error', message: 'Peralatan tidak ditemukan' });
        }

        // Unequip items of same type
        await prisma.equipment.updateMany({
            where: {
                player_id: parseInt(player_id),
                type: equipment.type,
                equipped: true
            },
            data: { equipped: false }
        });

        // Equip this item
        await prisma.equipment.update({
            where: { id: equipment.id },
            data: { equipped: true }
        });

        const player = await prisma.player.findUnique({
            where: { id: parseInt(player_id) },
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        const updatedPlayer = await regenerateStamina(player);

        res.json({ status: 'success', message: `Berhasil memasang ${equipment.name}`, data: updatedPlayer });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal memasang peralatan' });
    }
});

router.post('/game/unequip_equipment', async (req, res) => {
    const { player_id, equipment_id } = req.body;
    try {
        const equipment = await prisma.equipment.findUnique({
            where: { id: parseInt(equipment_id) }
        });
        if (!equipment || equipment.player_id !== parseInt(player_id)) {
            return res.status(404).json({ status: 'error', message: 'Peralatan tidak ditemukan' });
        }

        // Unequip this item
        await prisma.equipment.update({
            where: { id: equipment.id },
            data: { equipped: false }
        });

        const player = await prisma.player.findUnique({
            where: { id: parseInt(player_id) },
            include: {
                kingdom: true,
                equipments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        const updatedPlayer = await regenerateStamina(player);

        res.json({ status: 'success', message: `Berhasil melepas ${equipment.name}`, data: updatedPlayer });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal melepas peralatan' });
    }
});


const WEAPON_NAMES = {
    COMMON: ["Pedang Berkarat", "Keris Tumpul", "Bambu Runcing"],
    RARE: ["Pedang Baja", "Keris Pusaka", "Tombak Prajurit"],
    EPIC: ["Pedang Gajah Mada", "Keris Empu Gandring", "Busur Wijayadanu"],
    LEGENDARY: ["Nenggala", "Pasupati", "Cakra Basudewa"]
};
const ARMOR_NAMES = {
    COMMON: ["Baju Kulit Kusut", "Rompi Bambu", "Jubah Kain"],
    RARE: ["Zirah Besi Rakyat", "Rompi Kulit Harimau", "Zirah Tembaga"],
    EPIC: ["Zirah Ksatria Majapahit", "Rompi Wesi Kuning", "Jubah Siliwangi"],
    LEGENDARY: ["Zirah Antakusuma", "Perisai Dewata", "Jubah Mahapatih"]
};
const BOOTS_NAMES = {
    COMMON: ["Sandal Jerami", "Terompah Kayu", "Sandal Kulit Kusam"],
    RARE: ["Sepatu Bot Prajurit", "Sandal Kulit Kerbau", "Sepatu Pengintai"],
    EPIC: ["Sepatu Bayu", "Sepatu Bot Pengembara", "Sandal Angin"],
    LEGENDARY: ["Sepatu Kresna", "Sepatu Bot Gatotkaca", "Langkah Jagad"]
};
const HELMET_NAMES = {
    COMMON: ["Helm Bambu", "Caping Bambu", "Helm Kulit Kusam"],
    RARE: ["Pelindung Kepala Prajurit", "Helm Tembaga", "Caping Besi"],
    EPIC: ["Kulkul Perunggu", "Helm Ksatria Majapahit", "Mahkota Kayu"],
    LEGENDARY: ["Mahkota Hayam Wuruk", "Kulkul Dewata", "Helm Antakusuma"]
};
const ARMS_NAMES = {
    COMMON: ["Pelindung Lengan Kulit", "Sarung Tangan Kain", "Lengan Lapis Bambu"],
    RARE: ["Lengan Besi Prajurit", "Sarung Tangan Kulit Tebal", "Lengan Tembaga"],
    EPIC: ["Lengan Ksatria Majapahit", "Gelang Nanggala", "Sarung Tangan Harimau"],
    LEGENDARY: ["Gelang Pasupati", "Lengan Mahapatih", "Sarung Tangan Kresna"]
};
const LEG_NAMES = {
    COMMON: ["Pelindung Kaki Kulit", "Pelindung Kaki Bambu", "Pelindung Kaki Kain"],
    RARE: ["Pelindung Kaki Besi", "Pelindung Kaki Tembaga", "Celana Kulit Tebal"],
    EPIC: ["Kaki Ksatria Majapahit", "Pelindung Kaki Wesi Kuning", "Celana Siliwangi"],
    LEGENDARY: ["Pelindung Kaki Antakusuma", "Langkah Gatotkaca", "Kaki Langkah Jagad"]
};


router.post('/game/open_chest', async (req, res) => {
    const { player_id } = req.body;
    try {
        const player = await prisma.player.findUnique({
            where: { id: parseInt(player_id) }
        });
        if (!player) {
            return res.status(404).json({ status: 'error', message: 'Player tidak ditemukan' });
        }

        const cost = 50;
        if (player.gold < cost) {
            return res.status(400).json({ status: 'error', message: `Gold tidak cukup! Chest seharga ${cost} gold.` });
        }

        const rand = Math.random() * 100;
        let rarity = 'COMMON';
        let sellPrice = 10;
        if (rand < 3) {
            rarity = 'LEGENDARY';
            sellPrice = 120;
        } else if (rand < 15) {
            rarity = 'EPIC';
            sellPrice = 55;
        } else if (rand < 40) {
            rarity = 'RARE';
            sellPrice = 25;
        }

        const types = ['WEAPON', 'ARMOR', 'BOOTS', 'HELMET', 'ARMS', 'LEG'];
        const type = types[Math.floor(Math.random() * types.length)];

        let atkBonus = 0;
        let defBonus = 0;
        let agiBonus = 0;
        let critRateBonus = 0;
        let name = '';

        if (type === 'WEAPON') {
            const names = WEAPON_NAMES[rarity];
            name = names[Math.floor(Math.random() * names.length)];
            if (rarity === 'COMMON') atkBonus = Math.floor(Math.random() * 3) + 1;
            else if (rarity === 'RARE') atkBonus = Math.floor(Math.random() * 4) + 4;
            else if (rarity === 'EPIC') atkBonus = Math.floor(Math.random() * 5) + 8;
            else if (rarity === 'LEGENDARY') atkBonus = Math.floor(Math.random() * 6) + 15;
        } else if (type === 'ARMOR') {
            const names = ARMOR_NAMES[rarity];
            name = names[Math.floor(Math.random() * names.length)];
            if (rarity === 'COMMON') defBonus = Math.floor(Math.random() * 2) + 1;
            else if (rarity === 'RARE') defBonus = Math.floor(Math.random() * 3) + 3;
            else if (rarity === 'EPIC') defBonus = Math.floor(Math.random() * 4) + 6;
            else if (rarity === 'LEGENDARY') defBonus = Math.floor(Math.random() * 6) + 10;
        } else if (type === 'BOOTS') {
            const names = BOOTS_NAMES[rarity];
            name = names[Math.floor(Math.random() * names.length)];
            if (rarity === 'COMMON') agiBonus = Math.floor(Math.random() * 3) + 1;
            else if (rarity === 'RARE') agiBonus = Math.floor(Math.random() * 3) + 4;
            else if (rarity === 'EPIC') agiBonus = Math.floor(Math.random() * 4) + 7;
            else if (rarity === 'LEGENDARY') agiBonus = Math.floor(Math.random() * 7) + 12;
        } else if (type === 'HELMET') {
            const names = HELMET_NAMES[rarity];
            name = names[Math.floor(Math.random() * names.length)];
            if (rarity === 'COMMON') defBonus = Math.floor(Math.random() * 2) + 1;
            else if (rarity === 'RARE') defBonus = Math.floor(Math.random() * 2) + 2;
            else if (rarity === 'EPIC') defBonus = Math.floor(Math.random() * 3) + 4;
            else if (rarity === 'LEGENDARY') defBonus = Math.floor(Math.random() * 4) + 7;
        } else if (type === 'ARMS') {
            const names = ARMS_NAMES[rarity];
            name = names[Math.floor(Math.random() * names.length)];
            if (rarity === 'COMMON') critRateBonus = Math.floor(Math.random() * 2) + 2;
            else if (rarity === 'RARE') critRateBonus = Math.floor(Math.random() * 3) + 4;
            else if (rarity === 'EPIC') critRateBonus = Math.floor(Math.random() * 4) + 7;
            else if (rarity === 'LEGENDARY') critRateBonus = Math.floor(Math.random() * 6) + 12;
        } else if (type === 'LEG') {
            const names = LEG_NAMES[rarity];
            name = names[Math.floor(Math.random() * names.length)];
            if (rarity === 'COMMON') defBonus = Math.floor(Math.random() * 2) + 1;
            else if (rarity === 'RARE') defBonus = Math.floor(Math.random() * 3) + 2;
            else if (rarity === 'EPIC') defBonus = Math.floor(Math.random() * 3) + 5;
            else if (rarity === 'LEGENDARY') defBonus = Math.floor(Math.random() * 5) + 8;
        }

        const [updatedPlayer, newEquipment] = await prisma.$transaction([
            prisma.player.update({
                where: { id: player.id },
                data: { gold: player.gold - cost }
            }),
            prisma.equipment.create({
                data: {
                    player_id: player.id,
                    name: name,
                    type: type,
                    rarity: rarity,
                    atk_bonus: atkBonus,
                    def_bonus: defBonus,
                    agi_bonus: agiBonus,
                    crit_rate_bonus: critRateBonus,
                    durability: 100,
                    max_durability: 100,
                    sell_price: sellPrice
                }
            })
        ]);

        res.json({
            status: 'success',
            message: `Membuka Chest! Mendapatkan: ${name} (${rarity})`,
            data: {
                equipment: newEquipment,
                player: updatedPlayer
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal membuka chest' });
    }
});

router.post('/game/buy_equipment', async (req, res) => {
    const { player_id, item_key } = req.body;
    try {
        const player = await prisma.player.findUnique({
            where: { id: parseInt(player_id) }
        });
        if (!player) {
            return res.status(404).json({ status: 'error', message: 'Player tidak ditemukan' });
        }

        const cost = 30;
        if (player.gold < cost) {
            return res.status(400).json({ status: 'error', message: `Gold tidak cukup! Item toko seharga ${cost} gold.` });
        }

        let name = '';
        let type = '';
        let atkBonus = 0;
        let defBonus = 0;
        let agiBonus = 0;
        let critRateBonus = 0;

        if (item_key === 'wood_sword') {
            name = "Pedang Kayu";
            type = "WEAPON";
            atkBonus = 2;
        } else if (item_key === 'wood_shield') {
            name = "Perisai Kayu";
            type = "ARMOR";
            defBonus = 1;
        } else if (item_key === 'leather_boots') {
            name = "Sepatu Kulit";
            type = "BOOTS";
            agiBonus = 2;
        } else if (item_key === 'leather_helmet') {
            name = "Helm Kulit";
            type = "HELMET";
            defBonus = 1;
        } else if (item_key === 'cloth_gloves') {
            name = "Sarung Tangan Kain";
            type = "ARMS";
            critRateBonus = 2;
        } else if (item_key === 'leather_leggings') {
            name = "Celana Kulit";
            type = "LEG";
            defBonus = 1;
        } else {
            return res.status(400).json({ status: 'error', message: 'Item tidak valid' });
        }

        const [updatedPlayer, newEquipment] = await prisma.$transaction([
            prisma.player.update({
                where: { id: player.id },
                data: { gold: player.gold - cost }
            }),
            prisma.equipment.create({
                data: {
                    player_id: player.id,
                    name: name,
                    type: type,
                    rarity: 'COMMON',
                    atk_bonus: atkBonus,
                    def_bonus: defBonus,
                    agi_bonus: agiBonus,
                    crit_rate_bonus: critRateBonus,
                    durability: 100,
                    max_durability: 100,
                    sell_price: 10
                }
            })
        ]);

        res.json({
            status: 'success',
            message: `Membeli: ${name}`,
            data: {
                equipment: newEquipment,
                player: updatedPlayer
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal membeli item' });
    }
});

router.post('/game/sell_equipment', async (req, res) => {
    return res.status(400).json({ 
        status: 'error', 
        message: 'Penjualan langsung dinonaktifkan! Silakan gunakan tab Pasar untuk mendaftarkan antrean jual.' 
    });
});

// GET market templates (available names by slot & rarity)
router.get('/game/market/item_templates', (req, res) => {
    res.json({
        status: 'success',
        data: {
            WEAPON: WEAPON_NAMES,
            ARMOR: ARMOR_NAMES,
            BOOTS: BOOTS_NAMES,
            HELMET: HELMET_NAMES,
            ARMS: ARMS_NAMES,
            LEG: LEG_NAMES
        }
    });
});

// GET all market orders (grouped for order book)
router.get('/game/market/orders', async (req, res) => {
    try {
        const buyOrders = await prisma.marketOrder.groupBy({
            by: ['item_name', 'rarity', 'item_type', 'price'],
            where: { order_type: 'BUY' },
            _count: { id: true },
            orderBy: { price: 'desc' }
        });

        const sellOrders = await prisma.marketOrder.groupBy({
            by: ['item_name', 'rarity', 'item_type', 'price'],
            where: { order_type: 'SELL' },
            _count: { id: true },
            orderBy: { price: 'asc' }
        });

        res.json({
            status: 'success',
            data: {
                buy: buyOrders.map(o => ({
                    name: o.item_name,
                    rarity: o.rarity,
                    type: o.item_type,
                    price: o.price,
                    count: o._count.id
                })),
                sell: sellOrders.map(o => ({
                    name: o.item_name,
                    rarity: o.rarity,
                    type: o.item_type,
                    price: o.price,
                    count: o._count.id
                }))
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data pasar' });
    }
});

// GET active orders for a player
router.get('/game/market/my_orders/:playerId', async (req, res) => {
    try {
        const playerId = parseInt(req.params.playerId);
        const orders = await prisma.marketOrder.findMany({
            where: { player_id: playerId },
            include: { equipment: true },
            orderBy: { created_at: 'desc' }
        });

        res.json({
            status: 'success',
            data: orders
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil order saya' });
    }
});

// POST Place Sell Order
router.post('/game/market/place_sell_order', async (req, res) => {
    const { player_id, equipment_id, price } = req.body;
    try {
        const pId = parseInt(player_id);
        const eqId = parseInt(equipment_id);
        const sellPrice = parseInt(price);

        if (isNaN(sellPrice) || sellPrice <= 0) {
            return res.status(400).json({ status: 'error', message: 'Harga jual harus lebih besar dari 0 gold' });
        }

        const equipment = await prisma.equipment.findFirst({
            where: { id: eqId, player_id: pId }
        });

        if (!equipment) {
            return res.status(404).json({ status: 'error', message: 'Peralatan tidak ditemukan atau bukan milik Anda' });
        }

        if (equipment.equipped) {
            return res.status(400).json({ status: 'error', message: 'Lepas peralatan terlebih dahulu sebelum dijual di pasar' });
        }

        if (equipment.on_market) {
            return res.status(400).json({ status: 'error', message: 'Peralatan sudah terdaftar di pasar' });
        }

        // Matching Engine: Look for active BUY orders for the exact same item name and rarity with price >= sellPrice
        const matchingBuyOrder = await prisma.marketOrder.findFirst({
            where: {
                item_name: equipment.name,
                rarity: equipment.rarity,
                order_type: 'BUY',
                price: { gte: sellPrice }
            },
            orderBy: [
                { price: 'desc' }, // Highest price bid first
                { created_at: 'asc' } // Oldest bid first
            ]
        });

        if (matchingBuyOrder) {
            const buyerId = matchingBuyOrder.player_id;
            const dealPrice = matchingBuyOrder.price; // The bid price is already locked in escrow

            // Execute Transaction
            const [updatedSeller, updatedBuyer] = await prisma.$transaction([
                // 1. Give gold to seller
                prisma.player.update({
                    where: { id: pId },
                    data: { gold: { increment: dealPrice } }
                }),
                // 2. Buyer gets gold back if there is a difference (not applicable since matchingBuyOrder price is the dealPrice)
                prisma.player.findUnique({
                    where: { id: buyerId }
                }),
                // 3. Transfer equipment owner
                prisma.equipment.update({
                    where: { id: eqId },
                    data: { player_id: buyerId, on_market: false, equipped: false }
                }),
                // 4. Delete the matched BUY order
                prisma.marketOrder.delete({
                    where: { id: matchingBuyOrder.id }
                })
            ]);

            // Fetch the updated player stats to return
            const finalSeller = await prisma.player.findUnique({
                where: { id: pId },
                include: { kingdom: true }
            });

            return res.json({
                status: 'success',
                message: `Match! Anda menjual ${equipment.name} ke ${matchingBuyOrder.player_id} seharga ${dealPrice} Gold.`,
                matched: true,
                data: finalSeller
            });
        }

        // No match: list as active SELL order
        const [newOrder, updatedEq] = await prisma.$transaction([
            prisma.marketOrder.create({
                data: {
                    player_id: pId,
                    item_name: equipment.name,
                    rarity: equipment.rarity,
                    item_type: equipment.type,
                    order_type: 'SELL',
                    price: sellPrice,
                    equipment_id: eqId
                }
            }),
            prisma.equipment.update({
                where: { id: eqId },
                data: { on_market: true }
            })
        ]);

        const finalSeller = await prisma.player.findUnique({
            where: { id: pId },
            include: { kingdom: true }
        });

        res.json({
            status: 'success',
            message: `Peralatan ${equipment.name} berhasil di-list di pasar seharga ${sellPrice} Gold.`,
            matched: false,
            data: finalSeller
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal membuat order jual' });
    }
});

// POST Place Buy Order
router.post('/game/market/place_buy_order', async (req, res) => {
    const { player_id, item_name, rarity, item_type, price } = req.body;
    try {
        const pId = parseInt(player_id);
        const buyPrice = parseInt(price);

        if (isNaN(buyPrice) || buyPrice <= 0) {
            return res.status(400).json({ status: 'error', message: 'Harga beli harus lebih besar dari 0 gold' });
        }

        const buyer = await prisma.player.findUnique({
            where: { id: pId }
        });

        if (!buyer) {
            return res.status(404).json({ status: 'error', message: 'Player tidak ditemukan' });
        }

        if (buyer.gold < buyPrice) {
            return res.status(400).json({ status: 'error', message: 'Koin emas Anda tidak mencukupi untuk memesan order ini' });
        }

        // Matching Engine: Look for active SELL orders with price <= buyPrice
        const matchingSellOrder = await prisma.marketOrder.findFirst({
            where: {
                item_name: item_name,
                rarity: rarity,
                order_type: 'SELL',
                price: { lte: buyPrice }
            },
            include: { equipment: true },
            orderBy: [
                { price: 'asc' }, // Lowest price ask first
                { created_at: 'asc' } // Oldest ask first
            ]
        });

        if (matchingSellOrder) {
            const sellerId = matchingSellOrder.player_id;
            const dealPrice = matchingSellOrder.price; // We execute at the seller's offer price
            const refund = buyPrice - dealPrice;

            // Execute Transaction
            const [updatedBuyer, updatedSeller] = await prisma.$transaction([
                // 1. Deduct price from buyer and refund difference
                prisma.player.update({
                    where: { id: pId },
                    data: { gold: { decrement: dealPrice } }
                }),
                // 2. Give gold to seller
                prisma.player.update({
                    where: { id: sellerId },
                    data: { gold: { increment: dealPrice } }
                }),
                // 3. Transfer equipment owner
                prisma.equipment.update({
                    where: { id: matchingSellOrder.equipment_id },
                    data: { player_id: pId, on_market: false, equipped: false }
                }),
                // 4. Delete matched SELL order
                prisma.marketOrder.delete({
                    where: { id: matchingSellOrder.id }
                })
            ]);

            const finalBuyer = await prisma.player.findUnique({
                where: { id: pId },
                include: { kingdom: true }
            });

            return res.json({
                status: 'success',
                message: `Match! Anda membeli ${item_name} seharga ${dealPrice} Gold.${refund > 0 ? ' Sisa ' + refund + ' Gold dikembalikan.' : ''}`,
                matched: true,
                data: finalBuyer
            });
        }

        // No match: Escrow buyer gold and place BUY order
        const [updatedBuyer, newOrder] = await prisma.$transaction([
            prisma.player.update({
                where: { id: pId },
                data: { gold: { decrement: buyPrice } }
            }),
            prisma.marketOrder.create({
                data: {
                    player_id: pId,
                    item_name: item_name,
                    rarity: rarity,
                    item_type: item_type,
                    order_type: 'BUY',
                    price: buyPrice
                }
            })
        ]);

        const finalBuyer = await prisma.player.findUnique({
            where: { id: pId },
            include: { kingdom: true }
        });

        res.json({
            status: 'success',
            message: `Antrean beli ${item_name} berhasil diposting seharga ${buyPrice} Gold.`,
            matched: false,
            data: finalBuyer
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal membuat order beli' });
    }
});

// POST Cancel Market Order
router.post('/game/market/cancel_order', async (req, res) => {
    const { player_id, order_id } = req.body;
    try {
        const pId = parseInt(player_id);
        const oId = parseInt(order_id);

        const order = await prisma.marketOrder.findFirst({
            where: { id: oId, player_id: pId }
        });

        if (!order) {
            return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan atau bukan milik Anda' });
        }

        if (order.order_type === 'SELL') {
            // Cancel Sell: Update equipment on_market = false
            await prisma.$transaction([
                prisma.equipment.update({
                    where: { id: order.equipment_id },
                    data: { on_market: false }
                }),
                prisma.marketOrder.delete({
                    where: { id: oId }
                })
            ]);
        } else {
            // Cancel Buy: Refund locked escrow gold to buyer
            await prisma.$transaction([
                prisma.player.update({
                    where: { id: pId },
                    data: { gold: { increment: order.price } }
                }),
                prisma.marketOrder.delete({
                    where: { id: oId }
                })
            ]);
        }

        const finalPlayer = await prisma.player.findUnique({
            where: { id: pId },
            include: { kingdom: true }
        });

        res.json({
            status: 'success',
            message: 'Order berhasil dibatalkan.',
            data: finalPlayer
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal membatalkan order' });
    }
});

module.exports = router; // Trigger reload
