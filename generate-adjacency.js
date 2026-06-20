const fs = require('fs');

function getDistance(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx*dx + dy*dy);
}

function areAdjacent(feat1, feat2, threshold = 0.2) {
    const coords1 = [];
    const getCoords = (geom, arr) => {
        if (geom.type === 'Polygon') geom.coordinates.forEach(r => r.forEach(p => arr.push(p)));
        else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(m => m.forEach(r => r.forEach(p => arr.push(p))));
    };
    getCoords(feat1.geometry, coords1);
    
    const coords2 = [];
    getCoords(feat2.geometry, coords2);

    // Subsample coords to speed up
    const sample1 = coords1.filter((_, i) => i % 5 === 0);
    const sample2 = coords2.filter((_, i) => i % 5 === 0);

    for (let p1 of sample1) {
        for (let p2 of sample2) {
            if (getDistance(p1, p2) < threshold) return true;
        }
    }
    return false;
}

const data = JSON.parse(fs.readFileSync('maps/gadm41_IDN_1.json'));
const adjacency = {};
const features = data.features;

console.log("Processing...");
for (let i = 0; i < features.length; i++) {
    const codeA = features[i].properties.GID_1;
    adjacency[codeA] = [];
    console.log("Checking " + features[i].properties.NAME_1);
    for (let j = 0; j < features.length; j++) {
        if (i === j) continue;
        const codeB = features[j].properties.GID_1;
        if (areAdjacent(features[i], features[j], 0.2)) {
            adjacency[codeA].push(codeB);
        }
    }
}

// Add custom connections requested by user:
function addConnection(a, b) {
    if (!adjacency[a]) adjacency[a] = [];
    if (!adjacency[b]) adjacency[b] = [];
    if (!adjacency[a].includes(b)) adjacency[a].push(b);
    if (!adjacency[b].includes(a)) adjacency[b].push(a);
}

// Java -> Kalimantan
const java = ["IDN.4_1", "IDN.7_1", "IDN.9_1", "IDN.10_1", "IDN.33_1", "IDN.11_1"];
const kalimantan = ["IDN.12_1", "IDN.13_1", "IDN.14_1"];
for (let j of java) {
    for (let k of kalimantan) {
        addConnection(j, k);
    }
}

// NTB/NTT -> Sulawesi/Maluku
const ntb_ntt = ["IDN.20_1", "IDN.21_1"];
const sulawesi_maluku = ["IDN.26_1", "IDN.28_1", "IDN.19_1"];
for (let n of ntb_ntt) {
    for (let sm of sulawesi_maluku) {
        addConnection(n, sm);
    }
}

// Kalimantan <-> Sulawesi
addConnection("IDN.34_1", "IDN.27_1"); // Kalimantan Timur <-> Sulawesi Tengah
addConnection("IDN.34_1", "IDN.25_1"); // Kalimantan Timur <-> Sulawesi Barat
addConnection("IDN.13_1", "IDN.26_1"); // Kalimantan Selatan <-> Sulawesi Selatan
addConnection("IDN.35_1", "IDN.29_1"); // Kalimantan Utara <-> Sulawesi Utara

// Sulawesi <-> Maluku
addConnection("IDN.29_1", "IDN.18_1"); // Sulawesi Utara <-> Maluku Utara
addConnection("IDN.27_1", "IDN.18_1"); // Sulawesi Tengah <-> Maluku Utara
addConnection("IDN.28_1", "IDN.19_1"); // Sulawesi Tenggara <-> Maluku
addConnection("IDN.26_1", "IDN.19_1"); // Sulawesi Selatan <-> Maluku

// Maluku <-> Papua
addConnection("IDN.18_1", "IDN.22_1"); // Maluku Utara <-> Papua Barat
addConnection("IDN.19_1", "IDN.22_1"); // Maluku <-> Papua Barat
addConnection("IDN.19_1", "IDN.23_1"); // Maluku <-> Papua

// Sumatra <-> Kalimantan
addConnection("IDN.3_1", "IDN.12_1");  // BangkaBelitung <-> Kalimantan Barat
addConnection("IDN.16_1", "IDN.12_1"); // Kepulauan Riau <-> Kalimantan Barat

// Sort keys and values for neatness
const sortedAdj = {};
Object.keys(adjacency).sort().forEach(key => {
    sortedAdj[key] = adjacency[key].sort();
});

fs.writeFileSync('maps/adjacency.json', JSON.stringify(sortedAdj, null, 2));
console.log("Done!");
