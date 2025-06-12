import React from 'react';
import { 
  Accordion, 
  AccordionItem, 
  Button, 
  Tile, 
  Tag 
} from '@carbon/react';
import { 
  TrashCan, 
  Download, 
  Time,
  Code
} from '@carbon/icons-react';
import { formatDistanceToNow } from 'date-fns';

export interface QueryHistoryItem {
  id: string;
  query: string;
  sql: string;
  timestamp: Date;
  resultCount: number;
  error?: string;
}

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onClearHistory: () => void;
  onRerunQuery: (query: string) => void;
  onExportHistory: () => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  onClearHistory,
  onRerunQuery,
  onExportHistory
}) => {
  if (history.length === 0) {
    return (
      <Tile className="text-center py-8">
        <Time size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="font-medium text-gray-600 mb-2">No Query History</h3>
        <p className="text-gray-500">Your executed queries will appear here.</p>
      </Tile>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Time size={20} />
          Query History ({history.length})
        </h2>
        <div className="flex gap-2">
          <Button
            kind="secondary"
            size="sm"
            renderIcon={Download}
            onClick={onExportHistory}
          >
            Export
          </Button>
          <Button
            kind="danger--ghost"
            size="sm"
            renderIcon={TrashCan}
            onClick={onClearHistory}
          >
            Clear All
          </Button>
        </div>
      </div>

      <Accordion align="start">
        {history.slice().reverse().map((item, index) => (
          <AccordionItem
            key={item.id}
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex-1">
                  <div className="font-medium truncate max-w-md">
                    {item.query}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {item.error ? (
                    <Tag type="red" size="sm">Error</Tag>
                  ) : (
                    <Tag type="green" size="sm">{item.resultCount} rows</Tag>
                  )}
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Code size={16} />
                  Generated SQL:
                </h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  <code>{item.sql}</code>
                </pre>
              </div>

              {item.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-medium text-red-800 mb-1">Error:</h4>
                  <p className="text-red-700 text-sm">{item.error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  kind="primary"
                  size="sm"
                  onClick={() => onRerunQuery(item.query)}
                >
                  Run Again
                </Button>
                <Button
                  kind="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(item.sql);
                  }}
                >
                  Copy SQL
                </Button>
              </div>
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default QueryHistory;