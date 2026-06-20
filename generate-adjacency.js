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

fs.writeFileSync('maps/adjacency.json', JSON.stringify(adjacency, null, 2));
console.log("Done!");
