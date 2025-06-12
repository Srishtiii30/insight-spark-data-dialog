import Papa from 'papaparse';

export interface DataRow {
  [key: string]: any;
}

export interface DataStats {
  totalRows: number;
  totalColumns: number;
  numericColumns: string[];
  textColumns: string[];
  dateColumns: string[];
}

export interface QueryResult {
  data: DataRow[];
  sql: string;
  error?: string;
}

export const parseCSV = (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message));
        } else {
          const cleanData = results.data.map((row: any) => {
            const cleanRow: DataRow = {};
            Object.keys(row).forEach(key => {
              const cleanKey = key.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
              cleanRow[cleanKey] = row[key];
            });
            return cleanRow;
          });
          resolve(cleanData);
        }
      },
      error: (error) => reject(error)
    });
  });
};

export const parseJSON = (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        let data: DataRow[];
        
        if (Array.isArray(jsonData)) {
          data = jsonData;
        } else if (typeof jsonData === 'object') {
          data = [jsonData];
        } else {
          throw new Error('Invalid JSON format');
        }
        
        const cleanData = data.map(row => {
          const cleanRow: DataRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
            cleanRow[cleanKey] = row[key];
          });
          return cleanRow;
        });
        
        resolve(cleanData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const analyzeData = (data: DataRow[]): DataStats => {
  if (data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      numericColumns: [],
      textColumns: [],
      dateColumns: []
    };
  }

  const columns = Object.keys(data[0]);
  const numericColumns: string[] = [];
  const textColumns: string[] = [];
  const dateColumns: string[] = [];

  columns.forEach(column => {
    const values = data.slice(0, 100).map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
    
    if (values.length === 0) {
      textColumns.push(column);
      return;
    }

    // Check if numeric
    const numericValues = values.filter(val => !isNaN(Number(val)));
    if (numericValues.length > values.length * 0.8) {
      numericColumns.push(column);
      return;
    }

    // Check if date
    const dateValues = values.filter(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    });
    if (dateValues.length > values.length * 0.8) {
      dateColumns.push(column);
      return;
    }

    textColumns.push(column);
  });

  return {
    totalRows: data.length,
    totalColumns: columns.length,
    numericColumns,
    textColumns,
    dateColumns
  };
};

export const executeSimpleQuery = (data: DataRow[], query: string): QueryResult => {
  try {
    const lowerQuery = query.toLowerCase().trim();
    let result: DataRow[] = [...data];
    
    // Simple query patterns
    if (lowerQuery.includes('top') || lowerQuery.includes('first')) {
      const match = lowerQuery.match(/(?:top|first)\s+(\d+)/);
      const limit = match ? parseInt(match[1]) : 10;
      result = data.slice(0, limit);
    }
    
    if (lowerQuery.includes('last')) {
      const match = lowerQuery.match(/last\s+(\d+)/);
      const limit = match ? parseInt(match[1]) : 10;
      result = data.slice(-limit);
    }
    
    if (lowerQuery.includes('where') || lowerQuery.includes('filter')) {
      // Simple filtering (this is a simplified version)
      const columns = Object.keys(data[0] || {});
      for (const column of columns) {
        if (lowerQuery.includes(column)) {
          result = result.filter(row => 
            String(row[column]).toLowerCase().includes(column)
          );
          break;
        }
      }
    }
    
    if (lowerQuery.includes('group by') || lowerQuery.includes('count')) {
      // Simple grouping
      const columns = Object.keys(data[0] || {});
      const groupColumn = columns.find(col => lowerQuery.includes(col));
      
      if (groupColumn) {
        const grouped = result.reduce((acc: { [key: string]: number }, row) => {
          const key = String(row[groupColumn]);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        
        result = Object.entries(grouped).map(([key, count]) => ({
          [groupColumn]: key,
          count: count
        }));
      }
    }
    
    if (lowerQuery.includes('average') || lowerQuery.includes('avg')) {
      const stats = analyzeData(data);
      const numericCol = stats.numericColumns[0];
      
      if (numericCol) {
        const sum = data.reduce((acc, row) => acc + (Number(row[numericCol]) || 0), 0);
        const avg = sum / data.length;
        result = [{ [`average_${numericCol}`]: avg.toFixed(2) }];
      }
    }
    
    if (lowerQuery.includes('sum') || lowerQuery.includes('total')) {
      const stats = analyzeData(data);
      const numericCol = stats.numericColumns[0];
      
      if (numericCol) {
        const sum = data.reduce((acc, row) => acc + (Number(row[numericCol]) || 0), 0);
        result = [{ [`total_${numericCol}`]: sum }];
      }
    }
    
    // Generate a simple SQL representation
    let sql = 'SELECT ';
    if (lowerQuery.includes('count') || lowerQuery.includes('group by')) {
      sql += '*, COUNT(*) as count FROM data';
    } else if (lowerQuery.includes('average')) {
      const stats = analyzeData(data);
      const numericCol = stats.numericColumns[0];
      sql += `AVG(${numericCol}) as average_${numericCol} FROM data`;
    } else if (lowerQuery.includes('sum')) {
      const stats = analyzeData(data);
      const numericCol = stats.numericColumns[0];
      sql += `SUM(${numericCol}) as total_${numericCol} FROM data`;
    } else {
      sql += '* FROM data';
    }
    
    if (lowerQuery.includes('top') || lowerQuery.includes('first')) {
      const match = lowerQuery.match(/(?:top|first)\s+(\d+)/);
      const limit = match ? parseInt(match[1]) : 10;
      sql += ` LIMIT ${limit}`;
    }
    
    return {
      data: result,
      sql: sql
    };
    
  } catch (error) {
    return {
      data: [],
      sql: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const exportToCSV = (data: DataRow[], filename: string = 'export.csv'): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateSampleData = (): DataRow[] => {
  return [
    { product_name: 'Laptop', category: 'Electronics', price: 999, sales: 50, region: 'North' },
    { product_name: 'Mouse', category: 'Accessories', price: 25, sales: 200, region: 'South' },
    { product_name: 'Keyboard', category: 'Accessories', price: 75, sales: 150, region: 'East' },
    { product_name: 'Monitor', category: 'Electronics', price: 299, sales: 75, region: 'West' },
    { product_name: 'Headphones', category: 'Audio', price: 150, sales: 120, region: 'North' },
    { product_name: 'Laptop Pro', category: 'Electronics', price: 1299, sales: 45, region: 'South' },
    { product_name: 'Wireless Mouse', category: 'Accessories', price: 35, sales: 180, region: 'East' },
    { product_name: 'Mechanical Keyboard', category: 'Accessories', price: 125, sales: 90, region: 'West' },
    { product_name: '4K Monitor', category: 'Electronics', price: 450, sales: 60, region: 'North' },
    { product_name: 'Bluetooth Headphones', category: 'Audio', price: 200, sales: 110, region: 'South' },
    { product_name: 'Gaming Laptop', category: 'Electronics', price: 1599, sales: 30, region: 'East' },
    { product_name: 'USB Mouse', category: 'Accessories', price: 15, sales: 250, region: 'West' },
    { product_name: 'Ergonomic Keyboard', category: 'Accessories', price: 85, sales: 140, region: 'North' },
    { product_name: 'Ultrawide Monitor', category: 'Electronics', price: 599, sales: 40, region: 'South' },
    { product_name: 'Noise Cancelling Headphones', category: 'Audio', price: 299, sales: 80, region: 'East' },
    { product_name: 'MacBook', category: 'Electronics', price: 1499, sales: 65, region: 'West' },
    { product_name: 'Trackpad', category: 'Accessories', price: 149, sales: 70, region: 'North' },
    { product_name: 'Wireless Keyboard', category: 'Accessories', price: 95, sales: 130, region: 'South' },
    { product_name: 'Gaming Monitor', category: 'Electronics', price: 399, sales: 85, region: 'East' },
    { product_name: 'Earbuds', category: 'Audio', price: 99, sales: 190, region: 'West' }
  ];
};