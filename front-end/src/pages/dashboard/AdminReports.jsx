import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../../config/api';
import './admin-reports.css';

export default function AdminReports({ allTickets: initialTickets = [] }) {
  const [allTickets, setAllTickets] = useState(initialTickets);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [summaryData, setSummaryData] = useState([]);

  useEffect(() => {
    if (initialTickets.length === 0) {
      apiFetch('/tickets').then(data => {
        if (data) setAllTickets(data);
      }).catch(err => console.error("Failed to load tickets for reports", err));
    }
  }, [initialTickets]);

  const handleGenerateReport = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Filter tickets by date range
    const matchingTickets = allTickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate >= start && ticketDate <= end;
    });

    // Fallback mock array if no props passed for preview testing
    const ticketsToProcess = matchingTickets;

    // 2. Generate Summary Data (Group by category, count, sort descending highest to lowest)
    const summaryCounts = ticketsToProcess.reduce((acc, ticket) => {
      const cat = ticket.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const sortedSummary = Object.entries(summaryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    setFilteredTickets(ticketsToProcess);
    setSummaryData(sortedSummary);
    setIsReportGenerated(true);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // PDF Header Banner
      doc.setFillColor(6, 71, 50);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Tatua Sasa Admin", 14, 20);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Organization-Wide System Analytics & Issue Report", 14, 30);
      
      // Meta Info
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(10);
      doc.text(`Reporting Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 14, 50);
      doc.text(`Total Tracked Issues: ${filteredTickets.length}`, 14, 56);

      let finalY = 70;

      // 1. Summary Table (Highest to Lowest)
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(6, 71, 50);
      doc.text("Issue Summary Overview (Highest to Lowest)", 14, finalY);

      const summaryCols = ["Category", "Total Occurrences"];
      const summaryRows = summaryData.map(item => [
        item.category.replace('_', ' ').toUpperCase(),
        item.count
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [summaryCols],
        body: summaryRows,
        headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85] },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 5 },
      });

      finalY = doc.lastAutoTable.finalY + 15;

      // 2. Detailed Issue Log Table (Auto handles multi-page if data is large)
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(6, 71, 50);
      doc.text("Detailed Issue Log", 14, finalY);

      const logCols = ["Date Raised", "Category", "Subject / Title"];
      const logRows = filteredTickets.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        (t.category || 'N/A').replace('_', ' '),
        t.title || 'Untitled Issue'
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [logCols],
        body: logRows,
        headStyles: { fillColor: [6, 71, 50], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [244, 247, 246] },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      });

      doc.save(`Tatua_Sasa_Admin_Report_${startDate}_to_${endDate}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to compile PDF report.");
    }
  };

  return (
    <div className="admin-reports-container">
      {!isReportGenerated ? (
        <div className="admin-report-selection">
          <h2>Select duration to generate organization-wide report:</h2>
          
          <form className="admin-date-form" onSubmit={handleGenerateReport}>
            <div className="admin-date-inputs">
              <div className="admin-date-group">
                <label htmlFor="startDate">Start Date</label>
                <input 
                  type="date" 
                  id="startDate" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  required 
                />
              </div>
              <div className="admin-date-group">
                <label htmlFor="endDate">End Date</label>
                <input 
                  type="date" 
                  id="endDate" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="primary-btn" style={{ marginTop: '10px' }}>
              Generate Report Document
            </button>
          </form>
        </div>
      ) : (
        <div className="admin-doc-view-container">
          <div className="admin-doc-header-actions">
            <button className="admin-back-btn" onClick={() => setIsReportGenerated(false)}>
              &larr; Back to Date Selection
            </button>
          </div>

          <div className="admin-report-document">
            <div className="admin-doc-navbar">
              <h1>Tatua Sasa</h1>
              <div className="admin-doc-dates">
                Period: {new Date(startDate).toLocaleDateString()} &mdash; {new Date(endDate).toLocaleDateString()}
              </div>
            </div>

            {/* Summary Table View */}
            <h3 className="admin-doc-section-title">Issue Summary (Highest to Lowest Occurrences)</h3>
            <table className="admin-doc-table" style={{ maxWidth: '450px', marginBottom: '30px' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Occurrences</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textTransform: 'capitalize' }}>{item.category.replace('_', ' ')}</td>
                    <td><strong>{item.count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Detailed Log Table View */}
            <h3 className="admin-doc-section-title">Detailed Issue Log</h3>
            <table className="admin-doc-table">
              <thead>
                <tr>
                  <th>Date Raised</th>
                  <th>Category</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{(ticket.category || '').replace('_', ' ')}</td>
                    <td>{ticket.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="admin-download-pdf-btn" onClick={handleDownloadPDF}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF Report
          </button>
        </div>
      )}
    </div>
  );
}