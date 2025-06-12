import React, { useState } from 'react';
import { 
  TextInput, 
  Button, 
  Tile, 
  Tag,
  ExpandableSearch,
  InlineLoading
} from '@carbon/react';
import { 
  Send, 
  Search, 
  Help,
  ChartLineSmooth,
  DataTable as DataTableIcon
} from '@carbon/icons-react';
import { DataRow, executeSimpleQuery, QueryResult } from '@/utils/dataProcessor';

interface QueryInterfaceProps {
  data: DataRow[];
  onQueryResult: (result: QueryResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const QueryInterface: React.FC<QueryInterfaceProps> = ({ 
  data, 
  onQueryResult, 
  isLoading, 
  setIsLoading 
}) => {
  const [query, setQuery] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const exampleQueries = [
    'Show me the top 10 records by price',
    'What is the average sales by region?',
    'Count how many items are in each category',
    'Show the first 5 products',
    'Sum the total sales',
    'Group by category and count',
    'Show products with highest sales'
  ];

  const handleSubmitQuery = async () => {
    if (!query.trim() || data.length === 0 || isLoading) return;

    setIsLoading(true);
    
    try {
      const result = executeSimpleQuery(data, query);
      onQueryResult(result);
    } catch (error) {
      onQueryResult({
        data: [],
        sql: '',
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowExamples(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuery();
    }
  };

  return (
    <div className="query-section">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Search size={20} />
          Ask Your Data
        </h2>
        <p className="text-gray-600">
          Ask questions about your data in plain English. The system will generate SQL queries and show results.
        </p>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <TextInput
              id="query-input"
              labelText=""
              placeholder="e.g., 'Show me the top 5 products by sales' or 'What is the average price by category?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || data.length === 0}
              size="lg"
            />
          </div>
          <Button
            kind="primary"
            size="lg"
            disabled={!query.trim() || data.length === 0 || isLoading}
            onClick={handleSubmitQuery}
            renderIcon={Send}
          >
            {isLoading ? <InlineLoading description="Processing..." /> : 'Ask'}
          </Button>
        </div>
        
        <div className="flex gap-2 items-center text-sm text-gray-600">
          <Help size={16} />
          <span>Press Enter to submit your query</span>
        </div>
      </div>

      <div className="mb-4">
        <Button
          kind="ghost"
          size="sm"
          onClick={() => setShowExamples(!showExamples)}
          renderIcon={ChartLineSmooth}
        >
          {showExamples ? 'Hide' : 'Show'} Example Questions
        </Button>
      </div>

      {showExamples && (
        <Tile className="mb-4">
          <h3 className="font-medium mb-3">💡 Try these example questions:</h3>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <Tag
                key={index}
                type="blue"
                className="cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Tag>
            ))}
          </div>
        </Tile>
      )}

      {data.length === 0 && (
        <Tile className="text-center py-8">
          <DataTableIcon size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="font-medium text-gray-600 mb-2">No Data Loaded</h3>
          <p className="text-gray-500">Upload a CSV or JSON file to start asking questions about your data.</p>
        </Tile>
      )}
    </div>
  );
};

export default QueryInterface;