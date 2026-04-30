import { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Plus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../../store/dataStore';
import { Payment } from '../../types';

const methodLabels: Record<string, string> = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', mobile_money: 'Mobile Money', card: 'Card',
};

const emptyForm = {
  studentId: '', description: '', amount: '',
  method: 'cash' as Payment['method'], reference: '', paymentDate: new Date().toISOString().slice(0, 10),
};

function printInvoice(p: Payment, termName: string) {
  const win = window.open('', '_blank', 'width=750,height=900');
  if (!win) return;
  win.document.write(`
    <html><head><title>Invoice — ${p.studentName}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;padding:48px;max-width:620px;margin:0 auto;color:#111}
      .logo{font-size:22px;font-weight:900;text-align:center;margin-bottom:4px}
      .sub{text-align:center;color:#555;font-size:13px;margin-bottom:28px}
      .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
      .paid{background:#dcfce7;color:#16a34a}.partial{background:#fef3c7;color:#d97706}.unpaid{background:#fee2e2;color:#dc2626}
      .divider{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
      .row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px}
      .lbl{color:#6b7280}.val{font-weight:600}
      .total-row{display:flex;justify-content:space-between;padding:14px 0;border-top:2px solid #111;margin-top:8px}
      .total-lbl{font-size:16px;font-weight:900}.balance-val{font-size:16px;font-weight:700;color:${p.balance > 0 ? '#dc2626' : '#16a34a'}}
      .footer{margin-top:48px;text-align:center;font-size:11px;color:#9ca3af}
      .sig{display:flex;justify-content:space-between;margin-top:56px}
      .sig-line{width:180px;border-top:1px solid #111;padding-top:6px;font-size:11px;color:#6b7280;text-align:center}
    </style></head>
    <body>
      <div class="logo">Base2 Science and Media Academy</div>
      <div class="sub">Official Fee Invoice · ${termName}</div>
      <hr class="divider"/>
      <div class="row"><span class="lbl">Invoice No.</span><span class="val">INV-${p.id.slice(-8).toUpperCase()}</span></div>
      <div class="row"><span class="lbl">Date Issued</span><span class="val">${new Date().toLocaleDateString('en-GB')}</span></div>
      <div class="row"><span class="lbl">Student Name</span><span class="val">${p.studentName}</span></div>
      <div class="row"><span class="lbl">Description</span><span class="val">${p.description}</span></div>
      <div class="row"><span class="lbl">Payment Method</span><span class="val">${p.method ? methodLabels[p.method] ?? p.method : '—'}</span></div>
      <div class="row"><span class="lbl">Payment Date</span><span class="val">${p.paymentDate || '—'}</span></div>
      ${p.reference ? `<div class="row"><span class="lbl">Reference</span><span class="val">${p.reference}</span></div>` : ''}
      <hr class="divider"/>
      <div class="row"><span class="lbl">Total Agreed Fee</span><span class="val">UGX ${p.totalFee.toLocaleString()}</span></div>
      <div class="row"><span class="lbl">Amount Paid Now</span><span class="val" style="color:#16a34a">UGX ${p.amountPaid.toLocaleString()}</span></div>
      <div class="row"><span class="lbl">Remaining Balance</span><span class="balance-val">UGX ${p.balance.toLocaleString()}</span></div>
      <div class="total-row">
        <span class="total-lbl">Status</span>
        <span class="badge ${p.status}">${p.status.toUpperCase()}</span>
      </div>
      <div class="sig">
        <div class="sig-line">Bursar / Accountant</div>
        <div class="sig-line">Principal / Head</div>
        <div class="sig-line">Parent / Guardian</div>
      </div>
      <div class="footer">Base2 Science and Media Academy · Official fee invoice. Retain for your records.</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export default function Financials() {
  const payments    = useDataStore(s => s.payments);
  const terms       = useDataStore(s => s.terms);
  const students    = useDataStore(s => s.students);
  const { addPayment, fetchFromBackend } = useDataStore();

  const currentTerm = terms.find(t => t.isCurrent) || terms[0];

  const [filter, setFilter]       = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    fetchFromBackend();
  }, []);

  // Calculate totals from BOTH student records (Agreed Fees) and Payment records
  const studentFinancials = useMemo(() => {
    return students.map(s => {
      const studentPayments = payments.filter(p => p.studentId === s.id);
      const paid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const agreed = s.totalFee || 0;
      const balance = Math.max(0, agreed - paid);
      const status = balance === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      return {
        id: s.id,
        name: s.fullName,
        studentId: s.studentId,
        agreed,
        paid,
        balance,
        status,
        lastPayment: studentPayments.length > 0 ? studentPayments[studentPayments.length - 1].paymentDate : '—'
      };
    });
  }, [students, payments]);

  const filteredFinancials = filter === 'all' ? studentFinancials : studentFinancials.filter(s => s.status === filter);

  const totalFeesExpected = studentFinancials.reduce((sum, s) => sum + s.agreed, 0);
  const totalFeesPaid     = studentFinancials.reduce((sum, s) => sum + s.paid, 0);
  const totalOutstanding  = studentFinancials.reduce((sum, s) => sum + s.balance, 0);
  const collectionRate    = totalFeesExpected > 0 ? Math.round((totalFeesPaid / totalFeesExpected) * 100) : 0;

  const chartData = useMemo(() => {
    const byMonth: Record<string, { collected: number; outstanding: number }> = {};
    payments.forEach(p => {
      const key = p.paymentDate
        ? new Date(p.paymentDate).toLocaleString('default', { month: 'short' })
        : 'Unknown';
      if (!byMonth[key]) byMonth[key] = { collected: 0, outstanding: 0 };
      byMonth[key].collected   += p.amountPaid;
    });
    // Add outstanding from student records
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    if (!byMonth[currentMonth]) byMonth[currentMonth] = { collected: 0, outstanding: 0 };
    byMonth[currentMonth].outstanding += totalOutstanding;

    return Object.entries(byMonth).map(([month, v]) => ({ month, ...v }));
  }, [payments, totalOutstanding]);

  const f = (k: keyof typeof emptyForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleAddPayment = async () => {
    if (!form.studentId || !form.amount) return;
    setLoading(true);
    try {
      await addPayment({
        studentId:     form.studentId,
        amount:        parseFloat(form.amount),
        paymentMethod: form.method,
        reference:     form.reference,
        notes:         form.description,
      });
      setShowModal(false);
      setForm(emptyForm);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Financials &amp; Fee Management</h2><p>Track agreed fees, payments, and outstanding balances</p></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: 13 }}>
            Collection Rate: {collectionRate}%
          </span>
          <button id="btn-add-payment" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15}/> Record Payment
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {[
          { icon: <DollarSign size={22}/>, label: 'Money Agreed (Total)',  value: `UGX ${totalFeesExpected.toLocaleString()}`, color: '#94a3b8' },
          { icon: <CheckCircle size={22}/>, label: 'Money Paid (Revenue)', value: `UGX ${totalFeesPaid.toLocaleString()}`, color: '#22c55e' },
          { icon: <AlertCircle size={22}/>, label: 'Money Outstanding', value: `UGX ${totalOutstanding.toLocaleString()}`, color: '#ef4444' },
          { icon: <Clock size={22}/>, label: 'Student Accounts',          value: studentFinancials.length,                      color: '#f59e0b' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color, fontSize: 18 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, marginTop: 24 }}>
        <div className="card-header" style={{ padding: '18px 24px' }}>
          <div><h3>Student Financial Overview</h3><p>Detailed fee status for every student</p></div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {(['all','paid','partial','unpaid'] as const).map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Student</th><th>Money Agreed</th><th>Money Paid</th>
              <th>Balance</th><th>Status</th><th>Last Payment</th><th>Action</th>
            </tr></thead>
            <tbody>
              {filteredFinancials.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ background: '#f9731618', color: '#f97316', width: 30, height: 30, fontSize: 11 }}>
                        {s.name[0]}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>UGX {s.agreed.toLocaleString()}</td>
                  <td style={{ color: '#22c55e', fontWeight: 600 }}>UGX {s.paid.toLocaleString()}</td>
                  <td style={{ color: s.balance > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>UGX {s.balance.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${s.status === 'paid' ? 'badge-success' : s.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="td-muted">{s.lastPayment}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      const p = payments.find(pay => pay.studentId === s.id);
                      if (p) printInvoice(p, currentTerm?.name || 'Academic Term');
                    }} title="Print Last Invoice">
                      <FileText size={12}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record New Payment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="form-select" value={form.studentId} onChange={e => f('studentId', e.target.value)}>
                  <option value="">Select student…</option>
                  {students.map(st => <option key={st.id} value={st.id}>{st.fullName} (Agreed: {st.totalFee?.toLocaleString()})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={e => f('description', e.target.value)} placeholder="e.g. Term 1 Balance"/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount Paid (UGX)</label>
                  <input type="number" className="form-input" value={form.amount} onChange={e => f('amount', e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-input" value={form.paymentDate} onChange={e => f('paymentDate', e.target.value)}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={form.method} onChange={e => f('method', e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="btn-save-payment" className="btn btn-primary" onClick={handleAddPayment} disabled={loading || !form.studentId || !form.amount}>
                {loading ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
