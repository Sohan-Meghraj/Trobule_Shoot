import leven from 'leven';

// 🧠 ENTERPRISE AI: Comprehensive normalization dictionary
const AI_NORMALIZATION_MAP = {
  // Common abbreviations
  '\\bwt\\b': 'what', '\\bwts\\b': 'what is', '\\bwtw\\b': 'what the',
  '\\bpls\\b': 'please', '\\bplz\\b': 'please', '\\bthx\\b': 'thanks',
  '\\btnx\\b': 'thanks', '\\bty\\b': 'thank you', '\\bnp\\b': 'no problem',
  
  // Tech abbreviations  
  '\\berr\\b': 'error', '\\berrs\\b': 'errors', '\\bprob\\b': 'problem',
  '\\bprobs\\b': 'problems', '\\bcomp\\b': 'computer', '\\bpcs\\b': 'computers',
  '\\bcpu\\b': 'processor', '\\bgpu\\b': 'graphics', '\\bram\\b': 'memory',
  '\\bhdd\\b': 'hard drive', '\\bssd\\b': 'solid state drive', '\\bbios\\b': 'basic input output system',
  '\\bos\\b': 'operating system', '\\bwin\\b': 'windows', '\\bmac\\b': 'macos',
  '\\blinux\\b': 'linux', '\\bapp\\b': 'application', '\\bapps\\b': 'applications',
  
  // Network & Internet
  '\\bwifi\\b': 'wi-fi', '\\bnet\\b': 'network', '\\binet\\b': 'internet',
  '\\bconn\\b': 'connection', '\\bdisconn\\b': 'disconnection', '\\bbandwidth\\b': 'band width',
  '\\bip\\b': 'internet protocol', '\\bdns\\b': 'domain name system', '\\bvpn\\b': 'virtual private network',
  '\\blan\\b': 'local area network', '\\bwan\\b': 'wide area network',
  
  // Common typos and slang
  '\\bnoot\\b': 'not', '\\bnooot\\b': 'not', '\\bcant\\b': 'cannot',
  '\\bwont\\b': 'will not', '\\bdoesnt\\b': 'does not', '\\bdont\\b': 'do not',
  '\\barent\\b': 'are not', '\\bisnt\\b': 'is not', '\\bwasnt\\b': 'was not',
  '\\bwerent\\b': 'were not', '\\bhavent\\b': 'have not', '\\bhasnt\\b': 'has not',
  '\\bhadnt\\b': 'had not', '\\bwouldnt\\b': 'would not', '\\bcouldnt\\b': 'could not',
  '\\bshouldnt\\b': 'should not', '\\bmightnt\\b': 'might not', '\\bmustnt\\b': 'must not',
  
  // Common misspellings
  '\\breciev\\b': 'receive', '\\brecieving\\b': 'receiving', '\\brecieved\\b': 'received',
  '\\brecieve\\b': 'receive', '\\bseperate\\b': 'separate', '\\bdefinately\\b': 'definitely',
  '\\boccured\\b': 'occurred', '\\booning\\b': 'opening', '\\bcliking\\b': 'clicking',
  '\\bclik\\b': 'click', '\\bdubble\\b': 'double', '\\btrubble\\b': 'trouble',
  '\\btrubl\\b': 'trouble', '\\bissu\\b': 'issue', '\\bisue\\b': 'issue',
  
  // Short forms and contractions
  '\\bu\\b': 'you', '\\bur\\b': 'your', '\\burs\\b': 'yours',
  '\\bim\\b': 'i am', '\\bive\\b': 'i have', '\\bill\\b': 'i will',
  '\\bid\\b': 'i would', '\\byoure\\b': 'you are', '\\byouve\\b': 'you have',
  '\\byoull\\b': 'you will', '\\byoud\\b': 'you would', '\\bhes\\b': 'he is',
  '\\bshes\\b': 'she is', '\\bits\\b': 'it is', '\\bwere\\b': 'we are',
  '\\bweve\\b': 'we have', '\\bwell\\b': 'we will', '\\bwed\\b': 'we would',
  '\\btheyre\\b': 'they are', '\\btheyve\\b': 'they have', '\\btheyll\\b': 'they will',
  '\\btheyd\\b': 'they would', '\\bthats\\b': 'that is', '\\bwheres\\b': 'where is',
  '\\bwhens\\b': 'when is', '\\bhows\\b': 'how is', '\\bwhys\\b': 'why is',
  '\\bheres\\b': 'here is', '\\btheres\\b': 'there is', '\\bwhos\\b': 'who is',
  
  // Common tech phrases
  '\\bno work\\b': 'not working', '\\bnot work\\b': 'not working',
  '\\bno connect\\b': 'not connecting', '\\bnot connect\\b': 'not connecting',
  '\\bno open\\b': 'not opening', '\\bnot open\\b': 'not opening',
  '\\bno start\\b': 'not starting', '\\bnot start\\b': 'not starting',
  '\\bno load\\b': 'not loading', '\\bnot load\\b': 'not loading',
  '\\bno respond\\b': 'not responding', '\\bnot respond\\b': 'not responding',
  '\\bno display\\b': 'not displaying', '\\bnot display\\b': 'not displaying'
};

// 🧠 SMART CONTEXT EXPANSION MAP
const CONTEXT_EXPANSION_MAP = {
  '404': ['http error', 'website', 'page not found', 'broken link', 'missing page'],
  '500': ['server error', 'internal error', 'website down', 'application crash'],
  'wifi': ['wireless', 'network', 'internet', 'connection', 'wi-fi'],
  'internet': ['browser', 'website', 'online', 'network', 'connection'],
  'computer': ['pc', 'laptop', 'desktop', 'device', 'machine'],
  'slow': ['lag', 'lagging', 'performance', 'speed', 'freeze'],
  'crash': ['close', 'stop', 'freeze', 'not responding', 'error'],
  'blue screen': ['bsod', 'windows error', 'system crash', 'stop code'],
  'outlook': ['email', 'microsoft', 'office', 'client', 'mail'],
  'printer': ['print', 'printing', 'paper', 'ink', 'document'],
  'sound': ['audio', 'speaker', 'volume', 'hear', 'mute'],
  'camera': ['webcam', 'video', 'zoom', 'teams', 'meeting']
};

// 🧠 ADVANCED VOCABULARY BUILDER
export function buildVocab(kb) {
  const vocabulary = new Set();
  
  // Add all normalization values
  Object.values(AI_NORMALIZATION_MAP).forEach(value => {
    value.split(' ').forEach(word => {
      if (word.length > 1) vocabulary.add(word);
    });
  });
  
  // Add all context expansion words
  Object.values(CONTEXT_EXPANSION_MAP).flat().forEach(word => {
    vocabulary.add(word);
  });
  
  // Enhanced KB processing
  const addToVocab = (text) => {
    if (!text) return;
    const words = text.toString().toLowerCase()
      .split(/[^\w]+/)
      .filter(word => word.length > 1 && word.length < 20);
    
    words.forEach(word => vocabulary.add(word));
  };

  kb.forEach(entry => {
    addToVocab(entry.error);
    if (Array.isArray(entry.keywords)) {
      entry.keywords.forEach(addToVocab);
    }
    if (Array.isArray(entry.solution)) {
      entry.solution.forEach(addToVocab);
    }
  });

  console.log(`🧠 AI Vocabulary built: ${vocabulary.size} words`);
  return Array.from(vocabulary);
}

// 🧠 ENTERPRISE-GRADE QUERY PROCESSING
export function preprocessQuery(rawQuery, vocabulary = []) {
  if (!rawQuery || typeof rawQuery !== 'string') return '';

  let processed = rawQuery.toLowerCase().trim();
  
  console.log(`🔤 Original: "${processed}"`);
  
  // PHASE 1: Advanced Normalization
  processed = applyAdvancedNormalization(processed);
  console.log(`🔄 Normalized: "${processed}"`);
  
  // PHASE 2: Contextual Expansion
  processed = applyContextExpansion(processed);
  console.log(`🎯 Expanded: "${processed}"`);
  
  // PHASE 3: Intelligent Spell Correction
  processed = applyIntelligentSpellCorrection(processed, vocabulary);
  console.log(`✨ Corrected: "${processed}"`);
  
  // PHASE 4: Semantic Enhancement
  processed = applySemanticEnhancement(processed);
  console.log(`🚀 Enhanced: "${processed}"`);
  
  return processed;
}

// 🧠 PHASE 1: Advanced Normalization
function applyAdvancedNormalization(query) {
  let normalized = query;
  
  // Apply comprehensive normalization
  Object.entries(AI_NORMALIZATION_MAP).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'gi');
    normalized = normalized.replace(regex, replacement);
  });
  
  // Clean up: remove extra spaces and punctuation
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// 🧠 PHASE 2: Contextual Expansion
function applyContextExpansion(query) {
  let expanded = query;
  const addedContext = new Set();
  
  Object.entries(CONTEXT_EXPANSION_MAP).forEach(([trigger, contextWords]) => {
    if (query.includes(trigger)) {
      contextWords.forEach(word => {
        if (!query.includes(word) && !addedContext.has(word)) {
          expanded += ` ${word}`;
          addedContext.add(word);
        }
      });
    }
  });
  
  return expanded.trim();
}

// 🧠 PHASE 3: Intelligent Spell Correction
function applyIntelligentSpellCorrection(query, vocabulary) {
  const tokens = query.split(/\s+/).filter(Boolean);
  const corrected = tokens.map(token => {
    // Skip numbers and very short tokens
    if (/^\d+$/.test(token) || token.length <= 1) {
      return token;
    }
    
    // Skip if already perfect
    if (vocabulary.includes(token)) {
      return token;
    }
    
    // Multi-strategy correction
    return findBestCorrection(token, vocabulary);
  });
  
  return corrected.join(' ');
}

// 🧠 MULTI-STRATEGY SPELLING CORRECTION
function findBestCorrection(token, vocabulary) {
  let bestMatch = token;
  let bestScore = Infinity;
  
  // Strategy 1: Exact prefix matching (fast)
  const prefixMatches = vocabulary.filter(word => 
    word.startsWith(token.substring(0, Math.min(3, token.length)))
  );
  
  for (const word of prefixMatches) {
    const distance = leven(token, word);
    const lengthRatio = Math.min(token.length, word.length) / Math.max(token.length, word.length);
    const normalizedDistance = distance / Math.max(token.length, word.length);
    
    // Combined score considering both distance and length similarity
    const score = normalizedDistance * (1 - lengthRatio * 0.3);
    
    if (score < 0.15 && score < bestScore) { // Very strict threshold
      bestScore = score;
      bestMatch = word;
    }
  }
  
  // Strategy 2: Sound-based fallback for very close matches
  if (bestMatch === token) {
    for (const word of vocabulary) {
      if (Math.abs(word.length - token.length) > 2) continue;
      
      const distance = leven(token, word);
      if (distance <= 1 && distance < bestScore) { // Only 1 character difference
        bestScore = distance;
        bestMatch = word;
      }
    }
  }
  
  return bestMatch;
}

// 🧠 PHASE 4: Semantic Enhancement
function applySemanticEnhancement(query) {
  let enhanced = query;
  
  // Error code detection and enhancement
  const errorCodes = query.match(/\b\d{3}\b/g);
  if (errorCodes) {
    errorCodes.forEach(code => {
      if (!enhanced.includes('error')) {
        enhanced += ' error';
      }
      if (code === '404' && !enhanced.includes('not found')) {
        enhanced += ' not found';
      }
      if (code === '500' && !enhanced.includes('server')) {
        enhanced += ' server';
      }
    });
  }
  
  // Common problem pattern enhancement
  if ((enhanced.includes('not') || enhanced.includes('no')) && 
      (enhanced.includes('work') || enhanced.includes('open') || enhanced.includes('connect'))) {
    if (!enhanced.includes('working')) enhanced += ' working';
  }
  
  return enhanced.replace(/\s+/g, ' ').trim();
}

// 🧠 ENHANCED ERROR CODE EXTRACTION
export function extractErrorCodes(query) {
  const codes = query.match(/\b(\d{3,4}|[A-Z]+_\d+)\b/gi);
  return codes ? codes.map(code => code.toUpperCase()) : [];
}

// 🧠 ADVANCED CONTEXT ENHANCEMENT
export function enhanceQueryWithContext(query, kb) {
  let enhanced = query.toLowerCase();
  const enhancements = [];
  
  // Tech context enhancement
  if (enhanced.includes('wifi') || enhanced.includes('wireless') || enhanced.includes('wi-fi')) {
    enhancements.push('network', 'internet', 'connection');
  }
  
  if (enhanced.includes('computer') || enhanced.includes('pc') || enhanced.includes('laptop')) {
    enhancements.push('device', 'system', 'machine');
  }
  
  if (enhanced.includes('slow') || enhanced.includes('lag')) {
    enhancements.push('performance', 'speed', 'response');
  }
  
  if (enhanced.includes('email') || enhanced.includes('outlook')) {
    enhancements.push('message', 'communication', 'client');
  }
  
  // Error-specific enhancements
  if (enhanced.includes('404')) {
    enhancements.push('http', 'website', 'browser', 'page');
  }
  
  if (enhanced.includes('500')) {
    enhancements.push('server', 'internal', 'application');
  }
  
  if (enhanced.includes('blue') && enhanced.includes('screen')) {
    enhancements.push('bsod', 'windows', 'crash', 'stop');
  }
  
  // Add unique enhancements
  const uniqueEnhancements = [...new Set(enhancements)].filter(enh => !enhanced.includes(enh));
  if (uniqueEnhancements.length > 0) {
    enhanced += ' ' + uniqueEnhancements.join(' ');
  }
  
  return enhanced.trim();
}

// 🧠 QUERY INTENT DETECTION (BONUS FEATURE)
export function detectQueryIntent(query) {
  const intents = [];
  const q = query.toLowerCase();
  
  if (q.includes('wifi') || q.includes('network') || q.includes('internet')) {
    intents.push('network_issue');
  }
  
  if (q.includes('error') || q.includes('crash') || q.includes('not working')) {
    intents.push('error_resolution');
  }
  
  if (q.includes('slow') || q.includes('lag') || q.includes('performance')) {
    intents.push('performance_issue');
  }
  
  if (q.includes('email') || q.includes('outlook') || q.includes('mail')) {
    intents.push('email_issue');
  }
  
  if (q.includes('print') || q.includes('printer')) {
    intents.push('printing_issue');
  }
  
  if (q.includes('sound') || q.includes('audio') || q.includes('speaker')) {
    intents.push('audio_issue');
  }
  
  return intents.length > 0 ? intents : ['general_troubleshooting'];
}

console.log('🚀 Enterprise AI Preprocessor Loaded - Ready for next-level understanding!');