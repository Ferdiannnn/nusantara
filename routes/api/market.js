const express = require('express');
const router = express.Router();
const marketController = require('../../controllers/marketController');
const inventoryController = require('../../controllers/inventoryController');

// Order book & player orders
router.get('/orders', marketController.getOrders);
router.get('/my_orders/:playerId', marketController.getMyOrders);

// Item templates (for market listing UI)
router.get('/item_templates', inventoryController.getItemTemplates);

// Order placement
router.post('/place_sell_order', marketController.placeSellOrder);
router.post('/place_buy_order', marketController.placeBuyOrder);
router.post('/cancel_order', marketController.cancelOrder);

module.exports = router;
