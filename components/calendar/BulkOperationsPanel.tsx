
import React from 'react';
import { X, Calendar, Copy, Trash, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BulkOperationsPanelProps {
  selectedCount: number;
  onClearSelection: () => void;
}

const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedCount,
  onClearSelection
}) => {
  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{selectedCount} posts selected</span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" /> Reschedule
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reschedule selected posts</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1" /> Duplicate
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate selected posts</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export selected posts as CSV</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash className="h-4 w-4 mr-1" /> Delete
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete selected posts</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default BulkOperationsPanel;
