import React, { useCallback } from 'react';
import { FileUploader, FileUploaderButton, FileUploaderItem } from '@carbon/react';
import { Document, TrashCan } from '@carbon/icons-react';
import { parseCSV, parseJSON, DataRow } from '@/utils/dataProcessor';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onDataLoad: (data: DataRow[], filename: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad, isLoading, setIsLoading }) => {
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    const filename = file.name;
    
    // Validate file type
    if (!filename.endsWith('.csv') && !filename.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or JSON file.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let data: DataRow[];
      
      if (filename.endsWith('.csv')) {
        data = await parseCSV(file);
      } else {
        data = await parseJSON(file);
      }

      if (data.length === 0) {
        toast({
          title: "Empty file",
          description: "The uploaded file contains no data.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      onDataLoad(data, filename);
      toast({
        title: "File uploaded successfully",
        description: `Loaded ${data.length} rows and ${Object.keys(data[0]).length} columns.`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the file.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoad, setIsLoading, toast]);

  return (
    <div className="data-upload-area">
      <div>
        <input
          type="file"
          accept=".csv,.json"
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files);
            }
          }}
          disabled={isLoading}
          className="mb-4 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <div className="text-center">
          <Document size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="font-medium text-gray-600 mb-2">Upload your dataset</h3>
          <p className="text-gray-500">Drag and drop files here or click to browse</p>
          <p className="text-sm text-gray-400 mt-2">Supports CSV and JSON files</p>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Document size={16} />
          Supported formats: CSV, JSON
        </span>
      </div>
    </div>
  );
};

export default FileUpload;