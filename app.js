const map = L.map('map', {
  worldCopyJump: true,
  minZoom: 2,
}).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 7,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const timelineInput = document.getElementById('timeline');
const yearLabel = document.getElementById('year-label');
const activeCount = document.getElementById('active-count');
const selectedTitle = document.getElementById('selected-title');
const selectedPeriod = document.getElementById('selected-period');
const wikiLink = document.getElementById('wiki-link');

const politicsEl = document.getElementById('politics');
const economyEl = document.getElementById('economy');
const demographicsEl = document.getElementById('demographics');
const cultureEl = document.getElementById('culture');

const CATEGORY_QUERIES = {
  politics: ['political history', 'government', 'state'],
  economy: ['economy', 'trade', 'agriculture'],
  demographics: ['demographics', 'population', 'society'],
  culture: ['culture', 'religion', 'art'],
};

const POLITIES = [
  {
    id: 'mesopotamia',
    name: 'Sumerian City-States',
    wikiTitle: 'Sumer',
    period: [-4500, -1900],
    polygon: [[29.5, 44], [29.5, 49], [34, 49], [34, 44]],
    color: '#8e7cc3',
  },
  {
    id: 'ancient-egypt',
    name: 'Ancient Egypt',
    wikiTitle: 'Ancient Egypt',
    period: [-3150, -30],
    polygon: [[21, 25], [21, 36], [32, 36], [32, 25]],
    color: '#cc9c4a',
  },
  {
    id: 'achaemenid',
    name: 'Achaemenid Empire',
    wikiTitle: 'Achaemenid Empire',
    period: [-550, -330],
    polygon: [[25, 20], [25, 70], [45, 70], [45, 20]],
    color: '#cf5b59',
  },
  {
    id: 'han-china',
    name: 'Han Dynasty',
    wikiTitle: 'Han dynasty',
    period: [-202, 220],
    polygon: [[20, 100], [20, 123], [41, 123], [41, 100]],
    color: '#ff8a5c',
  },
  {
    id: 'roman',
    name: 'Roman Empire',
    wikiTitle: 'Roman Empire',
    period: [-27, 476],
    polygon: [[27, -10], [27, 42], [52, 42], [52, -10]],
    color: '#bb4444',
  },
  {
    id: 'abbasid',
    name: 'Abbasid Caliphate',
    wikiTitle: 'Abbasid Caliphate',
    period: [750, 1258],
    polygon: [[20, 30], [20, 65], [42, 65], [42, 30]],
    color: '#5f8b4c',
  },
  {
    id: 'mongol',
    name: 'Mongol Empire',
    wikiTitle: 'Mongol Empire',
    period: [1206, 1368],
    polygon: [[35, 55], [35, 125], [57, 125], [57, 55]],
    color: '#3d8ea8',
  },
  {
    id: 'ottoman',
    name: 'Ottoman Empire',
    wikiTitle: 'Ottoman Empire',
    period: [1299, 1922],
    polygon: [[18, 15], [18, 50], [44, 50], [44, 15]],
    color: '#4e6cbf',
  },
  {
    id: 'mughal',
    name: 'Mughal Empire',
    wikiTitle: 'Mughal Empire',
    period: [1526, 1857],
    polygon: [[8, 67], [8, 90], [34, 90], [34, 67]],
    color: '#c6548c',
  },
  {
    id: 'british',
    name: 'British Empire',
    wikiTitle: 'British Empire',
    period: [1707, 1997],
    polygon: [[-35, -15], [-35, 150], [60, 150], [60, -15]],
    color: '#4a7f7f',
  },
  {
    id: 'usa',
    name: 'United States',
    wikiTitle: 'United States',
    period: [1776, 2025],
    polygon: [[25, -125], [25, -66], [49, -66], [49, -125]],
    color: '#2d65b5',
  },
  {
    id: 'prc',
    name: "People's Republic of China",
    wikiTitle: "People's Republic of China",
    period: [1949, 2025],
    polygon: [[19, 73], [19, 134], [53, 134], [53, 73]],
    color: '#d54e4e',
  },
  {
    id: 'india',
    name: 'India',
    wikiTitle: 'India',
    period: [1947, 2025],
    polygon: [[7, 68], [7, 90], [35, 90], [35, 68]],
    color: '#e07b3f',
  },
  {
    id: 'eu',
    name: 'European Union',
    wikiTitle: 'European Union',
    period: [1993, 2025],
    polygon: [[36, -10], [36, 30], [61, 30], [61, -10]],
    color: '#365db8',
  },
];

const polityLayer = L.layerGroup().addTo(map);

function formatYear(year) {
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }
  return `${year} AD`;
}

function activePolitiesAtYear(year) {
  return POLITIES.filter((polity) => year >= polity.period[0] && year <= polity.period[1]);
}

function resetInfoPanel() {
  politicsEl.textContent = '—';
  economyEl.textContent = '—';
  demographicsEl.textContent = '—';
  cultureEl.textContent = '—';
}

async function fetchExtractByTitle(title) {
  const endpoint = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const response = await fetch(endpoint);
  const json = await response.json();
  const pages = json?.query?.pages ?? {};
  const firstPage = Object.values(pages)[0];
  return firstPage?.extract || '';
}

async function fetchCategorySnippet(polityName, wikiTitle, category) {
  const categoryTerms = CATEGORY_QUERIES[category].join(' OR ');
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${wikiTitle} ${categoryTerms}`)}&utf8=1&format=json&origin=*`;

  try {
    const searchResponse = await fetch(searchUrl);
    const searchJson = await searchResponse.json();
    const title = searchJson?.query?.search?.[0]?.title || wikiTitle;
    const text = await fetchExtractByTitle(title);
    return text || `No ${category} summary found for ${polityName}.`;
  } catch {
    return `Could not load ${category} data from Wikipedia right now.`;
  }
}

async function renderPolityDetails(polity, selectedYear) {
  selectedTitle.textContent = polity.name;
  selectedPeriod.textContent = `Shown for ${formatYear(selectedYear)} (existence: ${formatYear(polity.period[0])} to ${formatYear(polity.period[1])}).`;
  wikiLink.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(polity.wikiTitle.replaceAll(' ', '_'))}`;
  wikiLink.classList.remove('hidden');

  politicsEl.textContent = 'Loading from Wikipedia…';
  economyEl.textContent = 'Loading from Wikipedia…';
  demographicsEl.textContent = 'Loading from Wikipedia…';
  cultureEl.textContent = 'Loading from Wikipedia…';

  const [politics, economy, demographics, culture] = await Promise.all([
    fetchCategorySnippet(polity.name, polity.wikiTitle, 'politics'),
    fetchCategorySnippet(polity.name, polity.wikiTitle, 'economy'),
    fetchCategorySnippet(polity.name, polity.wikiTitle, 'demographics'),
    fetchCategorySnippet(polity.name, polity.wikiTitle, 'culture'),
  ]);

  politicsEl.textContent = politics;
  economyEl.textContent = economy;
  demographicsEl.textContent = demographics;
  cultureEl.textContent = culture;
}

function renderYear(year) {
  yearLabel.textContent = formatYear(year);
  polityLayer.clearLayers();
  const activePolities = activePolitiesAtYear(year);

  activeCount.textContent = `${activePolities.length} mapped polities for this year.`;

  if (!activePolities.length) {
    selectedTitle.textContent = 'No mapped polity for this year';
    selectedPeriod.textContent = 'Move the timeline to a year where at least one polity is highlighted.';
    resetInfoPanel();
    wikiLink.classList.add('hidden');
    return;
  }

  activePolities.forEach((polity) => {
    const polygon = L.polygon(polity.polygon, {
      color: polity.color,
      fillColor: polity.color,
      fillOpacity: 0.35,
      weight: 2,
    }).addTo(polityLayer);

    polygon.bindPopup(`<strong>${polity.name}</strong><br>${formatYear(polity.period[0])} – ${formatYear(polity.period[1])}`);
    polygon.on('click', () => {
      renderPolityDetails(polity, year);
    });
  });
}

timelineInput.addEventListener('input', (event) => {
  const selectedYear = Number(event.target.value);
  renderYear(selectedYear);
});

renderYear(Number(timelineInput.value));
