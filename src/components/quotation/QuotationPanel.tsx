
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Quotation, QuotationItem } from '@/types/quotation';
import { Project, User } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, FileText, Check, RefreshCw } from 'lucide-react';

interface QuotationPanelProps {
  project: Project;
}

const QuotationPanel = ({ project }: QuotationPanelProps) => {
  const { 
    quotations, quotationItems, users, 
    getQuotationsByProjectId, getQuotationItemsByQuotationId,
    addQuotation, updateQuotation, addQuotationItem, updateQuotationItem,
    generateQuotationTasks, currentUser
  } = useAppContext();
  
  const [projectQuotations, setProjectQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<Date>(new Date());
  
  // Filter workers for assignment
  const availableWorkers = users.filter(user => user.role === 'worker');
  
  // Load quotations for this project
  useEffect(() => {
    if (project) {
      const quotations = getQuotationsByProjectId(project.id);
      setProjectQuotations(quotations);
      
      // Select the first quotation by default if exists
      if (quotations.length > 0 && !selectedQuotation) {
        setSelectedQuotation(quotations[0]);
      }
    }
  }, [project, quotations, getQuotationsByProjectId]);
  
  const handleCreateQuotation = async () => {
    if (!project) return;
    
    try {
      // Set deadline to 15 days from now as default
      const deliveryDeadline = new Date();
      deliveryDeadline.setDate(deliveryDeadline.getDate() + 15);
      
      const newQuotation = await addQuotation({
        project_id: project.id,
        requested_by: currentUser?.id,
        status: 'En elaboración',
        delivery_deadline: deliveryDeadline
      });
      
      if (newQuotation) {
        setSelectedQuotation(newQuotation);
      }
    } catch (error) {
      console.error("Error creating quotation:", error);
    }
  };
  
  const handleCreateItem = async () => {
    if (!selectedQuotation || !newItemName.trim()) return;
    
    try {
      await addQuotationItem({
        quotation_id: selectedQuotation.id,
        equipment_name: newItemName,
        ficha_estado: 'Por hacer',
        ficha_responsable: selectedResponsible
      });
      
      // Reset form
      setNewItemName('');
      setSelectedResponsible(undefined);
      setIsAddingItem(false);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };
  
  const handleUpdateItemStatus = async (item: QuotationItem, newStatus: 'Por hacer' | 'En proceso' | 'Completado') => {
    try {
      await updateQuotationItem({
        ...item,
        ficha_estado: newStatus
      });
    } catch (error) {
      console.error("Error updating item status:", error);
    }
  };
  
  const handleUpdateDeadline = async (newDate: Date) => {
    if (!selectedQuotation) return;
    
    try {
      await updateQuotation({
        ...selectedQuotation,
        delivery_deadline: newDate
      });
    } catch (error) {
      console.error("Error updating deadline:", error);
    }
  };
  
  const handleGenerateTasks = async () => {
    if (!selectedQuotation) return;
    
    try {
      await generateQuotationTasks(selectedQuotation.id);
    } catch (error) {
      console.error("Error generating tasks:", error);
    }
  };
  
  // Get the items for selected quotation
  const items = selectedQuotation 
    ? getQuotationItemsByQuotationId(selectedQuotation.id)
    : [];
  
  // Check if we have any completed items
  const hasCompletedItems = items.some(item => item.ficha_estado === 'Completado');
  const allItemsCompleted = items.length > 0 && items.every(item => item.ficha_estado === 'Completado');
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-2" />
            Quotation Management
          </div>
          {projectQuotations.length === 0 && (
            <Button onClick={handleCreateQuotation}>
              <PlusCircle className="mr-1 h-4 w-4" /> Create Quotation
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Manage quotations and equipment requests for this project
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {projectQuotations.length === 0 ? (
          <div className="text-center p-4 border rounded-md bg-gray-50">
            <p className="text-muted-foreground">No quotations found for this project.</p>
            <Button variant="outline" className="mt-2" onClick={handleCreateQuotation}>
              Create Quotation
            </Button>
          </div>
        ) : (
          <>
            {projectQuotations.length > 1 ? (
              <Accordion type="single" collapsible className="mb-4">
                {projectQuotations.map(quotation => (
                  <AccordionItem key={quotation.id} value={quotation.id}>
                    <AccordionTrigger onClick={() => setSelectedQuotation(quotation)}>
                      Quotation {format(new Date(quotation.created_at), 'PP')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <p><strong>Status:</strong> {quotation.status}</p>
                        <p><strong>Deadline:</strong> {format(new Date(quotation.delivery_deadline), 'PP')}</p>
                        <p><strong>Items:</strong> {getQuotationItemsByQuotationId(quotation.id).length}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="mb-4 p-2 rounded-md bg-gray-50">
                <p><strong>Quotation Created:</strong> {format(new Date(projectQuotations[0].created_at), 'PPP')}</p>
              </div>
            )}
            
            {selectedQuotation && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Delivery Deadline</h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedQuotation.delivery_deadline, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedQuotation.delivery_deadline}
                          onSelect={(date) => date && handleUpdateDeadline(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingItem(true)}
                    >
                      <PlusCircle className="mr-1 h-4 w-4" /> Add Item
                    </Button>
                    
                    {hasCompletedItems && (
                      <Button 
                        onClick={handleGenerateTasks}
                      >
                        <RefreshCw className="mr-1 h-4 w-4" /> Generate Tasks
                      </Button>
                    )}
                  </div>
                </div>
                
                <Table>
                  <TableCaption>
                    {items.length === 0 
                      ? "No items added to this quotation yet." 
                      : `${items.length} equipment quotation items`
                    }
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsible</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.equipment_name}</TableCell>
                        <TableCell>
                          <Select 
                            value={item.ficha_estado} 
                            onValueChange={(value: 'Por hacer' | 'En proceso' | 'Completado') => {
                              handleUpdateItemStatus(item, value);
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="Por hacer">Por hacer</SelectItem>
                                <SelectItem value="En proceso">En proceso</SelectItem>
                                <SelectItem value="Completado">Completado</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={item.ficha_responsable || ""} 
                            onValueChange={(value) => {
                              updateQuotationItem({
                                ...item,
                                ficha_responsable: value || undefined
                              });
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {availableWorkers.map(worker => (
                                  <SelectItem key={worker.id} value={worker.id}>
                                    {worker.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.ficha_estado === 'Completado' && (
                            <Button variant="ghost" size="sm" className="text-green-500">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </>
        )}
        
        {/* Add Item Dialog */}
        <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Quotation Item</DialogTitle>
              <DialogDescription>
                Add a new equipment item to this quotation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Equipment Name</label>
                <Input 
                  placeholder="Enter equipment name" 
                  value={newItemName} 
                  onChange={(e) => setNewItemName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsible Person</label>
                <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsible person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableWorkers.map(worker => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="secondary" 
                onClick={() => setIsAddingItem(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateItem} 
                disabled={!newItemName.trim()}
              >
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      
      {allItemsCompleted && items.length > 0 && (
        <CardFooter className="bg-green-50 border-t">
          <div className="w-full flex justify-between items-center">
            <p className="text-sm text-green-700">All quotation items have been completed!</p>
            <Button 
              variant="outline" 
              className="text-green-700 border-green-700"
              onClick={() => {
                if (selectedQuotation) {
                  updateQuotation({
                    ...selectedQuotation,
                    status: 'Aprobada'
                  });
                }
              }}
            >
              <Check className="mr-1 h-4 w-4" /> Mark Quotation as Approved
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default QuotationPanel;
