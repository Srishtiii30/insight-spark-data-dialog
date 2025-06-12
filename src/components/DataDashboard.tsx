import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Column, 
  Tabs, 
  Tab, 
  TabList, 
  TabPanels, 
  TabPanel,
  Header,
  HeaderName,
  Button,
  Theme,
  Content
} from '@carbon/react';
import { 
  ChartLineData, 
  DocumentImport, 
  DataTable as DataTableIcon,
  Download,
  Analytics
} from '@carbon/icons-react';

import FileUpload from './FileUpload';
import DataOverview from './DataOverview';
import QueryInterface from './QueryInterface';
import DataVisualization from './DataVisualization';
import QueryHistory, { QueryHistoryItem } from './QueryHistory';

import { 
  DataRow, 
  DataStats, 
  analyzeData, 
  QueryResult, 
  exportToCSV, 
  generateSampleData 
} from '@/utils/dataProcessor';
import { useToast } from '@/hooks/use-toast';

const DataDashboard: React.FC = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [filename, setFilename] = useState<string>('');
  const [stats, setStats] = useState<DataStats | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  
  const { toast } = useToast();

  // Load sample data on component mount
  useEffect(() => {
    const sampleData = generateSampleData();
    handleDataLoad(sampleData, 'sample-ecommerce-data.csv');
  }, []);

  const handleDataLoad = (newData: DataRow[], newFilename: string) => {
    setData(newData);
    setFilename(newFilename);
    setStats(analyzeData(newData));
    setQueryResult(null);
    setSelectedTab(0); // Switch to overview tab
  };

  const handleQueryResult = (result: QueryResult) => {
    setQueryResult(result);
    
    // Add to history
    const historyItem: QueryHistoryItem = {
      id: Date.now().toString(),
      query: result.sql ? result.sql.split('SELECT')[0] || 'Query' : 'Unknown Query',
      sql: result.sql,
      timestamp: new Date(),
      resultCount: result.data.length,
      error: result.error
    };
    
    setQueryHistory(prev => [...prev, historyItem]);
    setSelectedTab(2); // Switch to visualization tab
  };

  const handleClearHistory = () => {
    setQueryHistory([]);
    toast({
      title: "History cleared",
      description: "Query history has been cleared."
    });
  };

  const handleRerunQuery = (query: string) => {
    // This would trigger the query interface with the previous query
    setSelectedTab(1); // Switch to query tab
    toast({
      title: "Query loaded",
      description: "Previous query has been loaded in the query interface."
    });
  };

  const handleExportHistory = () => {
    const historyData = queryHistory.map(item => ({
      query: item.query,
      sql: item.sql,
      timestamp: item.timestamp.toISOString(),
      result_count: item.resultCount,
      error: item.error || ''
    }));
    
    exportToCSV(historyData, 'query_history.csv');
    toast({
      title: "History exported",
      description: "Query history has been exported as CSV."
    });
  };

  const handleExportResults = () => {
    if (queryResult && queryResult.data.length > 0) {
      exportToCSV(queryResult.data, 'query_results.csv');
      toast({
        title: "Results exported",
        description: "Query results have been exported as CSV."
      });
    }
  };

  const handleLoadSampleData = () => {
    const sampleData = generateSampleData();
    handleDataLoad(sampleData, 'sample-ecommerce-data.csv');
    toast({
      title: "Sample data loaded",
      description: "E-commerce sample dataset has been loaded."
    });
  };

  return (
    <Theme theme="white">
      <div className="dashboard-container">
        <Header aria-label="Ask Your Data Dashboard">
          <HeaderName prefix="">
            <ChartLineData size={24} className="mr-2" />
            Ask Your Data - Natural Language Analytics
          </HeaderName>
        </Header>

        <Content>
          <div className="p-6">
            <Tabs selectedIndex={selectedTab} onChange={(e) => setSelectedTab(e.selectedIndex)}>
              <TabList aria-label="Dashboard navigation">
                <Tab>
                  <DocumentImport size={16} className="mr-2" />
                  Data Upload
                </Tab>
                <Tab disabled={data.length === 0}>
                  <Analytics size={16} className="mr-2" />
                  Ask Questions
                </Tab>
                <Tab disabled={!queryResult}>
                  <ChartLineData size={16} className="mr-2" />
                  Results & Charts
                </Tab>
                <Tab disabled={queryHistory.length === 0}>
                  <DataTableIcon size={16} className="mr-2" />
                  Query History
                </Tab>
              </TabList>

              <TabPanels>
                {/* Data Upload Tab */}
                <TabPanel>
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold mb-4">
                        🚀 Welcome to Ask Your Data!
                      </h1>
                      <p className="text-lg text-gray-600 mb-6">
                        Upload your dataset and start asking questions in natural language. 
                        Get instant insights with automatic SQL generation and beautiful visualizations.
                      </p>
                      
                      <div className="mb-6">
                        <Button
                          kind="secondary"
                          onClick={handleLoadSampleData}
                          renderIcon={ChartLineData}
                        >
                          Try with Sample E-commerce Data
                        </Button>
                      </div>
                    </div>

                    <Grid>
                      <Column sm={4} md={8} lg={12}>
                        <FileUpload
                          onDataLoad={handleDataLoad}
                          isLoading={isLoadingFile}
                          setIsLoading={setIsLoadingFile}
                        />
                      </Column>
                    </Grid>

                    {stats && data.length > 0 && (
                      <div className="mt-8">
                        <DataOverview
                          data={data}
                          stats={stats}
                          filename={filename}
                          isLoading={isLoadingFile}
                        />
                      </div>
                    )}

                    {data.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">
                          🎯 What you can ask:
                        </h3>
                        <ul className="text-blue-800 space-y-1">
                          <li>• "Show me the top 10 products by sales"</li>
                          <li>• "What is the average price by category?"</li>
                          <li>• "Count how many items are in each region"</li>
                          <li>• "Sum the total revenue"</li>
                        </ul>
                        <div className="mt-4">
                          <Button
                            kind="primary"
                            onClick={() => setSelectedTab(1)}
                          >
                            Start Asking Questions →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Query Interface Tab */}
                <TabPanel>
                  <Grid>
                    <Column sm={4} md={8} lg={12}>
                      <QueryInterface
                        data={data}
                        onQueryResult={handleQueryResult}
                        isLoading={isLoadingQuery}
                        setIsLoading={setIsLoadingQuery}
                      />
                    </Column>
                  </Grid>
                </TabPanel>

                {/* Results & Visualization Tab */}
                <TabPanel>
                  {queryResult && (
                    <Grid>
                      <Column sm={4} md={8} lg={12}>
                        <div className="mb-4 flex justify-between items-center">
                          <h2 className="text-2xl font-semibold">Query Results</h2>
                          <Button
                            kind="secondary"
                            renderIcon={Download}
                            onClick={handleExportResults}
                            disabled={!queryResult.data.length}
                          >
                            Export Results
                          </Button>
                        </div>
                        
                        {queryResult.error ? (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h3 className="font-medium text-red-800 mb-2">Query Error</h3>
                            <p className="text-red-700">{queryResult.error}</p>
                          </div>
                        ) : (
                          <DataVisualization
                            data={queryResult.data}
                            query={queryResult.sql}
                            sql={queryResult.sql}
                          />
                        )}
                      </Column>
                    </Grid>
                  )}
                </TabPanel>

                {/* Query History Tab */}
                <TabPanel>
                  <Grid>
                    <Column sm={4} md={8} lg={12}>
                      <QueryHistory
                        history={queryHistory}
                        onClearHistory={handleClearHistory}
                        onRerunQuery={handleRerunQuery}
                        onExportHistory={handleExportHistory}
                      />
                    </Column>
                  </Grid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>
        </Content>
      </div>
    </Theme>
  );
};

export default DataDashboard;