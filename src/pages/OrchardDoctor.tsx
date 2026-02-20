import React, { useState } from 'react';
import { Plus, Calendar, Phone, Video, MessageCircle, MapPin, Clock, CheckCircle, AlertTriangle, User, Stethoscope } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useOrchardDoctor } from '../hooks/useOrchardDoctor';
import type { ConsultType, ActionItem } from '../lib/database.types';

// Mock data - in a real app, this would come from route params or context
const MOCK_ORCHARD_ID = 'orchard-1';
const MOCK_GROWER_NAME = 'John Farmer';
const MOCK_GROWER_PHONE = '+91-9876543210';

const OrchardDoctor: React.FC = () => {
  const {
    consultations,
    allPrescriptions,
    pendingRxCount,
    loading,
    mutating,
    error,
    requestConsultation,
    acceptRequest,
    issueRx,
    executeRx,
    flagCorrection,
  } = useOrchardDoctor(MOCK_ORCHARD_ID, MOCK_GROWER_NAME, MOCK_GROWER_PHONE);

  const [activeTab, setActiveTab] = useState<'consultations' | 'prescriptions'>('consultations');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);

  // Form states
  const [requestForm, setRequestForm] = useState({
    doctorId: 'dr-smith-123',
    type: 'CHAT' as ConsultType,
    targetDateTime: '',
    notes: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    consultationId: '',
    doctorName: 'Dr. Smith',
    hospitalName: 'Kashmir Agricultural Hospital',
    issueDiagnosed: '',
    eppoCode: '',
    recommendation: '',
    followUpDate: '',
    actionItems: [{ category: 'FUNGICIDE' as ActionItem['category'], productName: '', dosage: '', estimatedCost: 0 }],
  });

  const resetForms = () => {
    setRequestForm({
      doctorId: 'dr-smith-123',
      type: 'CHAT',
      targetDateTime: '',
      notes: '',
    });
    setPrescriptionForm({
      consultationId: '',
      doctorName: 'Dr. Smith',
      hospitalName: 'Kashmir Agricultural Hospital',
      issueDiagnosed: '',
      eppoCode: '',
      recommendation: '',
      followUpDate: '',
      actionItems: [{ category: 'FUNGICIDE', productName: '', dosage: '', estimatedCost: 0 }],
    });
  };

  const handleRequestConsultation = async () => {
    await requestConsultation(requestForm);
    setShowRequestForm(false);
    resetForms();
  };

  const handleIssuePrescription = async () => {
    await issueRx(prescriptionForm);
    setShowPrescriptionForm(false);
    resetForms();
  };

  const getConsultationIcon = (type: ConsultType) => {
    switch (type) {
      case 'CHAT': return MessageCircle;
      case 'CALL': return Phone;
      case 'VIDEO': return Video;
      case 'ONSITE_VISIT': return MapPin;
      default: return MessageCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'text-yellow-600 bg-yellow-50';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50';
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-orange-600 bg-orange-50';
      case 'APPLIED': return 'text-green-600 bg-green-50';
      case 'NEEDS_CORRECTION': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orchard doctor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Stethoscope className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Orchard Doctor</h1>
        </div>
        <Button
          onClick={() => setShowRequestForm(true)}
          disabled={mutating}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Request Consultation</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Consultations</p>
              <p className="text-2xl font-bold text-gray-900">{consultations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">{allPrescriptions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-50">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Actions</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRxCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Request Consultation Form */}
      {showRequestForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Request New Consultation</h2>
            <Button
              onClick={() => setShowRequestForm(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Type
              </label>
              <select
                value={requestForm.type}
                onChange={(e) => setRequestForm(prev => ({ ...prev, type: e.target.value as ConsultType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="CHAT">Chat Consultation</option>
                <option value="CALL">Phone Call</option>
                <option value="VIDEO">Video Call</option>
                <option value="ONSITE_VISIT">On-site Visit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date & Time
              </label>
              <input
                type="datetime-local"
                value={requestForm.targetDateTime}
                onChange={(e) => setRequestForm(prev => ({ ...prev, targetDateTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Description
              </label>
              <textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe the issue you're facing with your orchard..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleRequestConsultation}
              disabled={mutating}
            >
              {mutating ? 'Requesting...' : 'Request Consultation'}
            </Button>
          </div>
        </Card>
      )}

      {/* Prescription Form */}
      {showPrescriptionForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Issue Digital Prescription</h2>
            <Button
              onClick={() => setShowPrescriptionForm(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Diagnosed
                </label>
                <input
                  type="text"
                  value={prescriptionForm.issueDiagnosed}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, issueDiagnosed: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Apple Scab Disease"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EPPO Code
                </label>
                <input
                  type="text"
                  value={prescriptionForm.eppoCode}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, eppoCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., VENTINE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={prescriptionForm.followUpDate}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation
              </label>
              <textarea
                value={prescriptionForm.recommendation}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, recommendation: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Detailed treatment recommendation..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Action Items
                </label>
                <Button
                  type="button"
                  onClick={() => setPrescriptionForm(prev => ({
                    ...prev,
                    actionItems: [...prev.actionItems, { category: 'FUNGICIDE', productName: '', dosage: '', estimatedCost: 0 }]
                  }))}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {prescriptionForm.actionItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <select
                    value={item.category}
                    onChange={(e) => {
                      const newItems = [...prescriptionForm.actionItems];
                      newItems[index].category = e.target.value as ActionItem['category'];
                      setPrescriptionForm(prev => ({ ...prev, actionItems: newItems }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="FUNGICIDE">Fungicide</option>
                    <option value="INSECTICIDE">Insecticide</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="LABOR">Labor</option>
                    <option value="IRRIGATION">Irrigation</option>
                    <option value="OTHER">Other</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Product Name"
                    value={item.productName}
                    onChange={(e) => {
                      const newItems = [...prescriptionForm.actionItems];
                      newItems[index].productName = e.target.value;
                      setPrescriptionForm(prev => ({ ...prev, actionItems: newItems }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />

                  <input
                    type="text"
                    placeholder="Dosage"
                    value={item.dosage}
                    onChange={(e) => {
                      const newItems = [...prescriptionForm.actionItems];
                      newItems[index].dosage = e.target.value;
                      setPrescriptionForm(prev => ({ ...prev, actionItems: newItems }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />

                  <input
                    type="number"
                    placeholder="Est. Cost"
                    value={item.estimatedCost}
                    onChange={(e) => {
                      const newItems = [...prescriptionForm.actionItems];
                      newItems[index].estimatedCost = parseFloat(e.target.value) || 0;
                      setPrescriptionForm(prev => ({ ...prev, actionItems: newItems }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleIssuePrescription}
              disabled={mutating}
            >
              {mutating ? 'Issuing...' : 'Issue Prescription'}
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'consultations', label: 'Consultations', count: consultations.length },
            { key: 'prescriptions', label: 'Prescriptions', count: allPrescriptions.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{label}</span>
              <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <div className="space-y-4">
            {consultations.length === 0 ? (
              <Card className="p-8 text-center">
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No consultations yet</p>
                <Button onClick={() => setShowRequestForm(true)} size="sm">
                  Request Your First Consultation
                </Button>
              </Card>
            ) : (
              consultations.map((consultation) => {
                const Icon = getConsultationIcon(consultation.type);
                return (
                  <Card key={consultation.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 rounded-lg bg-green-50">
                          <Icon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {consultation.type.replace('_', ' ')} Consultation
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(consultation.status)}`}>
                              {consultation.status}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{consultation.growerName} ({consultation.growerPhone})</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(consultation.targetDateTime).toLocaleString()}</span>
                            </div>
                            {consultation.doctorId && (
                              <div className="flex items-center space-x-2">
                                <Stethoscope className="w-4 h-4" />
                                <span>Dr. {consultation.doctorId}</span>
                              </div>
                            )}
                          </div>
                          <p className="mt-3 text-gray-700">{consultation.notes}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {consultation.status === 'REQUESTED' && (
                          <Button
                            onClick={() => acceptRequest(consultation.id, 'dr-smith-123')}
                            disabled={mutating}
                            size="sm"
                          >
                            Accept
                          </Button>
                        )}
                        {consultation.status === 'IN_PROGRESS' && (
                          <Button
                            onClick={() => {
                              setPrescriptionForm(prev => ({ ...prev, consultationId: consultation.id }));
                              setShowPrescriptionForm(true);
                            }}
                            disabled={mutating}
                            size="sm"
                          >
                            Issue Prescription
                          </Button>
                        )}
                      </div>
                    </div>

                    {consultation.prescription && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-semibold text-gray-900">Digital Prescription</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(consultation.prescription.status)}`}>
                            {consultation.prescription.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Issue Diagnosed</p>
                            <p className="text-sm text-gray-900">{consultation.prescription.issueDiagnosed}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">EPPO Code</p>
                            <p className="text-sm text-gray-900">{consultation.prescription.eppoCode}</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Recommendation</p>
                          <p className="text-sm text-gray-900">{consultation.prescription.recommendation}</p>
                        </div>
                        {consultation.prescription.actionItems.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Action Items</p>
                            <div className="space-y-2">
                              {consultation.prescription.actionItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <span className="font-medium">{item.productName}</span>
                                    <span className="text-sm text-gray-600 ml-2">({item.category})</span>
                                    <div className="text-sm text-gray-600">{item.dosage}</div>
                                  </div>
                                  <span className="text-sm font-medium">₹{item.estimatedCost}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {consultation.prescription.status === 'PENDING' && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => executeRx(consultation.prescription!.id)}
                              disabled={mutating}
                              size="sm"
                            >
                              Mark as Applied
                            </Button>
                            <Button
                              onClick={() => flagCorrection(consultation.prescription!.id)}
                              disabled={mutating}
                              variant="outline"
                              size="sm"
                            >
                              Needs Correction
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {allPrescriptions.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No prescriptions issued yet</p>
              </Card>
            ) : (
              allPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prescription.issueDiagnosed}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Doctor: {prescription.doctorName}</p>
                        <p>Hospital: {prescription.hospitalName}</p>
                        <p>Issued: {new Date(prescription.issuedAt).toLocaleDateString()}</p>
                        <p>Follow-up: {new Date(prescription.followUpDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {prescription.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => executeRx(prescription.id)}
                          disabled={mutating}
                          size="sm"
                        >
                          Mark as Applied
                        </Button>
                        <Button
                          onClick={() => flagCorrection(prescription.id)}
                          disabled={mutating}
                          variant="outline"
                          size="sm"
                        >
                          Needs Correction
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommendation</p>
                    <p className="text-sm text-gray-900">{prescription.recommendation}</p>
                  </div>

                  {prescription.actionItems.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Action Items</p>
                      <div className="space-y-2">
                        {prescription.actionItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium">{item.productName}</span>
                              <span className="text-sm text-gray-600 ml-2">({item.category})</span>
                              <div className="text-sm text-gray-600">{item.dosage}</div>
                            </div>
                            <span className="text-sm font-medium">₹{item.estimatedCost}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-right">
                        <span className="text-sm font-medium text-gray-700">
                          Total Estimated Cost: ₹{prescription.actionItems.reduce((sum, item) => sum + item.estimatedCost, 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrchardDoctor;