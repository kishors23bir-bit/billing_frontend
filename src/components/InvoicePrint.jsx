import React from 'react';
import logo from '../image/logo.png';
import './InvoicePrint.css';

const InvoicePrint = ({
  company = {},
  invoice = {},
  billTo = {},
  shipTo = {},
  items = [],
  summary = {},
  bankDetails = {},
  authorisedSignatoryName = 'Authorized Signatory',
  printScale = undefined
}) => {
  // Default company data
  const defaultCompany = {
    name: 'SEVVEL GARMENTS',
    addressLines: ['8/A Suppanur Papampalayam Post'],
    city: 'TIRUPPUR',
    state: 'Tamil Nadu',
    pincode: '638752',
    phone: '9600818418',
    gstin: '33GNIPK9601N1ZJ',
    pan: 'GNIPK9601N',
    ...company
  };

  // Default invoice data
  const defaultInvoice = {
    invoiceNumber: 'INV-0001',
    invoiceDate: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    placeOfSupply: 'Tamil Nadu',
    ...invoice
  };

  // Default bill to
  const defaultBillTo = {
    name: 'Customer Name',
    address: ['Address Line 1', 'Address Line 2'],
    city: 'City',
    district: 'District',
    state: 'State',
    pincode: '000000',
    gstin: '',
    pan: '',
    ...billTo
  };

  // Default ship to
  const defaultShipTo = {
    name: 'Customer Name',
    address: ['Address Line 1', 'Address Line 2'],
    city: 'City',
    district: 'District',
    state: 'State',
    pincode: '000000',
    ...shipTo
  };

  // Default summary
  const defaultSummary = {
    subtotalQty: 0,
    subtotalTaxable: 0,
    subtotalTax: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 0,
    receivedAmount: 0,
    amountInWords: 'Zero Rupees Only',
    ...summary
  };

  // Normalize summary keys: the caller may pass a different shape (e.g. `total` / `taxableAmount`),
  // so map common alternative names to the keys used by this template.
  const subtotalQty = defaultSummary.subtotalQty ?? defaultSummary.subtotal ?? 0;
  const subtotalTaxable = defaultSummary.subtotalTaxable ?? defaultSummary.taxableAmount ?? defaultSummary.taxableValue ?? 0;
  const subtotalTax = defaultSummary.subtotalTax ?? defaultSummary.taxAmount ?? defaultSummary.subtotalTax ?? 0;
  const taxAmount = defaultSummary.taxAmount ?? subtotalTax;
  const cgst = defaultSummary.cgst ?? ((typeof taxAmount === 'number') ? taxAmount / 2 : 0);
  const sgst = defaultSummary.sgst ?? ((typeof taxAmount === 'number') ? taxAmount / 2 : 0);
  const igst = defaultSummary.igst ?? 0;
  const totalAmount = defaultSummary.totalAmount ?? defaultSummary.total ?? 0;
  const receivedAmount = defaultSummary.receivedAmount ?? 0;
  const amountInWords = defaultSummary.amountInWords ?? defaultSummary.amountInWords ?? 'Zero Rupees Only';
  const roundOff = defaultSummary.roundOff ?? 0;

  // Default bank details
  const defaultBankDetails = {
    accountName: 'Account Holder Name',
    ifsc: 'IFSC CODE',
    accountNumber: '1234567890',
    bankName: 'Bank Name',
    branch: 'Branch Name',
    ...bankDetails
  };

  // Format currency
  const formatCurrency = (value) => {
    return '₹' + (parseFloat(value) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="invoice-wrapper">
      <div className="invoice-container" style={typeof printScale === 'number' ? { transform: `scale(${printScale})`, transformOrigin: 'top left' } : undefined}>
        {/* HEADER SECTION */}
        <div className="invoice-header">
          <div className="company-logo">
            <img src={logo} alt="Company Logo" />
          </div>
          <div className="company-info">
            <h1>{defaultCompany.name}</h1>
            {defaultCompany.addressLines && defaultCompany.addressLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
            <p>{defaultCompany.city}, {defaultCompany.state} - {defaultCompany.pincode}</p>
            <p>Mobile: {defaultCompany.phone}</p>
            <p>GSTIN: {defaultCompany.gstin} | PAN: {defaultCompany.pan}</p>
          </div>
        </div>

        {/* INVOICE TITLE */}
        <div className="invoice-title">
          <h2>TAX INVOICE</h2>
        </div>

        {/* INVOICE DETAILS GRID */}
        <div className="invoice-details-grid">
          <div>
            <div className="info-row">
              <span className="label">Invoice No.:</span>
              <span className="value">{defaultInvoice.invoiceNumber}</span>
            </div>
            <div className="info-row">
              <span className="label">Invoice Date:</span>
              <span className="value">{defaultInvoice.invoiceDate}</span>
            </div>
          </div>
          <div>
            <div className="info-row">
              <span className="label">Due Date:</span>
              <span className="value">{defaultInvoice.dueDate}</span>
            </div>
            <div className="info-row">
              <span className="label">Place of Supply:</span>
              <span className="value">{defaultInvoice.placeOfSupply}</span>
            </div>
          </div>
        </div>

        {/* BILL TO / SHIP TO SECTION */}
        <div className="billing-section">
          <div className="bill-to">
            <h3>BILL TO</h3>
            <p><strong>{defaultBillTo.name}</strong></p>
            {Array.isArray(defaultBillTo.address) && defaultBillTo.address.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
            <p>{defaultBillTo.city}, {defaultBillTo.district}, {defaultBillTo.state} - {defaultBillTo.pincode}</p>
            {defaultBillTo.gstin && <p><strong>GSTIN:</strong> {defaultBillTo.gstin}</p>}
            {defaultBillTo.pan && <p><strong>PAN:</strong> {defaultBillTo.pan}</p>}
          </div>

          <div className="ship-to">
            <h3>SHIP TO</h3>
            <p><strong>{defaultShipTo.name || defaultBillTo.name}</strong></p>
            {Array.isArray(defaultShipTo.address) && defaultShipTo.address.length > 0 ? (
              defaultShipTo.address.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))
            ) : (
              Array.isArray(defaultBillTo.address) && defaultBillTo.address.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))
            )}
            <p>{defaultShipTo.city || defaultBillTo.city}, {defaultShipTo.district || defaultBillTo.district}, {defaultShipTo.state || defaultBillTo.state} - {defaultShipTo.pincode || defaultBillTo.pincode}</p>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="items-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>ITEMS</th>
              <th>HSN/SAC</th>
              <th>QTY.</th>
              <th>UNIT</th>
              <th>RATE</th>
              <th>TAXABLE AMT</th>
              <th>TAX</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.description || item.name || ''}</td>
                  <td>{item.hsn || item.code || ''}</td>
                  <td>{item.quantity || 0}</td>
                  <td>{item.unit || 'PCS'}</td>
                  <td>{formatCurrency(item.rate || 0)}</td>
                  <td>{formatCurrency(item.taxableAmount || item.quantity * item.rate || 0)}</td>
                  <td>{formatCurrency(item.taxAmount || 0)} ({item.taxPercent || item.tax || 0}%)</td>
                  <td>{formatCurrency(item.lineTotal || 0)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '30px'}}>No items added</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* TOTALS AND BANK DETAILS SECTION */}
        <div className="totals-section">
          <div className="amount-words">
            <p><strong>Total Amount (in words):</strong></p>
            <p>{amountInWords}</p>
          </div>

          <div className="totals-table">
            <table>
              <tbody>
                <tr>
                  <td>Taxable Amount</td>
                  <td>{formatCurrency(subtotalTaxable || 0)}</td>
                </tr>
                <tr>
                  <td>CGST</td>
                  <td>{formatCurrency(cgst || 0)}</td>
                </tr>
                <tr>
                  <td>SGST</td>
                  <td>{formatCurrency(sgst || 0)}</td>
                </tr>
                <tr>
                  <td>IGST</td>
                  <td>{formatCurrency(igst || 0)}</td>
                </tr>
                {roundOff !== 0 && (
                  <tr>
                    <td>Round Off</td>
                    <td>{formatCurrency(roundOff)}</td>
                  </tr>
                )}
                <tr className="grand-total">
                  <td>Total Amount</td>
                  <td>{formatCurrency(totalAmount || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BANK DETAILS */}
        <div className="bank-details">
          <h3>BANK DETAILS</h3>
          <div className="bank-info">
            <p><strong>Account Name:</strong> {defaultBankDetails.accountName}</p>
            <p><strong>Account Number:</strong> {defaultBankDetails.accountNumber}</p>
            <p><strong>IFSC Code:</strong> {defaultBankDetails.ifsc}</p>
            <p><strong>Bank Name:</strong> {defaultBankDetails.bankName}</p>
            <p><strong>Branch:</strong> {defaultBankDetails.branch}</p>
          </div>
        </div>

        {/* TERMS SECTION (Optional) */}
        <div className="terms-section">
          <h3>TERMS & CONDITIONS</h3>
          <ol>
            <li>Goods once sold will not be taken back or exchanged</li>
            <li>All disputes are subject to jurisdiction only</li>
            <li>Payment should be made within the due date</li>
          </ol>
        </div>

        {/* FOOTER SECTION */}
        <div className="invoice-footer">
          <div className="footer-left">
            <p>TAX INVOICE – ORIGINAL FOR RECIPIENT</p>
          </div>
          <div className="footer-right">
            <p>For <strong>{defaultCompany.name}</strong></p>
            <p style={{marginTop: '40px'}}>_____________________</p>
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
