let catLabels = {
  "3d": "3D",
  "aerial": "Aerial Imagery",
  "carto": "Cartography Inspectors",
  "changeset": "Changesets",
  "compare": "Map Comparisons",
  "editor": "Editors",
  "general": "General",
  "indoor": "Indoor",
  "issue": "Validation Issues",
  "note": "Notes",
  "qa": "QA Visualizations",
  "query": "Query Tools",
  "mapstyle": "Map Styles",
  "mobile": "Mobile Apps",
  "router": "Routing Engines",
  "sister": "Sister Projects",
  "streetlevel": "Street-Level Imagery",
  "thematic": "Thematic Viewers",
  "trail": "Trail Maps"
};

let map, navControl, geolocateControl;
let allServices;
const servicesByCat = {};

const params = {};

// default values, can be changed in UI and saved to localStorage
const prefs = {
  targetBlank: false,
  showVisited: false,
}

window.addEventListener('load', function() {
  fetch('data/services.json')
    .then(response => response.json())
    .then(json => {
      addEventListeners();
      loadPrefsFromStorage();
      loadParamsFromUrl();

      allServices = json;
      prepareServiceData();
      reloadPage();
    });
});

function initMap() {

  map = new maplibregl.Map({
    container: 'map',
    hash: "map",
    style: 'map/basemap.json',
    center: [params.lat || 0, params.lon || 0],
    zoom: params.z || 0,
    minZoom: 0,
    fadeDuration: 0,
    keyboard: false
  });

  map.on('moveend', function() {
    loadParamsFromUrl();
    reloadPage();
  });

  navControl = new maplibregl.NavigationControl({
    visualizePitch: true,
    visualizeRoll: true,
    showZoom: true,
    showCompass: true
  });

  geolocateControl = new maplibregl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  });

  let scaleControl = new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
  });
  map.addControl(scaleControl);

}

function getFilterValue() {
  return document.getElementById('filter')?.value || '';
}

function setEditing(toEditingState) {
  let mapWrap = document.getElementById('map-wrap');
  if (toEditingState) {
    mapWrap.classList.add('editing');
    map.keyboard.enable();
    map.addControl(navControl);
    map.addControl(geolocateControl);
  } else {
    mapWrap.classList.remove('editing');
    map.keyboard.disable();
    map.removeControl(navControl);
    map.removeControl(geolocateControl);
  }
}

function addEventListeners() {
  document.getElementById('show-visited').addEventListener('change', function(e) {
    setPref('showVisited', e.target.checked);
  });
  document.getElementById('target-blank').addEventListener('change', function(e) {
    setPref('targetBlank', e.target.checked);
  });
  document.getElementById('edit-loc').addEventListener('click', function(e) {
    e.preventDefault();
    let mapWrap = document.getElementById('map-wrap');
    setEditing(!mapWrap.classList.contains('editing'))
  });
  document.getElementById('add-loc').addEventListener('click', function(e) {
    e.preventDefault();
    params.z = 0;
    params.lat = 0;
    params.lon = 0;
    reloadPage();
    setEditing(true);
  });
  document.getElementById('filter').addEventListener('focus', function(e) {
    e.target.select();
  });
  document.getElementById('filter').addEventListener('input', function(e) {
    reloadPage();
  });
  document.getElementById('clear-filter').addEventListener('click', function(e) {
    document.getElementById('filter').value = '';
    reloadPage();
  });

  window.addEventListener("hashchange", function() {
    loadParamsFromUrl();
    reloadPage();
  });
}

function setPref(key, val) {
  prefs[key] = val;
  writePrefsToStorage();
  reloadPage();
}

function loadPrefsFromStorage() {
  let storedPrefs = JSON.parse(localStorage.getItem('prefs') || '{}');
  Object.assign(prefs, storedPrefs);
}

function writePrefsToStorage() {
  localStorage.setItem('prefs', JSON.stringify(prefs));
}

function mapParamsFromUrl() {
  let hashMap = hashValue('map');
  if (hashMap) {
    let results = /^([\d\.]+)\/(-?[\d\.]+)\/(-?[\d\.]+)/.exec(hashMap);
    if (results.length === 4) {
      let z = parseFloat(results[1]);
      let lat = parseFloat(results[2]);
      let lon = parseFloat(results[3]);
      if (isFinite(z) && isFinite(lat) && isFinite(lon)) {
        return {
          z: z,
          lat: lat,
          lon: lon
        };
      }
    }
  }
  return {
    z: undefined,
    lat: undefined,
    lon: undefined
  };
}

function loadParamsFromUrl() {
  let newParms = mapParamsFromUrl();
  Object.assign(params, newParms);
}

function prepareServiceData() {
  for (let serviceId in allServices) {
    let service = allServices[serviceId];
    service.id = serviceId;
    service.catName = catLabels[service.cat] || service.cat;

    if (!servicesByCat[service.cat]) servicesByCat[service.cat] = [];
    servicesByCat[service.cat].push(service);

    if (!service.styles) continue;
    for (let styleId in service.styles) {
      let child = service.styles[styleId];
      child.id = serviceId + '-' + styleId;

      // copy over any missing info from service to styles
      if (!child.url) child.url = service.url;
      if (!child.slug) child.slug = service.slug;
      ['hash', 'query'].forEach(dictKey => {
        if (service[dictKey]) {
          let serviceDict = structuredClone(service[dictKey]);
          if (child[dictKey]) {
            Object.assign(serviceDict, child[dictKey]); 
          }
          child[dictKey] = serviceDict;
        }
      });
    }
  }
}

function makeUrl(definition) {
  let url = definition.url;

  function replaceTokens(val) {
    for (let paramKey in params) {
      let paramVal = params[paramKey];
      let regex = new RegExp('{{' + paramKey + '(?:\\|(.+?))?}}', "gi");
      let results = regex.exec(val);
      if (results !== null) {
        let fallbackVal = results[1];
        if (typeof(paramVal) !== "undefined" && paramVal !== null) {
          val = val.replaceAll(regex, paramVal);
        } else if (fallbackVal) {
          val = val.replaceAll(regex, fallbackVal);
        }
      }
    }
    return val;
  }

  function makeKeyValString(dict) {
    let str = "";
    Object.keys(dict).forEach(function(key) {
      let val = dict[key];
      if (val?.includes('{{')) {
        val = replaceTokens(val);
        if (!val.includes('{{')) {
          str += key === '' ? val : key + '=' + val + '&';
        }
      } else {
        if (val === null) {
          str += key;
        } else if (key === '') {
          str += val;
        } else {
          str += key + '=' + val;
        }
        str += '&';
      }
    });
    if (str.length && str[str.length - 1] === '&') {
      str = str.slice(0, -1);
    }
    return str;
  }

  if (definition.slug) {
    let slug = replaceTokens(definition.slug);
    if (!slug.includes('{{')) {
      url += slug;
    }
  } 
  if (definition.hash) {
    let str = makeKeyValString(definition.hash);
    if (str.length) url += '#' + str;
  }
  if (definition.query) {
    let str = makeKeyValString(definition.query);
    if (str.length) url += '?' + str;
  }
  return url;
}

function reloadPage() {

  let mapWrap = document.getElementById('map-wrap');

  if (isNaN(params.lat) || isNaN(params.lon)) {
    if (!mapWrap.classList.contains('no-loc')) {
      mapWrap.classList.add('no-loc');
    }
    if (map) {
      map.remove()
      map = undefined;
    }
  } else {
    if (!map) {
      if (mapWrap.classList.contains('no-loc')) {
        mapWrap.classList.remove('no-loc');
      }
      if (mapWrap.classList.contains('editing')) {
        mapWrap.classList.remove('editing');
      }
      initMap();
    }
  }

  prefs.showVisited ? document.body.classList.add('show-visited') : document.body.classList.remove('show-visited');

  if (isFinite(params.z) && isFinite(params.lat) && isFinite(params.lon)) {
    document.getElementById('title-extra').innerHTML =`<p><code>#map=${params.z}/${params.lat}/${params.lon}</code></p>`; //<a href="#">Copy link</a>
  } else {
    document.getElementById('title-extra').innerHTML = `<a href="#map=14/39.9524/-75.1636">Example</a>`;
  }
  //document.getElementById('header-desc').innerHTML = `<p>This is a directory of links to <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap</a>-related projects.</p>`;

  let html = "";

  let filter = getFilterValue().trim().toLowerCase();

  for (let cat in servicesByCat) {
    let services = servicesByCat[cat];
    
    if (filter) {
      services = services.filter(function(service) {
        return service.name.toLowerCase().includes(filter) || service.catName.toLowerCase().includes(filter);
      });
    }
    if (!services.length) continue;

    let calLabel = catLabels[cat] || cat;

    html += `<h2 class="section-name">${calLabel}</h2>`;
    html += `<ul class="services">`;

    for (let i in services) {
      let service = services[i];
        
      html += `<li id="${service.id}" class="service">`;
      html += `<div class="service-top">`;
      html += `<div class="service-name">`;
      if (service.url) html += `<a href="${makeUrl(service)}" ${prefs.targetBlank ? 'target="_blank"' : ''}>`
      html += service.name;
      if (service.url) html += `</a>`;
      html += `</div>`;

      html += `<div class="icon-links">`;
      if (service.github) html += `<a href="https://github.com/${service.github}" title="GitHub page" target="_blank"><img src="img/github.svg"/></a>`;
      if (service.gitlab) html += `<a href="https://gitlab.com/${service.gitlab}" title="GitLab page" target="_blank"><img src="img/gitlab.svg"/></a>`;
      if (service.osmwiki) html += `<a href="https://wiki.openstreetmap.org/wiki/${service.osmwiki}" title="OSM Wiki page" target="_blank"><img src="img/osmwiki.svg"/></a>`;
      html += `</div>`;
      html += `</div>`;
      if (service.styles) {
        html += '<ul class="styles">';
        for (let j in service.styles) {
          let style = service.styles[j];
          html += `<li id="${style.id}" class="style">`
          let url = makeUrl(style);
          html+= `<a href="${url}" ${prefs.targetBlank ? 'target="_blank"' : ''} class="style-name">`;
          html += style.name;
          html += `</a></li>`;
        }
        html += '</ul>';
      }
      html += '</li>';
    }
    html += `</ul>`;
  }

  document.getElementById('content').innerHTML = html;

  document.getElementById('show-visited').checked = prefs.showVisited;
  document.getElementById('target-blank').checked = prefs.targetBlank;
}

function hashValue(key) {
  let searchParams = new URLSearchParams(window.location.hash.slice(1));
  if (searchParams.has(key)) return searchParams.get(key);
  return null;
}