
import React from 'react';
import { Button } from '@/components/ui/button';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant={viewMode === 'grid' ? 'default' : 'outline'} 
        size="icon" 
        onClick={() => onViewModeChange('grid')}
      >
        <div className="grid grid-cols-2 gap-0.5">
          <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
        </div>
        <span className="sr-only">Grid view</span>
      </Button>
      
      <Button 
        variant={viewMode === 'list' ? 'default' : 'outline'} 
        size="icon"
        onClick={() => onViewModeChange('list')}
      >
        <div className="flex flex-col justify-center items-center gap-0.5">
          <div className="w-3.5 h-0.5 bg-current rounded-sm"></div>
          <div className="w-3.5 h-0.5 bg-current rounded-sm"></div>
          <div className="w-3.5 h-0.5 bg-current rounded-sm"></div>
        </div>
        <span className="sr-only">List view</span>
      </Button>
    </div>
  );
};

export default ViewModeToggle;
