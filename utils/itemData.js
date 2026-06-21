// Centralized item data: equipment names, crafting recipes, shop items

const EQUIPMENT_NAMES = {
    WEAPON: {
        COMMON: ["Pedang Berkarat", "Keris Tumpul", "Bambu Runcing"],
        RARE: ["Pedang Baja", "Keris Pusaka", "Tombak Prajurit"],
        EPIC: ["Pedang Gajah Mada", "Keris Empu Gandring", "Busur Wijayadanu"],
        LEGENDARY: ["Nenggala", "Pasupati", "Cakra Basudewa"]
    },
    ARMOR: {
        COMMON: ["Baju Kulit Kusut", "Rompi Bambu", "Jubah Kain"],
        RARE: ["Zirah Besi Rakyat", "Rompi Kulit Harimau", "Zirah Tembaga"],
        EPIC: ["Zirah Ksatria Majapahit", "Rompi Wesi Kuning", "Jubah Siliwangi"],
        LEGENDARY: ["Zirah Antakusuma", "Perisai Dewata", "Jubah Mahapatih"]
    },
    BOOTS: {
        COMMON: ["Sandal Jerami", "Terompah Kayu", "Sandal Kulit Kusam"],
        RARE: ["Sepatu Bot Prajurit", "Sandal Kulit Kerbau", "Sepatu Pengintai"],
        EPIC: ["Sepatu Bayu", "Sepatu Bot Pengembara", "Sandal Angin"],
        LEGENDARY: ["Sepatu Kresna", "Sepatu Bot Gatotkaca", "Langkah Jagad"]
    },
    HELMET: {
        COMMON: ["Helm Bambu", "Caping Bambu", "Helm Kulit Kusam"],
        RARE: ["Pelindung Kepala Prajurit", "Helm Tembaga", "Caping Besi"],
        EPIC: ["Kulkul Perunggu", "Helm Ksatria Majapahit", "Mahkota Kayu"],
        LEGENDARY: ["Mahkota Hayam Wuruk", "Kulkul Dewata", "Helm Antakusuma"]
    },
    ARMS: {
        COMMON: ["Pelindung Lengan Kulit", "Sarung Tangan Kain", "Lengan Lapis Bambu"],
        RARE: ["Lengan Besi Prajurit", "Sarung Tangan Kulit Tebal", "Lengan Tembaga"],
        EPIC: ["Lengan Ksatria Majapahit", "Gelang Nanggala", "Sarung Tangan Harimau"],
        LEGENDARY: ["Gelang Pasupati", "Lengan Mahapatih", "Sarung Tangan Kresna"]
    },
    LEG: {
        COMMON: ["Pelindung Kaki Kulit", "Pelindung Kaki Bambu", "Pelindung Kaki Kain"],
        RARE: ["Pelindung Kaki Besi", "Pelindung Kaki Tembaga", "Celana Kulit Tebal"],
        EPIC: ["Kaki Ksatria Majapahit", "Pelindung Kaki Wesi Kuning", "Celana Siliwangi"],
        LEGENDARY: ["Pelindung Kaki Antakusuma", "Langkah Gatotkaca", "Kaki Langkah Jagad"]
    }
};

// Stat ranges per type per rarity
const EQUIPMENT_STAT_RANGES = {
    WEAPON: {
        COMMON:    { atk_bonus: [1, 3] },
        RARE:      { atk_bonus: [4, 7] },
        EPIC:      { atk_bonus: [8, 12] },
        LEGENDARY: { atk_bonus: [15, 20] }
    },
    ARMOR: {
        COMMON:    { def_bonus: [1, 2] },
        RARE:      { def_bonus: [3, 5] },
        EPIC:      { def_bonus: [6, 9] },
        LEGENDARY: { def_bonus: [10, 15] }
    },
    BOOTS: {
        COMMON:    { agi_bonus: [1, 3] },
        RARE:      { agi_bonus: [4, 6] },
        EPIC:      { agi_bonus: [7, 10] },
        LEGENDARY: { agi_bonus: [12, 18] }
    },
    HELMET: {
        COMMON:    { def_bonus: [1, 2] },
        RARE:      { def_bonus: [2, 3] },
        EPIC:      { def_bonus: [4, 6] },
        LEGENDARY: { def_bonus: [7, 10] }
    },
    ARMS: {
        COMMON:    { crit_rate_bonus: [2, 3] },
        RARE:      { crit_rate_bonus: [4, 6] },
        EPIC:      { crit_rate_bonus: [7, 10] },
        LEGENDARY: { crit_rate_bonus: [12, 17] }
    },
    LEG: {
        COMMON:    { def_bonus: [1, 2] },
        RARE:      { def_bonus: [2, 4] },
        EPIC:      { def_bonus: [5, 7] },
        LEGENDARY: { def_bonus: [8, 12] }
    }
};

const RARITY_SELL_PRICE = {
    COMMON: 10,
    RARE: 25,
    EPIC: 55,
    LEGENDARY: 120
};

const CRAFTING_RECIPES = {
    knight_sword: {
        name: 'Pedang Ksatria',
        type: 'WEAPON',
        rarity: 'RARE',
        atk_bonus: 6,
        def_bonus: 0,
        agi_bonus: 0,
        crit_rate_bonus: 0,
        cost_gold: 150,
        cost_wood: 5,
        cost_iron: 15,
        cost_spices: 0,
        sell_price: 60
    },
    iron_plate: {
        name: 'Zirah Besi Rakyat',
        type: 'ARMOR',
        rarity: 'RARE',
        atk_bonus: 0,
        def_bonus: 4,
        agi_bonus: 0,
        crit_rate_bonus: 0,
        cost_gold: 200,
        cost_wood: 0,
        cost_iron: 20,
        cost_spices: 0,
        sell_price: 80
    },
    wanderer_boots: {
        name: 'Sepatu Bot Pengembara',
        type: 'BOOTS',
        rarity: 'EPIC',
        atk_bonus: 0,
        def_bonus: 0,
        agi_bonus: 8,
        crit_rate_bonus: 0,
        cost_gold: 400,
        cost_wood: 10,
        cost_iron: 0,
        cost_spices: 15,
        sell_price: 160
    },
    hayam_crown: {
        name: 'Mahkota Hayam Wuruk',
        type: 'HELMET',
        rarity: 'LEGENDARY',
        atk_bonus: 0,
        def_bonus: 9,
        agi_bonus: 0,
        crit_rate_bonus: 0,
        cost_gold: 1000,
        cost_wood: 0,
        cost_iron: 40,
        cost_spices: 30,
        sell_price: 450
    }
};

const SHOP_ITEMS = {
    wood_sword:       { name: "Pedang Kayu",      type: "WEAPON", atk_bonus: 2, def_bonus: 0, agi_bonus: 0, crit_rate_bonus: 0 },
    wood_shield:      { name: "Perisai Kayu",     type: "ARMOR",  atk_bonus: 0, def_bonus: 1, agi_bonus: 0, crit_rate_bonus: 0 },
    leather_boots:    { name: "Sepatu Kulit",     type: "BOOTS",  atk_bonus: 0, def_bonus: 0, agi_bonus: 2, crit_rate_bonus: 0 },
    leather_helmet:   { name: "Helm Kulit",       type: "HELMET", atk_bonus: 0, def_bonus: 1, agi_bonus: 0, crit_rate_bonus: 0 },
    cloth_gloves:     { name: "Sarung Tangan Kain",type: "ARMS",  atk_bonus: 0, def_bonus: 0, agi_bonus: 0, crit_rate_bonus: 2 },
    leather_leggings: { name: "Celana Kulit",     type: "LEG",    atk_bonus: 0, def_bonus: 1, agi_bonus: 0, crit_rate_bonus: 0 }
};

module.exports = {
    EQUIPMENT_NAMES,
    EQUIPMENT_STAT_RANGES,
    RARITY_SELL_PRICE,
    CRAFTING_RECIPES,
    SHOP_ITEMS
};
