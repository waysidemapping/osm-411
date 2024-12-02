let catLabels = {
  "3d": "3D Viewers",
  "aerial": "Aerial Imagery Sources",
  "carto": "Cartography Inspectors",
  "editor": "Editors",
  "general": "General",
  "indoor": "Indoor Viewers",
  "qa": "Quality Assurance Tools",
  "query": "Query Tools",
  "mapstyle": "Map Styles",
  "router": "Routing Engines",
  "sister": "Sister Projects",
  "streetlevel": "Street-Level Imagery Sources",
  "thematic": "Thematic Viewers",
  "trail": "Trail Maps"
};

let allServices;
let servicesByCat = {};

let params = {
  z: 10,
  lat: 41.113709,
  lon: -74.153544
};

fetch('/data/services.json')
  .then(response => response.json())
  .then(json => {
    allServices = json;
    prepareServiceData();
    loadPage();
  });

function prepareServiceData() {
  for (let serviceId in allServices) {
    let service = allServices[serviceId];
    service.id = serviceId;

    if (!service.cat) service.cat = 'general';

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
          if (!child[dictKey]) child[dictKey] = {};
          for (let key in service[dictKey]) {
            if (!child[dictKey][key]) child[dictKey][key] = service[dictKey][key];
          }
        }
      });
    }
  }
}

function makeUrl(service) {
  let url = service.url;

  function replaceTokens(val) {
    for (let paramKey in params) {
      let token = '{{' + paramKey + '}}';
      if (val.includes(token)) {
        let paramVal = params[paramKey];
        val = val.replaceAll(token, paramVal);
      }
    }
    return val;
  }

  function makeKeyValString(dict) {
    let str = "";
    for (let key in dict) {
      let val = dict[key];
      if (val.includes('{{')) {
        val = replaceTokens(val);
        if (!val.includes('{{')) {
          str += key === '' ? val : key + '=' + val + '&';
        }
      } else {
        str += key === '' ? val : key + '=' + val + '&';
      }
    }
    if (str.length && str[str.length - 1] === '&') {
      str = str.slice(0, -1);
    }
    return str;
  }

  if (service.slug) {
    let slug = replaceTokens(service.slug);
    if (!slug.includes('{{')) {
      url += slug;
    }
  } 
  if (service.hash) {
    let str = makeKeyValString(service.hash);
    if (str.length) url += '#' + str;
  }
  if (service.query) {
    let str = makeKeyValString(service.query);
    if (str.length) url += '?' + str;
  }
  return url;
}

function loadPage() {

  let html = "";

  for (let cat in servicesByCat) {
    let services = servicesByCat[cat];

    let calLabel = catLabels[cat] || cat;

    html += `<h2>${calLabel}</h2>`;
    html += `<ul class="services">`;

    for (let i in services) {
      let service = services[i];
      if (service.hidden) continue;
        
      html += `<li id="${service.id}" class="service">`;
      if (service.url) html += `<a href="${makeUrl(service)}" target="_blank">`
      html += `<span class="service-name">${service.name}</span>`;
      if (service.parentName) {
        html += ' on ' + service.parentName;
      }
      if (service.url) html += `</a>`;
      html += `<span class="icon-links">`;
      if (service.github) html += `<a href="https://github.com/${service.github}" target="_blank"><img src="/img/github.svg"/></a>`;
      if (service.gitlab) html += `<a href="https://gitlab.com/${service.gitlab}" target="_blank"><img src="/img/gitlab.svg"/></a>`;
      html += `</span>`;
      if (service.styles) {
        html += '<ul class="styles">';
        for (let j in service.styles) {
          let style = service.styles[j];
          if (style.hidden) continue;
          html += `<li id="${style.id}" class="style">`
          html+= `<a href="${makeUrl(style)}" target="_blank" class="style-name" ${style.title ? 'title="' + style.title + '"' : ''}>`;
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
}

function hashValue(key) {
  let searchParams = new URLSearchParams(window.location.hash.slice(1));
  if (searchParams.has(key)) return searchParams.get(key);
  return null;
}