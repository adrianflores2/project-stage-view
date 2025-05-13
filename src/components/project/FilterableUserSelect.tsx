
import React from 'react';
import { User } from '@/types';
import { Filter } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterableUserSelectProps {
  users: User[];
  selectedUserId: string | undefined;
  onUserChange: (userId: string | undefined) => void;
}

const FilterableUserSelect = ({ users, selectedUserId, onUserChange }: FilterableUserSelectProps) => {
  // Separate users by role for grouping in the dropdown
  const workerUsers = users.filter(u => u.role === 'worker');
  const coordinatorUsers = users.filter(u => u.role === 'coordinator');
  
  return (
    <div className="flex items-center bg-white rounded-lg px-3 py-1 shadow">
      <Filter size={16} className="text-gray-500 mr-2" />
      <Select
        value={selectedUserId || 'all'}
        onValueChange={(value) => onUserChange(value === 'all' ? undefined : value)}
      >
        <SelectTrigger className="border-0 h-8 p-0">
          <SelectValue placeholder="All Users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          
          {coordinatorUsers.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                Coordinators
              </div>
              {coordinatorUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </>
          )}
          
          {workerUsers.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                Workers
              </div>
              {workerUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterableUserSelect;
