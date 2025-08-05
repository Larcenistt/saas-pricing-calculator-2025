/**
 * Saved Calculations Manager
 * Handles saving, loading, and sharing calculator results
 */

const STORAGE_KEY = 'saas_pricing_calculations';
const SHARE_KEY_PREFIX = 'calc_';

// Generate a unique share ID
export const generateShareId = () => {
  return SHARE_KEY_PREFIX + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Save calculation to localStorage
export const saveCalculation = (calculation) => {
  try {
    const saved = getSavedCalculations();
    const newCalculation = {
      id: generateShareId(),
      name: calculation.name || `Calculation ${saved.length + 1}`,
      date: new Date().toISOString(),
      inputs: calculation.inputs,
      results: calculation.results,
      notes: calculation.notes || ''
    };
    
    saved.push(newCalculation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    
    return newCalculation;
  } catch (error) {
    console.error('Error saving calculation:', error);
    return null;
  }
};

// Get all saved calculations
export const getSavedCalculations = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading calculations:', error);
    return [];
  }
};

// Get a specific calculation by ID
export const getCalculationById = (id) => {
  const saved = getSavedCalculations();
  return saved.find(calc => calc.id === id);
};

// Delete a calculation
export const deleteCalculation = (id) => {
  try {
    const saved = getSavedCalculations();
    const filtered = saved.filter(calc => calc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return false;
  }
};

// Update a calculation
export const updateCalculation = (id, updates) => {
  try {
    const saved = getSavedCalculations();
    const index = saved.findIndex(calc => calc.id === id);
    
    if (index !== -1) {
      saved[index] = { ...saved[index], ...updates, updated: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      return saved[index];
    }
    
    return null;
  } catch (error) {
    console.error('Error updating calculation:', error);
    return null;
  }
};

// Create shareable URL
export const createShareableUrl = (calculationId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/calculator?share=${calculationId}`;
};

// Save to URL for sharing (stores in URL hash)
export const saveToUrl = (calculation) => {
  try {
    const compressed = btoa(JSON.stringify({
      inputs: calculation.inputs,
      results: calculation.results
    }));
    
    window.location.hash = `#share=${compressed}`;
    return window.location.href;
  } catch (error) {
    console.error('Error creating shareable URL:', error);
    return null;
  }
};

// Load from URL
export const loadFromUrl = () => {
  try {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      const compressed = hash.replace('#share=', '');
      const data = JSON.parse(atob(compressed));
      return data;
    }
    
    // Check URL params for share ID
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      return getCalculationById(shareId);
    }
    
    return null;
  } catch (error) {
    console.error('Error loading from URL:', error);
    return null;
  }
};

// Export calculations as JSON
export const exportCalculations = () => {
  const saved = getSavedCalculations();
  const dataStr = JSON.stringify(saved, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `saas-pricing-calculations-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Import calculations from JSON
export const importCalculations = (jsonData) => {
  try {
    const imported = JSON.parse(jsonData);
    if (Array.isArray(imported)) {
      const saved = getSavedCalculations();
      const merged = [...saved, ...imported];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing calculations:', error);
    return false;
  }
};