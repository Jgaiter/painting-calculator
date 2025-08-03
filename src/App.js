import React, { useState, useEffect } from 'react';
import './App.css';

const PaintingCalculator = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    address: '',
    projectType: '',
    squareFootage: '',
    paintTier: '',
    surfaces: [],
    difficultyLevel: 'basic',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [estimate, setEstimate] = useState(null);
  const [showEstimationFields, setShowEstimationFields] = useState(false);
  const [isClientInfoComplete, setIsClientInfoComplete] = useState(false);

  // ==================== BASE RATES & MULTIPLIERS SECTION ====================
  
  // Base rates per square foot
  const BASE_RATES = {
    min: 1.5,    // Minimum base rate per sq ft
    max: 3.5     // Maximum base rate per sq ft
  };
  
  // Paint tier multipliers
  const PAINT_MULTIPLIERS = {
    'standard': 1.0,     // Standard paint: 1.0x base rate (baseline)
    'premium': 1.3,      // Premium paint: 1.3x base rate
    'designer': 1.6      // Designer/specialty paint: 1.6x base rate
  };

  // Project difficulty multipliers
  const DIFFICULTY_MULTIPLIERS = {
    'basic': 1.0,           // Basic (new construction, minimal prep): 1.0x
    'standard': 1.2,        // Standard (good condition, light prep): 1.2x
    'moderate': 1.5,        // Moderate (some repairs, medium prep): 1.5x
    'complex': 2.0,         // Complex (extensive prep, repairs, intricate details): 2.0x
    'high_difficulty': 2.5  // High difficulty (historical restoration, specialty techniques): 2.5x
  };

  // Surface difficulty multipliers
  const SURFACE_MULTIPLIERS = {
    // Interior surfaces (additive - multiple surfaces in same space)
    interior: {
      'walls': 1.0,        // Base interior work
      'ceilings': 0.4,     // Additional work when added to walls
      'trim': 0.3          // Additional detail work
    },
    
    // Exterior surfaces (highest base multiplier + trim if selected)
    exterior: {
      'wood_siding': 1.0,    // Standard surface, easy to paint
      'vinyl_siding': 1.1,   // Requires specific primer/paint, slight prep work
      'cement': 1.3,         // Requires masonry primer, surface preparation
      'stucco': 1.5,         // Textured surface, more paint needed, difficult coverage
      'brick': 1.6,          // Most labor-intensive, masonry primer, high absorption
      'trim': 0.2            // Additional detail work for exterior trim
    }
  };

  // Minimum pricing thresholds
  const MINIMUM_PRICING = {
    absoluteMin: 3000,     // Absolute minimum project cost
    rangeSpread: 3000      // Minimum spread between low and high estimates
  };

  // ==================== END BASE RATES & MULTIPLIERS SECTION ====================

  const validateEmail = (email) => {
    // RFC 5322 compliant email regex (simplified version)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Optional field
    // US phone number format validation
    const phoneRegex = /^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };

  // Debounced validation for real-time feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      validateClientInfo();
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.clientName, formData.email, formData.address]);

  // Check if client info is complete to show estimation fields
  useEffect(() => {
    const clientComplete = 
      formData.clientName.trim().length >= 2 &&
      validateEmail(formData.email) &&
      formData.address.trim().length > 0;
    
    setIsClientInfoComplete(clientComplete);
    setShowEstimationFields(clientComplete);
  }, [formData.clientName, formData.email, formData.address]);

  const validateClientInfo = () => {
    const newErrors = {};

    // Name validation
    if (formData.clientName.trim().length > 0 && formData.clientName.trim().length < 2) {
      newErrors.clientName = 'Name must be at least 2 characters';
    } else if (formData.clientName.trim().length > 100) {
      newErrors.clientName = 'Name cannot exceed 100 characters';
    }

    // Email validation
    if (formData.email.trim().length > 0 && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but validate if provided)
    if (formData.phone.trim().length > 0 && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (e.g., (555) 123-4567)';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSurfaceChange = (surface) => {
    setFormData(prev => ({
      ...prev,
      surfaces: prev.surfaces.includes(surface)
        ? prev.surfaces.filter(s => s !== surface)
        : [...prev.surfaces, surface]
    }));
  };

  const handleTierSelect = (tier) => {
    setFormData(prev => ({
      ...prev,
      paintTier: tier
    }));
  };

  const getInteriorSurfaces = () => [
    { id: 'walls', label: 'Walls' },
    { id: 'ceilings', label: 'Ceilings' },
    { id: 'trim', label: 'Trim' }
  ];

  const getExteriorSurfaces = () => [
    { id: 'wood_siding', label: 'Wood Siding' },
    { id: 'trim', label: 'Trim' },
    { id: 'stucco', label: 'Stucco' },
    { id: 'cement', label: 'Cement' },
    { id: 'vinyl_siding', label: 'Vinyl Siding' },
    { id: 'brick', label: 'Brick' }
  ];

  const getSurfaceOptions = () => {
    if (formData.projectType === 'interior') return getInteriorSurfaces();
    if (formData.projectType === 'exterior') return getExteriorSurfaces();
    if (formData.projectType === 'both') return [...getInteriorSurfaces(), ...getExteriorSurfaces()];
    return [];
  };

  const validateForm = () => {
    const newErrors = {};

    // Required client information
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Name is required';
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName = 'Name must be at least 2 characters';
    } else if (formData.clientName.trim().length > 100) {
      newErrors.clientName = 'Name cannot exceed 100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required (street address, city, state, ZIP code)';
    }

    // Phone validation (optional but validate if provided)
    if (formData.phone.trim().length > 0 && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Project estimation fields
    if (!formData.projectType) {
      newErrors.projectType = 'Please select a project type';
    }
    if (!formData.squareFootage.trim()) {
      newErrors.squareFootage = 'Please enter square footage';
    } else if (parseInt(formData.squareFootage) < 100) {
      newErrors.squareFootage = 'Square footage must be at least 100';
    }
    if (!formData.paintTier) {
      newErrors.paintTier = 'Please select a paint tier';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEstimate = () => {
    if (!formData.projectType || !formData.squareFootage || !formData.paintTier) {
      return;
    }

    const sqftNum = parseInt(formData.squareFootage);
    
    // Start with base rates
    let baseMin = BASE_RATES.min;
    let baseMax = BASE_RATES.max;

    // Apply paint tier multiplier
    const paintMultiplier = PAINT_MULTIPLIERS[formData.paintTier] || 1.0;
    baseMin *= paintMultiplier;
    baseMax *= paintMultiplier;

    // Apply difficulty multiplier
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[formData.difficultyLevel] || 1.0;
    baseMin *= difficultyMultiplier;
    baseMax *= difficultyMultiplier;

    // Apply surface complexity multipliers
    let surfaceMultiplier = 1.0;
    
    if (formData.surfaces.length > 0) {
      if (formData.projectType === 'interior') {
        // Interior: Additive approach - start with base if walls selected, add others
        surfaceMultiplier = 0; // Reset to build up
        
        if (formData.surfaces.includes('walls')) {
          surfaceMultiplier += SURFACE_MULTIPLIERS.interior.walls; // 1.0 base
        }
        if (formData.surfaces.includes('ceilings')) {
          surfaceMultiplier += SURFACE_MULTIPLIERS.interior.ceilings; // +0.4
        }
        if (formData.surfaces.includes('trim')) {
          surfaceMultiplier += SURFACE_MULTIPLIERS.interior.trim; // +0.3
        }
        
        // If no walls selected but other surfaces are, use minimum base
        if (!formData.surfaces.includes('walls') && surfaceMultiplier > 0) {
          surfaceMultiplier += 0.8; // Minimum base for non-wall interior work
        }
        
      } else if (formData.projectType === 'exterior' || formData.projectType === 'both') {
        // Exterior: Highest base multiplier + trim if selected
        const exteriorSurfaces = formData.surfaces.filter(surface => 
          ['wood_siding', 'vinyl_siding', 'cement', 'stucco', 'brick'].includes(surface)
        );
        
        if (exteriorSurfaces.length > 0) {
          // Get highest multiplier from main exterior surfaces
          const exteriorMultipliers = exteriorSurfaces.map(surface => 
            SURFACE_MULTIPLIERS.exterior[surface] || 1.0
          );
          surfaceMultiplier = Math.max(...exteriorMultipliers);
          
          // Add trim multiplier if trim is selected
          if (formData.surfaces.includes('trim')) {
            surfaceMultiplier += SURFACE_MULTIPLIERS.exterior.trim; // +0.2
          }
        } else if (formData.surfaces.includes('trim')) {
          // Only trim selected for exterior
          surfaceMultiplier = 1.0 + SURFACE_MULTIPLIERS.exterior.trim;
        }
      }
      
      // Handle "both" project type - combine interior and exterior logic
      if (formData.projectType === 'both') {
        let interiorMultiplier = 0;
        let exteriorMultiplier = 1.0;
        
        // Calculate interior portion
        const interiorSurfaces = formData.surfaces.filter(surface => 
          ['walls', 'ceilings'].includes(surface)
        );
        
        if (interiorSurfaces.length > 0) {
          if (formData.surfaces.includes('walls')) {
            interiorMultiplier += SURFACE_MULTIPLIERS.interior.walls;
          }
          if (formData.surfaces.includes('ceilings')) {
            interiorMultiplier += SURFACE_MULTIPLIERS.interior.ceilings;
          }
        }
        
        // Calculate exterior portion (already done above)
        const exteriorSurfaces = formData.surfaces.filter(surface => 
          ['wood_siding', 'vinyl_siding', 'cement', 'stucco', 'brick'].includes(surface)
        );
        
        if (exteriorSurfaces.length > 0) {
          const exteriorMultipliers = exteriorSurfaces.map(surface => 
            SURFACE_MULTIPLIERS.exterior[surface] || 1.0
          );
          exteriorMultiplier = Math.max(...exteriorMultipliers);
        }
        
        // Handle trim for both projects
        if (formData.surfaces.includes('trim')) {
          if (interiorSurfaces.length > 0) {
            interiorMultiplier += SURFACE_MULTIPLIERS.interior.trim;
          }
          if (exteriorSurfaces.length > 0) {
            exteriorMultiplier += SURFACE_MULTIPLIERS.exterior.trim;
          }
        }
        
        // Average the interior and exterior multipliers for "both" projects
        surfaceMultiplier = (Math.max(interiorMultiplier, 1.0) + exteriorMultiplier) / 2;
      }
    }

    baseMin *= surfaceMultiplier;
    baseMax *= surfaceMultiplier;

    // Calculate base estimates
    let minPrice = sqftNum * baseMin;
    let maxPrice = sqftNum * baseMax;

    // Ensure minimum spread between low and high estimates
    if (maxPrice - minPrice < MINIMUM_PRICING.rangeSpread) {
      maxPrice = minPrice + MINIMUM_PRICING.rangeSpread;
    }

    // Ensure absolute minimum pricing
    if (minPrice < MINIMUM_PRICING.absoluteMin) {
      minPrice = MINIMUM_PRICING.absoluteMin;
      maxPrice = Math.max(maxPrice, MINIMUM_PRICING.absoluteMin + MINIMUM_PRICING.rangeSpread);
    }

    const tierNames = {
      'standard': 'Standard Paint',
      'premium': 'Premium Paint',
      'designer': 'Designer/Specialty Paint'
    };

    const result = {
      min: Math.round(minPrice),
      max: Math.round(maxPrice),
      tierName: tierNames[formData.paintTier]
    };

    setEstimate(result);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Calculate estimate before submitting
    calculateEstimate();

    try {
      // Prepare data for API submission
      const submissionData = {
        clientName: formData.clientName,
        email: formData.email,
        phone: formData.phone || '', // Optional field
        address: formData.address,
        projectType: formData.projectType,
        squareFootage: parseInt(formData.squareFootage),
        paintTier: formData.paintTier,
        surfaces: formData.surfaces,
        difficultyLevel: formData.difficultyLevel,
        additionalNotes: formData.additionalNotes || '',
        submittedAt: new Date().toISOString()
      };

      // Submit to backend API
      const response = await fetch('https://painting-calculator-back-end.onrender.com/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Form submitted successfully:', result);
        alert('Form submitted successfully! You will be contacted soon for a detailed consultation.');
      } else {
        console.error('API Error:', response.status, response.statusText);
        alert('There was an issue submitting your form. Please try again or contact us directly.');
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('There was a network error submitting your form. Please check your internet connection and try again.');
    }
  };

  const shouldShowSurfaces = formData.projectType === 'exterior' || formData.projectType === 'both';

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-400 to-green-600 p-5">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-10 text-center">
          <a href="https://limepainting.com/northern-colorado/" target="_blank" rel="noopener noreferrer">
            <div className="text-4xl font-bold mb-4 hover:scale-105 transition-transform">
              🎨 LIME PAINTING
            </div>
            <div className="text-xl opacity-90">OF NORTHERN COLORADO</div>
          </a>
          <h1 className="text-3xl font-light mt-4">Painting Cost Calculator</h1>
          <p className="text-lime-200 text-lg mt-2">Get a ballpark range for planning your project</p>
        </div>

        <div className="p-10">
          {/* Contact Information */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-lime-500">
            <h3 className="text-xl font-semibold text-green-800 mb-5">📋 Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-green-800 font-semibold mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  minLength="2"
                  maxLength="100"
                  required
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.clientName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-lime-500'
                  }`}
                />
                {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>}
              </div>
              
              <div>
                <label className="block text-green-800 font-semibold mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-lime-500'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-green-800 font-semibold mb-2">
                  Phone Number <span className="text-sm text-gray-600">(Recommended)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-lime-500'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              
              <div>
                <label className="block text-green-800 font-semibold mb-2">
                  Property Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Street address, City, State, ZIP code"
                  required
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-lime-500'
                  }`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Progressive Disclosure - Show estimation fields only after client info is complete */}
          {showEstimationFields && (
            <>
              {/* Project Details */}
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-lime-500">
                <h3 className="text-xl font-semibold text-green-800 mb-5">🎨 Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-green-800 font-semibold mb-2">
                      Project Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      required
                      className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.projectType ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-lime-500'
                      }`}
                    >
                      <option value="">Select Project Type</option>
                      <option value="interior">Interior Painting</option>
                      <option value="exterior">Exterior Painting</option>
                      <option value="both">Both Interior & Exterior</option>
                    </select>
                    {errors.projectType && <p className="text-red-500 text-sm mt-1">{errors.projectType}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-green-800 font-semibold mb-2">
                      Square Footage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="squareFootage"
                      value={formData.squareFootage}
                      onChange={handleInputChange}
                      min="100"
                      max="50000"
                      required
                      className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        errors.squareFootage ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-lime-500'
                      }`}
                    />
                    {errors.squareFootage && <p className="text-red-500 text-sm mt-1">{errors.squareFootage}</p>}
                  </div>
                </div>
              </div>

              {/* Paint Product Selection */}
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-lime-500">
                <h3 className="text-xl font-semibold text-green-800 mb-5">
                  🎨 Paint Quality Selection <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'standard', title: '⭐ Standard', multiplier: '1.0x', features: ['Good durability', 'Easy application', 'Wide color selection'] },
                    { id: 'premium', title: '🥇 Premium', multiplier: '1.3x', features: ['Excellent durability', 'Superior coverage', 'Advanced colors'] },
                    { id: 'designer', title: '💎 Designer', multiplier: '1.6x', features: ['Specialty finishes', 'Custom colors', 'Premium formulas'] }
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => handleTierSelect(tier.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                        formData.paintTier === tier.id
                          ? 'border-lime-500 bg-gradient-to-br from-green-50 to-lime-50'
                          : errors.paintTier
                          ? 'border-red-300 bg-red-50 hover:border-red-400'
                          : 'border-gray-200 bg-gray-50 hover:border-lime-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paintTier"
                        value={tier.id}
                        checked={formData.paintTier === tier.id}
                        onChange={() => handleTierSelect(tier.id)}
                        className="float-right scale-125"
                      />
                      <h5 className="text-lg font-semibold text-green-800 mb-1">{tier.title}</h5>
                      <p className="text-sm font-semibold text-gray-600 mb-2">{tier.multiplier} base rate</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {tier.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {errors.paintTier && <p className="text-red-500 text-sm mt-2">{errors.paintTier}</p>}
              </div>

              {/* Surface Types - Show for Interior */}
              {formData.projectType === 'interior' && (
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-lime-500">
                  <h3 className="text-xl font-semibold text-green-800 mb-5">
                    🏠 Interior Surface Types (Check all that apply)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getInteriorSurfaces().map((surface) => (
                      <label
                        key={surface.id}
                        className={`flex items-center p-4 bg-white border-2 rounded-lg cursor-pointer transition-all hover:border-lime-300 ${
                          formData.surfaces.includes(surface.id) 
                            ? 'border-lime-500 bg-lime-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.surfaces.includes(surface.id)}
                          onChange={() => handleSurfaceChange(surface.id)}
                          className="mr-3 scale-125"
                        />
                        <span className="font-medium">{surface.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Difficulty */}
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-lime-500">
                <h3 className="text-xl font-semibold text-green-800 mb-5">🔧 Project Difficulty</h3>
                <select
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-lime-500 focus:outline-none transition-colors"
                >
                  <option value="basic">Basic (1.0x) - New construction, minimal prep</option>
                  <option value="standard">Standard (1.2x) - Good condition, light prep</option>
                  <option value="moderate">Moderate (1.5x) - Some repairs, medium prep</option>
                  <option value="complex">Complex (2.0x) - Extensive prep, repairs, intricate details</option>
                  <option value="high_difficulty">High Difficulty (2.5x) - Historical restoration, specialty techniques</option>
                </select>
              </div>

              {/* Additional Details */}
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-lime-500">
                <h3 className="text-xl font-semibold text-green-800 mb-5">📝 Additional Details</h3>
                <div>
                  <label className="block text-green-800 font-semibold mb-2">Additional Notes</label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any specific requirements, concerns, or details about your project..."
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-lime-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Results - Only show after submit */}
          {estimate && (
            <div className="mb-8 p-8 bg-gradient-to-r from-lime-500 to-green-600 text-white rounded-xl text-center shadow-lg">
              <h3 className="text-2xl font-semibold mb-4">Your Estimated Range</h3>
              <div className="text-4xl font-bold mb-2">
                ${estimate.min.toLocaleString()} - ${estimate.max.toLocaleString()}
              </div>
              <div className="text-sm opacity-90 mb-4">{estimate.tierName}</div>
              <p className="text-sm">
                <strong>This is an unofficial range for planning purposes only.</strong><br />
                An official estimate requires an on-site consultation with our team.
              </p>
              <a
                href="https://limepainting.com/northern-colorado/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline hover:text-lime-200 transition-colors"
              >
                Visit Lime Painting Website →
              </a>
            </div>
          )}

          {/* Form-level errors */}
          {Object.keys(errors).length > 0 && !isClientInfoComplete && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Please complete the required fields:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white text-xl font-semibold py-4 px-8 rounded-full shadow-lg hover:from-lime-600 hover:to-green-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isClientInfoComplete}
          >
            Submit for Official Estimate
          </button>

          {/* Success State Message */}
          {!isClientInfoComplete && (
            <p className="text-center text-gray-600 mt-4">
              Complete the contact information above to access the project estimation fields.
            </p>
          )}

          {/* Disclaimer */}
          <div className="mt-6 p-5 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> This calculator provides unofficial pricing ranges for planning purposes only. 
              Actual costs may vary significantly based on surface preparation requirements, access challenges, 
              material choices, and specific project conditions. An official estimate requires an on-site consultation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <PaintingCalculator />
    </div>
  );
}

export default App;"
                        />
                        <span className="font-medium">{surface.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Surface Types - Conditional Display for Exterior/Both */}
              {shouldShowSurfaces && (
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border-l-4 border-lime-500">
                  <h3 className="text-xl font-semibold text-green-800 mb-5">
                    🏠 Exterior Surface Types (Check all that apply)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getExteriorSurfaces().map((surface) => (
                      <label
                        key={surface.id}
                        className={`flex items-center p-4 bg-white border-2 rounded-lg cursor-pointer transition-all hover:border-lime-300 ${
                          formData.surfaces.includes(surface.id) 
                            ? 'border-lime-500 bg-lime-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.surfaces.includes(surface.id)}
                          onChange={() => handleSurfaceChange(surface.id)}
                          className="mr-3 scale-125