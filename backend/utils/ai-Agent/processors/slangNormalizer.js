import fs from "fs";
import path from "path";

const dictPath = path.resolve(
  process.cwd(),
  "config",
  "slangDictionary.json"
);

let slangDict = {};
try {
  const raw = fs.readFileSync(dictPath, "utf8");
  const data = JSON.parse(raw);
  slangDict = data;
  console.log(`📚 Loaded slang dictionary with ${Object.keys(slangDict).length} entries`);
} catch (e) {
  console.warn("slangNormalizer: could not load slang dictionary", e.message);
}

export function normalizeSlang(text) {
  if (!text || typeof text !== 'string') return text;
  
  let t = text.toLowerCase();
  const originalText = t;

  console.log(`🔤 Original: "${text}"`);

  // Filter out comment keys and non-string values
  const validKeys = Object.keys(slangDict).filter(k => 
    !k.startsWith('___') && typeof slangDict[k] === 'string'
  );

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = validKeys.sort((a, b) => b.length - a.length);

  let replacementsMade = [];

  for (const k of sortedKeys) {
    const v = slangDict[k];
    
    // Use word boundaries to avoid replacing inside words
    const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, 'gi');
    const original = t;
    t = t.replace(re, v);
    
    if (t !== original) {
      replacementsMade.push(`${k}→${v}`);
    }
  }

  // Collapse extra spaces
  t = t.replace(/\s+/g, " ").trim();

  if (replacementsMade.length > 0) {
    console.log(`🔤 Replacements: ${replacementsMade.join(', ')}`);
  }
  console.log(`🔤 Normalized: "${t}"`);

  return t;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}