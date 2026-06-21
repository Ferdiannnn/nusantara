/**
 * Master API Router
 * 
 * Mounts all sub-routers under their respective prefixes.
 * All routes here are mounted at /api/game/* via app.js
 */
const express = require('express');
const router = express.Router();

const prisma = require('../../config/prisma');

// Sub-routers by domain
const authRoutes      = require('./auth');
const battleRoutes    = require('./battle');
const inventoryRoutes = require('./inventory');
const marketRoutes    = require('./market');
const mapRoutes       = require('./map');
const kingdomRoutes   = require('./kingdom');

// Mount sub-routers
router.use('/game', authRoutes);
router.use('/game', battleRoutes);
router.use('/game', inventoryRoutes);
router.use('/game/market', marketRoutes);
router.use('/game/kingdoms', kingdomRoutes);
router.use('/game', mapRoutes);

// ─── Legacy / Generic endpoints ─────────────────────────────────────────────

// GET /api/users
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.users.findMany({ orderBy: { id: 'asc' } });
        res.json({ status: 'success', data: users });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data' });
    }
});

// GET /api/users/:id
router.get('/users/:id', async (req, res) => {
    try {
        const user = await prisma.users.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!user) return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        res.json({ status: 'success', data: user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data' });
    }
});

// POST /api/users
router.post('/users', async (req, res) => {
    try {
        const newUser = await prisma.users.create({ data: { name: req.body.name } });
        res.status(201).json({ status: 'success', message: 'User berhasil ditambahkan', data: newUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal menambah data' });
    }
});

// GET /api/products
router.get('/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
        res.json({ status: 'success', data: products });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil data' });
    }
});

module.exports = router;
