var handlers = {
    getCurrentLocation: function (pos) {
        let lat = pos.coords.latitude;
        document.getElementById("lat").value = lat;
        let lon = pos.coords.longitude;
        document.getElementById("lon").value = lon;
        document.getElementById("radius").focus();
        let radius = document.getElementById("radius").value;
        radius = Number(radius);
        if (radius <= 0) {
          document.getElementById("statusDiv");
          statusDiv.innerHTML = '<p class="alert">Please enter a radius in miles, greater than zero.</p>';
          radius.value = "";
          return false;
        }
        // let radius = 5;
        handlers.addWaypoint(lat,lon,radius);
      },
    getInputValues: function () {
      let lat = document.getElementById("lat").value;
      let lon = document.getElementById("lon").value;
      let radius = document.getElementById("radius").value;
      if (radius <= 0) {
        document.getElementById("statusDiv");
        statusDiv.innerHTML = '<p class="alert">Please enter a radius greater than zero.</p>';
        radius.value = "";
        return false;
      }
      handlers.addWaypoint(lat,lon,radius);
    },
    addWaypoint: function(lat,lon,radius) {
        var proxyUrl = 'https://mysterious-stream-86355.herokuapp.com/',
        targetUrl = 'https://geodesy.noaa.gov/api/nde/radial?lat=' + lat + '&lon=' + lon + '&radius=' + radius;
        
        fetch(proxyUrl + targetUrl)
        .then(response => response.json())
        .then(json => {
            if (json.length == 0) {
                document.getElementById("statusDiv");
                statusDiv.innerHTML = '';
                statusDiv.innerHTML = '<p class="alert">There are no marks within ' + radius + ' miles of that location.</p>';
                document.getElementById("map").innerHTML = '';
                document.getElementById("map").style.height = "0";
                return false;
            }
            else if (json.length === undefined) {
                document.getElementById("statusDiv");
                statusDiv.innerHTML = '<p class="alert">Bounds not valid; please enter a position within the United States.</p>';
                document.getElementById("map").innerHTML = '';
                return false;
            }
            else {
                document.getElementById("statusDiv");
                statusDiv.innerHTML = '<p class="alert">There are ' + json.length + ' marks within ' + radius + ' miles of ' + lat + ', ' + lon + '.</p>';
            }

            let myGeoJSON = {
                "name":"NewFeatureType",
                "type":"FeatureCollection",
                "features":[]
            };   
            
            for (let i = 0; i < json.length; i++) { 
                               
                myGeoJSON.features.push({
                    "type":"Feature",
                    "geometry":{
                        "type":"Point",
                        "coordinates":[]
                    },
                    "properties":{
                        "pid":null,
                        "name":null,
                        "monumentType":null,
                        "setting":null,
                        "condition":null                        
                    }
                });       
                         
                myGeoJSON.features[i].geometry.coordinates.push(Number(json[i].lon),Number(json[i].lat));
                myGeoJSON.features[i].properties.pid = json[i].pid;
                myGeoJSON.features[i].properties.name = json[i].name;  
                myGeoJSON.features[i].properties.monumentType = json[i].monumentType.split('=')[1]; 
                myGeoJSON.features[i].properties.setting = json[i].setting.split('=')[1]; 
                myGeoJSON.features[i].properties.condition = json[i].condition; 
            }
            bmRequestForm.reset();
            // waypointsDiv.innerHTML = JSON.stringify(myGeoJSON);
            view.displayMap(myGeoJSON,lat,lon,radius);
            return myGeoJSON;
        })
        .catch(e => {
            document.getElementById("bmRequestForm");
            bmRequestForm.reset();
            return '<h1>Error Loading</h1>';
        }); 
    }
}

var view = {
    refreshMap: function() {
        // Code below resolves "map already initialized" error but map will no longer pan: https://github.com/Leaflet/Leaflet/issues/3962
        // Added jQuery lines to explicitly remove map div and recreate it.
        var container = L.DomUtil.get('map');
        if(container != null){
           container._leaflet_id = null;
           $("#map").remove();
           $(".container").append('<div id="map"></div>'); 
        }
    },
    displayMap: function(myGeoJSON,lat,lon,radius) { 
        this.refreshMap();
        var map = L.map('map');
        
        var circ = L.circle([lat,lon], {fillColor: 'transparent', radius: radius*1609.344}).addTo(map); // If desired to show the radius graphically

        var mrkCurrentLocation = new L.marker([lat,lon])
            .bindPopup(lat + ', ' + lon)
            .addTo(map);

        var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };

        var allPoints = L.geoJSON(myGeoJSON, {            
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            },
            onEachFeature: function(feature, layer) { 
                
                var popupText = '<b>Name: </b>' + feature.properties.name + '<br>' + '<b>PID: </b> <a target="_blank" href="https://www.ngs.noaa.gov/cgi-bin/ds_mark.prl?PidBox=' + feature.properties.pid + '">' + feature.properties.pid + '</a>';

                if (feature.properties.monumentType) {
                    popupText += '<br><b>Monument Type: </b>' + feature.properties.monumentType;
                }

                if (feature.properties.setting) {
                    popupText += '<br><b>Setting: </b>' + feature.properties.setting;
                }

                popupText += '<br><b>Coordinates: </b>' + Number(feature.geometry.coordinates[1]).toFixed(6) + ', ' + Number(feature.geometry.coordinates[0]).toFixed(6);

                if (feature.properties.condition) {
                    popupText += '<br><b>Condition: </b>' + feature.properties.condition;
                }

                layer.bindPopup(popupText);
            } 
        });

        var layers = {
            'Basic Topo': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
              }),
            'Streets': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              }),
            'Aerial': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              }),
            'NatGeo': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
              maxZoom: 16
              }),          
            'HikeBike': L.tileLayer('https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(map),
            'USGS Topo': L.tileLayer('https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png', {
              attribution: "USDA images from <a href='http://caltopo.com/'>CalTopo</a>", 
              minZoom: 6, 
              maxZoom:  16
             }),
            } 
        var overlaysObj = {};

        L.control.layers(layers, overlaysObj, {
            collapsed: true
            }).addTo(map);

        map.fitBounds(allPoints.getBounds());
        map.fitBounds(circ.getBounds());

        var markers = L.markerClusterGroup({
            disableClusteringAtZoom: 17
        });
		markers.addLayer(allPoints);
		
		map.addLayer(markers);

        L.control.mapCenterCoord({
            latlngFormat: 'DD',
            latlngDesignators: false,
            template: '{y}, {x}',
            }).addTo(map);

        map.on('contextmenu', addMarker);

        function addMarker(e){
            var newMarker = new L.marker(e.latlng).addTo(map);
            newMarker.bindPopup(e.latlng.lat.toFixed(6).toString() + ', ' + e.latlng.lng.toFixed(6).toString()).openPopup();
            handlers.addWaypoint(e.latlng.lat,e.latlng.lng,5);
        }

      },
}



