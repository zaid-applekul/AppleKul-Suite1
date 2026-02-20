import React, { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Users, Droplets } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useFinancialLedger } from '../hooks/useFinancialLedger';
import type { Spray, ActivityExpense, LabourWorker, IncomeEntry, ActivityCategory } from '../hooks/useFinancialLedger';

// Mock orchard ID - in a real app, this would come from route params or context
const MOCK_ORCHARD_ID = 'orchard-1';

const FinancialLedger: React.FC = () => {
  const {
    sprays,
    activities,
    workers,
    income,
    loading,
    mutating,
    error,
    addSpray,
    removeSpray,
    addActivity,
    removeActivity,
    addWorker,
    markPaid,
    removeWorker,
    addIncome,
    removeIncome,
    totalSprayCost,
    totalActivityCost,
    totalLabourCost,
    totalAdvancePaid,
    totalIncome,
    totalExpenses,
    netProfit,
  } = useFinancialLedger(MOCK_ORCHARD_ID);

  const [activeTab, setActiveTab] = useState<'sprays' | 'activities' | 'workers' | 'income'>('sprays');
  const [showSprayForm, setShowSprayForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  // Form states
  const [sprayForm, setSprayForm] = useState({
    sprayNo: '',
    stage: '',
    date: '',
    water: '',
    labourCount: '',
    labourRate: '',
    chemicals: [{ name: '', brand: '', qty: '', unit: 'ml', rate: '', recommended: '' }],
  });

  const [activityForm, setActivityForm] = useState({
    category: 'PRUNING' as ActivityCategory,
    date: '',
    description: '',
    amount: '',
    days: '',
    labourCount: '',
    ratePerDay: '',
  });

  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    activity: 'PRUNING' as ActivityCategory | 'SPRAY',
    startDate: '',
    endDate: '',
    days: '',
    ratePerDay: '',
    advance: '',
  });

  const [incomeForm, setIncomeForm] = useState({
    variety: '',
    crates: '',
    kgPerCrate: '',
    pricePerCrate: '',
    date: '',
    buyer: '',
  });

  const resetForms = () => {
    setSprayForm({
      sprayNo: '',
      stage: '',
      date: '',
      water: '',
      labourCount: '',
      labourRate: '',
      chemicals: [{ name: '', brand: '', qty: '', unit: 'ml', rate: '', recommended: '' }],
    });
    setActivityForm({
      category: 'PRUNING',
      date: '',
      description: '',
      amount: '',
      days: '',
      labourCount: '',
      ratePerDay: '',
    });
    setWorkerForm({
      name: '',
      phone: '',
      activity: 'PRUNING',
      startDate: '',
      endDate: '',
      days: '',
      ratePerDay: '',
      advance: '',
    });
    setIncomeForm({
      variety: '',
      crates: '',
      kgPerCrate: '',
      pricePerCrate: '',
      date: '',
      buyer: '',
    });
  };

  const handleAddSpray = async () => {
    const spray: Omit<Spray, 'id'> = {
      sprayNo: parseInt(sprayForm.sprayNo),
      stage: sprayForm.stage,
      date: sprayForm.date,
      water: parseFloat(sprayForm.water),
      labourCount: parseInt(sprayForm.labourCount),
      labourRate: parseFloat(sprayForm.labourRate),
      chemicals: sprayForm.chemicals.map(c => ({
        name: c.name,
        brand: c.brand,
        qty: parseFloat(c.qty),
        unit: c.unit,
        rate: parseFloat(c.rate),
        recommended: c.recommended,
      })),
    };
    await addSpray(spray);
    setShowSprayForm(false);
    resetForms();
  };

  const handleAddActivity = async () => {
    const activity: Omit<ActivityExpense, 'id'> = {
      category: activityForm.category,
      date: activityForm.date,
      description: activityForm.description,
      amount: parseFloat(activityForm.amount),
      days: parseInt(activityForm.days),
      labourCount: parseInt(activityForm.labourCount),
      ratePerDay: parseFloat(activityForm.ratePerDay),
    };
    await addActivity(activity);
    setShowActivityForm(false);
    resetForms();
  };

  const handleAddWorker = async () => {
    const worker: Omit<LabourWorker, 'id'> = {
      name: workerForm.name,
      phone: workerForm.phone,
      activity: workerForm.activity,
      startDate: workerForm.startDate,
      endDate: workerForm.endDate,
      days: parseInt(workerForm.days),
      ratePerDay: parseFloat(workerForm.ratePerDay),
      advance: parseFloat(workerForm.advance),
      paid: false,
    };
    await addWorker(worker);
    setShowWorkerForm(false);
    resetForms();
  };

  const handleAddIncome = async () => {
    const entry: Omit<IncomeEntry, 'id'> = {
      variety: incomeForm.variety,
      crates: parseInt(incomeForm.crates),
      kgPerCrate: parseFloat(incomeForm.kgPerCrate),
      pricePerCrate: parseFloat(incomeForm.pricePerCrate),
      date: incomeForm.date,
      buyer: incomeForm.buyer,
    };
    await addIncome(entry);
    setShowIncomeForm(false);
    resetForms();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Financial Ledger</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-50">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <DollarSign className={`w-6 h-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Labour Cost</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalLabourCost.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'sprays', label: 'Sprays', icon: Droplets },
            { key: 'activities', label: 'Activities', icon: Edit },
            { key: 'workers', label: 'Workers', icon: Users },
            { key: 'income', label: 'Income', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Sprays Tab */}
        {activeTab === 'sprays' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Spray Applications (₹{totalSprayCost.toLocaleString()})
              </h2>
              <Button
                onClick={() => setShowSprayForm(true)}
                disabled={mutating}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Spray</span>
              </Button>
            </div>

            {showSprayForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-md font-medium text-gray-900 mb-4">Add New Spray</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Spray No."
                    value={sprayForm.sprayNo}
                    onChange={(e) => setSprayForm(prev => ({ ...prev, sprayNo: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Stage"
                    value={sprayForm.stage}
                    onChange={(e) => setSprayForm(prev => ({ ...prev, stage: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={sprayForm.date}
                    onChange={(e) => setSprayForm(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Water (L)"
                    value={sprayForm.water}
                    onChange={(e) => setSprayForm(prev => ({ ...prev, water: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Labour Count"
                    value={sprayForm.labourCount}
                    onChange={(e) => setSprayForm(prev => ({ ...prev, labourCount: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Labour Rate"
                    value={sprayForm.labourRate}
                    onChange={(e) => setSprayForm(prev => ({ ...prev, labourRate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <h4 className="text-sm font-medium text-gray-700 mb-2">Chemicals</h4>
                {sprayForm.chemicals.map((chemical, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Chemical Name"
                      value={chemical.name}
                      onChange={(e) => {
                        const newChemicals = [...sprayForm.chemicals];
                        newChemicals[index].name = e.target.value;
                        setSprayForm(prev => ({ ...prev, chemicals: newChemicals }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Brand"
                      value={chemical.brand}
                      onChange={(e) => {
                        const newChemicals = [...sprayForm.chemicals];
                        newChemicals[index].brand = e.target.value;
                        setSprayForm(prev => ({ ...prev, chemicals: newChemicals }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={chemical.qty}
                      onChange={(e) => {
                        const newChemicals = [...sprayForm.chemicals];
                        newChemicals[index].qty = e.target.value;
                        setSprayForm(prev => ({ ...prev, chemicals: newChemicals }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <select
                      value={chemical.unit}
                      onChange={(e) => {
                        const newChemicals = [...sprayForm.chemicals];
                        newChemicals[index].unit = e.target.value;
                        setSprayForm(prev => ({ ...prev, chemicals: newChemicals }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Rate"
                      value={chemical.rate}
                      onChange={(e) => {
                        const newChemicals = [...sprayForm.chemicals];
                        newChemicals[index].rate = e.target.value;
                        setSprayForm(prev => ({ ...prev, chemicals: newChemicals }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Recommended"
                      value={chemical.recommended}
                      onChange={(e) => {
                        const newChemicals = [...sprayForm.chemicals];
                        newChemicals[index].recommended = e.target.value;
                        setSprayForm(prev => ({ ...prev, chemicals: newChemicals }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ))}

                <div className="flex space-x-2 mt-4">
                  <Button onClick={handleAddSpray} disabled={mutating} size="sm">
                    {mutating ? 'Adding...' : 'Add Spray'}
                  </Button>
                  <Button
                    onClick={() => setShowSprayForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spray No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chemicals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sprays.map((spray) => (
                    <tr key={spray.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {spray.sprayNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {spray.stage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(spray.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {spray.chemicals.map((c, i) => (
                          <div key={i}>{c.name} ({c.qty}{c.unit})</div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(spray.chemicals.reduce((sum, c) => sum + c.qty * c.rate, 0) + spray.labourCount * spray.labourRate).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeSpray(spray.id)}
                          disabled={mutating}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Activities (₹{totalActivityCost.toLocaleString()})
              </h2>
              <Button
                onClick={() => setShowActivityForm(true)}
                disabled={mutating}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Activity</span>
              </Button>
            </div>

            {showActivityForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-md font-medium text-gray-900 mb-4">Add New Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <select
                    value={activityForm.category}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, category: e.target.value as ActivityCategory }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="PRUNING">Pruning</option>
                    <option value="DIGGING">Digging</option>
                    <option value="IRRIGATION">Irrigation</option>
                    <option value="GENERAL">General</option>
                    <option value="PICKING">Picking</option>
                    <option value="GRADING">Grading</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="FORWARDING">Forwarding</option>
                    <option value="SERVICES">Services</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="date"
                    value={activityForm.date}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={activityForm.description}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={activityForm.amount}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Days"
                    value={activityForm.days}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, days: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Labour Count"
                    value={activityForm.labourCount}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, labourCount: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Rate per Day"
                    value={activityForm.ratePerDay}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, ratePerDay: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleAddActivity} disabled={mutating} size="sm">
                    {mutating ? 'Adding...' : 'Add Activity'}
                  </Button>
                  <Button
                    onClick={() => setShowActivityForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activity.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {activity.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{activity.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeActivity(activity.id)}
                          disabled={mutating}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Workers Tab */}
        {activeTab === 'workers' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Labour Workers (₹{totalLabourCost.toLocaleString()})
              </h2>
              <Button
                onClick={() => setShowWorkerForm(true)}
                disabled={mutating}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Worker</span>
              </Button>
            </div>

            {showWorkerForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-md font-medium text-gray-900 mb-4">Add New Worker</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Worker Name"
                    value={workerForm.name}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <select
                    value={workerForm.activity}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, activity: e.target.value as ActivityCategory | 'SPRAY' }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="PRUNING">Pruning</option>
                    <option value="DIGGING">Digging</option>
                    <option value="IRRIGATION">Irrigation</option>
                    <option value="GENERAL">General</option>
                    <option value="PICKING">Picking</option>
                    <option value="GRADING">Grading</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="FORWARDING">Forwarding</option>
                    <option value="SERVICES">Services</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="SPRAY">Spray</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={workerForm.startDate}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={workerForm.endDate}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Days"
                    value={workerForm.days}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, days: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Rate per Day"
                    value={workerForm.ratePerDay}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, ratePerDay: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Advance"
                    value={workerForm.advance}
                    onChange={(e) => setWorkerForm(prev => ({ ...prev, advance: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleAddWorker} disabled={mutating} size="sm">
                    {mutating ? 'Adding...' : 'Add Worker'}
                  </Button>
                  <Button
                    onClick={() => setShowWorkerForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workers.map((worker) => (
                    <tr key={worker.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div>{worker.name}</div>
                          <div className="text-xs text-gray-500">{worker.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.activity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{new Date(worker.startDate).toLocaleDateString()} - {new Date(worker.endDate).toLocaleDateString()}</div>
                          <div className="text-xs">{worker.days} days @ ₹{worker.ratePerDay}/day</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>₹{(worker.days * worker.ratePerDay).toLocaleString()}</div>
                          {worker.advance > 0 && (
                            <div className="text-xs text-orange-600">Advance: ₹{worker.advance}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => markPaid(worker.id, !worker.paid)}
                          disabled={mutating}
                          className={`px-2 py-1 text-xs rounded-full ${
                            worker.paid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {worker.paid ? 'Paid' : 'Unpaid'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeWorker(worker.id)}
                          disabled={mutating}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Income Tab */}
        {activeTab === 'income' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Income Entries (₹{totalIncome.toLocaleString()})
              </h2>
              <Button
                onClick={() => setShowIncomeForm(true)}
                disabled={mutating}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Income</span>
              </Button>
            </div>

            {showIncomeForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-md font-medium text-gray-900 mb-4">Add New Income Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Variety"
                    value={incomeForm.variety}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, variety: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Crates"
                    value={incomeForm.crates}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, crates: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Kg per Crate"
                    value={incomeForm.kgPerCrate}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, kgPerCrate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Price per Crate"
                    value={incomeForm.pricePerCrate}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, pricePerCrate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Buyer"
                    value={incomeForm.buyer}
                    onChange={(e) => setIncomeForm(prev => ({ ...prev, buyer: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleAddIncome} disabled={mutating} size="sm">
                    {mutating ? 'Adding...' : 'Add Income'}
                  </Button>
                  <Button
                    onClick={() => setShowIncomeForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variety
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {income.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.variety}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{entry.crates} crates</div>
                          <div className="text-xs">{entry.kgPerCrate} kg/crate</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>₹{(entry.crates * entry.pricePerCrate).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">₹{entry.pricePerCrate}/crate</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.buyer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeIncome(entry.id)}
                          disabled={mutating}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FinancialLedger;