import React, { useEffect, useState } from 'react';
import './CustomerHistoryDrawer.css';

export default function CustomerHistoryDrawer({ isOpen, customerData, onClose }){
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes(window.location.host)
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:5000';

  useEffect(()=>{
    if (!isOpen) return;
    const id = customerData?._id ?? customerData?.id ?? customerData?.partyId;
    const fetchInvoices = async ()=>{
      setLoading(true);
      try{
        const q = new URLSearchParams();
        if (fromDate) q.set('from', fromDate);
        if (toDate) q.set('to', toDate);
        const res = await fetch(`${API_BASE_URL}/api/parties/${id}/invoices?${q.toString()}`);
        const contentType = res.headers.get('content-type')||'';
        const data = contentType.includes('application/json') ? await res.json() : { __rawText: await res.text() };
        if (!res.ok) throw new Error((data && data.message) || data.__rawText || res.statusText);
        setInvoices(Array.isArray(data.invoices)?data.invoices:data);
      }catch(err){ console.error(err); setInvoices([]);}finally{setLoading(false)}
    };
    fetchInvoices();
  },[isOpen, customerData, fromDate, toDate]);

  if (!isOpen) return null;

  const totalCount = invoices.length;
  const totalValue = invoices.reduce((s,i)=>s + (Number(i.total) || Number(i.amount) || 0),0);

  return (
    <div className="drawer-overlay history" onMouseDown={onClose}>
      <aside className="drawer history-drawer" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h3>Purchase History</h3>
            <div className="sub">{customerData?.name} — {customerData?.mobile}</div>
          </div>
          <button className="close" onClick={onClose}>✕</button>
        </div>

        <div className="history-controls">
          <label>From <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} /></label>
          <label>To <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} /></label>
        </div>

        <div className="history-summary">
          <div>Total invoices: {totalCount}</div>
          <div>Total purchases: ₹ {totalValue.toLocaleString('en-IN')}</div>
        </div>

        <div className="history-list">
          {loading && <div className="empty">Loading…</div>}
          {!loading && !invoices.length && <div className="empty">No invoices found for this customer.</div>}
          {invoices.map((inv)=> (
            <div className="history-row" key={inv.invoiceNumber||inv._id||inv.id}>
              <div className="col number">{inv.invoiceNumber || inv.number || '-'}</div>
              <div className="col date">{inv.date || inv.invoiceDate || '-'}</div>
              <div className="col items">{inv.items?.length ?? inv.itemCount ?? '-'}</div>
              <div className="col amount">₹ {Number(inv.total || inv.amount || 0).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
