
/**
 * Helper function to convert data to a CSV file and trigger a download
 * @param data Array of objects to convert to CSV
 * @param filename Name of the file to download
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string
): void => {
  if (!data.length) return;
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => {
      return headers.map(header => {
        const cellValue = row[header];
        // Handle special cases like nulls, objects, etc.
        if (cellValue === null || cellValue === undefined) return '';
        if (typeof cellValue === 'object') return JSON.stringify(cellValue);
        // Escape commas by wrapping in quotes
        return typeof cellValue === 'string' && cellValue.includes(',') 
          ? `"${cellValue}"`
          : String(cellValue);
      }).join(',');
    })
  ];
  
  // Create a Blob with the CSV content
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
