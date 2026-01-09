import React, { useState, useEffect } from 'react';
import './Bills.css';
import API from '../config/api';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, todaySales: 0, monthSales: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [bRes, sRes] = await Promise.all([
        fetch(`${API}/api/bills`),
        fetch(`${API}/api/bills/summary`)
      ]);

      if (!bRes.ok) throw new Error(`Bills fetch failed: ${bRes.status}`);
      if (!sRes.ok) throw new Error(`Summary fetch failed: ${sRes.status}`);

      const bData = await bRes.json();

      // If summary endpoint fails (404 or similar), compute summary client-side from bills
      if (!sRes.ok) {
        const billsArr = bData.bills || [];
        const total = billsArr.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        let today = 0;
        let month = 0;

        billsArr.forEach((b) => {
          const d = b.invoiceDate ? new Date(b.invoiceDate) : null;
          if (d) {
            if (d >= startOfToday && d < startOfTomorrow) today += Number(b.grandTotal) || 0;
            if (d >= startOfMonth && d < startOfNextMonth) month += Number(b.grandTotal) || 0;
          }
        });

        setBills(billsArr);
        setSummary({ totalSales: total, todaySales: today, monthSales: month });
        setError(`Summary endpoint returned ${sRes.status}; showing computed totals from bills.`);
        return;
      }

      const sData = await sRes.json();

      setBills(bData.bills || []);
      setSummary(sData || { totalSales: 0, todaySales: 0, monthSales: 0 });
    } catch (err) {
      console.error('Failed to fetch bills or summary', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (v) => '₹' + (Number(v) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <div className="bills-page">
      <div className="bills-header">
        <h2>Sales Bills</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn" onClick={fetchData} disabled={loading} style={{ padding: '8px 12px', marginRight: 8 }}>Refresh</button>
          <div className="bills-summary">
            <div className="summary-item">
              <div className="label">Total Sales</div>
              <div className="value">{formatCurrency(summary.totalSales)}</div>
            </div>
            <div className="summary-item">
              <div className="label">Today Sales</div>
              <div className="value">{formatCurrency(summary.todaySales)}</div>
            </div>
            <div className="summary-item">
              <div className="label">This Month</div>
              <div className="value">{formatCurrency(summary.monthSales)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bills-list">
        {error && <div style={{ color: 'red', padding: 12, background: '#fff6f6', borderRadius: 6 }}>{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : bills.length === 0 ? (
          <div>No bills found</div>
        ) : (
          <table className="bills-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b._id}>
                  <td>{b.invoiceNumber}</td>
                  <td>{b.invoiceDate ? new Date(b.invoiceDate).toLocaleDateString() : ''}</td>
                  <td>{b.customer?.name}</td>
                  <td className="text-right">{formatCurrency(b.grandTotal)}</td>
                  <td className="actions"><a href={`/api/bills/${encodeURIComponent(b.invoiceNumber)}/pdf`} target="_blank" rel="noreferrer">View PDF</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Bills;