const tabLinks = [...document.querySelectorAll(".tab-link")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];
const pageShell = document.querySelector(".page-shell");
const profilePanel = document.querySelector(".profile-panel");
const homeVideoBlocks = [...document.querySelectorAll(".home-video-block[data-video-id]")];
const SVG_NS = "http://www.w3.org/2000/svg";
const TABLET_LAYOUT_MAX_WIDTH = 1040;
const TABLET_LAYOUT_MIN_WIDTH = 768;
const COMPACT_LANDSCAPE_MAX_HEIGHT = 500;

let currentTabId = "about";

const isPortraitViewport = () => window.innerHeight > window.innerWidth;

const shouldCollapseProfilePanel = () => (
  window.innerWidth <= TABLET_LAYOUT_MAX_WIDTH
  && (
    isPortraitViewport()
    || window.innerHeight <= COMPACT_LANDSCAPE_MAX_HEIGHT
  )
);

const shouldUseTabletPortraitHomeLayout = () => (
  window.innerWidth >= TABLET_LAYOUT_MIN_WIDTH
  && window.innerWidth <= TABLET_LAYOUT_MAX_WIDTH
  && isPortraitViewport()
);

const syncMobileProfilePanel = () => {
  if (!profilePanel) {
    return;
  }

  const shouldHideProfile = shouldCollapseProfilePanel() && currentTabId !== "about";
  profilePanel.hidden = shouldHideProfile;
  pageShell?.classList.toggle("profile-panel-hidden", shouldHideProfile);
  pageShell?.classList.toggle(
    "tablet-portrait-home-layout",
    shouldUseTabletPortraitHomeLayout() && currentTabId === "about"
  );
};

const renderHomeVideo = (container) => {
  const { videoId, videoTitle } = container.dataset;
  if (!videoId) {
    return;
  }

  container.replaceChildren();

  const heading = document.createElement("p");
  heading.className = "home-video-title";
  heading.textContent = videoTitle || "Featured video";
  container.append(heading);

  // YouTube blocks file:// embeds because the request has no HTTP Referer.
  if (window.location.protocol === "file:") {
    const fallback = document.createElement("div");
    fallback.className = "home-video-fallback";

    const message = document.createElement("p");
    message.textContent = "Embedded YouTube playback requires this page to be opened from a website or local web server.";

    const action = document.createElement("p");
    const link = document.createElement("a");
    link.className = "home-inline-link";
    link.href = `https://www.youtube.com/watch?v=${videoId}`;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Watch this video on YouTube";
    action.append(link);

    fallback.append(message, action);
    container.append(fallback);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.className = "home-video-frame";
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.title = videoTitle || "Featured video";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allowFullscreen = true;
  container.append(iframe);
};

const initializeHomeVideos = () => {
  homeVideoBlocks.forEach(renderHomeVideo);
};

const setActiveTab = (tabId) => {
  currentTabId = tabId;
  tabLinks.forEach((button) => {
    const isActive = button.dataset.tab === tabId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.id === tabId;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });

  syncMobileProfilePanel();
};

const validTabIds = new Set(tabPanels.map((panel) => panel.id));
const initialTab = validTabIds.has(window.location.hash.slice(1))
  ? window.location.hash.slice(1)
  : "about";

setActiveTab(initialTab);
initializeHomeVideos();

tabLinks.forEach((button) => {
  button.addEventListener("click", () => {
    const { tab } = button.dataset;
    setActiveTab(tab);
    history.replaceState(null, "", `#${tab}`);
  });
});

window.addEventListener("hashchange", () => {
  const tabId = window.location.hash.slice(1);
  if (validTabIds.has(tabId)) {
    setActiveTab(tabId);
  }
});

window.addEventListener("resize", syncMobileProfilePanel);
window.addEventListener("orientationchange", () => {
  window.setTimeout(syncMobileProfilePanel, 150);
});

const publicationEntries = [...document.querySelectorAll("#publications .pub-entry")];
const wordCloudSvg = document.querySelector("#research-word-cloud");
const publicationCountNode = document.querySelector("#co-word-doc-count");
const keywordCountNode = document.querySelector("#word-cloud-keyword-count");

const phraseReplacements = [
  [/-/g, " "],
  [/revenue management/g, "revenue_management"],
  [/supply chain/g, "supply_chain"],
  [/park and ride/g, "park_and_ride"],
  [/willingness to pay/g, "willingness_to_pay"],
  [/single server/g, "single_server"],
  [/time varying/g, "time_varying"],
  [/information sharing/g, "information_sharing"],
  [/demand forecasting/g, "demand_forecasting"],
  [/lost sales/g, "lost_sales"],
  [/transactional data/g, "transactional_data"],
  [/choice behavior/g, "choice_behavior"],
  [/customer choice/g, "customer_choice"],
  [/discrete choice/g, "discrete_choice"],
  [/seat allocation/g, "seat_allocation"],
  [/resource allocation/g, "resource_allocation"],
  [/server assignment/g, "server_assignment"],
  [/service systems/g, "service_systems"],
  [/service system/g, "service_systems"],
  [/queueing systems/g, "queueing_systems"],
  [/queueing system/g, "queueing_systems"],
  [/tandem queues/g, "tandem_queue"],
  [/tandem queue/g, "tandem_queue"],
  [/freight transportation/g, "freight_transportation"],
  [/cargo transportation/g, "cargo_transportation"],
  [/intermodal network/g, "intermodal_network"],
  [/road tunnels/g, "road_tunnel"],
  [/land bridge/g, "landbridge"]
];

const stopwords = new Set([
  "a", "about", "across", "after", "all", "also", "an", "and", "analysis", "analyze", "any",
  "approach", "approaches", "approximate", "approximately", "are", "as", "at", "based", "be",
  "become", "becomes", "before", "being", "between", "both", "build", "but", "by", "can", "case",
  "cases", "characterize", "characterizes", "compare", "compared", "comparison", "conditions", "consider",
  "considers", "construct", "constructed", "data", "decision", "decisions", "demonstrate", "demonstrates",
  "describe", "describes", "determine", "determines", "develop", "developed", "developing", "develops",
  "dynamic", "each", "effects", "either", "enabling", "example", "examples", "exist", "existing",
  "extension", "extensions", "find", "findings", "focus", "focuses", "for", "formulate", "formulated",
  "formulates", "framework", "from", "general", "goal", "goals", "how", "however", "if", "in",
  "include", "includes", "including", "information", "introduction", "into", "investigate", "investigates",
  "is", "it", "its", "jointly", "large", "larger", "long", "make", "many", "maximize", "maximization",
  "maximizing", "may", "method", "methods", "model", "models", "more", "most", "need", "new", "non",
  "numerical", "objective", "observability", "observable", "obtain", "obtained", "of", "offer", "offered",
  "on", "one", "optimal", "our", "out", "paper", "papers", "perform", "performance", "platform",
  "policies", "policy", "possible", "probability", "problem", "problems", "process", "provider", "providers",
  "propose", "proposed", "proposes", "provide", "provided", "provides", "recorded", "reduce", "reduced",
  "regarding", "results", "result", "same", "service", "services", "setting", "settings", "show", "shows",
  "significantly", "single", "small", "solution", "solutions", "solve", "special", "specific", "station",
  "stations", "strategies", "strategy", "studies", "study", "such", "suggest", "suggests", "system", "systems",
  "task", "tasks", "than", "that", "the", "their", "theoretical", "theory", "there", "these", "they",
  "this", "through", "times", "to", "two", "under", "used", "using", "utility", "variety", "various",
  "via", "we", "well", "what", "when", "whether", "which", "while", "whose", "with", "within", "work",
  "works"
]);

const tokenAliases = new Map([
  ["algorithms", "algorithm"],
  ["capacities", "capacity"],
  ["choices", "choice"],
  ["commuters", "commuter"],
  ["containers", "container"],
  ["demands", "demand"],
  ["flows", "flow"],
  ["freights", "freight"],
  ["lots", "lot"],
  ["operators", "operator"],
  ["parameters", "parameter"],
  ["ports", "port"],
  ["queues", "queue"],
  ["retailers", "retailer"],
  ["suppliers", "supplier"],
  ["tunnels", "tunnel"],
  ["willingness", "willingness"],
  ["networks", "network"]
]);

const palette = [
  "#7b2637",
  "#355d7c",
  "#476454",
  "#594b42",
  "#9a5b2d",
  "#2f6f6a"
];

const colorOverrides = new Map([
  ["transportation", "#476454"]
]);

let measurementContext;

const hashWord = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
};

const measureLabelWidth = (label, fontSize) => {
  if (!measurementContext) {
    measurementContext = document.createElement("canvas").getContext("2d");
  }

  measurementContext.font = `700 ${fontSize}px Manrope`;
  return measurementContext.measureText(label).width;
};

const scaleValue = (value, minValue, maxValue, minScale, maxScale) => {
  if (maxValue === minValue) {
    return (minScale + maxScale) / 2;
  }

  const ratio = (value - minValue) / (maxValue - minValue);
  return minScale + ratio * (maxScale - minScale);
};

const extractPublicationTitle = (summaryElement) => {
  if (!summaryElement) {
    return "";
  }

  const journalTitle = summaryElement.querySelector("em")?.textContent?.trim() ?? "";
  let text = summaryElement.textContent.replace(/\s+/g, " ").trim();

  if (journalTitle) {
    text = text.split(journalTitle)[0].trim();
  }

  const yearMatch = text.match(/\b(19|20)\d{2}\b\.\s*/);
  if (yearMatch) {
    text = text.slice(yearMatch.index + yearMatch[0].length).trim();
  }

  text = text.replace(/\(with .*?\)\.?$/i, "").trim();
  return text.replace(/\.+$/, "").trim();
};

const normalizeToken = (token) => {
  let normalized = tokenAliases.get(token) ?? token;

  if (normalized === "analysis") {
    return "analysis";
  }

  if (normalized.endsWith("ies") && normalized.length > 5) {
    normalized = `${normalized.slice(0, -3)}y`;
  } else if (normalized.endsWith("s") && normalized.length > 4 && !normalized.endsWith("ss") && !normalized.includes("_")) {
    normalized = normalized.slice(0, -1);
  }

  if (normalized === "price") {
    normalized = "pricing";
  }

  return normalized;
};

const extractKeywords = (text) => {
  if (!text) {
    return [];
  }

  let cleaned = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\b(introduction|analytical results|applications|extensions)\s*:/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/[']/g, "");

  phraseReplacements.forEach(([pattern, replacement]) => {
    cleaned = cleaned.replace(pattern, replacement);
  });

  const tokens = cleaned.match(/[a-z_][a-z0-9_]*/g) ?? [];

  return tokens
    .map(normalizeToken)
    .filter((token) => token.length >= 3)
    .filter((token) => !stopwords.has(token));
};

const formatKeyword = (term) => term
  .split("_")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const buildKeywordDataset = (records) => {
  const scoreMap = new Map();
  const docFrequencyMap = new Map();

  records.forEach(({ title, abstract }) => {
    const titleTerms = new Set(extractKeywords(title));
    const abstractTerms = new Set(extractKeywords(abstract));
    const documentTerms = new Set([...titleTerms, ...abstractTerms]);

    titleTerms.forEach((term) => {
      scoreMap.set(term, (scoreMap.get(term) ?? 0) + 3);
    });

    abstractTerms.forEach((term) => {
      scoreMap.set(term, (scoreMap.get(term) ?? 0) + 1);
    });

    documentTerms.forEach((term) => {
      docFrequencyMap.set(term, (docFrequencyMap.get(term) ?? 0) + 1);
    });
  });

  const keywords = [...scoreMap.entries()]
    .map(([term, score]) => ({
      term,
      label: formatKeyword(term),
      score,
      docs: docFrequencyMap.get(term) ?? 0
    }))
    .filter((entry) => entry.docs >= 2);

  const mergeKeyword = (sourceTerm, targetTerm, options = {}) => {
    const sourceEntry = keywords.find((entry) => entry.term === sourceTerm);
    let targetEntry = keywords.find((entry) => entry.term === targetTerm);

    if (!sourceEntry && !targetEntry) {
      return;
    }

    if (!targetEntry) {
      targetEntry = {
        term: targetTerm,
        label: formatKeyword(targetTerm),
        score: 0,
        docs: 0
      };
      keywords.push(targetEntry);
    }

    targetEntry.score = Math.max(
      targetEntry.score,
      sourceEntry?.score ?? 0,
      options.minScore ?? 0
    );
    targetEntry.docs = Math.max(
      targetEntry.docs,
      sourceEntry?.docs ?? 0,
      docFrequencyMap.get(targetTerm) ?? 0,
      options.minDocs ?? 0
    );

    if (sourceEntry && sourceEntry !== targetEntry) {
      keywords.splice(keywords.indexOf(sourceEntry), 1);
    }
  };

  const pricingEntry = keywords.find((entry) => entry.term === "pricing");
  const choiceEntry = keywords.find((entry) => entry.term === "choice");
  const revenueEntry = keywords.find((entry) => entry.term === "revenue");
  const intermodalEntry = keywords.find((entry) => entry.term === "intermodal")
    ?? keywords.find((entry) => entry.term === "intermodal_network");
  let queueingSystemsEntry = keywords.find((entry) => entry.term === "queueing_systems");

  mergeKeyword("discrete", "discrete_choice", {
    minScore: choiceEntry?.score ?? 0,
    minDocs: choiceEntry?.docs ?? 0
  });
  mergeKeyword("choice", "discrete_choice", {
    minScore: choiceEntry?.score ?? 0,
    minDocs: choiceEntry?.docs ?? 0
  });
  mergeKeyword("revenue", "revenue_management", {
    minScore: revenueEntry?.score ?? 0,
    minDocs: revenueEntry?.docs ?? 0
  });
  mergeKeyword("cargo_transportation", "transportation", {
    minScore: intermodalEntry?.score ?? 0,
    minDocs: intermodalEntry?.docs ?? 0
  });
  mergeKeyword("freight_transportation", "transportation", {
    minScore: intermodalEntry?.score ?? 0,
    minDocs: intermodalEntry?.docs ?? 0
  });

  const transportationEntry = keywords.find((entry) => entry.term === "transportation");
  if (transportationEntry) {
    transportationEntry.score = Math.max(
      transportationEntry.score,
      intermodalEntry?.score ?? 0
    );
  }

  queueingSystemsEntry = keywords.find((entry) => entry.term === "queueing_systems");

  if (!queueingSystemsEntry && (docFrequencyMap.get("queueing_systems") ?? 0) > 0) {
    queueingSystemsEntry = {
      term: "queueing_systems",
      label: formatKeyword("queueing_systems"),
      score: pricingEntry?.score ?? Math.max(...keywords.map((entry) => entry.score), 1),
      docs: docFrequencyMap.get("queueing_systems") ?? 0
    };
    keywords.push(queueingSystemsEntry);
  }

  if (queueingSystemsEntry) {
    const targetScore = pricingEntry?.score ?? Math.max(...keywords.map((entry) => entry.score), 1);
    queueingSystemsEntry.score = Math.max(queueingSystemsEntry.score, targetScore);
  }
  return keywords
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.docs !== left.docs) {
        return right.docs - left.docs;
      }
      return left.label.localeCompare(right.label);
    })
    .slice(0, 34);
};

const renderEmptyState = (svg, message) => {
  svg.innerHTML = "";

  const textNode = document.createElementNS(SVG_NS, "text");
  textNode.setAttribute("x", "500");
  textNode.setAttribute("y", "340");
  textNode.setAttribute("class", "research-network-empty");
  textNode.textContent = message;
  svg.append(textNode);
};

const intersects = (candidate, placed) => placed.some((box) => (
  candidate.left < box.right + box.padding
    && candidate.right > box.left - box.padding
    && candidate.top < box.bottom + box.padding
    && candidate.bottom > box.top - box.padding
));

const renderWordCloud = (svg, keywords) => {
  const width = 1260;
  const height = 880;
  const padding = 70;
  const placed = [];
  const maxScore = keywords[0]?.score ?? 1;
  const minScore = keywords[keywords.length - 1]?.score ?? maxScore;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";

  keywords.forEach((entry, index) => {
    const fontSize = scaleValue(entry.score, minScore, maxScore, 20, 72);
    const labelWidth = measureLabelWidth(entry.label, fontSize);
    const labelHeight = fontSize * 0.92;
    const startAngle = (hashWord(entry.term) % 360) * (Math.PI / 180);
    let chosenBox = null;

    for (let step = 0; step < 3800; step += 1) {
      const angle = startAngle + step * 0.39;
      const radius = 16 + 11 * Math.sqrt(step);
      const centerX = width / 2 + radius * Math.cos(angle);
      const centerY = height / 2 + radius * 0.8 * Math.sin(angle);
      const candidate = {
        left: centerX - labelWidth / 2,
        right: centerX + labelWidth / 2,
        top: centerY - labelHeight / 2,
        bottom: centerY + labelHeight / 2,
        x: centerX,
        y: centerY,
        padding: Math.max(14, fontSize * 0.34)
      };

      const withinBounds = candidate.left >= padding
        && candidate.right <= width - padding
        && candidate.top >= padding
        && candidate.bottom <= height - padding;

      if (withinBounds && !intersects(candidate, placed)) {
        chosenBox = candidate;
        break;
      }
    }

    if (!chosenBox) {
      return;
    }

    placed.push(chosenBox);

    const textNode = document.createElementNS(SVG_NS, "text");
    const color = colorOverrides.get(entry.term) ?? palette[index % palette.length];
    textNode.setAttribute("x", chosenBox.x.toFixed(1));
    textNode.setAttribute("y", chosenBox.y.toFixed(1));
    textNode.setAttribute("font-size", fontSize.toFixed(1));
    textNode.setAttribute("class", `word-cloud-term${index < 8 ? " is-featured" : ""}`);
    textNode.setAttribute("fill", color);
    textNode.setAttribute("text-anchor", "middle");
    textNode.setAttribute("dominant-baseline", "middle");
    textNode.setAttribute("tabindex", "0");

    const titleNode = document.createElementNS(SVG_NS, "title");
    titleNode.textContent = `${entry.label}: appears in ${entry.docs} publications`;
    textNode.append(titleNode);
    textNode.append(document.createTextNode(entry.label));
    svg.append(textNode);
  });
};

const buildResearchWordCloud = () => {
  if (!wordCloudSvg || publicationEntries.length === 0) {
    return;
  }

  const records = publicationEntries
    .map((entry) => ({
      title: extractPublicationTitle(entry.querySelector(".pub-title")),
      abstract: entry.querySelector(".pub-abstract")?.textContent?.replace(/\s+/g, " ").trim() ?? ""
    }))
    .filter((record) => record.title || record.abstract);

  if (publicationCountNode) {
    publicationCountNode.textContent = `${records.length} publications`;
  }

  const keywords = buildKeywordDataset(records);

  if (keywordCountNode) {
    keywordCountNode.textContent = keywords.length
      ? `${keywords.length} recurring keywords`
      : "no recurring keywords";
  }

  if (!keywords.length) {
    renderEmptyState(wordCloudSvg, "Publication keywords will appear here.");
    return;
  }

  renderWordCloud(wordCloudSvg, keywords);
};

buildResearchWordCloud();

