
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { User } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, Plus, User as UserIcon } from 'lucide-react';

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserManagement = ({ open, onOpenChange }: UserManagementDialogProps) => {
  const { users, addUser, removeUser, currentUser } = useAppContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'worker' | 'coordinator' | 'supervisor' | 'admin'>('worker');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addUser({
      name,
      email,
      role,
      password
    });
    
    // Reset form
    setName('');
    setEmail('');
    setPassword('');
    setRole('worker');
  };

  // Admin users and coordinators can manage users
  const canManageUsers = currentUser?.role === 'coordinator' || currentUser?.role === 'admin';
  const workerUsers = users.filter(u => u.role === 'worker');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserIcon className="mr-2" /> User Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {canManageUsers && (
            <form onSubmit={handleSubmit} className="p-4 border rounded-md bg-gray-50">
              <h3 className="text-lg font-medium mb-4">Add New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input 
                    id="name"
                    placeholder="Full name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="user@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="Create a password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role" className="text-sm font-medium">Role</label>
                  <Select value={role} onValueChange={(value: any) => setRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      {currentUser?.role === 'admin' && (
                        <SelectItem value="admin">Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit">
                <Plus size={16} className="mr-2" /> Add User
              </Button>
            </form>
          )}
          
          <div>
            <h3 className="text-lg font-medium mb-4">Users List</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    {canManageUsers && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="capitalize">{user.role}</span>
                      </TableCell>
                      {canManageUsers && (
                        <TableCell>
                          {/* Only allow removing workers or users with lower privilege levels */}
                          {((user.role === 'worker' || 
                             (user.role === 'coordinator' && currentUser?.role === 'admin') || 
                             (user.role === 'supervisor' && currentUser?.role === 'admin')) && 
                             user.id !== currentUser?.id) && (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removeUser(user.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagement;
