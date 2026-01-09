import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const transactions = [
    { date: '29 Nov 2025', type: 'Delivery Challan', txnNo: '2', party: 'Sevvel Garments', amount: '₹2,720' },
    { date: '23 Nov 2025', type: 'Sales Invoice', txnNo: '8', party: 'Sevvel Garments', amount: '₹2,856' },
    { date: '22 Nov 2025', type: 'Delivery Challan', txnNo: '1', party: 'Sevvel Garments', amount: '₹8,730' },
    { date: '21 Nov 2025', type: 'Add Money', txnNo: '3', party: 'Sevvel Garments', amount: '₹0' },
    { date: '21 Nov 2025', type: 'Sales Invoices', txnNo: '5', party: 'Sevvel Garments', amount: '₹9,166.5' },
  ];

  const checklist = [
    { title: 'Send payment reminder', detail: 'Invoice INV-205 due tomorrow' },
    { title: 'Follow up on demo', detail: 'Call scheduled client at 03:00 PM' },
  ];

  const [toPay, setToPay] = React.useState(0);

  React.useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const fetchPurchaseSummary = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/purchase-invoices/summary`);
        if (!res.ok) return;
        const d = await res.json();
        setToPay(Number(d.unpaidTotal || 0));
      } catch (err) {
        console.error('Failed to fetch purchase summary', err);
      }
    };

    fetchPurchaseSummary();
  }, []);

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your business performance</p>
        </div>
      </header>

      <section className="overview-grid">
        <article className="overview-card success">
          <p className="label">To Collect</p>
          <p className="value">₹ 12,022.5</p>
        </article>
        <article className="overview-card warning">
          <p className="label">To Pay</p>
          <p className="value">{`₹ ${toPay.toLocaleString('en-IN')}`}</p>
        </article>
        <article className="overview-card neutral">
          <div className="overview-header">
            <p className="label">Total Cash + Bank Balance</p>
            <p className="timestamp">Last update: 01 Dec 2025 | 07:05 PM</p>
          </div>
          <p className="value">₹ 0</p>
        </article>
      </section>

      <section className="detail-grid">
        <article className="transactions-card">
          <header>
            <h2>Latest Transactions</h2>
            <button type="button">See All Transactions</button>
          </header>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Txn No</th>
                  <th>Party Name</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => (
                  <tr key={`${row.date}-${row.txnNo}`}>
                    <td>{row.date}</td>
                    <td>{row.type}</td>
                    <td>{row.txnNo}</td>
                    <td>{row.party}</td>
                    <td>{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="checklist-card">
          <header>
            <h2>Today&apos;s Checklist</h2>
          </header>
          <div className="checklist-body">
            <div className="checklist-illustration" aria-hidden="true" />
            <ul>
              {checklist.map((item) => (
                <li key={item.title}>
                  <p className="item-title">{item.title}</p>
                  <p className="item-detail">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </>
  );
}

export default Home;
