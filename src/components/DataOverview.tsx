import React from 'react';
import { Tile, SkeletonText } from '@carbon/react';
import { DataRow, DataStats } from '@/utils/dataProcessor';

interface DataOverviewProps {
  data: DataRow[];
  stats: DataStats;
  filename: string;
  isLoading?: boolean;
}

const DataOverview: React.FC<DataOverviewProps> = ({ data, stats, filename, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Tile key={i} className="p-4">
            <SkeletonText heading />
            <SkeletonText />
          </Tile>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Rows',
      value: stats.totalRows.toLocaleString(),
      description: 'Records in dataset'
    },
    {
      label: 'Columns',
      value: stats.totalColumns.toString(),
      description: 'Data fields'
    },
    {
      label: 'Numeric Columns',
      value: stats.numericColumns.length.toString(),
      description: 'Quantitative data'
    },
    {
      label: 'Text Columns',
      value: stats.textColumns.length.toString(),
      description: 'Categorical data'
    }
  ];

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Dataset Overview</h2>
        <p className="text-gray-600">File: {filename}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Tile key={index} className="p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {metric.value}
            </div>
            <div className="font-medium text-gray-900 mb-1">
              {metric.label}
            </div>
            <div className="text-sm text-gray-500">
              {metric.description}
            </div>
          </Tile>
        ))}
      </div>
      
      {stats.numericColumns.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Numeric Columns:</h3>
          <div className="flex flex-wrap gap-2">
            {stats.numericColumns.map((col, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {stats.textColumns.length > 0 && (
        <div className="mt-2 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Text Columns:</h3>
          <div className="flex flex-wrap gap-2">
            {stats.textColumns.map((col, index) => (
              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataOverview;