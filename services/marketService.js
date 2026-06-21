const prisma = require('../config/prisma');

/**
 * Get all market orders grouped for the order book
 */
async function getOrders() {
    const [buyOrders, sellOrders] = await Promise.all([
        prisma.marketOrder.groupBy({
            by: ['item_name', 'rarity', 'item_type', 'price'],
            where: { order_type: 'BUY' },
            _count: { id: true },
            orderBy: { price: 'desc' }
        }),
        prisma.marketOrder.groupBy({
            by: ['item_name', 'rarity', 'item_type', 'price'],
            where: { order_type: 'SELL' },
            _count: { id: true },
            orderBy: { price: 'asc' }
        })
    ]);

    return {
        buy: buyOrders.map(o => ({ name: o.item_name, rarity: o.rarity, type: o.item_type, price: o.price, count: o._count.id })),
        sell: sellOrders.map(o => ({ name: o.item_name, rarity: o.rarity, type: o.item_type, price: o.price, count: o._count.id }))
    };
}

/**
 * Get orders for a specific player
 */
async function getMyOrders(playerId) {
    return prisma.marketOrder.findMany({
        where: { player_id: parseInt(playerId) },
        include: { equipment: true },
        orderBy: { created_at: 'desc' }
    });
}

/**
 * Place a sell order (with matching engine)
 */
async function placeSellOrder({ player_id, equipment_id, price }) {
    const pId = parseInt(player_id);
    const eqId = parseInt(equipment_id);
    const sellPrice = parseInt(price);

    if (isNaN(sellPrice) || sellPrice <= 0) {
        const err = new Error('Harga jual harus lebih besar dari 0 gold');
        err.status = 400;
        throw err;
    }

    const equipment = await prisma.equipment.findFirst({ where: { id: eqId, player_id: pId } });
    if (!equipment) {
        const err = new Error('Peralatan tidak ditemukan atau bukan milik Anda');
        err.status = 404;
        throw err;
    }
    if (equipment.equipped) {
        const err = new Error('Lepas peralatan terlebih dahulu sebelum dijual di pasar');
        err.status = 400;
        throw err;
    }
    if (equipment.on_market) {
        const err = new Error('Peralatan sudah terdaftar di pasar');
        err.status = 400;
        throw err;
    }

    // Matching engine: find a BUY order with price >= sellPrice
    const matchingBuyOrder = await prisma.marketOrder.findFirst({
        where: { item_name: equipment.name, rarity: equipment.rarity, order_type: 'BUY', price: { gte: sellPrice } },
        orderBy: [{ price: 'desc' }, { created_at: 'asc' }]
    });

    if (matchingBuyOrder) {
        const dealPrice = matchingBuyOrder.price;
        await prisma.$transaction([
            prisma.player.update({ where: { id: pId }, data: { gold: { increment: dealPrice } } }),
            prisma.player.findUnique({ where: { id: matchingBuyOrder.player_id } }),
            prisma.equipment.update({ where: { id: eqId }, data: { player_id: matchingBuyOrder.player_id, on_market: false, equipped: false } }),
            prisma.marketOrder.delete({ where: { id: matchingBuyOrder.id } })
        ]);

        const finalSeller = await prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
        return {
            matched: true,
            message: `Match! Anda menjual ${equipment.name} ke ${matchingBuyOrder.player_id} seharga ${dealPrice} Gold.`,
            data: finalSeller
        };
    }

    // No match: list as SELL order
    await prisma.$transaction([
        prisma.marketOrder.create({
            data: { player_id: pId, item_name: equipment.name, rarity: equipment.rarity, item_type: equipment.type, order_type: 'SELL', price: sellPrice, equipment_id: eqId }
        }),
        prisma.equipment.update({ where: { id: eqId }, data: { on_market: true } })
    ]);

    const finalSeller = await prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
    return {
        matched: false,
        message: `Peralatan ${equipment.name} berhasil di-list di pasar seharga ${sellPrice} Gold.`,
        data: finalSeller
    };
}

/**
 * Place a buy order (with matching engine)
 */
async function placeBuyOrder({ player_id, item_name, rarity, item_type, price }) {
    const pId = parseInt(player_id);
    const buyPrice = parseInt(price);

    if (isNaN(buyPrice) || buyPrice <= 0) {
        const err = new Error('Harga beli harus lebih besar dari 0 gold');
        err.status = 400;
        throw err;
    }

    const buyer = await prisma.player.findUnique({ where: { id: pId } });
    if (!buyer) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }
    if (buyer.gold < buyPrice) {
        const err = new Error('Koin emas Anda tidak mencukupi untuk memesan order ini');
        err.status = 400;
        throw err;
    }

    // Matching engine: find a SELL order with price <= buyPrice
    const matchingSellOrder = await prisma.marketOrder.findFirst({
        where: { item_name, rarity, order_type: 'SELL', price: { lte: buyPrice } },
        include: { equipment: true },
        orderBy: [{ price: 'asc' }, { created_at: 'asc' }]
    });

    if (matchingSellOrder) {
        const dealPrice = matchingSellOrder.price;
        const refund = buyPrice - dealPrice;
        await prisma.$transaction([
            prisma.player.update({ where: { id: pId }, data: { gold: { decrement: dealPrice } } }),
            prisma.player.update({ where: { id: matchingSellOrder.player_id }, data: { gold: { increment: dealPrice } } }),
            prisma.equipment.update({ where: { id: matchingSellOrder.equipment_id }, data: { player_id: pId, on_market: false, equipped: false } }),
            prisma.marketOrder.delete({ where: { id: matchingSellOrder.id } })
        ]);

        const finalBuyer = await prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
        return {
            matched: true,
            message: `Match! Anda membeli ${item_name} seharga ${dealPrice} Gold.${refund > 0 ? ' Sisa ' + refund + ' Gold dikembalikan.' : ''}`,
            data: finalBuyer
        };
    }

    // No match: escrow gold and create BUY order
    await prisma.$transaction([
        prisma.player.update({ where: { id: pId }, data: { gold: { decrement: buyPrice } } }),
        prisma.marketOrder.create({
            data: { player_id: pId, item_name, rarity, item_type, order_type: 'BUY', price: buyPrice }
        })
    ]);

    const finalBuyer = await prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
    return {
        matched: false,
        message: `Antrean beli ${item_name} berhasil diposting seharga ${buyPrice} Gold.`,
        data: finalBuyer
    };
}

/**
 * Cancel a market order (refunds escrow for BUY orders)
 */
async function cancelOrder({ player_id, order_id }) {
    const pId = parseInt(player_id);
    const oId = parseInt(order_id);

    const order = await prisma.marketOrder.findFirst({ where: { id: oId, player_id: pId } });
    if (!order) {
        const err = new Error('Order tidak ditemukan atau bukan milik Anda');
        err.status = 404;
        throw err;
    }

    if (order.order_type === 'SELL') {
        await prisma.$transaction([
            prisma.equipment.update({ where: { id: order.equipment_id }, data: { on_market: false } }),
            prisma.marketOrder.delete({ where: { id: oId } })
        ]);
    } else {
        await prisma.$transaction([
            prisma.player.update({ where: { id: pId }, data: { gold: { increment: order.price } } }),
            prisma.marketOrder.delete({ where: { id: oId } })
        ]);
    }

    return prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
}

module.exports = { getOrders, getMyOrders, placeSellOrder, placeBuyOrder, cancelOrder };
