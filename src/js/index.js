let catLabels = {
  "3d": "3D",
  "aerial": "Aerial Imagery Sources",
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
  "router": "Routing Engines",
  "sister": "Sister Projects",
  "streetlevel": "Street-Level Imagery Sources",
  "thematic": "Thematic Viewers",
  "trail": "Trail Maps"
};

let allServices;
const servicesByCat = {};

const params = {};

// default values, can be changed in UI and saved to localStorage
const prefs = {
  targetBlank: false,
  showVisited: false,
}

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

function getFilterValue() {
  return document.getElementById('filter')?.value || '';
}

function addEventListeners() {
  document.getElementById('show-visited').addEventListener('change', function(e) {
    setPref('showVisited', e.target.checked);
  });
  document.getElementById('target-blank').addEventListener('change', function(e) {
    setPref('targetBlank', e.target.checked);
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
    let results = /^([\d\.]+)\/(-?[\d\.]+)\/(-?[\d\.]+)$/.exec(hashMap);
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
      
      child.parentName = service.name;

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
      if (typeof(paramVal) !== "undefined" && paramVal !== null) {
        let token = '{{' + paramKey + '}}';
        if (val.includes(token)) {
          val = val.replaceAll(token, paramVal);
        }
      }
    }
    return val;
  }

  function makeKeyValString(dict) {
    let str = "";
    Object.keys(dict).forEach(function(key) {
      let val = dict[key];
      if (val.includes('{{')) {
        val = replaceTokens(val);
        if (!val.includes('{{')) {
          str += key === '' ? val : key + '=' + val + '&';
        }
      } else {
        str += key === '' ? val : key + '=' + val + '&';
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

  prefs.showVisited ? document.body.classList.add('show-visited') : document.body.classList.remove('show-visited');

  let descHtml = `<p>This is a directory of links to <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap</a>-related projects.</p>`;

  if (params.z && params.lat && params.lon) {
    descHtml += `<p>Pages will open at latitude <code>${params.lat}</code>, longitude <code>${params.lon}</code>, and zoom <code>${params.z}</code>. <a href="#">Clear</a></p>`;
  } else {
    descHtml += `<p>You can set a common viewport with the URL hash like <code>#map=zoom/lat/lon</code>. <a href="#map=14/39.9524/-75.1636">Example</a></p>`;
  }
  document.getElementById('header-desc').innerHTML = descHtml;

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
      html += `<span class="service-name">`;
      if (service.url) html += `<a href="${makeUrl(service)}" ${prefs.targetBlank ? 'target="_blank"' : ''}>`
      html += service.name;
      html += `</span>`;
      if (service.parentName) {
        html += ' on ' + service.parentName;
      }
      if (service.url) html += `</a>`;
      html += `<span class="icon-links">`;
      if (service.github) html += `<a href="https://github.com/${service.github}" target="_blank"><img src="img/github.svg"/></a>`;
      if (service.gitlab) html += `<a href="https://gitlab.com/${service.gitlab}" target="_blank"><img src="img/gitlab.svg"/></a>`;
      if (service.osmwiki) html += `<a href="https://wiki.openstreetmap.org/wiki/${service.osmwiki}" target="_blank"><img src="img/osmwiki.svg"/></a>`;
      html += `</span>`;
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