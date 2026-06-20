const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); // Impor instansiasi Prisma Client
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
            include: { kingdom: true }
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

router.post('/game/attack', async (req, res) => {
    const { territory_code, attacker_kingdom_id } = req.body;
    try {
        // Cek wilayah yang dikuasai kerajaan penyerang
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

        // Logika sederhana: jika diserang, langsung pindah kepemilikan
        let territory = await prisma.territory.findUnique({
            where: { code: territory_code }
        });

        if (!territory) {
            // Jika territory belum ada di database, buat baru dan jadikan milik attacker
            territory = await prisma.territory.create({
                data: {
                    code: territory_code,
                    name: 'Provinsi', // Di aplikasi nyata, ambil dari nama JSON
                    kingdom_id: attacker_kingdom_id,
                    troops_count: 10
                }
            });
        } else {
            // Jika sudah ada, update kepemilikannya
            territory = await prisma.territory.update({
                where: { code: territory_code },
                data: {
                    kingdom_id: attacker_kingdom_id,
                    troops_count: 10
                }
            });
        }

        res.json({ status: 'success', data: territory });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal menyerang wilayah' });
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

        const newPlayer = await prisma.player.create({
            data: {
                username,
                password: hashPassword(password),
                kingdom_id: parseInt(kingdom_id)
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
