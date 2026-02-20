import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, CreditCard as Edit, Trash2, Save, X, Upload, TreePine, Ruler, Calendar, Map as MapIcon, Eye } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Field } from '../types';
import { orchardService } from '../services/orchardService';

interface TreeTag {
  id: string;
  name: string;
  variety: string;
  latitude: number;
  longitude: number;
}

const Fields: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const boundaryPolygonRef = useRef<any>(null);
  const treeMarkersRef = useRef<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treeTags, setTreeTags] = useState<TreeTag[]>([]);
  const [showTreeTagging, setShowTreeTagging] = useState(false);
  const [currentTreeTag, setCurrentTreeTag] = useState<Partial<TreeTag>>({});

  const [formData, setFormData] = useState({
    name: '',
    area: '',
    soilType: 'Loamy',
    cropStage: 'Growing',
    healthStatus: 'Good',
    location: '',
    plantedDate: '',
    orchardType: '',
    varietyTrees: [{ variety: '', totalTrees: '' }],
    notes: '',
  });

  // Load Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        return;
      }

      if ((window as any).google?.maps) {
        setMapsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,drawing`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => console.error('Failed to load Google Maps');
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Load fields
  const loadFields = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedFields: Field[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        area: row.area || 0,
        soilType: row.soil_type || 'Unknown',
        cropStage: row.crop_stage || 'Growing',
        healthStatus: row.health_status || 'Good',
        location: row.location || 'Unknown',
        plantedDate: row.planted_date || '',
        latitude: row.latitude,
        longitude: row.longitude,
        boundaryPath: row.boundary_path || [],
        details: row.details || {},
      }));

      setFields(mappedFields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  // Initialize map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;

    const googleMaps = (window as any).google;
    if (!googleMaps?.maps) return;

    const map = new googleMaps.maps.Map(mapRef.current, {
      center: { lat: 34.0837, lng: 74.7973 }, // Kashmir coordinates
      zoom: 10,
      mapTypeId: 'satellite',
    });

    mapInstanceRef.current = map;

    // Initialize drawing manager
    const drawingManager = new googleMaps.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: googleMaps.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon', 'marker'],
      },
      polygonOptions: {
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        strokeColor: '#16a34a',
        strokeWeight: 2,
        clickable: true,
        editable: true,
      },
      markerOptions: {
        draggable: true,
      },
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // Handle polygon completion
    googleMaps.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: any) => {
      if (boundaryPolygonRef.current) {
        boundaryPolygonRef.current.setMap(null);
      }
      boundaryPolygonRef.current = polygon;
      drawingManager.setDrawingMode(null);
    });

    // Handle marker placement for tree tagging
    googleMaps.maps.event.addListener(drawingManager, 'markercomplete', (marker: any) => {
      if (showTreeTagging) {
        const position = marker.getPosition();
        setCurrentTreeTag({
          latitude: position.lat(),
          longitude: position.lng(),
        });
        marker.setMap(null); // Remove the temporary marker
      }
    });

    // Load existing fields on map
    loadFieldsOnMap();
  }, [mapsLoaded, fields]);

  const loadFieldsOnMap = () => {
    if (!mapInstanceRef.current) return;

    const googleMaps = (window as any).google;
    if (!googleMaps?.maps) return;

    // Clear existing markers
    treeMarkersRef.current.forEach(marker => marker.setMap(null));
    treeMarkersRef.current = [];

    fields.forEach(field => {
      // Add field boundary if exists
      if (field.boundaryPath && field.boundaryPath.length > 0) {
        const polygon = new googleMaps.maps.Polygon({
          paths: field.boundaryPath,
          strokeColor: '#16a34a',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#22c55e',
          fillOpacity: 0.2,
        });
        polygon.setMap(mapInstanceRef.current);

        // Add click listener
        polygon.addListener('click', () => {
          setSelectedField(field);
        });
      }

      // Add field marker if coordinates exist
      if (field.latitude && field.longitude) {
        const marker = new googleMaps.maps.Marker({
          position: { lat: field.latitude, lng: field.longitude },
          map: mapInstanceRef.current,
          title: field.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="#22c55e" stroke="#16a34a" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${field.name.charAt(0)}</text>
              </svg>
            `),
            scaledSize: new googleMaps.maps.Size(32, 32),
          },
        });

        marker.addListener('click', () => {
          setSelectedField(field);
        });
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVarietyChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      varietyTrees: prev.varietyTrees.map((vt, i) => 
        i === index ? { ...vt, [field]: value } : vt
      ),
    }));
  };

  const addVarietyRow = () => {
    setFormData(prev => ({
      ...prev,
      varietyTrees: [...prev.varietyTrees, { variety: '', totalTrees: '' }],
    }));
  };

  const removeVarietyRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      varietyTrees: prev.varietyTrees.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      area: '',
      soilType: 'Loamy',
      cropStage: 'Growing',
      healthStatus: 'Good',
      location: '',
      plantedDate: '',
      orchardType: '',
      varietyTrees: [{ variety: '', totalTrees: '' }],
      notes: '',
    });
    setTreeTags([]);
    if (boundaryPolygonRef.current) {
      boundaryPolygonRef.current.setMap(null);
      boundaryPolygonRef.current = null;
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedField(null);
    resetForm();
    setShowTreeTagging(false);
  };

  const handleEdit = (field: Field) => {
    setSelectedField(field);
    setIsEditing(true);
    setIsCreating(false);
    setFormData({
      name: field.name,
      area: field.area.toString(),
      soilType: field.soilType,
      cropStage: field.cropStage,
      healthStatus: field.healthStatus,
      location: field.location,
      plantedDate: field.plantedDate,
      orchardType: field.details?.orchardType || '',
      varietyTrees: field.details?.varietyTrees || [{ variety: '', totalTrees: '' }],
      notes: field.details?.notes || '',
    });
    setShowTreeTagging(false);
  };

  const handleSave = async () => {
    if (!session?.user) return;

    setSaving(true);
    setError(null);

    try {
      let boundaryPath: Array<{ lat: number; lng: number }> = [];
      let calculatedArea = 0;
      let centerLat: number | undefined;
      let centerLng: number | undefined;

      // Get boundary data if polygon exists
      if (boundaryPolygonRef.current) {
        const path = boundaryPolygonRef.current.getPath();
        const googleMaps = (window as any).google;
        
        boundaryPath = [];
        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          boundaryPath.push({
            lat: point.lat(),
            lng: point.lng(),
          });
        }

        // Calculate area in square meters and convert to kanal
        const areaInSqMeters = googleMaps.maps.geometry.spherical.computeArea(path);
        calculatedArea = areaInSqMeters / 505.857; // Convert to kanal (1 kanal = 505.857 sq meters)

        // Calculate center point
        const bounds = new googleMaps.maps.LatLngBounds();
        boundaryPath.forEach(point => bounds.extend(point));
        const center = bounds.getCenter();
        centerLat = center.lat();
        centerLng = center.lng();
      }

      const fieldData = {
        name: formData.name,
        area: parseFloat(formData.area) || calculatedArea,
        soil_type: formData.soilType,
        crop_stage: formData.cropStage,
        health_status: formData.healthStatus,
        location: formData.location,
        planted_date: formData.plantedDate || null,
        latitude: centerLat,
        longitude: centerLng,
        boundary_path: boundaryPath.length > 0 ? boundaryPath : null,
        details: {
          orchardType: formData.orchardType,
          varietyTrees: formData.varietyTrees.filter(vt => vt.variety && vt.totalTrees),
          notes: formData.notes,
          mapAreaKanal: calculatedArea > 0 ? calculatedArea : null,
        },
      };

      let savedField;
      if (isCreating) {
        const { data, error } = await supabase
          .from('fields')
          .insert([{ ...fieldData, user_id: session.user.id }])
          .select()
          .single();

        if (error) throw error;
        savedField = data;
      } else if (selectedField) {
        const { data, error } = await supabase
          .from('fields')
          .update(fieldData)
          .eq('id', selectedField.id)
          .eq('user_id', session.user.id)
          .select()
          .single();

        if (error) throw error;
        savedField = data;
      }

      if (savedField) {
        // Save variety data to orchard_varieties table
        if (formData.varietyTrees.length > 0) {
          await orchardService.syncVarietiesFromFormData(
            session.user.id,
            savedField.id,
            formData.varietyTrees
          );
        }

        // Save tree tags
        if (treeTags.length > 0) {
          await orchardService.syncTreeTagsFromFormData(
            session.user.id,
            savedField.id,
            treeTags.map(tag => ({
              ...tag,
              rowNumber: '1', // Default row number
            }))
          );
        }
      }

      await loadFields();
      setIsCreating(false);
      setIsEditing(false);
      setSelectedField(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (field: Field) => {
    if (!session?.user || !confirm('Are you sure you want to delete this field?')) return;

    try {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', field.id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      await loadFields();
      if (selectedField?.id === field.id) {
        setSelectedField(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedField(null);
    resetForm();
    setShowTreeTagging(false);
  };

  const handleViewOnDashboard = (field: Field) => {
    const params = new URLSearchParams();
    params.set('fieldId', field.id);
    if (field.latitude && field.longitude) {
      params.set('lat', field.latitude.toString());
      params.set('lng', field.longitude.toString());
    }
    navigate(`/dashboard?${params.toString()}`);
  };

  const addTreeTag = () => {
    if (currentTreeTag.name && currentTreeTag.variety && currentTreeTag.latitude && currentTreeTag.longitude) {
      const newTag: TreeTag = {
        id: Date.now().toString(),
        name: currentTreeTag.name,
        variety: currentTreeTag.variety,
        latitude: currentTreeTag.latitude,
        longitude: currentTreeTag.longitude,
      };
      setTreeTags(prev => [...prev, newTag]);
      setCurrentTreeTag({});
    }
  };

  const removeTreeTag = (id: string) => {
    setTreeTags(prev => prev.filter(tag => tag.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orchard Management</h1>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add New Field</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fields List */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Fields</h2>
            {fields.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No fields created yet</p>
                <Button onClick={handleCreate} size="sm">
                  Create Your First Field
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedField?.id === field.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setSelectedField(field)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{field.name}</h3>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOnDashboard(field);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View on Dashboard"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(field);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(field);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-3 h-3" />
                        <span>
                          {field.details?.mapAreaKanal 
                            ? `${field.details.mapAreaKanal.toFixed(2)} kanal (mapped)`
                            : `${field.area} kanal`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapIcon className="w-3 h-3" />
                        <span>{field.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TreePine className="w-3 h-3" />
                        <span>{field.healthStatus}</span>
                      </div>
                      {field.details?.orchardType && (
                        <div className="text-green-700 font-medium">
                          {field.details.orchardType}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Map and Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Map</h2>
            <div
              ref={mapRef}
              className="w-full h-96 rounded-lg border border-gray-300 bg-gray-100"
            />
            {!import.meta.env.VITE_GOOGLE_API_KEY && (
              <p className="text-sm text-gray-500 mt-2">
                Google Maps API key required for map functionality
              </p>
            )}
          </Card>

          {/* Form */}
          {(isCreating || isEditing) && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'Create New Field' : 'Edit Field'}
                </h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area (Kanal)
                    </label>
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to auto-calculate from map boundary
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soil Type
                    </label>
                    <select
                      name="soilType"
                      value={formData.soilType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Loamy">Loamy</option>
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Silty">Silty</option>
                      <option value="Rocky">Rocky</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crop Stage
                    </label>
                    <select
                      name="cropStage"
                      value={formData.cropStage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Planting">Planting</option>
                      <option value="Growing">Growing</option>
                      <option value="Flowering">Flowering</option>
                      <option value="Fruiting">Fruiting</option>
                      <option value="Harvesting">Harvesting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Health Status
                    </label>
                    <select
                      name="healthStatus"
                      value={formData.healthStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planted Date
                    </label>
                    <input
                      type="date"
                      name="plantedDate"
                      value={formData.plantedDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orchard Type
                    </label>
                    <input
                      type="text"
                      name="orchardType"
                      value={formData.orchardType}
                      onChange={handleInputChange}
                      placeholder="e.g., Apple Orchard, Mixed Fruit"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Variety Trees Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Variety & Tree Count
                    </label>
                    <Button
                      type="button"
                      onClick={addVarietyRow}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variety
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.varietyTrees.map((vt, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input
                          type="text"
                          placeholder="Variety name"
                          value={vt.variety}
                          onChange={(e) => handleVarietyChange(index, 'variety', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          placeholder="Total trees"
                          value={vt.totalTrees}
                          onChange={(e) => handleVarietyChange(index, 'totalTrees', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {formData.varietyTrees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVarietyRow(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tree Tagging Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Tree Tags ({treeTags.length})
                    </label>
                    <Button
                      type="button"
                      onClick={() => setShowTreeTagging(!showTreeTagging)}
                      variant="outline"
                      size="sm"
                    >
                      <TreePine className="w-4 h-4 mr-2" />
                      {showTreeTagging ? 'Hide' : 'Tag Trees'}
                    </Button>
                  </div>

                  {showTreeTagging && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Click on the map to place tree markers, then fill in the details below.
                      </p>
                      
                      {currentTreeTag.latitude && currentTreeTag.longitude && (
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Tree name/ID"
                            value={currentTreeTag.name || ''}
                            onChange={(e) => setCurrentTreeTag(prev => ({ ...prev, name: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Variety"
                            value={currentTreeTag.variety || ''}
                            onChange={(e) => setCurrentTreeTag(prev => ({ ...prev, variety: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <div className="col-span-2">
                            <Button
                              type="button"
                              onClick={addTreeTag}
                              size="sm"
                              className="w-full"
                            >
                              Add Tree Tag
                            </Button>
                          </div>
                        </div>
                      )}

                      {treeTags.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Tagged Trees:</h4>
                          {treeTags.map((tag) => (
                            <div key={tag.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <span className="text-sm">
                                {tag.name} - {tag.variety}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeTreeTag(tag.id)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Additional notes about this field..."
                  />
                </div>
              </form>
            </Card>
          )}

          {/* Field Details */}
          {selectedField && !isEditing && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedField.name}
                </h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleViewOnDashboard(selectedField)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View on Dashboard
                  </Button>
                  <Button
                    onClick={() => handleEdit(selectedField)}
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Area</h3>
                    <p className="text-lg text-gray-900">
                      {selectedField.details?.mapAreaKanal 
                        ? `${selectedField.details.mapAreaKanal.toFixed(2)} kanal (mapped)`
                        : `${selectedField.area} kanal`}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Soil Type</h3>
                    <p className="text-lg text-gray-900">{selectedField.soilType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Crop Stage</h3>
                    <p className="text-lg text-gray-900">{selectedField.cropStage}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Health Status</h3>
                    <p className="text-lg text-gray-900">{selectedField.healthStatus}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Location</h3>
                    <p className="text-lg text-gray-900">{selectedField.location}</p>
                  </div>
                  {selectedField.plantedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Planted Date</h3>
                      <p className="text-lg text-gray-900">
                        {new Date(selectedField.plantedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedField.details?.orchardType && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Orchard Type</h3>
                      <p className="text-lg text-gray-900">{selectedField.details.orchardType}</p>
                    </div>
                  )}
                  {selectedField.boundaryPath && selectedField.boundaryPath.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Boundary</h3>
                      <p className="text-lg text-gray-900">
                        {selectedField.boundaryPath.length} GPS points mapped
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedField.details?.varietyTrees && selectedField.details.varietyTrees.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Varieties & Trees</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedField.details.varietyTrees.map((vt: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-900">{vt.variety}</div>
                        <div className="text-sm text-green-700">{vt.totalTrees} trees</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedField.details?.notes && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-900">{selectedField.details.notes}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fields;