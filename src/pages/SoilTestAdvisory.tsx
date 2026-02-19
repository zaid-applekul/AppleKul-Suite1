
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';


const SoilTestAdvisory: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  // State for manual test entry
  const [showTestForm, setShowTestForm] = useState<string | null>(null);
  const [testForm, setTestForm] = useState({
    soil_ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    oc: '',
    s: '',
    zn: '',
    fe: '',
    mn: '',
    cu: '',
    b: '',
    ec: '',
    lime_requirement: '',
    gypsum_requirement: '',
    recorded_date: '',
  });
  const [testSubmitError, setTestSubmitError] = useState<string | null>(null);
  const [testSubmitting, setTestSubmitting] = useState(false);


  // Upload previous report handler (must be hoisted above usage)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const filePath = `${fieldId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('soil-reports').upload(filePath, file);
      if (uploadError) throw uploadError;
      // Automatically create a soil_test_results record with no values, just to mark a test exists
      if (user) {
        const today = new Date().toISOString().slice(0, 10);
        await supabase.from('soil_test_results').insert({
          field_id: fieldId,
          user_id: user.id,
          recorded_date: today,
          soil_ph: null,
          nitrogen: null,
          phosphorus: null,
          potassium: null,
        });
        // Refetch fields/tests so alert disappears
        await fetchFieldsAndSoilTests();
      }
      alert('Report uploaded!');
      // Prompt to enter test results after upload
      setShowTestForm(fieldId);
    } catch (err) {
      setUploadError((err && (err as any).message) || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle test form input change
  const handleTestFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTestForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit test results to Supabase (soil_test_results table)
  const handleTestFormSubmit = async (fieldId: string) => {
    setTestSubmitting(true);
    setTestSubmitError(null);
    try {
      if (!user) throw new Error('User not authenticated');
      const recorded_date = testForm.recorded_date || new Date().toISOString().slice(0, 10);
      // Only submit if at least one value is present
      const hasValue = [
        'soil_ph','nitrogen','phosphorus','potassium','oc','s','zn','fe','mn','cu','b','ec','lime_requirement','gypsum_requirement'
      ].some(key => testForm[key]);
      if (!hasValue) throw new Error('Please enter at least one value.');
      const { error: insertError } = await supabase.from('soil_test_results').insert({
        field_id: fieldId,
        user_id: user.id,
        recorded_date,
        soil_ph: testForm.soil_ph ? parseFloat(testForm.soil_ph) : null,
        nitrogen: testForm.nitrogen ? parseFloat(testForm.nitrogen) : null,
        phosphorus: testForm.phosphorus ? parseFloat(testForm.phosphorus) : null,
        potassium: testForm.potassium ? parseFloat(testForm.potassium) : null,
        oc: testForm.oc ? parseFloat(testForm.oc) : null,
        s: testForm.s ? parseFloat(testForm.s) : null,
        zn: testForm.zn ? parseFloat(testForm.zn) : null,
        fe: testForm.fe ? parseFloat(testForm.fe) : null,
        mn: testForm.mn ? parseFloat(testForm.mn) : null,
        cu: testForm.cu ? parseFloat(testForm.cu) : null,
        b: testForm.b ? parseFloat(testForm.b) : null,
        ec: testForm.ec ? parseFloat(testForm.ec) : null,
        lime_requirement: testForm.lime_requirement ? parseFloat(testForm.lime_requirement) : null,
        gypsum_requirement: testForm.gypsum_requirement ? parseFloat(testForm.gypsum_requirement) : null,
      });
      if (insertError) throw insertError;
      setShowTestForm(null);
      setTestForm({ soil_ph: '', nitrogen: '', phosphorus: '', potassium: '', oc: '', s: '', zn: '', fe: '', mn: '', cu: '', b: '', ec: '', lime_requirement: '', gypsum_requirement: '', recorded_date: '' });
      // Refetch fields/tests (optional: you may want to update this to also fetch from soil_test_results)
      await fetchFieldsAndSoilTests();
    } catch (err) {
      setTestSubmitError((err && (err as any).message) || 'Failed to submit test results');
    } finally {
      setTestSubmitting(false);
    }
  };

  // Nutrient status logic with 15% threshold and advisory fetch
  const deficiencyAdvisory: Record<string, string> = {
    'soil_ph': 'Apply lime to raise pH or sulfur to lower pH as per recommendation.',
    'N': 'Apply recommended dose of nitrogen fertilizer.',
    'P': 'Apply phosphorus fertilizer as per soil test.',
    'K': 'Apply potassium fertilizer as per soil test.',
    // ...add more as needed
  };
  const toxicityAdvisory: Record<string, string> = {
    'soil_ph': 'Reduce lime application or use acidifying amendments.',
    'N': 'Reduce nitrogen application, avoid over-fertilization.',
    'P': 'Reduce phosphorus application, avoid over-fertilization.',
    'K': 'Reduce potassium application, avoid over-fertilization.',
    // ...add more as needed
  };
  const getDeficiencyAlerts = (analytics: any[]) => {
    // Define optimal ranges for each parameter
    const params = [
      { key: 'soil_ph', label: 'Soil pH', green: [6, 7.5] },
      { key: 'N', label: 'Nitrogen (N)', green: [280, 450] },
      { key: 'P', label: 'Phosphorus (P)', green: [20, 40] },
      { key: 'K', label: 'Potassium (K)', green: [120, 250] },
      // ...add more as needed
    ];
    const alerts = [];
    for (const param of params) {
      const val = analytics.find(a => a.metric_type === param.key)?.metric_value;
      if (val === undefined || val === null) continue;
      const [optMin, optMax] = param.green;
      const range = optMax - optMin;
      const margin = range * 0.15;
      let status: 'green' | 'amber' | 'red' = 'green';
      let advisory = '';
      if (val >= optMin && val <= optMax) {
        status = 'green';
      } else if (
        (val >= optMin - margin && val < optMin) ||
        (val > optMax && val <= optMax + margin)
      ) {
        status = 'amber';
        advisory = val < optMin ? deficiencyAdvisory[param.key] || '' : toxicityAdvisory[param.key] || '';
      } else {
        status = 'red';
        advisory = val < optMin ? deficiencyAdvisory[param.key] || '' : toxicityAdvisory[param.key] || '';
      }
      alerts.push({ ...param, value: val, status, advisory });
    }
    return alerts;
  };

  // State for top summary
  const [topSummary, setTopSummary] = useState<any | null>(null);
  // For comparison chart
  const [allManualResults, setAllManualResults] = useState<any[]>([]);
  const [compareFieldId, setCompareFieldId] = useState<string | null>(null);

  // Fetch fields and analytics
  const fetchFieldsAndSoilTests = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!user) {
      setFields([]);
      setLoading(false);
      return;
    }
    // Fetch all fields for this user
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('fields')
      .select('id, name')
      .eq('user_id', user.id);
    if (fieldsError) {
      setError('Failed to fetch fields.');
      setLoading(false);
      return;
    }
    // For each field, fetch the latest soil test analytic and all manual test results
    const fieldResults = await Promise.all(
      (fieldsData || []).map(async (field: any) => {
        // Latest soil pH from analytics
        const { data: analytics } = await supabase
          .from('field_analytics')
          .select('metric_type, metric_value, recorded_date')
          .eq('field_id', field.id)
          .eq('metric_type', 'soil_ph')
          .order('recorded_date', { ascending: false })
          .limit(1);
        // All analytics for this field (for deficiency analysis)
        const { data: allAnalytics } = await supabase
          .from('field_analytics')
          .select('metric_type, metric_value, recorded_date')
          .eq('field_id', field.id)
          .order('recorded_date', { ascending: false });

        // All manual test results for this field
        const { data: manualResults } = await supabase
          .from('soil_test_results')
          .select('id, recorded_date, soil_ph, nitrogen, phosphorus, potassium, zn, fe, mn, cu, b, ec')
          .eq('field_id', field.id)
          .order('recorded_date', { ascending: false });

        // Latest manual test
        const latestManual = manualResults && manualResults.length > 0 ? manualResults[0] : null;

        return {
          ...field,
          soilTest: (analytics && analytics.length > 0 && (!latestManual || new Date(analytics[0].recorded_date) > new Date(latestManual.recorded_date)))
            ? { type: 'analytics', ...analytics[0] }
            : (latestManual ? { type: 'manual', ...latestManual } : null),
          allAnalytics: allAnalytics || [],
          latestManual,
          allManualResults: manualResults || [],
        };
      })
    );
    setFields(fieldResults);

    // For comparison: gather all manual test results for the selected field
    let compareResults: any[] = [];
    if (compareFieldId) {
      const field = fieldResults.find(f => f.id === compareFieldId);
      if (field && field.allManualResults) {
        compareResults = field.allManualResults;
      }
    }
    setAllManualResults(compareResults);
        {/* Comparison chart for manual test results */}
        {fields.length > 0 && (
          <div className="flex flex-col items-center mb-8">
            <div className="mb-2 font-semibold text-green-900">Compare Manual Test Results</div>
            <select
              className="mb-4 border rounded px-2 py-1 text-green-900"
              value={compareFieldId || ''}
              onChange={e => setCompareFieldId(e.target.value || null)}
            >
              <option value="">Select Field</option>
              {fields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {allManualResults.length > 0 && (
              <div className="w-full max-w-2xl bg-white rounded-lg p-4 border border-green-200 shadow">
                <div className="mb-2 text-sm text-gray-700">Each bar shows the value for a test date. Hover for details.</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 text-left">Nutrient</th>
                        {allManualResults.map((r, idx) => (
                          <th key={r.id || idx} className="p-2 text-center whitespace-nowrap">{r.recorded_date ? new Date(r.recorded_date).toLocaleDateString() : '-'}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['soil_ph','ec','nitrogen','phosphorus','potassium','oc','s','zn','fe','mn','cu','b','lime_requirement','gypsum_requirement'].map(nutrient => (
                        <tr key={nutrient}>
                          <td className="p-2 font-semibold text-green-900">{nutrient.replace('_',' ').toUpperCase()}</td>
                          {allManualResults.map((r, idx) => (
                            <td key={r.id || idx} className="p-2">
                              <div className="relative h-5 w-40 bg-green-50 rounded border border-green-200">
                                {r[nutrient] !== undefined && r[nutrient] !== null && r[nutrient] !== '' ? (
                                  <div
                                    className={
                                      nutrient === 'soil_ph' ? 'bg-yellow-300' :
                                      nutrient === 'ec' ? 'bg-blue-200' :
                                      ['nitrogen','phosphorus','potassium'].includes(nutrient) ? 'bg-green-300' :
                                      'bg-gray-200'
                                    }
                                    style={{
                                      width: Math.max(8, Math.min(100, Math.abs(Number(r[nutrient])) * 10)) + '%',
                                      height: '100%',
                                      borderRadius: '0.25rem',
                                      transition: 'width 0.3s',
                                    }}
                                    title={r[nutrient]}
                                  />
                                ) : null}
                                <span className="absolute left-1 top-0 text-xs text-green-900">{r[nutrient] !== undefined && r[nutrient] !== null && r[nutrient] !== '' ? r[nutrient] : '-'}</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

    // Top summary: show only the latest field's lacking/excess nutrients
    let latestField = null;
    let latestDate = null;
    fieldResults.forEach(field => {
      if (field.latestManual && (!latestDate || new Date(field.latestManual.recorded_date) > latestDate)) {
        latestField = field;
        latestDate = new Date(field.latestManual.recorded_date);
      }
    });
    const summary = { lacking: [], excess: [], field: latestField ? latestField.name : '', date: latestField && latestField.latestManual ? latestField.latestManual.recorded_date : '' };
    const params = [
      { key: 'soil_ph', label: 'Soil pH', green: [6, 7.5], amber: [5.5, 8], unit: '' },
      { key: 'ec', label: 'EC (dS/m)', green: [0.2, 1.0], amber: [0.1, 1.5], unit: '' },
      { key: 'nitrogen', label: 'Nitrogen (N)', green: [280, 450], amber: [200, 500], unit: 'kg/ha' },
      { key: 'phosphorus', label: 'Phosphorus (P)', green: [20, 40], amber: [15, 50], unit: 'kg/ha' },
      { key: 'potassium', label: 'Potassium (K)', green: [120, 250], amber: [100, 300], unit: 'kg/ha' },
      { key: 'zn', label: 'Zinc (Zn)', green: [0.6, 1.2], amber: [0.5, 1.5], unit: 'mg/kg' },
      { key: 'fe', label: 'Iron (Fe)', green: [4.5, 8], amber: [4, 10], unit: 'mg/kg' },
      { key: 'mn', label: 'Manganese (Mn)', green: [2, 5], amber: [1.5, 6], unit: 'mg/kg' },
      { key: 'cu', label: 'Copper (Cu)', green: [0.2, 0.5], amber: [0.15, 0.7], unit: 'mg/kg' },
      { key: 'b', label: 'Boron (B)', green: [0.5, 1.0], amber: [0.4, 1.2], unit: 'mg/kg' },
      { key: 'oc', label: 'Organic Carbon (OC)', green: [0.75, 1.5], amber: [0.5, 2.0], unit: '%'},
      { key: 's', label: 'Sulphur (S)', green: [10, 20], amber: [8, 25], unit: 'mg/kg'},
      { key: 'lime_requirement', label: 'Lime Requirement', green: [0, 2], amber: [0, 3], unit: 't/ha'},
      { key: 'gypsum_requirement', label: 'Gypsum Requirement', green: [0, 2], amber: [0, 3], unit: 't/ha'},
    ];
    if (latestField && latestField.latestManual) {
      params.forEach(param => {
        const val = latestField.latestManual[param.key];
        if (val === undefined || val === null) return;
        if (val < param.green[0]) {
          summary.lacking.push(`${param.label} (${val}${param.unit ? ' ' + param.unit : ''})`);
        } else if (val > param.green[1]) {
          summary.excess.push(`${param.label} (${val}${param.unit ? ' ' + param.unit : ''})`);
        }
      });
    }
    setTopSummary(summary);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFieldsAndSoilTests();
  }, [fetchFieldsAndSoilTests]);

  const now = new Date();
  const monthsAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-10 px-2 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white/90 rounded-2xl shadow-xl p-8 border border-green-200">
        <h1 className="text-2xl font-bold text-green-900 mb-4 text-center">Soil & Water Test Advisory</h1>
        {/* Top summary card for deficiencies/excesses, always visible, improved UI */}
        {topSummary && (
          <div className="flex justify-center mb-8">
            <Card className="p-6 border-2 border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-lg w-full max-w-2xl">
              <div className="flex flex-col items-center mb-3 justify-center">
                <div className="flex items-center mb-1">
                  <svg className="w-7 h-7 text-green-700 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9s9 4.03 9 9c0 4.97-4.03 9-9 9zm0 0c-2.21 0-4-1.79-4-4 0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.21-1.79 4-4 4z" /></svg>
                  <span className="font-extrabold text-xl text-green-900 tracking-tight">Latest Nutrient Status</span>
                </div>
                {topSummary.field && (
                  <div className="text-black text-sm mb-1">Field: <span className="font-bold">{topSummary.field}</span>{topSummary.date && ` | Test Date: ${new Date(topSummary.date).toLocaleDateString()}`}</div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Lacking Nutrients */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm flex flex-col min-h-[120px]">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-500 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                    <span className="font-semibold text-red-700 text-base">Lacking</span>
                  </div>
                  {topSummary.lacking.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border border-red-200 rounded">
                        <thead>
                          <tr className="bg-red-100">
                            <th className="p-2 text-left">Nutrient</th>
                            <th className="p-2 text-left">Value</th>
                            <th className="p-2 text-left">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSummary.lacking.map((item, idx) => {
                            // Parse: "Nutrient (value unit)" or "Nutrient (value)"
                            const match = item.match(/^([^(]+)\s*\(([^)]+)\)$/);
                            let nutrient = item, value = '', unit = '';
                            if (match) {
                              nutrient = match[1].trim();
                              const valParts = match[2].split(' ');
                              value = valParts[0];
                              unit = valParts.slice(1).join(' ');
                            }
                            return (
                              <tr key={idx} className="border-t border-red-100">
                                <td className="p-2 font-semibold text-red-800">{nutrient}</td>
                                <td className="p-2 text-red-700">{value}</td>
                                <td className="p-2 text-red-700">{unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-green-700 text-sm italic">No deficiencies detected</span>
                  )}
                </div>
                {/* Excess Nutrients */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm flex flex-col min-h-[120px]">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-yellow-500 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                    <span className="font-semibold text-yellow-700 text-base">Excess</span>
                  </div>
                  {topSummary.excess.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border border-yellow-200 rounded">
                        <thead>
                          <tr className="bg-yellow-100">
                            <th className="p-2 text-left">Nutrient</th>
                            <th className="p-2 text-left">Value</th>
                            <th className="p-2 text-left">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSummary.excess.map((item, idx) => {
                            // Parse: "Nutrient (value unit)" or "Nutrient (value)"
                            const match = item.match(/^([^(]+)\s*\(([^)]+)\)$/);
                            let nutrient = item, value = '', unit = '';
                            if (match) {
                              nutrient = match[1].trim();
                              const valParts = match[2].split(' ');
                              value = valParts[0];
                              unit = valParts.slice(1).join(' ');
                            }
                            return (
                              <tr key={idx} className="border-t border-yellow-100">
                                <td className="p-2 font-semibold text-yellow-800">{nutrient}</td>
                                <td className="p-2 text-yellow-700">{value}</td>
                                <td className="p-2 text-yellow-700">{unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-green-700 text-sm italic">No excesses detected</span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            <p className="mb-6 text-gray-700 text-center">
              The platform checks if your orchards have a recent soil/water lab test. If not, you will be prompted to book a test with a partnered lab.
            </p>
            <div className="space-y-6">
              {fields.map((field) => {
                const needsTest = !field.soilTest || !field.soilTest.recorded_date || monthsAgo(field.soilTest.recorded_date) > 12;
                // Always define deficiencyAlerts for this field
                const deficiencyAlerts = getDeficiencyAlerts(field.allAnalytics);
                // Use latest manual test for indicator, not analytics
                let indicatorColor = 'bg-green-400 border-green-600';
                let indicatorTooltip = 'All nutrients within optimal range';
                if (field.latestManual) {
                  // Use the same params as summary
                  const params = [
                    { key: 'soil_ph', label: 'Soil pH', green: [6, 7.5] },
                    { key: 'ec', label: 'EC (dS/m)', green: [0.2, 1.0] },
                    { key: 'nitrogen', label: 'Nitrogen (N)', green: [280, 450] },
                    { key: 'phosphorus', label: 'Phosphorus (P)', green: [20, 40] },
                    { key: 'potassium', label: 'Potassium (K)', green: [120, 250] },
                    { key: 'zn', label: 'Zinc (Zn)', green: [0.6, 1.2] },
                    { key: 'fe', label: 'Iron (Fe)', green: [4.5, 8] },
                    { key: 'mn', label: 'Manganese (Mn)', green: [2, 5] },
                    { key: 'cu', label: 'Copper (Cu)', green: [0.2, 0.5] },
                    { key: 'b', label: 'Boron (B)', green: [0.5, 1.0] },
                    { key: 'oc', label: 'Organic Carbon (OC)', green: [0.75, 1.5] },
                    { key: 's', label: 'Sulphur (S)', green: [10, 20] },
                    { key: 'lime_requirement', label: 'Lime Requirement', green: [0, 2] },
                    { key: 'gypsum_requirement', label: 'Gypsum Requirement', green: [0, 2] },
                  ];
                  let excessList = [];
                  let lackingList = [];
                  for (const param of params) {
                    const val = field.latestManual[param.key];
                    if (val === undefined || val === null) continue;
                    if (val > param.green[1]) excessList.push(param.label);
                    else if (val < param.green[0]) lackingList.push(param.label);
                  }
                  if (excessList.length > 0) {
                    indicatorColor = 'bg-red-400 border-red-600';
                    indicatorTooltip = 'Excess: ' + excessList.join(', ');
                  } else if (lackingList.length > 0) {
                    indicatorColor = 'bg-yellow-300 border-yellow-500';
                    indicatorTooltip = 'Lacking: ' + lackingList.join(', ');
                  }
                }
                return (
                  <Card key={field.id} className="mb-4 p-4 transition-shadow duration-200 hover:shadow-2xl bg-gradient-to-br from-green-50 to-white border-2 border-green-100 rounded-2xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {/* Unique status indicator with icon and gradient ring */}
                        <span
                          className={`relative flex items-center justify-center w-8 h-8 rounded-full border-4 shadow-md transition-all duration-200 ${indicatorColor} bg-white/80 hover:scale-110`}
                          style={{
                            background: indicatorColor.includes('red')
                              ? 'radial-gradient(circle at 60% 40%, #fff 60%, #f87171 100%)'
                              : indicatorColor.includes('yellow')
                              ? 'radial-gradient(circle at 60% 40%, #fff 60%, #fde68a 100%)'
                              : 'radial-gradient(circle at 60% 40%, #fff 60%, #6ee7b7 100%)',
                          }}
                          title={indicatorTooltip}
                        >
                          {indicatorColor.includes('red') ? (
                            <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg>
                          ) : indicatorColor.includes('yellow') ? (
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          )}
                        </span>
                        <span className="font-extrabold text-lg text-green-900 tracking-tight drop-shadow-sm">{field.name}</span>
                        {needsTest ? (
                          <span className="ml-2 text-red-600 font-medium">No recent soil/water test found.</span>
                        ) : (
                          <span className="ml-2 text-green-700 text-sm font-medium">Last test: {new Date(field.soilTest.recorded_date).toLocaleDateString()} <span className="hidden md:inline">(pH: {field.soilTest.metric_value})</span></span>
                        )}
                      </div>
                      <div className="mt-2 md:mt-0 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedFieldId(field.id); fileInputRef.current?.click(); }}>Upload Previous Report</Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={e => handleFileChange(e, field.id)}
                          disabled={uploading}
                        />
                        <Button size="sm" variant="outline" onClick={() => { setShowTestForm(field.id); setTestForm({ soil_ph: '', N: '', P: '', K: '', recorded_date: '' }); }}>Enter Test Results</Button>
                      </div>
                    </div>
                    {uploadError && selectedFieldId === field.id && (
                      <div className="text-red-600 text-sm mb-2">{uploadError}</div>
                    )}
                    {/* Manual test entry form */}
                    {showTestForm === field.id && (
                      <div className="bg-green-50 border border-green-200 rounded p-4 my-2">
                        <div className="font-semibold mb-2">Enter Soil/Water Test Results</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                          <div>
                            <label className="block text-sm">Soil pH</label>
                            <input type="number" step="0.01" name="soil_ph" value={testForm.soil_ph} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Nitrogen (N)</label>
                            <input type="number" name="nitrogen" value={testForm.nitrogen} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Phosphorus (P)</label>
                            <input type="number" name="phosphorus" value={testForm.phosphorus} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Potassium (K)</label>
                            <input type="number" name="potassium" value={testForm.potassium} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Organic Carbon (OC)</label>
                            <input type="number" name="oc" value={testForm.oc} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Sulphur (S)</label>
                            <input type="number" name="s" value={testForm.s} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Zinc (Zn)</label>
                            <input type="number" name="zn" value={testForm.zn} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Iron (Fe)</label>
                            <input type="number" name="fe" value={testForm.fe} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Manganese (Mn)</label>
                            <input type="number" name="mn" value={testForm.mn} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Copper (Cu)</label>
                            <input type="number" name="cu" value={testForm.cu} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Boron (B)</label>
                            <input type="number" name="b" value={testForm.b} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">EC (dS/m)</label>
                            <input type="number" name="ec" value={testForm.ec} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Lime Requirement</label>
                            <input type="number" name="lime_requirement" value={testForm.lime_requirement} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Gypsum Requirement</label>
                            <input type="number" name="gypsum_requirement" value={testForm.gypsum_requirement} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-sm">Test Date</label>
                            <input type="date" name="recorded_date" value={testForm.recorded_date} onChange={handleTestFormChange} className="w-full border rounded px-2 py-1" />
                          </div>
                        </div>
                        {testSubmitError && <div className="text-red-600 text-sm mb-2">{testSubmitError}</div>}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleTestFormSubmit(field.id)} disabled={testSubmitting}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowTestForm(null)} disabled={testSubmitting}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    {deficiencyAlerts.length > 0 && (
                      <div className="mt-2">
                        <div className="font-semibold mb-1">Nutrient Deficiency & RAG Alerts:</div>
                        <ul className="space-y-2">
                          {deficiencyAlerts.map(alert => (
                            <li key={alert.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 rounded-lg border border-gray-100 bg-gray-50">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{alert.label}:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${alert.status === 'green' ? 'bg-green-100 text-green-800' : alert.status === 'amber' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{alert.status.toUpperCase()}</span>
                                <span className="text-gray-700">({alert.value})</span>
                              </div>
                              {(alert.status === 'amber' || alert.status === 'red') && alert.advisory && (
                                <div className={`text-xs md:text-sm ${alert.status === 'red' ? 'text-red-700' : 'text-yellow-700'} font-medium pl-6 md:pl-0`}>Action: {alert.advisory}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
            {fields.every(f => f.soilTest && f.soilTest.recorded_date && monthsAgo(f.soilTest.recorded_date) <= 12) ? (
              <div className="text-green-700 text-center font-medium">All orchards have recent soil/water tests.</div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default SoilTestAdvisory;
