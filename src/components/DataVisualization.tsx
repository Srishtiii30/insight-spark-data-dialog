import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import { 
  Select, 
  SelectItem, 
  Tile, 
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from '@carbon/react';
import { Download, ChartBar, ChartLine, ChartPie } from '@carbon/icons-react';
import { DataRow } from '@/utils/dataProcessor';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

interface DataVisualizationProps {
  data: DataRow[];
  query: string;
  sql: string;
}

type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'radar';

const DataVisualization: React.FC<DataVisualizationProps> = ({ data, query, sql }) => {
  const [chartType, setChartType] = React.useState<ChartType>('table');
  const chartRef = useRef(null);

  useEffect(() => {
    // Auto-select appropriate chart type based on data and query
    if (data.length === 0) {
      setChartType('table');
      return;
    }

    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      data.every(row => !isNaN(Number(row[col])) && row[col] !== '')
    );

    const queryLower = query.toLowerCase();

    if (queryLower.includes('trend') || queryLower.includes('over time')) {
      setChartType('line');
    } else if (queryLower.includes('count') || queryLower.includes('group')) {
      setChartType('bar');
    } else if (queryLower.includes('distribution') && numericColumns.length > 0) {
      setChartType('pie');
    } else if (columns.length > 2 && numericColumns.length >= 2) {
      setChartType('bar');
    } else {
      setChartType('table');
    }
  }, [data, query]);

  const generateChartData = () => {
    if (data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      data.slice(0, 10).every(row => !isNaN(Number(row[col])) && row[col] !== '')
    );
    const textColumns = columns.filter(col => !numericColumns.includes(col));

    const labels = data.map((row, index) => {
      const labelCol = textColumns[0] || columns[0];
      return String(row[labelCol] || `Row ${index + 1}`);
    });

    const colors = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];

    if (chartType === 'pie') {
      const valueCol = numericColumns[0] || columns[1];
      return {
        labels: labels.slice(0, 10),
        datasets: [{
          data: data.slice(0, 10).map(row => Number(row[valueCol]) || 0),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      };
    }

    if (chartType === 'radar') {
      const numCols = numericColumns.slice(0, 6);
      return {
        labels: numCols,
        datasets: [{
          label: 'Values',
          data: numCols.map(col => {
            const avg = data.reduce((sum, row) => sum + (Number(row[col]) || 0), 0) / data.length;
            return avg;
          }),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        }]
      };
    }

    // Bar and Line charts
    const datasets = numericColumns.slice(0, 3).map((col, index) => ({
      label: col,
      data: data.map(row => Number(row[col]) || 0),
      backgroundColor: colors[index],
      borderColor: colors[index].replace('0.8', '1'),
      borderWidth: 1,
      tension: 0.4
    }));

    return {
      labels: labels.slice(0, 20),
      datasets: datasets
    };
  };

  const chartData = generateChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Data Visualization - ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}`
      },
    },
    scales: chartType !== 'pie' && chartType !== 'radar' ? {
      y: {
        beginAtZero: true,
      },
    } : undefined,
  };

  const exportChart = () => {
    if (chartRef.current) {
      const chart = chartRef.current as any;
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = url;
      link.click();
    }
  };

  const renderChart = () => {
    if (!chartData || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No data available for visualization</p>
        </div>
      );
    }

    const chartProps = {
      ref: chartRef,
      data: chartData,
      options: chartOptions,
      height: 400
    };

    switch (chartType) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'radar':
        return <Radar {...chartProps} />;
      default:
        return null;
    }
  };

  const tableHeaders = data.length > 0 ? Object.keys(data[0]).map(key => ({
    key,
    header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })) : [];

  const tableRows = data.map((row, index) => ({
    id: index.toString(),
    ...row
  }));

  return (
    <div className="results-section">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Results & Visualization</h2>
        <div className="flex gap-2">
          <Select
            id="chart-type"
            labelText=""
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
          >
            <SelectItem value="table" text="Data Table" />
            <SelectItem value="bar" text="Bar Chart" />
            <SelectItem value="line" text="Line Chart" />
            <SelectItem value="pie" text="Pie Chart" />
            <SelectItem value="radar" text="Radar Chart" />
          </Select>
          {chartType !== 'table' && (
            <Button
              kind="secondary"
              size="sm"
              renderIcon={Download}
              onClick={exportChart}
            >
              Export Chart
            </Button>
          )}
        </div>
      </div>

      {sql && (
        <Tile className="mb-4">
          <h3 className="font-medium mb-2">Generated SQL Query:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            <code>{sql}</code>
          </pre>
        </Tile>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Found {data.length} rows
        </p>
      </div>

      {chartType === 'table' ? (
        <TableContainer title="Query Results">
          <Table>
            <TableHead>
              <TableRow>
                {tableHeaders.map(header => (
                  <TableHeader key={header.key}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.slice(0, 100).map(row => (
                <TableRow key={row.id}>
                  {tableHeaders.map(header => (
                    <TableCell key={header.key}>
                      {String(row[header.key] || '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div className="chart-container" style={{ height: '400px' }}>
          {renderChart()}
        </div>
      )}

      {data.length > 100 && chartType === 'table' && (
        <p className="text-sm text-gray-500 mt-2">
          Showing first 100 rows. Total: {data.length} rows.
        </p>
      )}
    </div>
  );
};

export default DataVisualization;