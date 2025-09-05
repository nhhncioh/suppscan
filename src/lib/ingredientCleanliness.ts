// src/lib/ingredientCleanliness.ts - Enhanced Version with Better Extraction
import { IngredientCategory } from '@/types/suppscan';

export interface CleanlinessScore {
  overall: number; // 1-10
  category: 'excellent' | 'good' | 'fair' | 'poor';
  flags: string[];
  positives: string[];
}

export interface IngredientAnalysis {
  name: string;
  category: IngredientCategory;
  cleanlinessImpact: number; // -3 to +3
  reasoning: string;
  alternatives?: string[];
}

// Enhanced ingredient database with more comprehensive entries
const INGREDIENT_DATABASE: Record<string, {
  category: IngredientCategory;
  impact: number;
  reasoning: string;
  alternatives?: string[];
}> = {
  // Active ingredients (positive impact)
  'ascorbic acid': {
    category: 'active_ingredient',
    impact: 2,
    reasoning: 'High-quality, bioavailable form of Vitamin C with proven immune support benefits'
  },
  'vitamin c': {
    category: 'active_ingredient',
    impact: 2,
    reasoning: 'Essential antioxidant vitamin with immune system support'
  },
  'cholecalciferol': {
    category: 'active_ingredient',
    impact: 2,
    reasoning: 'Natural, highly bioavailable form of Vitamin D3'
  },
  'methylcobalamin': {
    category: 'active_ingredient',
    impact: 2,
    reasoning: 'Active, methylated form of B12 with superior bioavailability'
  },
  'folate': {
    category: 'active_ingredient',
    impact: 2,
    reasoning: 'Natural folate is more bioavailable than synthetic folic acid'
  },
  'alpha tocopherol': {
    category: 'active_ingredient',
    impact: 2,
    reasoning: 'Natural form of Vitamin E with antioxidant properties'
  },

  // Beneficial excipients
  'vegetable cellulose': {
    category: 'beneficial_excipient',
    impact: 1,
    reasoning: 'Plant-based capsule material, clean and vegan-friendly'
  },
  'rice flour': {
    category: 'beneficial_excipient',
    impact: 1,
    reasoning: 'Natural, hypoallergenic filler derived from rice'
  },
  'sunflower lecithin': {
    category: 'beneficial_excipient',
    impact: 1,
    reasoning: 'Natural emulsifier, better alternative to soy lecithin'
  },
  'organic rice concentrate': {
    category: 'beneficial_excipient',
    impact: 1,
    reasoning: 'Organic, natural flow agent alternative to synthetic fillers'
  },
  'natural flavor': {
    category: 'beneficial_excipient',
    impact: 1,
    reasoning: 'Natural flavoring without artificial additives'
  },

  // Neutral excipients (acceptable)
  'microcrystalline cellulose': {
    category: 'neutral_excipient',
    impact: 0,
    reasoning: 'Common, generally safe binding agent derived from plant fiber'
  },
  'cellulose': {
    category: 'neutral_excipient',
    impact: 0,
    reasoning: 'Plant-derived fiber used as a safe binding agent'
  },
  'calcium carbonate': {
    category: 'neutral_excipient',
    impact: 0,
    reasoning: 'Natural mineral used as filler, also provides some calcium'
  },
  'dicalcium phosphate': {
    category: 'neutral_excipient',
    impact: 0,
    reasoning: 'Mineral-based filler that also provides calcium and phosphorus'
  },
  'gelatin': {
    category: 'neutral_excipient',
    impact: 0,
    reasoning: 'Traditional capsule material, not suitable for vegetarians but generally safe'
  },
  'hypromellose': {
    category: 'neutral_excipient',
    impact: 0,
    reasoning: 'Vegetarian capsule material, chemically stable and safe'
  },
  'hydroxypropyl methylcellulose': {
    category: 'neutral_excipient',
    impact: 0,
    reasoning: 'Vegetarian capsule material, safe alternative to gelatin'
  },

  // Questionable fillers (mild concern)
  'magnesium stearate': {
    category: 'questionable_filler',
    impact: -1,
    reasoning: 'Common flow agent that may reduce nutrient absorption, though effects are minimal at typical doses',
    alternatives: ['rice flour', 'sunflower lecithin', 'organic rice concentrate']
  },
  'stearic acid': {
    category: 'questionable_filler',
    impact: -1,
    reasoning: 'Saturated fatty acid used as lubricant, may affect absorption'
  },
  'silicon dioxide': {
    category: 'questionable_filler',
    impact: -1,
    reasoning: 'Anti-caking agent that may interfere with nutrient absorption at high doses'
  },
  'maltodextrin': {
    category: 'questionable_filler',
    impact: -1,
    reasoning: 'Highly processed starch that can spike blood sugar, unnecessary additive'
  },
  'soy lecithin': {
    category: 'questionable_filler',
    impact: -1,
    reasoning: 'Often from GMO soybeans, potential allergen, sunflower lecithin is better alternative'
  },

  // Artificial additives (concerning)
  'titanium dioxide': {
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Whitening agent with potential safety concerns, banned in food in EU',
    alternatives: ['natural colorings', 'no coloring needed']
  },
  'artificial flavor': {
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Synthetic flavoring chemicals, natural flavors are safer alternatives'
  },
  'artificial colors': {
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Synthetic dyes linked to hyperactivity and other health concerns'
  },
  'fd&c red no. 40': {
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Artificial red dye linked to behavioral issues in children'
  },
  'fd&c blue no. 1': {
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Artificial blue dye with potential safety concerns'
  },
  'fd&c yellow no. 6': {
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Artificial yellow dye that may cause allergic reactions'
  },
  'polysorbate 80': {
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Synthetic emulsifier that may disrupt gut microbiome'
  },

  // Preservatives
  'sodium benzoate': {
    category: 'preservative',
    impact: -1,
    reasoning: 'Chemical preservative, generally safe but can form benzene when combined with vitamin C'
  },
  'potassium sorbate': {
    category: 'preservative',
    impact: -1,
    reasoning: 'Chemical preservative, safer than some alternatives but still synthetic'
  },
  'bht': {
    category: 'preservative',
    impact: -2,
    reasoning: 'Synthetic antioxidant preservative with potential health concerns'
  },
  'bha': {
    category: 'preservative',
    impact: -2,
    reasoning: 'Synthetic preservative classified as possible carcinogen'
  },

  // Allergens
  'soy': {
    category: 'allergen',
    impact: -1,
    reasoning: 'Common allergen, often from GMO sources'
  },
  'wheat': {
    category: 'allergen',
    impact: -1,
    reasoning: 'Contains gluten, problematic for those with celiac disease or sensitivity'
  },
  'milk': {
    category: 'allergen',
    impact: -1,
    reasoning: 'Dairy allergen, not suitable for lactose intolerant individuals'
  },
  'egg': {
    category: 'allergen',
    impact: -1,
    reasoning: 'Common allergen ingredient'
  }
};

// Enhanced pattern matching for ingredients not in database
const INGREDIENT_PATTERNS = [
  // Artificial colors pattern
  {
    pattern: /^(fd&c|d&c)\s+(red|blue|green|yellow)\s+(no\.?\s*)?\d+$/i,
    category: 'artificial_additive' as IngredientCategory,
    impact: -2,
    reasoning: 'Artificial food dye with potential safety concerns'
  },
  // Natural colors
  {
    pattern: /^(natural|organic)\s+(color|flavour?|flavor)$/i,
    category: 'beneficial_excipient' as IngredientCategory,
    impact: 1,
    reasoning: 'Natural coloring or flavoring agent'
  },
  // Vitamins and minerals (active ingredients)
  {
    pattern: /^(vitamin|vit\.?)\s+[a-z]\d*$/i,
    category: 'active_ingredient' as IngredientCategory,
    impact: 2,
    reasoning: 'Essential vitamin with health benefits'
  },
  // Mineral salts
  {
    pattern: /^(calcium|magnesium|zinc|iron|potassium|sodium)\s+(carbonate|oxide|sulfate|chloride|citrate|gluconate|bisglycinate|picolinate)$/i,
    category: 'neutral_excipient' as IngredientCategory,
    impact: 0,
    reasoning: 'Mineral compound used as ingredient or filler'
  },
  // Organic compounds
  {
    pattern: /^organic\s+/i,
    category: 'beneficial_excipient' as IngredientCategory,
    impact: 1,
    reasoning: 'Organic ingredient without synthetic pesticides or chemicals'
  }
];

export class IngredientCleanlinessScanner {
  
  static analyzeIngredients(ocrText: string, ingredientList?: string[]): {
    analysis: IngredientAnalysis[];
    cleanlinessScore: CleanlinessScore;
  } {
    console.log('=== INGREDIENT ANALYSIS DEBUG ===');
    console.log('OCR Text length:', ocrText.length);
    console.log('Provided ingredient list:', ingredientList);
    
    // Extract ingredients from OCR text if not provided, with enhanced extraction
    const extractedIngredients = ingredientList || this.extractIngredientsFromOCR(ocrText);
    
    console.log('Final extracted ingredients:', extractedIngredients);
    
    if (extractedIngredients.length === 0) {
      console.log('No ingredients found - returning default neutral analysis');
      return {
        analysis: [{
          name: 'Unknown ingredients',
          category: 'neutral_excipient',
          cleanlinessImpact: 0,
          reasoning: 'Could not detect ingredient list from image. Try scanning the ingredient panel more clearly.'
        }],
        cleanlinessScore: {
          overall: 5,
          category: 'fair',
          flags: ['Could not detect ingredient list'],
          positives: []
        }
      };
    }
    
    const analysis: IngredientAnalysis[] = [];
    let totalImpact = 0;
    const flags: string[] = [];
    const positives: string[] = [];
    
    for (const ingredient of extractedIngredients) {
      const ingredientAnalysis = this.analyzeIngredient(ingredient);
      analysis.push(ingredientAnalysis);
      totalImpact += ingredientAnalysis.cleanlinessImpact;
      
      if (ingredientAnalysis.cleanlinessImpact < -1) {
        flags.push(`${ingredient}: ${ingredientAnalysis.reasoning}`);
      } else if (ingredientAnalysis.cleanlinessImpact > 0) {
        positives.push(`${ingredient}: ${ingredientAnalysis.reasoning}`);
      }
    }
    
    // Enhanced scoring logic
    const averageImpact = totalImpact / Math.max(extractedIngredients.length, 1);
    
    // Better baseline scoring
    let baseScore = 6;
    
    // Count ingredient types for better context
    const beneficial = analysis.filter(ing => ing.cleanlinessImpact > 0).length;
    const problematic = analysis.filter(ing => ing.cleanlinessImpact < -1).length;
    const neutral = analysis.filter(ing => ing.cleanlinessImpact === 0).length;
    
    // Adjust base score based on formulation quality
    if (beneficial > 0 && problematic === 0) {
      baseScore = 7; // Clean formulation with benefits
    } else if (beneficial === 0 && problematic === 0 && neutral > 0) {
      baseScore = 6; // Standard neutral formulation
    } else if (problematic > 0) {
      baseScore = 4; // Has concerning ingredients
    }
    
    // Apply average impact adjustment
    const rawScore = baseScore + averageImpact;
    const overall = Math.max(1, Math.min(10, Math.round(rawScore * 2) / 2)); // Round to 0.5
    
    let category: CleanlinessScore['category'];
    if (overall >= 8) category = 'excellent';
    else if (overall >= 6.5) category = 'good';
    else if (overall >= 4.5) category = 'fair';
    else category = 'poor';
    
    console.log('Final analysis:', { 
      ingredientCount: analysis.length, 
      totalImpact, 
      averageImpact, 
      baseScore, 
      overall, 
      category 
    });
    
    return {
      analysis,
      cleanlinessScore: {
        overall,
        category,
        flags,
        positives
      }
    };
  }
  
  private static analyzeIngredient(ingredient: string): IngredientAnalysis {
    const normalized = ingredient.toLowerCase().trim();
    console.log('Analyzing ingredient:', ingredient, '-> normalized:', normalized);
    
    // Check exact match first
    const exactMatch = INGREDIENT_DATABASE[normalized];
    if (exactMatch) {
      console.log('Found exact match for:', normalized);
      return {
        name: ingredient,
        category: exactMatch.category,
        cleanlinessImpact: exactMatch.impact,
        reasoning: exactMatch.reasoning,
        alternatives: exactMatch.alternatives
      };
    }
    
    // Check partial matches for compound names
    for (const [dbIngredient, data] of Object.entries(INGREDIENT_DATABASE)) {
      if (normalized.includes(dbIngredient) || dbIngredient.includes(normalized)) {
        console.log('Found partial match:', normalized, 'matches', dbIngredient);
        return {
          name: ingredient,
          category: data.category,
          cleanlinessImpact: data.impact,
          reasoning: data.reasoning,
          alternatives: data.alternatives
        };
      }
    }
    
    // Check pattern matches
    for (const pattern of INGREDIENT_PATTERNS) {
      if (pattern.pattern.test(normalized)) {
        console.log('Found pattern match for:', normalized);
        return {
          name: ingredient,
          category: pattern.category,
          cleanlinessImpact: pattern.impact,
          reasoning: pattern.reasoning
        };
      }
    }
    
    console.log('No match found for:', normalized, '- defaulting to neutral');
    
    // Default for unknown ingredients
    return {
      name: ingredient,
      category: 'neutral_excipient',
      cleanlinessImpact: 0,
      reasoning: 'Unknown ingredient - assumed neutral until further analysis'
    };
  }
  
  private static extractIngredientsFromOCR(ocrText: string): string[] {
    console.log('=== ENHANCED INGREDIENT EXTRACTION ===');
    console.log('Raw OCR text:', ocrText);
    
    const lines = ocrText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    console.log('Split into lines:', lines);
    
    const ingredients: string[] = [];
    let inIngredientsSection = false;
    let ingredientLines: string[] = [];
    
    // Enhanced section detection patterns
    const ingredientSectionPatterns = [
      /^(other\s+)?ingredients?\s*:?\s*$/i,
      /^non[- ]?medicinal\s+ingredients?\s*:?\s*$/i,
      /^inactive\s+ingredients?\s*:?\s*$/i,
      /^excipients?\s*:?\s*$/i,
      /^capsule\s+ingredients?\s*:?\s*$/i,
      /^contains?\s*:?\s*$/i,
      /^also\s+contains?\s*:?\s*$/i
    ];
    
    const endSectionPatterns = [
      /^(suggested\s+use|directions?|dosage|warning|caution|storage|keep\s+out|expir|best\s+by|lot|mfg|manufactured|distributed)/i,
      /^\s*$/,  // Empty line
      /^allergen/i,
      /^free\s+of/i,
      /^does\s+not\s+contain/i
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim().toLowerCase();
      
      console.log(`Line ${i}: "${line}" (trimmed: "${trimmed}")`);
      
      // Check if this line starts an ingredients section
      const isIngredientSection = ingredientSectionPatterns.some(pattern => pattern.test(trimmed));
      
      if (isIngredientSection) {
        console.log('Found ingredient section start at line', i);
        inIngredientsSection = true;
        
        // Check if ingredients are on the same line after the colon
        const colonIndex = line.indexOf(':');
        if (colonIndex >= 0 && colonIndex < line.length - 1) {
          const afterColon = line.substring(colonIndex + 1).trim();
          if (afterColon.length > 0) {
            console.log('Found ingredients on same line after colon:', afterColon);
            ingredientLines.push(afterColon);
          }
        }
        continue;
      }
      
      // Check if this line ends the ingredients section
      const isEndSection = endSectionPatterns.some(pattern => pattern.test(trimmed));
      
      if (inIngredientsSection && isEndSection) {
        console.log('Found ingredient section end at line', i);
        break;
      }
      
      // Collect ingredient lines
      if (inIngredientsSection && trimmed.length > 0) {
        console.log('Adding ingredient line:', line);
        ingredientLines.push(line);
      }
    }
    
    console.log('Collected ingredient lines:', ingredientLines);
    
    // Parse ingredients from collected lines
    for (const line of ingredientLines) {
      const lineIngredients = this.extractIngredientsFromLine(line);
      ingredients.push(...lineIngredients);
    }
    
    // Fallback: search entire text for common ingredients if no section found
    if (ingredients.length === 0) {
      console.log('No ingredient section found, using fallback extraction');
      ingredients.push(...this.fallbackIngredientExtraction(ocrText));
    }
    
    // Clean up and deduplicate
    const cleanedIngredients = ingredients
      .map(ing => ing.trim())
      .filter(ing => ing.length > 2)
      .filter(ing => !ing.match(/^\d+[\s\w]*$/)) // Remove pure numbers/dosages
      .filter(ing => !ing.match(/^[%\d\s.,-]+$/)) // Remove percentages and numbers
      .filter(ing => ing.toLowerCase() !== 'ingredients') // Remove the word "ingredients"
      .filter(ing => ing.toLowerCase() !== 'contains') // Remove the word "contains"
      .filter((ing, index, arr) => arr.findIndex(x => x.toLowerCase() === ing.toLowerCase()) === index) // Remove duplicates
      .slice(0, 15); // Reasonable limit
    
    console.log('Final cleaned ingredients:', cleanedIngredients);
    return cleanedIngredients;
  }
  
  private static extractIngredientsFromLine(line: string): string[] {
    console.log('Extracting from line:', line);
    
    // Clean the line
    let cleaned = line
      .replace(/[()[\]]/g, '') // Remove parentheses and brackets
      .replace(/\band\b/gi, ',') // Replace "and" with comma
      .trim();
    
    // Split by common delimiters
    const ingredients = cleaned
      .split(/[,;\.]+/)
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0)
      .filter(ing => !ing.match(/^\d+/)) // Remove items starting with numbers
      .filter(ing => !ing.match(/^(mg|mcg|g|iu|ui)\b/i)) // Remove units
      .map(ing => {
        // Clean up each ingredient
        return ing
          .replace(/^\W+/, '') // Remove leading non-word chars
          .replace(/\W+$/, '') // Remove trailing non-word chars
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      })
      .filter(ing => ing.length > 2);
    
    console.log('Extracted ingredients from line:', ingredients);
    return ingredients;
  }
  
  private static fallbackIngredientExtraction(ocrText: string): string[] {
    console.log('Running fallback ingredient extraction');
    
    const ingredients: string[] = [];
    
    // Common supplement ingredients to look for
    const commonIngredients = [
      'microcrystalline cellulose', 'vegetable cellulose', 'magnesium stearate', 
      'silicon dioxide', 'titanium dioxide', 'rice flour', 'maltodextrin',
      'dicalcium phosphate', 'calcium carbonate', 'gelatin', 'hypromellose',
      'hydroxypropyl methylcellulose', 'stearic acid', 'soy lecithin', 
      'sunflower lecithin', 'natural flavor', 'artificial flavor',
      'ascorbic acid', 'cholecalciferol', 'methylcobalamin', 'cyanocobalamin',
      'alpha tocopherol', 'beta carotene', 'folic acid', 'folate',
      'natural colors', 'artificial colors', 'organic rice concentrate',
      'carrageenan', 'polysorbate 80', 'sodium benzoate', 'potassium sorbate'
    ];
    
    const lowerText = ocrText.toLowerCase();
    
    for (const ingredient of commonIngredients) {
      if (lowerText.includes(ingredient.toLowerCase())) {
        console.log('Found common ingredient in fallback:', ingredient);
        ingredients.push(ingredient);
      }
    }
    
    // Also look for individual words that might be ingredients
    const words = ocrText.toLowerCase().split(/\s+/);
    const potentialIngredients = [
      'gelatin', 'cellulose', 'stearate', 'dioxide', 'carbonate', 'maltodextrin',
      'lecithin', 'carrageenan', 'titanium', 'silicon', 'magnesium', 'calcium',
      'talc', 'dextrose', 'sucrose', 'lactose', 'sorbitol', 'mannitol', 'xylitol'
    ];
    
    for (const potential of potentialIngredients) {
      if (words.includes(potential) && !ingredients.some(ing => ing.toLowerCase().includes(potential))) {
        console.log('Found potential ingredient in fallback:', potential);
        ingredients.push(potential);
      }
    }
    
    return ingredients;
  }
  
  static generateCleanlinessReport(analysis: IngredientAnalysis[], score: CleanlinessScore): string {
    const categoryEmojis = {
      excellent: '🌟',
      good: '✅',
      fair: '⚠️',
      poor: '❌'
    };
    
    let report = `${categoryEmojis[score.category]} **Cleanliness Score: ${score.overall}/10 (${score.category})**\n\n`;
    
    if (score.positives.length > 0) {
      report += `**✅ Clean Ingredients:**\n${score.positives.map(p => `• ${p}`).join('\n')}\n\n`;
    }
    
    if (score.flags.length > 0) {
      report += `**⚠️ Ingredient Concerns:**\n${score.flags.map(f => `• ${f}`).join('\n')}\n\n`;
    }
    
    // Category breakdown
    const categoryCount = analysis.reduce((acc, ing) => {
      acc[ing.category] = (acc[ing.category] || 0) + 1;
      return acc;
    }, {} as Record<IngredientCategory, number>);
    
    report += `**Ingredient Breakdown:**\n`;
    Object.entries(categoryCount).forEach(([category, count]) => {
      const categoryName = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      report += `• ${categoryName}: ${count}\n`;
    });
    
    return report;
  }
}

// Export for use in existing confidence.ts
export function analyzeIngredientCleanliness(ocrText: string, ingredients?: string[]) {
  return IngredientCleanlinessScanner.analyzeIngredients(ocrText, ingredients);
}