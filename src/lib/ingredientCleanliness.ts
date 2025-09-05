// src/lib/ingredientCleanliness.ts

export type IngredientCategory = 
  | 'active_ingredient'
  | 'beneficial_excipient'
  | 'neutral_excipient'
  | 'questionable_filler'
  | 'artificial_additive'
  | 'allergen'
  | 'preservative';

export type CleanlinessScore = {
  overall: number; // 1-10 scale
  category: 'excellent' | 'good' | 'fair' | 'poor';
  flags: string[];
  positives: string[];
};

export type IngredientAnalysis = {
  name: string;
  category: IngredientCategory;
  cleanlinessImpact: number; // -5 to +5
  reasoning: string;
  alternatives?: string[];
};

// Comprehensive ingredient database for cleanliness assessment
const INGREDIENT_DATABASE: Record<string, {
  category: IngredientCategory;
  impact: number;
  reasoning: string;
  alternatives?: string[];
}> = {
  // Active ingredients (positive)
  'vitamin c': { category: 'active_ingredient', impact: 5, reasoning: 'Essential nutrient with proven benefits' },
  'vitamin d3': { category: 'active_ingredient', impact: 5, reasoning: 'Bioactive form of vitamin D' },
  'magnesium glycinate': { category: 'active_ingredient', impact: 4, reasoning: 'Highly bioavailable form of magnesium' },
  'zinc picolinate': { category: 'active_ingredient', impact: 4, reasoning: 'Well-absorbed form of zinc' },
  
  // Beneficial excipients (positive/neutral)
  'microcrystalline cellulose': { category: 'beneficial_excipient', impact: 1, reasoning: 'Plant-based, inert binding agent' },
  'vegetable cellulose': { category: 'beneficial_excipient', impact: 2, reasoning: 'Plant-based capsule material' },
  'rice flour': { category: 'beneficial_excipient', impact: 1, reasoning: 'Natural, gluten-free filler' },
  'magnesium stearate': { category: 'neutral_excipient', impact: 0, reasoning: 'Common lubricant, generally safe in small amounts' },
  'silicon dioxide': { category: 'neutral_excipient', impact: 0, reasoning: 'Anti-caking agent, naturally occurring' },
  'stearic acid': { category: 'neutral_excipient', impact: 0, reasoning: 'Natural fatty acid lubricant' },
  
  // Questionable fillers (negative impact)
  'maltodextrin': { category: 'questionable_filler', impact: -1, reasoning: 'Highly processed carbohydrate, may affect blood sugar', alternatives: ['rice flour', 'tapioca starch'] },
  'dicalcium phosphate': { category: 'questionable_filler', impact: -1, reasoning: 'Cheap filler, may reduce absorption of other nutrients' },
  'talc': { category: 'questionable_filler', impact: -2, reasoning: 'Controversial mineral, potential contaminant concerns' },
  
  // Artificial additives (more negative impact)
  'titanium dioxide': { category: 'artificial_additive', impact: -2, reasoning: 'Artificial whitening agent, safety concerns in nanoparticle form' },
  'fd&c red no. 40': { category: 'artificial_additive', impact: -3, reasoning: 'Artificial food dye, linked to hyperactivity in children' },
  'fd&c blue no. 1': { category: 'artificial_additive', impact: -3, reasoning: 'Artificial food dye, unnecessary additive' },
  'fd&c yellow no. 6': { category: 'artificial_additive', impact: -3, reasoning: 'Artificial food dye, potential allergen' },
  'carrageenan': { category: 'artificial_additive', impact: -2, reasoning: 'Controversial thickener, may cause digestive issues' },
  'polysorbate 80': { category: 'artificial_additive', impact: -2, reasoning: 'Emulsifier that may affect gut microbiome' },
  
  // Preservatives (context-dependent)
  'sodium benzoate': { category: 'preservative', impact: -1, reasoning: 'Preservative, safe in small amounts but unnecessary in most supplements' },
  'potassium sorbate': { category: 'preservative', impact: -1, reasoning: 'Preservative, generally safe but indicates processing' },
  
  // Common allergens
  'soy lecithin': { category: 'allergen', impact: -1, reasoning: 'Common allergen, though generally safe for most people', alternatives: ['sunflower lecithin'] },
  'wheat': { category: 'allergen', impact: -2, reasoning: 'Contains gluten, problematic for sensitive individuals' },
  'milk': { category: 'allergen', impact: -1, reasoning: 'Common allergen, unnecessary in most supplements' },
};

// Pattern matching for ingredients not in exact database
const INGREDIENT_PATTERNS: Array<{
  pattern: RegExp;
  category: IngredientCategory;
  impact: number;
  reasoning: string;
}> = [
  {
    pattern: /artificial|synthetic|fd&c|lake|dye/i,
    category: 'artificial_additive',
    impact: -2,
    reasoning: 'Contains artificial additives or synthetic colors'
  },
  {
    pattern: /cellulose|plant|vegetable/i,
    category: 'beneficial_excipient',
    impact: 1,
    reasoning: 'Plant-based ingredient'
  },
  {
    pattern: /organic/i,
    category: 'active_ingredient',
    impact: 2,
    reasoning: 'Organic certification indicates cleaner sourcing'
  },
  {
    pattern: /hydrogenated|partially hydrogenated/i,
    category: 'artificial_additive',
    impact: -3,
    reasoning: 'Hydrogenated oils contain trans fats'
  },
  {
    pattern: /natural flavor|natural flavoring/i,
    category: 'questionable_filler',
    impact: -1,
    reasoning: 'Vague term that may hide various additives'
  }
];

export class IngredientCleanlinessScanner {
  
  static analyzeIngredients(ocrText: string, ingredientList?: string[]): {
    analysis: IngredientAnalysis[];
    cleanlinessScore: CleanlinessScore;
  } {
    // Extract ingredients from OCR text if not provided
    const ingredients = ingredientList || this.extractIngredientsFromOCR(ocrText);
    
    const analysis: IngredientAnalysis[] = [];
    let totalImpact = 0;
    const flags: string[] = [];
    const positives: string[] = [];
    
    for (const ingredient of ingredients) {
      const ingredientAnalysis = this.analyzeIngredient(ingredient);
      analysis.push(ingredientAnalysis);
      totalImpact += ingredientAnalysis.cleanlinessImpact;
      
      if (ingredientAnalysis.cleanlinessImpact < -1) {
        flags.push(`${ingredient}: ${ingredientAnalysis.reasoning}`);
      } else if (ingredientAnalysis.cleanlinessImpact > 1) {
        positives.push(`${ingredient}: ${ingredientAnalysis.reasoning}`);
      }
    }
    
    // IMPROVED SCORING LOGIC
    // Calculate overall cleanliness score (1-10 scale)
    const averageImpact = totalImpact / Math.max(ingredients.length, 1);
    
    // Better baseline scoring that rewards premium ingredients
    let baseScore = 6; // Start at 6 instead of 5 for neutral formulations
    
    // Count ingredient types for better context
    const beneficial = analysis.filter(ing => ing.cleanlinessImpact > 0).length;
    const problematic = analysis.filter(ing => ing.cleanlinessImpact < -1).length;
    const neutral = analysis.filter(ing => ing.cleanlinessImpact === 0).length;
    
    // Adjust base score based on formulation quality
    if (beneficial > 0 && problematic === 0) {
      baseScore = 7; // Clean formulation with some benefits
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
    
    // Check exact match first
    const exactMatch = INGREDIENT_DATABASE[normalized];
    if (exactMatch) {
      return {
        name: ingredient,
        category: exactMatch.category,
        cleanlinessImpact: exactMatch.impact,
        reasoning: exactMatch.reasoning,
        alternatives: exactMatch.alternatives
      };
    }
    
    // Check pattern matches
    for (const pattern of INGREDIENT_PATTERNS) {
      if (pattern.pattern.test(normalized)) {
        return {
          name: ingredient,
          category: pattern.category,
          cleanlinessImpact: pattern.impact,
          reasoning: pattern.reasoning
        };
      }
    }
    
    // Default for unknown ingredients
    return {
      name: ingredient,
      category: 'neutral_excipient',
      cleanlinessImpact: 0,
      reasoning: 'Unknown ingredient - assumed neutral until further analysis'
    };
  }
  
  private static extractIngredientsFromOCR(ocrText: string): string[] {
    // Enhanced extraction - look for ingredient list sections
    const lines = ocrText.split('\n');
    const ingredients: string[] = [];
    let inIngredientsSection = false;
    
    // Log the OCR text for debugging
    console.log('OCR Text for ingredient extraction:', ocrText);
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      // Start of ingredients section - more patterns
      if (trimmed.includes('ingredients') || 
          trimmed.includes('other ingredients') ||
          trimmed.includes('inactive ingredients') ||
          trimmed.includes('non-medicinal ingredients') ||
          trimmed.includes('excipients') ||
          trimmed.match(/contains?:/) ||
          trimmed.includes('capsule ingredients') ||
          trimmed.includes('gelatin') ||
          trimmed.includes('cellulose') ||
          trimmed.includes('stearate')) {
        inIngredientsSection = true;
        
        // Also extract from this line if it contains ingredients
        const lineIngredients = this.extractIngredientsFromLine(line);
        ingredients.push(...lineIngredients);
        continue;
      }
      
      // End of ingredients section
      if (inIngredientsSection && (
        trimmed.includes('directions') ||
        trimmed.includes('suggested use') ||
        trimmed.includes('dosage') ||
        trimmed.includes('warning') ||
        trimmed.includes('caution') ||
        trimmed.includes('storage') ||
        trimmed.includes('keep out') ||
        trimmed.includes('expir') ||
        trimmed.includes('best by') ||
        trimmed.includes('lot') ||
        trimmed.includes('mfg') ||
        trimmed.match(/^\s*$/) // Empty line
      )) {
        break;
      }
      
      // Extract ingredients from current line
      if (inIngredientsSection && trimmed.length > 0) {
        const lineIngredients = this.extractIngredientsFromLine(line);
        ingredients.push(...lineIngredients);
      }
    }
    
    // Also try to extract from anywhere in the text using common ingredient patterns
    const commonIngredientPatterns = [
      /\b(magnesium stearate|silicon dioxide|titanium dioxide|microcrystalline cellulose|vegetable cellulose|rice flour|maltodextrin|dicalcium phosphate|gelatin|hypromellose|stearic acid|calcium carbonate|soy lecithin|sunflower lecithin|carrageenan|polysorbate\s+\d+|sodium benzoate|potassium sorbate|artificial colors?|fd&c\s+\w+\s+no\.?\s*\d+|red\s+#?\d+|blue\s+#?\d+|yellow\s+#?\d+)\b/gi,
      /\b(ascorbic acid|cholecalciferol|methylcobalamin|cyanocobalamin|folic acid|folate|alpha[\s-]?tocopherol|beta[\s-]?carotene)\b/gi,
      /\b(organic\s+\w+|natural\s+flavor|artificial\s+flavor|natural\s+colors?)\b/gi,
      /\b(magnesium oxide|calcium oxide|zinc oxide|iron sulfate|iron fumarate)\b/gi
    ];
    
    commonIngredientPatterns.forEach(pattern => {
      const matches = ocrText.match(pattern) || [];
      ingredients.push(...matches.map(match => match.trim()));
    });
    
    // Try to extract individual words that might be ingredients
    const words = ocrText.toLowerCase().split(/\s+/);
    const potentialIngredients = [
      'gelatin', 'cellulose', 'stearate', 'dioxide', 'carbonate', 'maltodextrin', 
      'lecithin', 'carrageenan', 'titanium', 'silicon', 'magnesium', 'calcium',
      'talc', 'dextrose', 'sucrose', 'lactose', 'sorbitol', 'mannitol'
    ];
    
    potentialIngredients.forEach(potential => {
      if (words.includes(potential)) {
        ingredients.push(potential);
      }
    });
    
    // Clean up and deduplicate
    const cleanedIngredients = ingredients
      .map(ing => ing.trim())
      .filter(ing => ing.length > 2)
      .filter((ing, index, arr) => arr.indexOf(ing) === index) // Remove duplicates
      .filter(ing => ing.toLowerCase() !== 'ingredients') // Remove the word "ingredients" itself
      .filter(ing => !/^\d+$/.test(ing)) // Remove pure numbers
      .filter(ing => !ing.match(/^[%\d\s]+$/)) // Remove percentages and numbers
      .slice(0, 20); // Limit to prevent too many false positives
    
    console.log('Extracted ingredients:', cleanedIngredients);
    return cleanedIngredients;
  }
  
  private static extractIngredientsFromLine(line: string): string[] {
    return line
      .split(/[,;\.:]/) // Split by punctuation
      .map(ing => ing.trim())
      .map(ing => ing.replace(/[()[\]]/g, '')) // Remove parentheses/brackets
      .map(ing => ing.replace(/\d+\s*mg|\d+\s*mcg|\d+\s*g|\d+\s*iu/gi, '')) // Remove dosages
      .map(ing => ing.trim())
      .filter(ing => ing.length > 2) // Must be at least 3 characters
      .filter(ing => !/^\d+$/.test(ing)) // Remove pure numbers
      .filter(ing => !/^[%\d\s]+$/.test(ing)) // Remove percentages and numbers
      .filter(ing => !ing.match(/^\d+\s*(mg|mcg|g|iu|ml)$/i)); // Remove standalone dosages
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