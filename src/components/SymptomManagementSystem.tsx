import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Zap, Brain, Heart, Shield, Eye, Bone } from 'lucide-react';

// Symptom data structure
const SYMPTOMS = [
  {
    id: 'tired',
    name: 'Always Tired',
    icon: 'ðŸ˜´',
    category: 'Energy',
    description: 'Feeling fatigued and low energy throughout the day',
    commonSupplements: ['Iron', 'B12', 'CoQ10', 'Magnesium', 'Vitamin D'],
    color: 'bg-blue-500'
  },
  {
    id: 'hungry',
    name: 'Always Hungry', 
    icon: 'ðŸ½ï¸',
    category: 'Metabolism',
    description: 'Constant cravings and difficulty feeling satisfied',
    commonSupplements: ['Chromium', 'Fiber', 'Protein', 'Green Tea Extract'],
    color: 'bg-orange-500'
  },
  {
    id: 'stressed',
    name: 'Stressed Out',
    icon: 'ðŸ˜°',
    category: 'Mental Health',
    description: 'Feeling overwhelmed and anxious frequently',
    commonSupplements: ['Magnesium', 'Ashwagandha', 'L-Theanine', 'B-Complex'],
    color: 'bg-red-500'
  },
  {
    id: 'poor-sleep',
    name: 'Poor Sleep',
    icon: 'ðŸŒ™',
    category: 'Sleep',
    description: 'Difficulty falling asleep or staying asleep',
    commonSupplements: ['Melatonin', 'Magnesium', 'GABA', 'Valerian Root'],
    color: 'bg-purple-500'
  },
  {
    id: 'brain-fog',
    name: 'Brain Fog',
    icon: 'ðŸ§ ',
    category: 'Cognitive',
    description: 'Difficulty concentrating and mental clarity issues',
    commonSupplements: ['Omega-3', 'B12', 'Lion\'s Mane', 'Ginkgo Biloba'],
    color: 'bg-green-500'
  },
  {
    id: 'low-mood',
    name: 'Low Mood',
    icon: 'ðŸ˜”',
    category: 'Mental Health',
    description: 'Feeling down or lacking motivation',
    commonSupplements: ['Vitamin D', 'Omega-3', 'SAMe', '5-HTP'],
    color: 'bg-indigo-500'
  },
  {
    id: 'joint-pain',
    name: 'Joint Pain',
    icon: 'ðŸ¦´',
    category: 'Physical',
    description: 'Aches and stiffness in joints',
    commonSupplements: ['Turmeric', 'Glucosamine', 'Omega-3', 'Collagen'],
    color: 'bg-yellow-500'
  },
  {
    id: 'weak-immunity',
    name: 'Weak Immunity',
    icon: 'ðŸ¤§',
    category: 'Immune',
    description: 'Getting sick frequently or slow recovery',
    commonSupplements: ['Vitamin C', 'Zinc', 'Vitamin D', 'Elderberry'],
    color: 'bg-teal-500'
  },
  {
    id: 'poor-digestion',
    name: 'Poor Digestion',
    icon: 'ðŸ¤¢',
    category: 'Digestive',
    description: 'Bloating, gas, or digestive discomfort',
    commonSupplements: ['Probiotics', 'Digestive Enzymes', 'Fiber', 'L-Glutamine'],
    color: 'bg-pink-500'
  },
  {
    id: 'dry-skin',
    name: 'Dry Skin',
    icon: 'ðŸ§´',
    category: 'Skin',
    description: 'Skin feels dry, flaky, or lacking moisture',
    commonSupplements: ['Omega-3', 'Vitamin E', 'Collagen', 'Hyaluronic Acid'],
    color: 'bg-cyan-500'
  },
  {
    id: 'hair-loss',
    name: 'Hair Thinning',
    icon: 'ðŸ’‡',
    category: 'Beauty',
    description: 'Noticing hair loss or thinning',
    commonSupplements: ['Biotin', 'Iron', 'Zinc', 'Collagen'],
    color: 'bg-rose-500'
  },
  {
    id: 'muscle-cramps',
    name: 'Muscle Cramps',
    icon: 'ðŸ’ª',
    category: 'Physical',
    description: 'Frequent muscle cramps or spasms',
    commonSupplements: ['Magnesium', 'Potassium', 'Calcium', 'Electrolytes'],
    color: 'bg-emerald-500'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Symptoms', icon: 'ðŸŒŸ' },
  { id: 'Energy', name: 'Energy', icon: 'âš¡' },
  { id: 'Mental Health', name: 'Mental Health', icon: 'ðŸ§ ' },
  { id: 'Physical', name: 'Physical', icon: 'ðŸ’ª' },
  { id: 'Digestive', name: 'Digestive', icon: 'ðŸ¤¢' },
  { id: 'Immune', name: 'Immune', icon: 'ðŸ›¡ï¸' },
  { id: 'Sleep', name: 'Sleep', icon: 'ðŸŒ™' },
  { id: 'Skin', name: 'Skin & Beauty', icon: 'âœ¨' }
];

export default function SymptomManagementSystem() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Load saved symptoms from localStorage (in real app, this would be from your backend)
  useEffect(() => {
    const saved = localStorage.getItem('selectedSymptoms');
    if (saved) {
      setSelectedSymptoms(JSON.parse(saved));
    }
  }, []);

  // Save symptoms when they change
  useEffect(() => {
    localStorage.setItem('selectedSymptoms', JSON.stringify(selectedSymptoms));
  }, [selectedSymptoms]);

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const filteredSymptoms = SYMPTOMS.filter(symptom => {
    const matchesCategory = activeCategory === 'all' || symptom.category === activeCategory;
    const matchesSearch = symptom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         symptom.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getRecommendations = () => {
    const allSupplements = [];
    selectedSymptoms.forEach(symptomId => {
      const symptom = SYMPTOMS.find(s => s.id === symptomId);
      if (symptom) {
        allSupplements.push(...symptom.commonSupplements);
      }
    });
    
    // Count frequency and return top recommendations
    const supplementCounts = {};
    allSupplements.forEach(supp => {
      supplementCounts[supp] = (supplementCounts[supp] || 0) + 1;
    });
    
    return Object.entries(supplementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ðŸ©º Symptom Management
          </h1>
          <p className="text-gray-300 text-lg">
            Select the symptoms you're experiencing to get personalized supplement recommendations
          </p>
        </div>

        {/* Selected Symptoms Summary */}
        {selectedSymptoms.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-400">
                Selected Symptoms ({selectedSymptoms.length})
              </h3>
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showRecommendations ? 'Hide' : 'Show'} Recommendations
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSymptoms.map(symptomId => {
                const symptom = SYMPTOMS.find(s => s.id === symptomId);
                return (
                  <div key={symptomId} className="flex items-center bg-gray-700 rounded-lg px-3 py-2">
                    <span className="mr-2">{symptom.icon}</span>
                    <span className="text-sm">{symptom.name}</span>
                    <button
                      onClick={() => toggleSymptom(symptomId)}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {showRecommendations && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-blue-400">ðŸŽ¯ Recommended Supplements:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getRecommendations().map(({ name, count }) => (
                    <div key={name} className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-gray-400">
                        Helps with {count} of your symptoms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Symptom Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSymptoms.map(symptom => {
            const isSelected = selectedSymptoms.includes(symptom.id);
            return (
              <div
                key={symptom.id}
                onClick={() => toggleSymptom(symptom.id)}
                className={`bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all hover:scale-105 ${
                  isSelected 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{symptom.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{symptom.name}</h3>
                      <span className="text-sm text-gray-400">{symptom.category}</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-500'
                  }`}>
                    {isSelected && <Check size={16} className="text-white" />}
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{symptom.description}</p>
                
                <div>
                  <p className="text-xs text-gray-400 mb-2">Common supplements:</p>
                  <div className="flex flex-wrap gap-1">
                    {symptom.commonSupplements.slice(0, 3).map(supp => (
                      <span key={supp} className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {supp}
                      </span>
                    ))}
                    {symptom.commonSupplements.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{symptom.commonSupplements.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Instructions */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-blue-400">
            ðŸ“± How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">1ï¸âƒ£</div>
              <h4 className="font-medium mb-2">Select Your Symptoms</h4>
              <p className="text-sm text-gray-400">Choose the health issues you're currently experiencing</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">2ï¸âƒ£</div>
              <h4 className="font-medium mb-2">Get Recommendations</h4>
              <p className="text-sm text-gray-400">View personalized supplement suggestions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">3ï¸âƒ£</div>
              <h4 className="font-medium mb-2">Scan Products</h4>
              <p className="text-sm text-gray-400">When scanning supplements, see how they help your specific symptoms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}