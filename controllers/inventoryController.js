const inventoryService = require('../services/inventoryService');
const { EQUIPMENT_NAMES } = require('../utils/itemData');
const { CRAFTING_RECIPES } = require('../utils/itemData');

const getChestRates = (req, res) => {
    try {
        const rates = inventoryService.getChestRates();
        res.json({ status: 'success', data: rates });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: 'error', message: 'Gagal mengambil rate chest' });
    }
};

const updateChestRates = (req, res) => {
    try {
        const rates = inventoryService.updateChestRates(req.body);
        res.json({ status: 'success', message: 'Rate chest berhasil diperbarui!', data: rates });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal memperbarui rate chest' });
    }
};

const openChest = async (req, res) => {
    try {
        const result = await inventoryService.openChest(req.body);
        res.json({ status: 'success', message: result.message, data: { equipment: result.equipment, player: result.player } });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal membuka chest' });
    }
};

const harvest = async (req, res) => {
    try {
        const result = await inventoryService.harvest(req.body);
        res.json({
            status: 'success',
            message: `Berhasil memanen ${result.harvested.count} unit ${result.harvested.label}! (+2 Gold, +5 EXP)`,
            data: result
        });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal melakukan panen sumber daya' });
    }
};

const craftEquipment = async (req, res) => {
    try {
        const result = await inventoryService.craftEquipment(req.body);
        res.json({
            status: 'success',
            message: `Berhasil manufaktur ${result.recipe.name} (${result.recipe.rarity})!`,
            data: { player: result.player, equipment: result.equipment }
        });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal membuat peralatan' });
    }
};

const buyFromShop = async (req, res) => {
    try {
        const result = await inventoryService.buyFromShop(req.body);
        res.json({
            status: 'success',
            message: `Membeli: ${result.equipment.name}`,
            data: { equipment: result.equipment, player: result.player }
        });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal membeli item' });
    }
};

const equipItem = async (req, res) => {
    try {
        const result = await inventoryService.equipItem(req.body);
        res.json({ status: 'success', message: `Berhasil memasang ${result.equipment.name}`, data: result.player });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal memasang peralatan' });
    }
};

const unequipItem = async (req, res) => {
    try {
        const result = await inventoryService.unequipItem(req.body);
        res.json({ status: 'success', message: `Berhasil melepas ${result.equipment.name}`, data: result.player });
    } catch (err) {
        console.error(err.message);
        res.status(err.status || 500).json({ status: 'error', message: err.message || 'Gagal melepas peralatan' });
    }
};

const getItemTemplates = (req, res) => {
    res.json({ status: 'success', data: EQUIPMENT_NAMES });
};

const getCraftingRecipes = (req, res) => {
    res.json({ status: 'success', data: CRAFTING_RECIPES });
};

// Disabled endpoint
const sellEquipment = (req, res) => {
    res.status(400).json({
        status: 'error',
        message: 'Penjualan langsung dinonaktifkan! Silakan gunakan tab Pasar untuk mendaftarkan antrean jual.'
    });
};

module.exports = {
    getChestRates,
    updateChestRates,
    openChest,
    harvest,
    craftEquipment,
    buyFromShop,
    equipItem,
    unequipItem,
    getItemTemplates,
    getCraftingRecipes,
    sellEquipment
};
