import Fuse from 'fuse.js';
import { extractErrorCodes } from './preprocess.js';

/**
 * Optimized search for troubleshooting - Balanced approach
 */
export function createSearchIndex(kb) {
  const enhancedKB = kb.map(entry => ({
    ...entry,
    _searchText: [
      entry.error,
      ...(entry.keywords || []),
      ...(entry.solution || [])
    ].join(' ').toLowerCase(),
    _errorCodes: extractErrorCodes(entry.error + ' ' + (entry.keywords || []).join(' ')),
    _searchKeywords: (entry.keywords || []).join(' ').toLowerCase()
  }));

  return new Fuse(enhancedKB, {
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    threshold: 0.4, // Balanced threshold
    distance: 100,
    keys: [
      { 
        name: 'keywords', 
        weight: 0.7
      },
      { 
        name: 'error', 
        weight: 0.6
      },
      { 
        name: '_searchText', 
        weight: 0.4
      }
    ]
  });
}

/**
 * Smart matching with multiple fallback strategies
 */
export function findBestMatch(query, searchIndex, kb) {
  const queryLower = query.toLowerCase().trim();
  console.log(`🔍 Searching: "${queryLower}"`);

  const strategies = [];

  // STRATEGY 1: Exact error code match (highest priority)
  const errorCodes = extractErrorCodes(queryLower);
  if (errorCodes.length > 0) {
    for (const code of errorCodes) {
      const exactMatch = kb.find(entry => 
        entry._errorCodes && entry._errorCodes.includes(code)
      );
      if (exactMatch) {
        console.log(`🎯 Exact error code: ${code}`);
        return {
          entry: exactMatch,
          confidence: 0.98,
          strategy: 'error_code'
        };
      }
    }
  }

  // STRATEGY 2: Direct phrase matching for common IT issues
  const phraseMatch = findDirectPhraseMatch(queryLower, kb);
  if (phraseMatch) {
    strategies.push(phraseMatch);
  }

  // STRATEGY 3: Fuse.js semantic search
  const fuseResults = searchIndex.search(queryLower, { limit: 5 });
  if (fuseResults.length > 0) {
    fuseResults.forEach(result => {
      const confidence = calculateConfidence(result.score, queryLower, result.item);
      if (confidence >= 0.5) {
        strategies.push({
          entry: result.item,
          confidence,
          strategy: 'semantic'
        });
      }
    });
  }

  // STRATEGY 4: Token overlap as final fallback
  if (strategies.length === 0) {
    const overlapMatch = findTokenOverlapMatch(queryLower, kb);
    if (overlapMatch) {
      strategies.push(overlapMatch);
    }
  }

  // Select best match
  if (strategies.length > 0) {
    const bestMatch = strategies.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    console.log(`✅ Best match: ${bestMatch.entry.error} (${bestMatch.confidence.toFixed(2)})`);
    return bestMatch;
  }

  console.log(`❌ No match found`);
  return null;
}

/**
 * Direct phrase matching for common IT phrases
 */
function findDirectPhraseMatch(query, kb) {
  // Common phrase mappings
  const phraseMap = {
    'computer running slow': 'Computer is Running Slow',
    'computer slow': 'Computer is Running Slow',
    'pc slow': 'Computer is Running Slow',
    'laptop slow': 'Computer is Running Slow',
    'wifi not working': 'Cannot Connect to Wi-Fi',
    'wifi connection': 'Cannot Connect to Wi-Fi',
    'internet not working': 'Cannot Connect to Wi-Fi',
    'printer issues': 'My Default Printer Keeps Changing',
    'printer not working': 'My Default Printer Keeps Changing',
    'outlook not opening': 'Outlook is Not Opening',
    'email not working': 'Cannot Send or Receive Emails',
    'blue screen': 'Blue Screen of Death (BSOD)',
    'bsod': 'Blue Screen of Death (BSOD)',
    'error 404': '404 Not Found',
    '404 error': '404 Not Found',
    'page not found': '404 Not Found',
    'error 500': '500 Internal Server Error',
    'server error': '500 Internal Server Error'
  };

  // Check for direct phrase matches
  for (const [phrase, targetError] of Object.entries(phraseMap)) {
    if (query.includes(phrase)) {
      const entry = kb.find(e => e.error === targetError);
      if (entry) {
        console.log(`🎯 Direct phrase match: ${phrase} -> ${targetError}`);
        return {
          entry,
          confidence: 0.9,
          strategy: 'phrase_map'
        };
      }
    }
  }

  return null;
}

/**
 * Calculate confidence with multiple factors
 */
function calculateConfidence(fuseScore, query, entry) {
  const baseScore = Math.max(0, 1 - (fuseScore || 1));
  
  // Boost for keyword matches
  const queryTokens = new Set(query.split(/\W+/).filter(Boolean));
  const entryKeywords = new Set([
    ...entry.keywords.map(k => k.toLowerCase()),
    entry.error.toLowerCase()
  ]);
  
  let keywordMatches = 0;
  queryTokens.forEach(token => {
    if (entryKeywords.has(token)) keywordMatches++;
  });
  
  const keywordBoost = (keywordMatches / queryTokens.size) * 0.4;
  const finalScore = baseScore + keywordBoost;
  
  return Math.min(0.95, finalScore);
}

/**
 * Token overlap as final fallback
 */
function findTokenOverlapMatch(query, kb) {
  const queryTokens = new Set(query.split(/\W+/).filter(word => word.length > 2));
  if (queryTokens.size === 0) return null;

  let bestMatch = null;
  let bestOverlap = 0;

  for (const entry of kb) {
    const entryTokens = new Set([
      ...entry.error.toLowerCase().split(/\W+/),
      ...entry.keywords.flatMap(kw => kw.toLowerCase().split(/\W+/))
    ].filter(word => word.length > 2));

    let overlap = 0;
    queryTokens.forEach(token => {
      if (entryTokens.has(token)) overlap++;
    });

    const overlapRatio = overlap / queryTokens.size;
    
    if (overlapRatio > 0.3 && overlapRatio > bestOverlap) {
      bestOverlap = overlapRatio;
      bestMatch = {
        entry,
        confidence: 0.6 + (overlapRatio * 0.3),
        strategy: 'token_overlap'
      };
    }
  }

  return bestMatch;
}

/**
 * Simple acceptance criteria - always accept matches from our search
 */
export function shouldAcceptMatch(match, originalQuery) {
  if (!match) {
    console.log('❌ No match provided');
    return false;
  }
  
  // Since we already do strict matching in findBestMatch, accept all matches
  console.log(`✅ Accepting match: ${match.entry.error} (${match.confidence.toFixed(2)})`);
  return true;
}