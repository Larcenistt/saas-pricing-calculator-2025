/**
 * Email Manager Utility
 * Helps manage and export captured emails
 */

// Get all captured emails
export const getCapturedEmails = () => {
  try {
    const emails = localStorage.getItem('captured_emails');
    return emails ? JSON.parse(emails) : [];
  } catch (error) {
    console.error('Error getting emails:', error);
    return [];
  }
};

// Export emails as CSV
export const exportEmailsAsCSV = () => {
  const emails = getCapturedEmails();
  
  if (emails.length === 0) {
    console.log('No emails to export');
    return;
  }
  
  // Create CSV content
  const csvContent = [
    'Email,Date Captured',
    ...emails.map(entry => `${entry.email},${new Date(entry.date).toLocaleString()}`)
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `captured-emails-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  console.log(`Exported ${emails.length} emails`);
};

// Get email stats
export const getEmailStats = () => {
  const emails = getCapturedEmails();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEmails = emails.filter(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  
  return {
    total: emails.length,
    today: todayEmails.length,
    thisWeek: emails.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length
  };
};

// Clear all emails (use with caution)
export const clearAllEmails = () => {
  // This should be called with a confirmation from the UI layer
  // The confirmation should be handled by the component using a modal or toast
  localStorage.removeItem('captured_emails');
  console.log('All emails cleared');
  return true;
};

// Add these functions to window for easy console access
if (typeof window !== 'undefined') {
  window.emailManager = {
    getEmails: getCapturedEmails,
    exportCSV: exportEmailsAsCSV,
    getStats: getEmailStats,
    clear: clearAllEmails
  };
  
  // Only log in development
  if (import.meta.env.DEV) {
    console.log('Email Manager loaded. Use window.emailManager to access functions.');
  }
}