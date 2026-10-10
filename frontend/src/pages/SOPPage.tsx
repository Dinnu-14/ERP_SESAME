import React, { useEffect, useState } from 'react';
import { FileCheck2, Plus, CheckCircle, RefreshCw, BookOpen, PenTool, CheckSquare } from 'lucide-react';
import { api } from '../services/api';
import { SOP, Employee } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const SOPPage: React.FC = () => {
  const { user } = useAuth();
  const [sops, setSops] = useState<SOP[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSOPModalOpen, setIsSOPModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);

  const [newSOP, setNewSOP] = useState({
    code: 'SOP-',
    title: '',
    category: 'OIL_EXTRACTION',
    department: 'Production',
    description: '',
    initial_version: {
      version_number: 'v1.0',
      content: '1. Standard protocol steps\n2. Mandatory safety compliance',
      change_summary: 'Initial release',
      checklists: [
        { step_number: 1, title: 'Pre-flight check', instruction: 'Verify sensor power', is_critical: true },
        { step_number: 2, title: 'Operational inspection', instruction: 'Monitor barrel temperature', is_critical: true },
      ],
    },
  });

  const [ackForm, setAckForm] = useState({
    employee_id: 1,
    digital_signature: user?.full_name || 'Authorized Signatory',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, eList] = await Promise.all([api.getSOPs(), api.getEmployees()]);
      setSops(sList);
      setEmployees(eList);
    } catch (err) {
      console.error('Failed to load SOPs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSOP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSOP(newSOP);
      setIsSOPModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating SOP: ${err.message}`);
    }
  };

  const handleOpenAck = (sop: SOP) => {
    setSelectedSOP(sop);
    setAckForm({
      employee_id: employees[0]?.id || 1,
      digital_signature: user?.full_name || 'Authorized Staff',
    });
    setIsAckModalOpen(true);
  };

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSOP) return;
    try {
      const currentVer = selectedSOP.versions?.[0];
      await api.acknowledgeSOP(selectedSOP.id, {
        sop_id: selectedSOP.id,
        version_id: currentVer ? currentVer.id : 1,
        employee_id: ackForm.employee_id,
        digital_signature: ackForm.digital_signature,
      });
      setIsAckModalOpen(false);
      loadData();
      alert('SOP acknowledgment registered successfully.');
    } catch (err: any) {
      alert(`Error acknowledging SOP: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-700" />
            Standard Operating Procedures (SOP) Master
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Version-controlled procedures, mandatory checklists, and employee compliance acknowledgements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSOPModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create SOP
          </button>
        </div>
      </div>

      {/* SOP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sops.map((sop) => {
          const ver = sop.versions?.[0];
          return (
            <div
              key={sop.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{sop.code}</span>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {ver ? ver.version_number : 'v1.0'} (PUBLISHED)
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base leading-snug">{sop.title}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">{sop.description}</p>

                {/* Checklist Steps Preview */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Mandatory Checkpoints & Standards
                  </span>
                  {ver?.checklists?.map((step: any) => (
                    <div key={step.id} className="text-xs flex items-baseline gap-2">
                      <span className="font-bold text-emerald-700">#{step.step_number}</span>
                      <span className="font-semibold text-slate-800">{step.title}:</span>
                      <span className="text-slate-500">{step.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {sop.acknowledgments?.length || 0} Staff Sign-offs
                </span>
                <button
                  onClick={() => handleOpenAck(sop)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Sign Compliance Ack
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New SOP */}
      <Modal
        isOpen={isSOPModalOpen}
        onClose={() => setIsSOPModalOpen(false)}
        title="Draft Standard Operating Procedure"
        subtitle="Publish quality assurance or operational procedure for staff training"
      >
        <form onSubmit={handleCreateSOP} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SOP Code</label>
              <input
                type="text"
                required
                value={newSOP.code}
                onChange={(e) => setNewSOP({ ...newSOP, code: e.target.value })}
                placeholder="e.g. SOP-STORE-002"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newSOP.category}
                onChange={(e) => setNewSOP({ ...newSOP, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              >
                <option value="SEED_RECEIVING">Seed Receiving</option>
                <option value="STORAGE">Storage & Warehousing</option>
                <option value="OIL_EXTRACTION">Oil Extraction</option>
                <option value="MACHINE_CLEANING">Machine Cleaning</option>
                <option value="QUALITY_CONTROL">Quality Control</option>
                <option value="PACKAGING">Packaging & Bottling</option>
                <option value="WASTE_DISPOSAL">Waste Disposal</option>
                <option value="FRANCHISE_OPERATIONS">Franchise Operations</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">SOP Title</label>
            <input
              type="text"
              required
              value={newSOP.title}
              onChange={(e) => setNewSOP({ ...newSOP, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Scope & Description</label>
            <textarea
              rows={3}
              value={newSOP.description}
              onChange={(e) => setNewSOP({ ...newSOP, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSOPModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Publish SOP
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Sign Acknowledgment */}
      <Modal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        title="Employee SOP Compliance Sign-off"
        subtitle={`Procedure: ${selectedSOP?.title}`}
      >
        <form onSubmit={handleAcknowledge} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Acknowledge As Employee</label>
            <select
              value={ackForm.employee_id}
              onChange={(e) => setAckForm({ ...ackForm, employee_id: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Digital Signature Text</label>
            <input
              type="text"
              required
              value={ackForm.digital_signature}
              onChange={(e) => setAckForm({ ...ackForm, digital_signature: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-emerald-800 font-bold"
            />
          </div>
          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            By signing, the employee affirms that they have read and fully understood the safety,
            quality, and hygiene standards defined in this SOP version.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAckModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Register Digital Sign-off
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
