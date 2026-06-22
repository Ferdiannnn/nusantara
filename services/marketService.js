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
async function placeSellOrder({ player_id, equipment_id, item_name, item_type, price, quantity = 1 }) {
    const pId = parseInt(player_id);
    const sellPrice = parseInt(price);
    const qty = parseInt(quantity) || 1;

    if (isNaN(sellPrice) || sellPrice <= 0) {
        const err = new Error('Harga jual harus lebih besar dari 0 gold');
        err.status = 400;
        throw err;
    }
    if (qty <= 0) {
        const err = new Error('Kuantitas harus lebih besar dari 0');
        err.status = 400;
        throw err;
    }

    if (item_type === 'RESOURCE') {
        const validResources = ['wood', 'iron', 'spices'];
        const rName = item_name?.toLowerCase();
        if (!validResources.includes(rName)) {
            const err = new Error('Resource tidak valid');
            err.status = 400;
            throw err;
        }

        const seller = await prisma.player.findUnique({ where: { id: pId } });
        if (!seller || seller[rName] < qty) {
            const err = new Error(`Anda tidak memiliki cukup ${item_name}`);
            err.status = 400;
            throw err;
        }

        // Loop per unit for matching
        let matchedCount = 0;
        let totalEarnings = 0;
        let currentSellerResource = seller[rName];

        for (let i = 0; i < qty; i++) {
            const matchingBuyOrder = await prisma.marketOrder.findFirst({
                where: { item_name, rarity: 'COMMON', item_type: 'RESOURCE', order_type: 'BUY', price: { gte: sellPrice } },
                orderBy: [{ price: 'desc' }, { created_at: 'asc' }]
            });

            if (matchingBuyOrder) {
                const dealPrice = matchingBuyOrder.price;
                await prisma.$transaction([
                    prisma.player.update({ where: { id: pId }, data: { gold: { increment: dealPrice }, [rName]: { decrement: 1 } } }),
                    prisma.player.update({ where: { id: matchingBuyOrder.player_id }, data: { [rName]: { increment: 1 } } }),
                    prisma.marketOrder.delete({ where: { id: matchingBuyOrder.id } })
                ]);
                matchedCount++;
                totalEarnings += dealPrice;
                currentSellerResource--;
            } else {
                // No match, create SELL order and escrow resource
                await prisma.$transaction([
                    prisma.marketOrder.create({
                        data: { player_id: pId, item_name, rarity: 'COMMON', item_type: 'RESOURCE', order_type: 'SELL', price: sellPrice }
                    }),
                    prisma.player.update({ where: { id: pId }, data: { [rName]: { decrement: 1 } } })
                ]);
                currentSellerResource--;
            }
        }

        const finalSeller = await prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
        return {
            matched: matchedCount > 0,
            message: `Memproses ${qty}x ${item_name}. ${matchedCount > 0 ? `Terjual ${matchedCount}x seharga total ${totalEarnings} Gold.` : ''} ${qty - matchedCount > 0 ? `${qty - matchedCount}x dimasukkan ke antrean pasar.` : ''}`,
            data: finalSeller
        };

    } else {
        // Equipment logic
        const eqId = parseInt(equipment_id);
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
}

/**
 * Place a buy order (with matching engine)
 */
async function placeBuyOrder({ player_id, item_name, rarity, item_type, price, quantity = 1 }) {
    const pId = parseInt(player_id);
    const buyPrice = parseInt(price);
    const qty = parseInt(quantity) || 1;

    if (isNaN(buyPrice) || buyPrice <= 0) {
        const err = new Error('Harga beli harus lebih besar dari 0 gold');
        err.status = 400;
        throw err;
    }
    if (qty <= 0) {
        const err = new Error('Kuantitas harus lebih besar dari 0');
        err.status = 400;
        throw err;
    }

    const totalCost = buyPrice * qty;
    const buyer = await prisma.player.findUnique({ where: { id: pId } });
    if (!buyer) {
        const err = new Error('Player tidak ditemukan');
        err.status = 404;
        throw err;
    }
    if (buyer.gold < totalCost) {
        const err = new Error('Koin emas Anda tidak mencukupi untuk memesan order ini');
        err.status = 400;
        throw err;
    }

    if (item_type === 'RESOURCE') {
        const validResources = ['wood', 'iron', 'spices'];
        const rName = item_name?.toLowerCase();
        if (!validResources.includes(rName)) {
            const err = new Error('Resource tidak valid');
            err.status = 400;
            throw err;
        }

        let matchedCount = 0;
        let totalRefund = 0;
        let totalSpent = 0;

        for (let i = 0; i < qty; i++) {
            const matchingSellOrder = await prisma.marketOrder.findFirst({
                where: { item_name, rarity: 'COMMON', item_type: 'RESOURCE', order_type: 'SELL', price: { lte: buyPrice } },
                orderBy: [{ price: 'asc' }, { created_at: 'asc' }]
            });

            if (matchingSellOrder) {
                const dealPrice = matchingSellOrder.price;
                const refund = buyPrice - dealPrice;
                await prisma.$transaction([
                    prisma.player.update({ where: { id: pId }, data: { gold: { decrement: dealPrice }, [rName]: { increment: 1 } } }),
                    prisma.player.update({ where: { id: matchingSellOrder.player_id }, data: { gold: { increment: dealPrice } } }),
                    prisma.marketOrder.delete({ where: { id: matchingSellOrder.id } })
                ]);
                matchedCount++;
                totalSpent += dealPrice;
                totalRefund += refund;
            } else {
                // No match, create BUY order and escrow gold
                await prisma.$transaction([
                    prisma.player.update({ where: { id: pId }, data: { gold: { decrement: buyPrice } } }),
                    prisma.marketOrder.create({
                        data: { player_id: pId, item_name, rarity: 'COMMON', item_type: 'RESOURCE', order_type: 'BUY', price: buyPrice }
                    })
                ]);
            }
        }

        const finalBuyer = await prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
        return {
            matched: matchedCount > 0,
            message: `Memproses pesanan beli ${qty}x ${item_name}. ${matchedCount > 0 ? `Berhasil membeli ${matchedCount}x seharga total ${totalSpent} Gold.` : ''} ${qty - matchedCount > 0 ? `${qty - matchedCount}x dimasukkan ke antrean pasar.` : ''}`,
            data: finalBuyer
        };

    } else {
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
}

/**
 * Cancel a market order (refunds escrow for BUY orders and resources/equipment for SELL)
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
        if (order.item_type === 'RESOURCE') {
            const rName = order.item_name.toLowerCase();
            await prisma.$transaction([
                prisma.player.update({ where: { id: pId }, data: { [rName]: { increment: 1 } } }),
                prisma.marketOrder.delete({ where: { id: oId } })
            ]);
        } else {
            await prisma.$transaction([
                prisma.equipment.update({ where: { id: order.equipment_id }, data: { on_market: false } }),
                prisma.marketOrder.delete({ where: { id: oId } })
            ]);
        }
    } else {
        await prisma.$transaction([
            prisma.player.update({ where: { id: pId }, data: { gold: { increment: order.price } } }),
            prisma.marketOrder.delete({ where: { id: oId } })
        ]);
    }

    return prisma.player.findUnique({ where: { id: pId }, include: { kingdom: true } });
}

module.exports = { getOrders, getMyOrders, placeSellOrder, placeBuyOrder, cancelOrder };
