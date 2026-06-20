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
    const { territory_code, attacker_kingdom_id } = req.body;
    try {
        let territory = await prisma.territory.findUnique({
            where: { code: territory_code },
            include: {
                battles: {
                    where: { status: 'ONGOING', attacker_kingdom_id: attacker_kingdom_id },
                    orderBy: { started_at: 'desc' },
                    take: 1
                }
            }
        });

        if (!territory || territory.battles.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Tidak ada peperangan aktif di wilayah ini dari kerajaan Anda.' });
        }

        const damage = Math.floor(Math.random() * 11) + 10; // 10 to 20
        const newHP = Math.max(0, territory.troops_count - damage);

        if (newHP <= 0) {
            const battleId = territory.battles[0].id;
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: {
                    kingdom_id: attacker_kingdom_id,
                    troops_count: 100
                }
            });

            await prisma.battle.update({
                where: { id: battleId },
                data: { status: 'ATTACKER_WON', ended_at: new Date() }
            });

            res.json({ status: 'success', message: 'Wilayah berhasil dikuasai!', conquered: true, hp: 100 });
        } else {
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: { troops_count: newHP }
            });
            res.json({ status: 'success', message: 'Serangan berhasil!', conquered: false, hp: newHP, damage: damage });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal menyerang' });
    }
});

router.post('/game/defend_territory', async (req, res) => {
    const { territory_code, defender_kingdom_id } = req.body;
    try {
        let territory = await prisma.territory.findUnique({
            where: { code: territory_code },
            include: {
                battles: {
                    where: { status: 'ONGOING', defender_kingdom_id: defender_kingdom_id },
                    orderBy: { started_at: 'desc' },
                    take: 1
                }
            }
        });

        if (!territory || territory.kingdom_id !== defender_kingdom_id || territory.battles.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Tidak ada peperangan aktif di wilayah ini yang perlu dipertahankan.' });
        }

        const heal = Math.floor(Math.random() * 11) + 10; // 10 to 20 heal
        const newHP = Math.min(100, territory.troops_count + heal);

        if (newHP >= 100) {
            const battleId = territory.battles[0].id;
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: { troops_count: 100 }
            });

            await prisma.battle.update({
                where: { id: battleId },
                data: { status: 'DEFENDER_WON', ended_at: new Date() }
            });

            res.json({ status: 'success', message: 'Wilayah berhasil dipertahankan secara penuh!', defended: true, hp: 100 });
        } else {
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: { troops_count: newHP }
            });
            res.json({ status: 'success', message: 'Pertahanan berhasil!', defended: false, hp: newHP, heal: heal });
        }
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

module.exports = router;
