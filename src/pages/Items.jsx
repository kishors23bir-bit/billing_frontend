import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ItemPicker from '../components/ItemPicker';
import EditItemModal from '../components/EditItemModal';
import { useNavigate, useLocation } from 'react-router-dom';
import './Home.css';
import './Items.css';
import API from '../config/api';

const formatCurrency = (value) => {
  const amount = Number.isFinite(value) ? value : 0;
  return (
    '₹ ' +
    amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const isLowStock = (item) => item.stock <= 0;

function Items() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const location = useLocation();

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetch(`${API}/api/items`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load items');
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error('Failed to load items', error);
      setLoadError('Unable to load items. Please try again later.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open modal editor for an item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleSaveFromModal = async (updatedFields) => {
    if (!editingItem) return;
    const id = editingItem.itemId ?? editingItem.id ?? editingItem._id;
    setUpdatingItemId(id);
    try {
      const res = await fetch(`${API}/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { __rawText: text };
      }

      if (!res.ok) {
        const serverMessage = (data && data.message) || data.__rawText || res.statusText || 'Failed to update item';
        throw new Error(serverMessage);
      }

      // Merge updated fields into the item received from server (if provided) or local copy
      const updatedItem = data.item || { ...(editingItem), ...updatedFields };

      setItems((prev) => prev.map((it) => (it.itemId ?? it.id ?? it._id) === id ? updatedItem : it));
      setToast({ type: 'success', message: 'Product updated successfully' });
      setTimeout(()=>setToast(null), 3000);
      
      // Modal will close itself on success
    } catch (err) {
      console.error('Failed to update item', err);
      setToast({ type: 'error', message: 'Update failed: ' + (err.message || 'Unknown error') });
      setTimeout(()=>setToast(null), 5000);
      // Re-throw so modal knows to stay open
      throw err;
    } finally {
      setUpdatingItemId(null);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // If navigated here with a newly created item in location state, prepend it
  useEffect(() => {
    if (location && location.state && location.state.createdItem) {
      const created = location.state.createdItem;
      setItems((prev) => {
        // avoid duplicates (by itemId)
        if (prev.some((it) => it.itemId === created.itemId)) return prev;
        return [created, ...prev];
      });
      // clear the navigation state so it doesn't re-apply on back/refresh
      try {
        navigate(location.pathname, { replace: true, state: null });
      } catch (e) {
        // ignore navigate errors if any
      }

      // Also trigger a short delayed refetch to reconcile with server-side data
      setTimeout(() => {
        fetchItems().catch(() => {});
      }, 500);
    }
  }, [location, navigate]);

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !term ||
        [item.name, item.code, item.category]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));
      const matchesLowStock = !showLowStockOnly || isLowStock(item);

      return matchesCategory && matchesSearch && matchesLowStock;
    });
  }, [items, searchTerm, selectedCategory, showLowStockOnly]);

  // Calculate stock value per item as: (stockQty * sellingPrice) + existing stockValue (if any)
  const totalStockValue = useMemo(() => {
    return filteredItems.reduce((accumulator, item) => {
      const stockQty = Number(item.stock) || 0;
      const sellingPrice = Number(item.salePrice ?? item.sellingPrice ?? 0);
      const existingStockValue = Number(item.stockValue) || 0;

      const itemStockValue = stockQty * sellingPrice + existingStockValue;
      return accumulator + itemStockValue;
    }, 0);
  }, [filteredItems]);
  const totalLowStock = useMemo(() => items.filter(isLowStock).length, [items]);

  return (
    <>
      <header className="items-header">
        <div>
          <h1>Items</h1>
          <p>Manage and review your inventory catalogue.</p>
        </div>
      </header>

      {toast && (
        <div className={`simple-toast ${toast.type === 'error' ? 'error' : 'success'}`}>
          {toast.message}
        </div>
      )}

      <section className="inventory-summary">
          <article className="summary-card">
            <div>
              <p className="summary-label">Stock Value</p>
              <h2>{formatCurrency(totalStockValue)}</h2>
            </div>
          </article>
          <article className="summary-card">
            <div>
              <p className="summary-label">Low Stock</p>
              <h2>{totalLowStock}</h2>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(event) => setShowLowStockOnly(event.target.checked)}
              />
              <span>Show Low Stock</span>
            </label>
          </article>
        </section>

        <section className="inventory-filters">
          <div className="filter search-filter">
            <label htmlFor="inventory-search">Search Item</label>
            <input
              id="inventory-search"
              type="search"
              placeholder="Search by item name or code"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="filter">
            <label htmlFor="inventory-category">Select Categories</label>
            <select
              id="inventory-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          <div className="filter" style={{display: 'flex', alignItems: 'flex-end'}}>
            <button type="button" className="primary" onClick={() => navigate('/items/add')} style={{width: '100%', padding: '0.7rem 1.5rem', borderRadius: '999px'}}>Create Item</button>
          </div>
        </section>

        <section className="inventory-table">
          <div className="inventory-table__header">
            <span>
              <input type="checkbox" aria-label="Select all items" />
            </span>
            <span>Item Name</span>
            <span>Item Code</span>
            <span>Stock Qty</span>
            <span>Selling Price</span>
            <span>Purchase Price</span>
            <span className="actions-column">Actions</span>
          </div>
          <div className="inventory-table__body">
            {isLoading && <p className="inventory-table__empty">Loading items…</p>}
            {loadError && !isLoading && <p className="inventory-table__empty">{loadError}</p>}
              {!isLoading && !loadError && filteredItems.map((item) => (
              <div key={item.itemId ?? item.id ?? item._id} className="inventory-table__row">
                <span>
                  <input type="checkbox" aria-label={`Select ${item.name}`} />
                </span>
                <span className="item-name">{item.name}</span>
                <span>{item.code || '-'}</span>
                <span>
                  {item.stock ?? 0} {item.unit || ''}
                </span>
                <span>{item.salePrice ? formatCurrency(item.salePrice) : '-'}</span>
                <span>{item.purchasePrice ? formatCurrency(item.purchasePrice) : '-'}</span>
                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-edit"
                    aria-label="Edit item"
                    onClick={() => handleEditItem(item)}
                    disabled={updatingItemId === (item.itemId ?? item.id ?? item._id)}
                  />
                </div>
              </div>
            ))}
            {!isLoading && !loadError && !filteredItems.length && (
              <p className="inventory-table__empty">No items match the current filters.</p>
            )}
          </div>
        </section>
        <EditItemModal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingItem(null); }} item={editingItem} onSave={handleSaveFromModal} />

        <ItemPicker open={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelect={(item) => {
          // When an item is selected from the picker on the Items page,
          // you might want to open an editor or add it — for now just close the picker.
          console.log('Selected item from picker on Items page', item);
        }} />
      </>
  );
}

export default Items;
