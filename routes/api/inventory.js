const express = require('express');
const router = express.Router();
const inventoryController = require('../../controllers/inventoryController');

// Chest
router.get('/chest_rates', inventoryController.getChestRates);
router.post('/chest_rates', inventoryController.updateChestRates);
router.post('/open_chest', inventoryController.openChest);

// Harvest
router.post('/harvest', inventoryController.harvest);

// Crafting & Shop
router.post('/craft', inventoryController.craftEquipment);
router.get('/crafting_recipes', inventoryController.getCraftingRecipes);
router.post('/buy_equipment', inventoryController.buyFromShop);
router.post('/sell_equipment', inventoryController.sellEquipment); // disabled endpoint

// Equipment management
router.post('/equip_equipment', inventoryController.equipItem);
router.post('/unequip_equipment', inventoryController.unequipItem);

module.exports = router;
