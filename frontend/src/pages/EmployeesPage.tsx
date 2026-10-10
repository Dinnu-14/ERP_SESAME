import React, { useEffect, useState } from 'react';
import { Users, Plus, CheckCircle, Clock, Calendar, RefreshCw, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { Employee } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

export const EmployeesPage: React.FC = () => {
  const { locations } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isAttModalOpen, setIsAttModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const [newEmp, setNewEmp] = useState({
    employee_code: 'EMP-',
    first_name: '',
    last_name: '',
    department: 'Production',
    job_title: 'Expeller Technician',
    location_id: 1,
    phone: '',
    shift: 'Morning 8AM - 4PM',
  });

  const [attForm, setAttForm] = useState({
    status: 'PRESENT',
    check_in: '08:30 AM',
    check_out: '05:00 PM',
    notes: 'Regular shift completed',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const eList = await api.getEmployees();
      setEmployees(eList);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEmployee(newEmp);
      setIsEmpModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating employee: ${err.message}`);
    }
  };

  const handleOpenAtt = (emp: Employee) => {
    setSelectedEmp(emp);
    setIsAttModalOpen(true);
  };

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      await api.recordAttendance({
        employee_id: selectedEmp.id,
        status: attForm.status,
        check_in: attForm.check_in,
        check_out: attForm.check_out,
        notes: attForm.notes,
      });
      setIsAttModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error logging attendance: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-700" />
            Employee Management & Staff Attendance
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Staff directory across factory production units and SUFALA retail branches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEmpModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Active Staff Directory</h2>
          <button
            onClick={loadData}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Employee Code</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Assigned Location</th>
                <th className="py-3 px-4">Shift Schedule</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {employees.map((emp) => {
                const loc = locations.find((l) => l.id === emp.location_id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {emp.employee_code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{emp.job_title}</div>
                      <div className="text-[10px] text-slate-400">{emp.department}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{loc?.name || 'Central Operations'}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{emp.shift}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {emp.employment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenAtt(emp)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] border border-slate-300"
                      >
                        Punch Attendance
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Employee */}
      <Modal
        isOpen={isEmpModalOpen}
        onClose={() => setIsEmpModalOpen(false)}
        title="Add Employee Profile"
        subtitle="Onboard factory worker or franchise store staff"
      >
        <form onSubmit={handleCreateEmp} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Employee Code</label>
              <input
                type="text"
                required
                value={newEmp.employee_code}
                onChange={(e) => setNewEmp({ ...newEmp, employee_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Location</label>
              <select
                value={newEmp.location_id}
                onChange={(e) => setNewEmp({ ...newEmp, location_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={newEmp.first_name}
                onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={newEmp.last_name}
                onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={newEmp.department}
                onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                <option value="Production">Production & Expeller</option>
                <option value="Store & Warehouse">Store & Warehouse</option>
                <option value="SUFALA Franchise">SUFALA Franchise</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="B2B Sales">B2B Sales</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Job Designation</label>
              <input
                type="text"
                required
                value={newEmp.job_title}
                onChange={(e) => setNewEmp({ ...newEmp, job_title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsEmpModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Create Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Punch Attendance */}
      <Modal
        isOpen={isAttModalOpen}
        onClose={() => setIsAttModalOpen(false)}
        title="Record Daily Attendance"
        subtitle={`Staff: ${selectedEmp?.first_name} ${selectedEmp?.last_name} (${selectedEmp?.employee_code})`}
      >
        <form onSubmit={handleRecordAttendance} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={attForm.status}
              onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="HALF_DAY">HALF DAY</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Check In Time</label>
              <input
                type="text"
                value={attForm.check_in}
                onChange={(e) => setAttForm({ ...attForm, check_in: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Check Out Time</label>
              <input
                type="text"
                value={attForm.check_out}
                onChange={(e) => setAttForm({ ...attForm, check_out: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAttModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Save Attendance Punch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
