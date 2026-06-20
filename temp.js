
        // Batas wilayah Indonesia (BBox kasar)
        const indonesiaBounds = [
            [-11.0, 95.0], // Barat Daya
            [6.0, 141.0]   // Timur Laut
        ];

        const map = L.map('map', {
            zoomControl: false,
            preferCanvas: true, // Meningkatkan performa drastis untuk ribuan polygon!
            maxBounds: indonesiaBounds,
            maxBoundsViscosity: 1.0, // Mencegah pengguna keluar dari batas
            minZoom: 4 // Jangan biarkan zoom terlalu jauh
        }).setView([-2.5489, 118.0149], 5);

        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);

        // Proteksi Login
        const playerDataStr = localStorage.getItem('player');
        let player = null;
        let selectedKingdomId = null;

        if (!playerDataStr) {
            window.location.href = '/register.html';
        } else {
            player = JSON.parse(playerDataStr);
            if (!player || !player.kingdom) {
                localStorage.removeItem('player');
                window.location.href = '/login.html';
            } else {
                selectedKingdomId = player.kingdom_id;
                document.getElementById('player-profile').innerHTML = `
                    <div class="player-avatar">${player.username.charAt(0).toUpperCase()}</div>
                    <div class="player-stats">
                        <div class="name">Lv.1 ${player.username}</div>
                        <div class="kingdom" style="color: ${player.kingdom.color_hex}">Kerajaan ${player.kingdom.name}</div>
                    </div>
                `;
            }
        }

        function logout() {
            localStorage.removeItem('player');
            window.location.href = '/login.html';
        }

        // Fix map size after flex layout renders
        setTimeout(() => { map.invalidateSize(); }, 500);

        // State Game
        let territoriesDb = {}; // Menyimpan data kepemilikan daerah

        // Styling default untuk geojson polygons
        function getStyle(feature) {
            const code = feature.properties.GID_3 || feature.properties.GID_2 || feature.properties.GID_1;
            const tData = territoriesDb[code];
            
            if (tData && tData.kingdom) {
                return {
                    color: tData.kingdom.color_hex,
                    weight: 1.5,
                    opacity: 1,
                    fillColor: tData.kingdom.color_hex,
                    fillOpacity: 0.6
                };
            }

            // Default (netral)
            return {
                color: "#3b82f6",
                weight: 0.8,
                opacity: 0.8,
                fillColor: "#1e3a8a",
                fillOpacity: 0.3
            };
        }

        const highlightStyle = {
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
        };

        // Fungsi saat fitur (polygon) berinteraksi
        function onEachFeature(feature, layer) {
            const name = feature.properties.NAME_3 || feature.properties.NAME_2 || feature.properties.NAME_1 || "Tidak diketahui";
            const parent = feature.properties.NAME_2 ? `${feature.properties.NAME_2}, ` : "";
            const province = feature.properties.NAME_1 || "";
            const code = feature.properties.GID_3 || feature.properties.GID_2 || feature.properties.GID_1;
            
            // Set initial tooltip (will be updated on hover)
            layer.bindTooltip("Loading...", { sticky: true });

            // Perbarui tooltip secara dinamis saat disentuh (mouseover)
            layer.on('mouseover', function(e) {
                const layer = e.target;
                layer.setStyle({
                    ...getStyle(feature),
                    ...highlightStyle
                });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                }

                const tData = territoriesDb[code];
                const owner = tData && tData.kingdom ? tData.kingdom.name : "Netral";
                const tooltipContent = `
                    <div style="padding: 5px;">
                        <strong style="font-size: 14px; display: block; margin-bottom: 2px;">${name}</strong>
                        <span style="font-size: 11px; color: #cbd5e1;">${parent}${province}</span><br/>
                        <span style="font-size: 12px; color: #facc15; font-weight: bold; margin-top: 5px; display: inline-block;">Kerajaan: ${owner}</span>
                    </div>
                `;
                layer.setTooltipContent(tooltipContent);
            });

            layer.on('mouseout', function(e) {
                const layer = e.target;
                layer.setStyle(getStyle(feature));
            });

            layer.on('click', function(e) {
                map.fitBounds(e.target.getBounds());
                
                // Cek kepemilikan terbaru dari territoriesDb!
                const currentTData = territoriesDb[code];
                const currentOwner = currentTData && currentTData.kingdom ? currentTData.kingdom.name : "Netral";
                const isOwnedByUs = currentTData && currentTData.kingdom && currentTData.kingdom.id === player.kingdom_id;
                const btnLabel = isOwnedByUs ? "Sudah Dikuasai" : "Serang Wilayah!";
                
                document.getElementById('sidebar-content').innerHTML = `
                    <div class="territory-card">
                        <div class="t-title">${name}</div>
                        <div class="t-owner">${parent}${province}</div>
                        <div class="t-stats">
                            <div>👑 Kepemilikan: <strong style="color: ${currentTData?.kingdom?.color_hex || '#fff'}">${currentOwner}</strong></div>
                            <div>⚔️ Pasukan: <strong>${currentTData?.troops_count || 0}</strong></div>
                        </div>
                        <button id="btn-attack" class="btn-attack" ${isOwnedByUs ? 'disabled' : ''}>
                            ${btnLabel}
                        </button>
                    </div>
                `;

                    if (!isOwnedByUs) {
                        document.getElementById('btn-attack').addEventListener('click', () => {
                            const btn = document.getElementById('btn-attack');
                            btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;"></div> Mengirim Pasukan...';
                            btn.disabled = true;

                            fetch('/api/game/attack', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    territory_code: code,
                                    attacker_kingdom_id: parseInt(selectedKingdomId)
                                })
                            })
                            .then(res => res.json())
                            .then(res => {
                                if(res.status === 'success') {
                                    // Berhasil direbut, update peta & sidebar
                                    btn.innerHTML = 'Berhasil Dikuasai!';
                                    btn.style.background = '#22c55e';
                                    setTimeout(() => fetchTerritories(), 1000);
                                } else {
                                    alert(res.message);
                                    btn.innerHTML = 'Serangan Gagal';
                                }
                            })
                            .catch(err => {
                                console.error(err);
                                btn.innerHTML = 'Error';
                            });
                        });
                    }
                });
        }

        let geojsonLayer;
        let mapDataJson = null;

        // Fetch data geojson
        function loadMapData() {
            fetch('/maps/gadm41_IDN_1.json')
                .then(response => {
                    if (!response.ok) {
                        return fetch('/maps/gadm41_IDN_1.json').then(r => r.json());
                    }
                    return response.json();
                })
                .then(data => {
                    mapDataJson = data;
                    renderMap();
                })
                .catch(error => {
                    console.error("Error loading map data:", error);
                    const loader = document.getElementById('loader');
                    loader.innerHTML = `
                        <div style="color: #ef4444; font-weight: bold; margin-bottom: 10px;">Error Memuat Data</div>
                        <div style="font-size: 12px; color: #fca5a5;">${error.message}</div>
                    `;
                });
        }

        function renderMap() {
            if (!mapDataJson) return;
            
            if(geojsonLayer) {
                map.removeLayer(geojsonLayer);
            }

            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => document.getElementById('loader').style.display = 'none', 500);

            geojsonLayer = L.geoJSON(mapDataJson, {
                style: getStyle,
                onEachFeature: onEachFeature
            }).addTo(map);
        }

        function fetchTerritories() {
            fetch('/api/game/territories?t=' + Date.now())
                .then(res => res.json())
                .then(res => {
                    if(res.status === 'success') {
                        territoriesDb = {};
                        res.data.forEach(t => {
                            territoriesDb[t.code] = t;
                        });
                        
                        // Perbarui gaya (warna) polygon saja, JANGAN buat ulang seluruh peta!
                        if (geojsonLayer) {
                            geojsonLayer.eachLayer(function(layer) {
                                layer.setStyle(getStyle(layer.feature));
                            });
                        } else {
                            renderMap();
                        }
                    }
                });
        }

        // Load territories and map
        fetchTerritories();
        loadMapData();
    