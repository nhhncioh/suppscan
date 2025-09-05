// src/components/CleanlinessTab.tsx - Fixed Version
import React from 'react';
import { CleanlinessScore, IngredientAnalysis } from '@/lib/ingredientCleanliness';

interface CleanlinessTabProps {
  cleanlinessScore?: CleanlinessScore;
  ingredientAnalysis?: IngredientAnalysis[];
  loading?: boolean;
}

const CleanlinessTab: React.FC<CleanlinessTabProps> = ({ 
  cleanlinessScore, 
  ingredientAnalysis, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Analyzing ingredient cleanliness...</p>
      </div>
    );
  }

  if (!cleanlinessScore || !ingredientAnalysis) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 mb-4">No cleanliness data available</p>
        <p className="text-sm text-gray-400">
          Cleanliness analysis requires clear ingredient list detection
        </p>
      </div>
    );
  }

  const categoryEmojis = {
    excellent: '🌟',
    good: '✅',
    fair: '⚠️',
    poor: '❌'
  };

  const categoryColors = {
    excellent: 'bg-green-100 text-green-800 border-green-200',
    good: 'bg-blue-100 text-blue-800 border-blue-200',
    fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    poor: 'bg-red-100 text-red-800 border-red-200'
  };

  const getIngredientCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'active_ingredient': 'bg-green-50 border-green-200 text-green-800',
      'beneficial_excipient': 'bg-blue-50 border-blue-200 text-blue-800',
      'neutral_excipient': 'bg-gray-50 border-gray-200 text-gray-700',
      'questionable_filler': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'artificial_additive': 'bg-red-50 border-red-200 text-red-800',
      'allergen': 'bg-orange-50 border-orange-200 text-orange-800',
      'preservative': 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colorMap[category] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getCategoryDisplayName = (category: string) => {
    const nameMap: Record<string, string> = {
      'active_ingredient': 'Active Ingredient',
      'beneficial_excipient': 'Beneficial Excipient',
      'neutral_excipient': 'Neutral Excipient',
      'questionable_filler': 'Questionable Filler',
      'artificial_additive': 'Artificial Additive',
      'allergen': 'Potential Allergen',
      'preservative': 'Preservative'
    };
    return nameMap[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      'active_ingredient': '🌿',
      'beneficial_excipient': '💊',
      'neutral_excipient': '⚪',
      'questionable_filler': '⚠️',
      'artificial_additive': '🔴',
      'allergen': '⚠️',
      'preservative': '🧪'
    };
    return iconMap[category] || '❓';
  };

  // Group ingredients by category for better organization
  const ingredientsByCategory = ingredientAnalysis.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, IngredientAnalysis[]>);

  // Calculate category statistics
  const categoryStats = Object.entries(ingredientsByCategory).map(([category, ingredients]) => ({
    category,
    count: ingredients.length,
    displayName: getCategoryDisplayName(category),
    icon: getCategoryIcon(category),
    color: getIngredientCategoryColor(category)
  }));

  return (
    <div className="space-y-6 p-4">
      {/* Enhanced Overall Score Card */}
      <div className={`p-6 rounded-lg border-2 ${categoryColors[cleanlinessScore.category]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{categoryEmojis[cleanlinessScore.category]}</span>
            <div>
              <h3 className="font-bold text-2xl">
                Cleanliness Score: {cleanlinessScore.overall}/10
              </h3>
              <p className="text-lg opacity-90 capitalize">
                {cleanlinessScore.category} ingredient quality
              </p>
              <p className="text-sm opacity-75 mt-1">
                Based on analysis of {ingredientAnalysis.length} ingredient{ingredientAnalysis.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {cleanlinessScore.overall}/10
            </div>
            <div className="text-sm opacity-75 capitalize">
              {cleanlinessScore.category}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {cleanlinessScore.positives.length}
          </div>
          <div className="text-sm text-green-700 font-medium">Clean Ingredients</div>
          <div className="text-xs text-green-600 mt-1">
            {ingredientAnalysis.filter(ing => ing.cleanlinessImpact > 0).length} beneficial
          </div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {cleanlinessScore.flags.length}
          </div>
          <div className="text-sm text-yellow-700 font-medium">Concerns Found</div>
          <div className="text-xs text-yellow-600 mt-1">
            {ingredientAnalysis.filter(ing => ing.cleanlinessImpact < -1).length} problematic
          </div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {ingredientAnalysis.length}
          </div>
          <div className="text-sm text-blue-700 font-medium">Total Analyzed</div>
          <div className="text-xs text-blue-600 mt-1">
            {Object.keys(ingredientsByCategory).length} categories
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
          📊 Ingredient Categories
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoryStats.map(({ category, count, displayName, icon, color }) => (
            <div key={category} className={`p-3 rounded-lg border ${color} text-center`}>
              <div className="text-lg mb-1">{icon}</div>
              <div className="font-medium text-sm">{displayName}</div>
              <div className="text-lg font-bold">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Positive Ingredients */}
      {cleanlinessScore.positives.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            ✅ Clean & Beneficial Ingredients
          </h4>
          <div className="space-y-3">
            {cleanlinessScore.positives.map((positive, index) => {
              const ingredient = ingredientAnalysis.find(ing => positive.includes(ing.name));
              return (
                <div key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-green-100">
                  <span className="text-green-600 mt-0.5 text-lg">🌿</span>
                  <div className="flex-1">
                    <div className="text-green-800 font-medium">{positive}</div>
                    {ingredient && (
                      <div className="text-green-700 text-sm mt-1">
                        Impact Score: +{ingredient.cleanlinessImpact}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Ingredient Concerns with Specific Details */}
      {cleanlinessScore.flags.length > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            ⚠️ Specific Ingredient Concerns Found
          </h4>
          <div className="space-y-3">
            {cleanlinessScore.flags.map((flag, index) => {
              const ingredient = ingredientAnalysis.find(ing => flag.includes(ing.name));
              return (
                <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-red-100">
                  <span className="text-red-600 mt-0.5 text-xl">
                    {ingredient?.category === 'artificial_additive' ? '🚫' : 
                     ingredient?.category === 'questionable_filler' ? '⚠️' : 
                     ingredient?.category === 'allergen' ? '🤧' : '⭕'}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-red-800 mb-1">
                      {ingredient?.name || flag.split(':')[0]} - {getCategoryDisplayName(ingredient?.category || 'unknown')}
                    </div>
                    <div className="text-red-700 text-sm leading-relaxed mb-2">
                      <strong>Why it&apos;s concerning:</strong> {ingredient?.reasoning || flag.split(': ')[1]}
                    </div>
                    {ingredient?.alternatives && ingredient.alternatives.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                        <span className="font-medium text-green-800">🌿 Better alternatives:</span>
                        <span className="text-green-700 ml-1">{ingredient.alternatives.join(', ')}</span>
                      </div>
                    )}
                    <div className="text-xs text-red-600 mt-2">
                      <strong>Impact Score:</strong> {ingredient?.cleanlinessImpact || 'Unknown'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Additional Context for Concerns */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 What this means:</strong> These ingredients may be unnecessary additives, potential allergens, 
              or have quality concerns. Consider looking for alternatives or consulting with a healthcare provider 
              if you have sensitivities.
            </p>
          </div>
        </div>
      ) : (
        /* Show Detected Ingredients Even When No Concerns */
        cleanlinessScore.flags.length === 0 && ingredientAnalysis.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              ✅ No Major Concerns Detected
            </h4>
            <p className="text-green-700 text-sm mb-3">
              Great news! We didn&apos;t identify any problematic artificial additives, questionable fillers, 
              or concerning preservatives in this supplement&apos;s ingredient list.
            </p>
            
            {/* Show what was actually detected */}
            <div className="bg-white border border-green-100 rounded p-3">
              <h5 className="font-medium text-green-800 mb-2">Ingredients Analyzed:</h5>
              <div className="space-y-2">
                {ingredientAnalysis.map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(ingredient.category)}</span>
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {getCategoryDisplayName(ingredient.category)}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ingredient.cleanlinessImpact > 0 
                        ? 'bg-green-100 text-green-800' 
                        : ingredient.cleanlinessImpact < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ingredient.cleanlinessImpact > 0 ? '+' : ''}{ingredient.cleanlinessImpact} impact
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* What We Specifically Look For */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          🔍 What We Analyze
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-800 mb-2">✅ Clean Ingredients We Look For:</h5>
            <ul className="text-blue-700 space-y-1">
              <li>• Plant-based capsules (vegetable cellulose)</li>
              <li>• Natural fillers (rice flour, cellulose)</li>
              <li>• Chelated minerals (glycinate, picolinate)</li>
              <li>• Active vitamin forms (methylcobalamin, folate)</li>
              <li>• Organic certifications</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-red-800 mb-2">⚠️ Concerning Ingredients We Flag:</h5>
            <ul className="text-red-700 space-y-1">
              <li>• Artificial colors (Red #40, Blue #1, Yellow #6)</li>
              <li>• Questionable fillers (maltodextrin, talc)</li>
              <li>• Synthetic forms (cyanocobalamin, folic acid)</li>
              <li>• Controversial additives (titanium dioxide, carrageenan)</li>
              <li>• Poorly absorbed minerals (oxide forms)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Ingredient Analysis by Category */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Complete Ingredient Analysis</h4>
        
        {ingredientAnalysis.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg border">
            <p className="text-gray-600 mb-2">No ingredients detected for analysis</p>
            <p className="text-sm text-gray-500">
              This might happen if the ingredient list wasn&apos;t clearly visible in the scan. 
              Try scanning the ingredient panel more clearly.
            </p>
          </div>
        ) : (
          Object.entries(ingredientsByCategory)
            .sort(([,a], [,b]) => {
              // Sort by impact: positive first, then neutral, then negative
              const avgImpactA = a.reduce((sum, ing) => sum + ing.cleanlinessImpact, 0) / a.length;
              const avgImpactB = b.reduce((sum, ing) => sum + ing.cleanlinessImpact, 0) / b.length;
              return avgImpactB - avgImpactA;
            })
            .map(([category, ingredients]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getCategoryIcon(category)}</span>
                <h5 className="font-medium text-lg text-gray-700">
                  {getCategoryDisplayName(category)} ({ingredients.length})
                </h5>
                <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  Avg Impact: {(ingredients.reduce((sum, ing) => sum + ing.cleanlinessImpact, 0) / ingredients.length).toFixed(1)}
                </span>
              </div>
              
              <div className="grid gap-3">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getIngredientCategoryColor(ingredient.category)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h6 className="font-semibold text-lg">{ingredient.name}</h6>
                          <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                            {getCategoryDisplayName(ingredient.category)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm opacity-90 leading-relaxed">
                            <strong>Analysis:</strong> {ingredient.reasoning}
                          </p>
                          
                          {ingredient.cleanlinessImpact < 0 && (
                            <div className="bg-red-100 border border-red-200 rounded p-2 text-sm">
                              <span className="font-medium text-red-800">⚠️ Concern:</span>
                              <span className="text-red-700 ml-1">
                                This ingredient has a negative impact on supplement cleanliness
                              </span>
                            </div>
                          )}
                          
                          {ingredient.cleanlinessImpact > 0 && (
                            <div className="bg-green-100 border border-green-200 rounded p-2 text-sm">
                              <span className="font-medium text-green-800">✅ Benefit:</span>
                              <span className="text-green-700 ml-1">
                                This ingredient contributes positively to supplement quality
                              </span>
                            </div>
                          )}
                          
                          {ingredient.alternatives && ingredient.alternatives.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                              <span className="font-medium text-blue-800">💡 Better alternatives: </span>
                              <span className="text-blue-700">
                                {ingredient.alternatives.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold ${
                          ingredient.cleanlinessImpact > 0 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : ingredient.cleanlinessImpact < 0
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                        }`}>
                          {ingredient.cleanlinessImpact > 0 ? '+' : ''}{ingredient.cleanlinessImpact}
                        </span>
                        <div className="text-xs text-gray-600 mt-1 text-center">
                          Impact Score
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enhanced Educational Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
        <h5 className="font-semibold text-gray-800 mb-4 text-lg">Understanding Your Results</h5>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600 mb-4">
          <div className="space-y-3">
            <div>
              <span className="inline-block w-8 h-4 bg-green-100 border border-green-300 rounded mr-2"></span>
              <strong className="text-green-600">8-10 (Excellent):</strong> Clean formulation with minimal processing, beneficial ingredients, no concerning additives
            </div>
            <div>
              <span className="inline-block w-8 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></span>
              <strong className="text-blue-600">6-7 (Good):</strong> Generally clean with some minor concerns or neutral excipients
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="inline-block w-8 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></span>
              <strong className="text-yellow-600">4-5 (Fair):</strong> Mix of beneficial and questionable ingredients, some fillers present
            </div>
            <div>
              <span className="inline-block w-8 h-4 bg-red-100 border border-red-300 rounded mr-2"></span>
              <strong className="text-red-600">1-3 (Poor):</strong> Multiple artificial additives, questionable fillers, or concerning preservatives
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>💡 Pro Tip:</strong> Look for supplements with plant-based capsules, chelated minerals, 
              and active vitamin forms. Third-party testing certifications are also good quality indicators.
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>🔬 Our Analysis:</strong> We evaluate over 100 common supplement ingredients based on 
              bioavailability, processing methods, potential health concerns, and industry best practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanlinessTab;