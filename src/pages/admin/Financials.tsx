import { useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PAYMENTS, STUDENTS, TERMS } from '../../data/mockData';
import { Payment } from '../../types';

const totalRevenue    = PAYMENTS.reduce((s, p) => s + p.amountPaid, 0);
const totalOutstanding = PAYMENTS.reduce((s, p) => s + p.balance, 0);
const totalFees        = PAYMENTS.reduce((s, p) => s + p.totalFee, 0);
const collectionRate   = Math.round((totalRevenue / totalFees) * 100);
const currentTerm      = TERMS.find(t => t.isCurrent);

const methodLabels: Record<string, string> = { cash: 'Cash', bank_transfer: 'Bank Transfer', mobile_money: 'Mobile Money', card: 'Card' };

function printInvoice(p: Payment) {
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
      .total-lbl{font-size:16px;font-weight:900}.total-val{font-size:20px;font-weight:900;color:#16a34a}
      .balance-val{font-size:16px;font-weight:700;color:${p.balance > 0 ? '#dc2626' : '#16a34a'}}
      .footer{margin-top:48px;text-align:center;font-size:11px;color:#9ca3af}
      .sig{display:flex;justify-content:space-between;margin-top:56px}
      .sig-line{width:180px;border-top:1px solid #111;padding-top:6px;font-size:11px;color:#6b7280;text-align:center}
    </style></head>
    <body>
      <div class="logo">Base 2 Media Academy</div>
      <div class="sub">Official Fee Invoice · ${currentTerm?.name ?? 'Academic Term'}</div>
      <hr class="divider"/>
      <div class="row"><span class="lbl">Invoice No.</span><span class="val">INV-${p.id.slice(-8).toUpperCase()}</span></div>
      <div class="row"><span class="lbl">Date Issued</span><span class="val">${new Date().toLocaleDateString('en-GB')}</span></div>
      <div class="row"><span class="lbl">Student Name</span><span class="val">${p.studentName}</span></div>
      <div class="row"><span class="lbl">Description</span><span class="val">${p.description}</span></div>
      <div class="row"><span class="lbl">Payment Method</span><span class="val">${p.method ? methodLabels[p.method] ?? p.method : '—'}</span></div>
      <div class="row"><span class="lbl">Payment Date</span><span class="val">${p.paymentDate || '—'}</span></div>
      ${p.reference ? `<div class="row"><span class="lbl">Reference</span><span class="val">${p.reference}</span></div>` : ''}
      <hr class="divider"/>
      <div class="row"><span class="lbl">Total Fee</span><span class="val">UGX ${p.totalFee.toLocaleString()}</span></div>
      <div class="row"><span class="lbl">Amount Paid</span><span class="val" style="color:#16a34a">UGX ${p.amountPaid.toLocaleString()}</span></div>
      <div class="row"><span class="lbl">Balance Remaining</span><span class="balance-val">UGX ${p.balance.toLocaleString()}</span></div>
      <div class="total-row">
        <span class="total-lbl">Status</span>
        <span class="badge ${p.status}">${p.status.toUpperCase()}</span>
      </div>
      <div class="sig">
        <div class="sig-line">Bursar / Accountant</div>
        <div class="sig-line">Principal / Head</div>
        <div class="sig-line">Parent / Guardian</div>
      </div>
      <div class="footer">Base 2 Media Academy · This is an official fee invoice. Please retain for your records.</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

const chartData = [
  { month: 'Jan', collected: 3200, outstanding: 800 },
  { month: 'Feb', collected: 2800, outstanding: 600 },
  { month: 'Mar', collected: 3600, outstanding: 400 },
  { month: 'Apr', collected: totalRevenue, outstanding: totalOutstanding },
];

export default function Financials() {
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [filter, setFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const recordPayment = (id: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, amountPaid: p.totalFee, balance: 0, status: 'paid', paymentDate: new Date().toISOString().slice(0,10), method: 'cash', reference: `CASH-${Date.now()}` };
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Financials</h2><p>Fee collection, payments & outstanding balances</p></div>
        <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: 13 }}>Collection Rate: {collectionRate}%</span>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {[
          { icon: <DollarSign size={22}/>, label: 'Total Fees Expected', value: `UGX ${totalFees.toLocaleString()}`, color: '#94a3b8' },
          { icon: <CheckCircle size={22}/>, label: 'Total Collected', value: `UGX ${totalRevenue.toLocaleString()}`, color: '#22c55e' },
          { icon: <AlertCircle size={22}/>, label: 'Outstanding Balance', value: `UGX ${totalOutstanding.toLocaleString()}`, color: '#ef4444' },
          { icon: <Clock size={22}/>, label: 'Partial Payments', value: PAYMENTS.filter(p => p.status === 'partial').length, color: '#f59e0b' },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ borderTopColor: s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value" style={{ color: s.color, fontSize: typeof s.value === 'string' ? 20 : 28 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div><h3>Monthly Collection Overview</h3><p>Collected vs Outstanding (UGX)</p></div>
          <TrendingUp size={16} color="#94a3b8"/>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false}/>
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background: '#1a2236', border: '1px solid #1e2d45', borderRadius: 8, color: '#f0f4ff' }}/>
            <Bar dataKey="collected" fill="#22c55e" radius={[4,4,0,0]} name="Collected"/>
            <Bar dataKey="outstanding" fill="#ef4444" radius={[4,4,0,0]} name="Outstanding"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '18px 24px' }}>
          <div><h3>Payment Records</h3><p>All students · Current Term</p></div>
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
              <th>Student</th><th>Description</th><th>Total Fee</th><th>Paid</th><th>Balance</th><th>Method</th><th>Date</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ background: '#f9731618', color: '#f97316', width: 30, height: 30, fontSize: 11 }}>
                        {p.studentName.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{p.studentName}</span>
                    </div>
                  </td>
                  <td className="td-muted">{p.description}</td>
                  <td style={{ fontWeight: 600 }}>UGX {p.totalFee.toLocaleString()}</td>
                  <td style={{ color: '#22c55e', fontWeight: 600 }}>UGX {p.amountPaid.toLocaleString()}</td>
                  <td style={{ color: p.balance > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>UGX {p.balance.toLocaleString()}</td>
                  <td className="td-muted">{p.method ? methodLabels[p.method] : '—'}</td>
                  <td className="td-muted">{p.paymentDate || '—'}</td>
                  <td>
                    <span className={`badge ${p.status === 'paid' ? 'badge-success' : p.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.status !== 'paid' && (
                        <button className="btn btn-ghost btn-sm" id={`record-pay-${p.id}`} onClick={() => recordPayment(p.id)}>
                          Mark Paid
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" id={`invoice-${p.id}`} onClick={() => printInvoice(p)} title="Print Invoice">
                        <FileText size={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
