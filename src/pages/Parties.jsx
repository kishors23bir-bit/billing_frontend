import React, { useMemo, useState, useEffect } from 'react';
import reportIconUrl from '../image/icons/reports.svg';
import portalIconUrl from '../image/icons/home.svg';
import settingsIcon from '../image/icons/settings.svg';
import './Parties.css';
import PartyDrawer from '../components/PartyDrawer';

/* parties loaded from API */
const partiesList = [];

// Resolve API base URL like other pages (prefer Vite env var)
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
try {
  const currentHost = window.location.host;
  if (!API_BASE_URL || API_BASE_URL.includes(currentHost)) {
    API_BASE_URL = 'http://localhost:5000';
  }
} catch (e) {
  API_BASE_URL = API_BASE_URL || 'http://localhost:5000';
}

/* Summary cards values are computed from loaded parties (see inside component) */

export default function Parties() {
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(''); // '' = All, 'Buyer', 'Supplier'

  const [parties, setParties] = useState(partiesList);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const filteredParties = useMemo(() => {
    if (!categoryFilter) return parties;
    return parties.filter(p => p.category === categoryFilter);
  }, [parties, categoryFilter]);

  // Summary counts computed from loaded parties
  const totalParties = parties.length;
  const toCollectAmt = parties.reduce((sum, p) => {
    const bal = Number(p.balance || 0);
    return sum + (bal > 0 ? bal : 0);
  }, 0);
  const toPayAmt = parties.reduce((sum, p) => {
    const bal = Number(p.balance || 0);
    return sum + (bal < 0 ? Math.abs(bal) : 0);
  }, 0);

  const summaryCards = [
    { label: 'All Parties', value: String(totalParties), accent: 'lavender' },
    { label: 'To Collect', value: '₹ ' + toCollectAmt.toLocaleString('en-IN'), accent: 'green' },
    { label: 'To Pay', value: '₹ ' + toPayAmt.toLocaleString('en-IN'), accent: 'red' },
  ];

  useEffect(() => {
    let mounted = true;
    
    const loadParties = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/parties`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load parties');
        if (mounted) setParties(Array.isArray(data.parties) ? data.parties : []);
      } catch (err) {
        console.error('Failed to load parties', err);
        if (mounted) setLoadError('Unable to load parties');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadParties();

    return () => { mounted = false; };
  }, []);

  const openDrawer = (mode, party = null) => {
    setSelectedParty(party);
    setDrawerMode(mode);
    setOpenMenuIndex(null);
  };

  const closeDrawer = () => setDrawerMode(null);

  const handlePartyUpdated = (updatedParty) => {
    // Refresh the parties list after save
    fetchParties();
  };

  const toggleMenu = (index) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  const handleEdit = (party) => {
    openDrawer('edit', party);
  };

  const fetchParties = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/parties`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load parties');
      setParties(Array.isArray(data.parties) ? data.parties : []);
    } catch (err) {
      console.error('Failed to load parties', err);
      setLoadError('Unable to load parties');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="parties-page">
      {/* HEADER */}
      <header className="parties-header">
        <div className="page-title">
          <h1>Parties</h1>
          <p>Manage customers and view purchase history.</p>
        </div>

        <div className="header-actions">
          <button className="ghost-link">
            <img src={portalIconUrl} alt="Portal" className="icon-inline" />
            SharedLedger Portal
          </button>

          <button className="ghost-link">
            <img src={reportIconUrl} alt="Reports" className="icon-inline" />
            Reports
          </button>

          <button className="icon-btn">
            <img src={settingsIcon} alt="Settings" />
          </button>
        </div>
      </header>

      {/* INFO BANNER removed */}

      {/* SUMMARY */}
      <section className="summary-row">
        {summaryCards.map(card => (
          <article key={card.label} className={`summary-card ${card.accent}`}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      {/* FILTERS */}
      <section className="filters-row">
        <div className="filters-left">
          <div className="search-box">
            <input
              type="search"
              placeholder="Search by customer name or mobile"
            />
          </div>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Buyer">Buyer</option>
            <option value="Supplier">Supplier</option>
          </select>

          <select>
            <option>Bulk Action</option>
          </select>
        </div>

        <button className="primary" onClick={() => openDrawer('create')}>
          Create Party
        </button>
      </section>

      {/* TABLE */}
      <section className="table-wrapper">
        <div className="table-section">
          <div className="table-header">
            <span>Party Name</span>
            <span>Category</span>
            <span>Mobile Number</span>
            <span>Party Type</span>
            <span>Balance</span>
            <span className="actions-column">Actions</span>
          </div>

          <div className="table-body">
            {isLoading && <div className="empty"><p className="empty-text">Loading parties…</p></div>}
            {loadError && !isLoading && <div className="empty"><p className="empty-text">{loadError}</p></div>}

            {!isLoading && !loadError && filteredParties.length === 0 && (
              <div className="table-body empty"><p className="empty-text">No parties found</p></div>
            )}

            {!isLoading && !loadError && filteredParties.map((party, index) => (
              <div className="table-row" key={`${party.partyId || party.name}-${index}`}>
                <span className="party-name">{party.name}</span>
                <span>{party.category ?? '-'}</span>
                <span>{party.phone || '-'}</span>
                <span>{party.type || 'Customer'}</span>
                <span className={`balance ${party.balance > 0 ? 'down' : 'neutral'}`}>{'₹ ' + (Number(party.balance || 0)).toLocaleString('en-IN')}</span>
                <span className="actions-column">
                  <button className="ghost" onClick={() => { setSelectedParty(party); setDrawerMode('history'); }}>
                    View History
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="icon-btn slim" 
                      aria-label="More actions"
                      onClick={() => toggleMenu(index)}
                    >
                      ⋮
                    </button>
                    {openMenuIndex === index && (
                      <div className="dropdown-menu">
                        <button onClick={() => handleEdit(party)}>Edit Party</button>
                        <button onClick={() => { setSelectedParty(party); setDrawerMode('history'); setOpenMenuIndex(null); }}>View Details</button>
                      </div>
                    )}
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {drawerMode && (
        <PartyDrawer
          mode={drawerMode}
          party={selectedParty}
          onClose={closeDrawer}
          onSave={handlePartyUpdated}
        />
      )}
    </div>
  );
}
