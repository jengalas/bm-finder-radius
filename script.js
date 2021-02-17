var handlers = {
    getInputValues: function () {
      let lat = document.getElementById("lat").value;
      let lon = document.getElementById("lon").value;
      let radius = document.getElementById("radius").value;
      handlers.addWaypoint(lat,lon,radius);
    },
    addWaypoint: function(lat,lon,radius) {
        var proxyUrl = 'https://mysterious-stream-86355.herokuapp.com/',
        targetUrl = 'https://geodesy.noaa.gov/api/nde/radial?lat=' + lat + '&lon=' + lon + '&radius=' + radius;
        console.log(targetUrl);
        fetch(proxyUrl + targetUrl)
        .then(response => response.json())
        .then(json => {
            if (json.length == 0) {
                document.getElementById("statusDiv");
                statusDiv.innerHTML = '<p class="alert">There are no marks within ' + radius + ' miles of that location.</p>';
            }

            let myGeoJSON = {
                "name":"NewFeatureType",
                "type":"FeatureCollection",
                "features":[]
            };   
            
            for (let i = 0; i < json.length; i++) { 
                console.log('i=' ,i);                
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
                console.log(myGeoJSON.features[i]);          
                myGeoJSON.features[i].geometry.coordinates.push(Number(json[i].lon),Number(json[i].lat));
                myGeoJSON.features[i].properties.pid = json[i].pid;
                myGeoJSON.features[i].properties.name = json[i].name;  
                myGeoJSON.features[i].properties.monumentType = json[i].monumentType.split('=')[1]; 
                myGeoJSON.features[i].properties.setting = json[i].setting.split('=')[1]; 
                myGeoJSON.features[i].properties.condition = json[i].condition; 
            }
            bmRequestForm.reset();
            console.log(myGeoJSON);
            waypointsDiv.innerHTML = JSON.stringify(myGeoJSON);
            return myGeoJSON;
        })
        .catch(e => {
            console.log(e);
            document.getElementById("statusDiv");
            statusDiv.innerHTML = '<p class="alert">There are no marks within the specified radius of that location.</p>';
            document.getElementById("bmRequestForm");
            bmRequestForm.reset();
            return '<h1>Error Loading</h1>';
        }); 
    }
}



