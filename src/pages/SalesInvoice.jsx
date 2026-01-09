import React, { useState, useEffect } from 'react';
import ItemSelectionModal from '../components/ItemSelectionModal';
import './SalesInvoice.css';
import InvoicePrint from '../components/InvoicePrint';
import { inventoryCatalog } from '../data/inventoryCatalog.js';
import API from '../config/api';

const SalesInvoice = () => {
  // Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Customer state
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Items state
  const [items, setItems] = useState([]);
  // Catalog items fetched from server for auto-fill (newly created items will appear here)
  const [itemsCatalog, setItemsCatalog] = useState([]);

  // Additional state
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  
  // Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Auto-generate invoice number on mount
  useEffect(() => {
    const generateInvoiceNumber = async () => {
      try {
        // Fetch all bills to get the last invoice number
        const response = await fetch(`${API}/api/bills`);
        const data = await response.json();
        
        let nextNumber = 1;
        
        if (data.bills && data.bills.length > 0) {
          // Find the highest invoice number
          const invoiceNumbers = data.bills
            .map(bill => bill.invoiceNumber)
            .filter(num => num && num.startsWith('INV'))
            .map(num => {
              const match = num.match(/INV(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => !isNaN(num));
          
          if (invoiceNumbers.length > 0) {
            const maxNumber = Math.max(...invoiceNumbers);
            nextNumber = maxNumber + 1;
          }
        }
        
        // Format with leading zeros (4 digits)
        const formattedNumber = `INV${String(nextNumber).padStart(4, '0')}`;
        setInvoiceNumber(formattedNumber);
      } catch (err) {
        console.error('Failed to generate invoice number:', err);
        // Fallback to INV0001 if there's an error
        setInvoiceNumber('INV0001');
      }
    };

    generateInvoiceNumber();
  }, []);

  // Fetch customers and items (for auto-fill)
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API}/api/parties`);
        const data = await response.json();
        setCustomers(data.parties || []);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };

    const fetchItems = async () => {
      try {
        const res = await fetch(`${API}/api/items`);
        const d = await res.json();
        setItemsCatalog(d.items || []);
      } catch (err) {
        console.error('Failed to fetch items for auto-fill:', err);
      }
    };

    fetchCustomers();
    fetchItems();
  }, []);

  // Calculate item amount
  const calculateAmount = (item) => {
    const subtotal = item.qty * item.price;
    const discountAmount = (subtotal * item.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * item.tax) / 100;
    return taxableAmount + taxAmount;
  };

  // Update item
  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        // If user typed item name, try to auto-fill price from server catalog first, then local catalog
        if (field === 'name') {
          const typed = String(value || '').trim().toLowerCase();
          if (typed) {
            let match = itemsCatalog.find(i => String(i.name || '').toLowerCase() === typed);
            if (!match) match = itemsCatalog.find(i => String(i.name || '').toLowerCase().includes(typed));
            // fallback to local inventoryCatalog
            if (!match) match = inventoryCatalog.find(i => String(i.name || '').toLowerCase() === typed);
            if (!match) match = inventoryCatalog.find(i => String(i.name || '').toLowerCase().includes(typed));
            if (match) {
              updatedItem.price = Number(match.salePrice ?? match.salesPrice ?? match.purchasePrice ?? 0) || 0;
            }
          }
        }

        updatedItem.amount = calculateAmount(updatedItem);
        return updatedItem;
      }
      return item;
    }));
  };

  // Add new item
  const handleAddItem = () => {
    setIsItemModalOpen(true);
  };
  
  // Handle adding items from modal
  const handleAddItemsFromModal = (newItems) => {
    const maxId = items.length > 0 ? Math.max(...items.map(i => i.id)) : 0;
    const itemsToAdd = newItems.map((item, index) => ({
      id: maxId + index + 1,
      name: item.name,
      hsn: item.code || '',
      qty: item.quantity || 1,
      // Prefer modal-provided rate (selling price), fall back to known fields
      price: item.rate ?? item.salePrice ?? item.salesPrice ?? item.purchasePrice ?? 0,
      discount: 0,
      tax: 18,
      amount: 0
    }));
    
    // Calculate amounts for new items
    const updatedItems = itemsToAdd.map(item => ({
      ...item,
      amount: calculateAmount(item)
    }));
    
    setItems([...items, ...updatedItems]);
  };

  // Remove item
  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item.qty * item.price * item.discount) / 100), 0);
  const taxableAmount = subtotal - totalDiscount;
  const totalTax = items.reduce((sum, item) => {
    const itemSubtotal = item.qty * item.price;
    const itemDiscount = (itemSubtotal * item.discount) / 100;
    const itemTaxable = itemSubtotal - itemDiscount;
    return sum + ((itemTaxable * item.tax) / 100);
  }, 0);
  const grandTotal = taxableAmount + totalTax + additionalCharges;

  // Filter customers
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Prepare print data
  const printItems = items.map((i) => {
    const qty = Number(i.qty) || 0;
    const rate = Number(i.price) || 0;
    const subtotal = qty * rate;
    const discountAmount = (subtotal * (Number(i.discount) || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (Number(i.tax) || 0)) / 100;
    const lineTotal = taxableAmount + taxAmount;

    return {
      description: i.name || '',
      name: i.name || '',
      hsn: i.hsn || i.code || '',
      quantity: qty,
      unit: i.unit || 'PCS',
      rate: rate,
      taxableAmount: taxableAmount,
      taxAmount: taxAmount,
      taxPercent: Number(i.tax) || 0,
      lineTotal: lineTotal
    };
  });

  const printSummary = {
    subtotalQty: items.reduce((s, it) => s + (Number(it.qty) || 0), 0),
    subtotalTaxable: Number(taxableAmount) || 0,
    subtotalTax: Number(totalTax) || 0,
    totalAmount: Number(grandTotal) || 0,
    amountInWords: ''
  };

  const printInvoiceMeta = {
    invoiceNumber,
    invoiceDate,
    dueDate,
    placeOfSupply: ''
  };

  const printBillTo = selectedCustomer ? {
    name: selectedCustomer.name,
    address: selectedCustomer.addressLine ? [selectedCustomer.addressLine] : [],
    city: selectedCustomer.city || '',
    district: selectedCustomer.city || '',
    state: selectedCustomer.state || '',
    pincode: selectedCustomer.postalCode || '',
    gstin: selectedCustomer.gstNumber || ''
  } : {};

  // Compute print scale: shrink slightly when there are many items so it fits on one page
  const computePrintScale = () => {
    const count = items.length || 0;
    if (count <= 8) return 1;
    const extra = count - 8;
    // reduce by ~3.5% per extra row, clamp at 0.72 (minimum scale)
    const scale = Math.max(0.72, 1 - extra * 0.035);
    return scale;
  };

  const printScale = computePrintScale();


  // Format currency
  const formatCurrency = (value) => {
    return '₹' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Save invoice to server and return success
  const handleSave = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return false;
    }
    if (items.length === 0) {
      alert('Add at least one item before saving');
      return false;
    }

    setIsSaving(true);

    try {
      const payload = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        customer: {
          partyId: selectedCustomer.partyId || '',
          name: selectedCustomer.name,
          phone: selectedCustomer.phone || '',
          gstNumber: selectedCustomer.gstNumber || '',
          addressLine: selectedCustomer.addressLine || ''
        },
        items: items.map(i => ({
          itemId: i.id || i.itemId || '',
          name: i.name || '',
          hsn: i.hsn || '',
          quantity: Number(i.qty) || 0,
          unit: i.unit || 'PCS',
          price: Number(i.price) || Number(i.rate) || 0,
          discount: Number(i.discount) || 0,
          tax: Number(i.tax) || 0,
          amount: Number(i.amount) || 0
        })),

        subtotal,
        totalDiscount,
        taxableAmount,
        totalTax,
        additionalCharges,
        grandTotal,
        notes
      };

      const res = await fetch(`${API}/api/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to save invoice');
        setIsSaving(false);
        return false;
      }

      const d = await res.json();
      setSavedBill(d.bill || null);
      setIsSaving(false);
      alert('Invoice saved successfully!');
      return true;
    } catch (err) {
      console.error('Save error', err);
      alert('Failed to save invoice');
      setIsSaving(false);
      return false;
    }
  };

  // Save and print the invoice
  const handlePrint = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (items.length === 0) {
      alert('Add at least one item before printing');
      return;
    }

    // Show print view
    setShowPrintView(true);
    
    // Wait for the component to render, then trigger print dialog
    setTimeout(() => {
      window.print();
      // Hide print view after printing
      setTimeout(() => setShowPrintView(false), 100);
    }, 300);
  };

  return (
    <div className="sales-invoice-page">
      <div className="invoice-container">
        {/* Header */}
        <div className="invoice-header">
          <h1>Sales Invoice</h1>
          <div className="header-actions">
            <button className="btn-save" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Invoice'}</button>
            <button className="btn-print" onClick={handlePrint} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save & Print'}</button>
          </div>
        </div>

        {savedBill && (
          <div className="saved-message" style={{ margin: '12px 0', padding: '10px', background: '#ecfeff', border: '1px solid #67e8f9', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>Invoice saved: <strong>{savedBill.invoiceNumber}</strong></div>
            <div>
              <a href={`/api/bills/${encodeURIComponent(savedBill.invoiceNumber)}/pdf`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '6px 10px' }}>View PDF</a>
            </div>
            <div>
              <a href="/bills" className="btn" style={{ padding: '6px 10px' }}>View All Bills</a>
            </div>
          </div>
        )}

        {/* Invoice Info */}
        <div className="invoice-info">
          <div className="info-group">
            <label>Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-0001"
              readOnly
              style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
            />
          </div>
          <div className="info-group">
            <label>Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className="info-group">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Customer Selection */}
        <div className="customer-section">
          <label>Select Customer</label>
          {!selectedCustomer ? (
            <div className="customer-search">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search customer..."
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="customer-dropdown">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.partyId}
                      className="customer-item"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerDropdown(false);
                        setCustomerSearch('');
                      }}
                    >
                      <strong>{customer.name}</strong>
                      {customer.phone && <span>{customer.phone}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="selected-customer">
              <div className="customer-details">
                <strong>{selectedCustomer.name}</strong>
                <span>{selectedCustomer.phone}</span>
                {selectedCustomer.gstNumber && <span className="gst">GST: {selectedCustomer.gstNumber}</span>}
                {selectedCustomer.addressLine && <span>{selectedCustomer.addressLine}</span>}
              </div>
              <button
                className="btn-change"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                }}
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="items-section">
          <h3>Items</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>NO</th>
                <th style={{ width: '300px' }}>ITEM NAME</th>
                <th style={{ width: '120px' }}>HSN/SAC</th>
                <th style={{ width: '100px' }}>QTY</th>
                <th style={{ width: '120px' }}>PRICE (₹)</th>
                <th style={{ width: '100px' }}>DISCOUNT %</th>
                <th style={{ width: '100px' }}>TAX %</th>
                <th style={{ width: '140px' }}>AMOUNT (₹)</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    No items added. Click "+ Add Item" to get started.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Enter item name"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                        placeholder="HSN"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.tax}
                        onChange={(e) => handleItemChange(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                    </td>
                    <td className="text-right">
                      <strong>{formatCurrency(item.amount)}</strong>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn-delete"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <button className="btn-add-item" onClick={handleAddItem}>
            + Add Item
          </button>
        </div>

        {/* Summary Section */}
        <div className="summary-section">
          <div className="notes-area">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for customer..."
              rows="6"
            />
          </div>

          <div className="totals-area">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="total-row">
              <span>Discount:</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
            <div className="total-row">
              <span>Taxable Amount:</span>
              <span>{formatCurrency(taxableAmount)}</span>
            </div>
            <div className="total-row">
              <span>Tax (CGST + SGST):</span>
              <span>{formatCurrency(totalTax)}</span>
            </div>
            <div className="total-row">
              <span>Additional Charges:</span>
              <input
                type="number"
                value={additionalCharges}
                onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="charges-input"
              />
            </div>
            <div className="total-row grand-total">
              <span>Grand Total:</span>
              <strong>{formatCurrency(grandTotal)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden printable invoice (print-only) */}
      {showPrintView && (
        <div className="print-section" style={{ display: 'none' }}>
          <InvoicePrint
            invoice={printInvoiceMeta}
            billTo={printBillTo}
            items={printItems}
            summary={printSummary}
            printScale={printScale}
          />
        </div>
      )}
      
      {/* Item Selection Modal */}
      <ItemSelectionModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onAddItems={handleAddItemsFromModal}
      />
    </div>
  );
};

export default SalesInvoice;
