"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, LucideIcon, X, MoreVertical, AlertTriangle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface EntityField {
  key: string;
  label: string;
  type: 'input' | 'textarea';
  placeholder?: string;
  isDefault?: boolean;
}

export interface Entity {
  id: string;
  name: string;
  description: string;
  [key: string]: string;
}

interface EntityCardProps {
  entity: Entity;
  onSelect: () => void;
  isSelected: boolean;
  icon: LucideIcon;
}

export function EntityCard({ 
  entity, 
  onSelect, 
  isSelected,
  icon: Icon
}: EntityCardProps) {
  return (
    <Card 
      className={`mb-3 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
      onClick={onSelect}
    >
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {entity.name}
        </CardTitle>
        {entity.description && (
          <CardDescription className="text-xs line-clamp-1">
            {entity.description.substring(0, 60)}
            {entity.description.length > 60 ? '...' : ''}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}

interface EntityPanelProps {
  title: string;
  icon: LucideIcon;
  entities: Entity[];
  defaultFields?: EntityField[];
  onAdd: () => void;
  onUpdate: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onAddField?: (field: EntityField) => void;
  onRemoveField?: (key: string) => void;
}

export function EntityPanel({
  title,
  icon: Icon,
  entities,
  defaultFields = [],
  onAdd,
  onUpdate,
  onDelete,
  onAddField,
  onRemoveField
}: EntityPanelProps) {
  const [selectedId, setSelectedId] = useState<string>(entities[0]?.id || '');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'input' | 'textarea'>('input');
  const [isAddingField, setIsAddingField] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const selectedEntity = entities.find(e => e.id === selectedId);
  
  // Combine built-in fields with custom fields
  const allFields: EntityField[] = [
    { key: 'name', label: 'Name', type: 'input', isDefault: true },
    { key: 'description', label: 'Description', type: 'textarea', isDefault: true, 
      placeholder: 'Enter a description...' },
    ...defaultFields
  ];
  
  const handleAddField = () => {
    if (!newFieldName.trim() || !onAddField) return;
    
    const key = newFieldName.toLowerCase().replace(/\s+/g, '_');
    onAddField({
      key,
      label: newFieldName,
      type: newFieldType,
      placeholder: `Enter ${newFieldName.toLowerCase()}...`
    });
    
    setNewFieldName('');
    setNewFieldType('input');
    setIsAddingField(false);
  };

  const handleDeleteField = (key: string) => {
    setFieldToDelete(key);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteField = () => {
    if (fieldToDelete && onRemoveField) {
      onRemoveField(fieldToDelete);
      setFieldToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="h-full grid grid-cols-[220px_1fr] gap-4">
      <div className="flex flex-col pr-3">
        <ScrollArea className="flex-1 h-[calc(100vh-300px)]">
          <div className="pr-1 pb-3 pl-1 pt-1">
            {entities.map(entity => (
              <EntityCard 
                key={entity.id} 
                entity={entity}
                onSelect={() => setSelectedId(entity.id)}
                isSelected={entity.id === selectedId}
                icon={Icon}
              />
            ))}
          </div>
        </ScrollArea>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onAdd} 
          className="mt-3 mb-2 w-full gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add {title}
        </Button>
      </div>
      
      {selectedEntity && (
        <div className="h-full flex flex-col pb-2">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 flex-row justify-between items-start space-y-0">
              <div>
                <CardTitle className="text-base">{selectedEntity.name}</CardTitle>
                {selectedEntity.description && (
                  <CardDescription className="line-clamp-1">
                    {selectedEntity.description.substring(0, 60)}
                    {selectedEntity.description.length > 60 ? '...' : ''}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => onDelete(selectedId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-290px)]">
                <div className="space-y-4 p-5 pb-8">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Name</Label>
                    <Input 
                      value={selectedEntity.name} 
                      onChange={(e) => onUpdate(selectedId, 'name', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  {/* Description field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Description</Label>
                    <Textarea 
                      value={selectedEntity.description || ''} 
                      onChange={(e) => onUpdate(selectedId, 'description', e.target.value)}
                      className="min-h-[120px] text-sm"
                      placeholder="Enter a description..."
                    />
                  </div>
                  
                  {/* Custom fields */}
                  {defaultFields.map((field) => (
                    <div key={field.key} className="space-y-1.5 relative">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-medium">{field.label}</Label>
                        {onRemoveField && !field.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteField(field.key)}
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {field.type === 'input' ? (
                        <Input 
                          value={selectedEntity[field.key] || ''} 
                          onChange={(e) => onUpdate(selectedId, field.key, e.target.value)}
                          className="text-sm"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <Textarea 
                          value={selectedEntity[field.key] || ''} 
                          onChange={(e) => onUpdate(selectedId, field.key, e.target.value)}
                          className="min-h-[100px] text-sm"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Add Field Button */}
                  {onAddField && (
                    <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 text-sm"
                        >
                          <Plus className="h-3.5 w-3.5 mr-2" />
                          Add Field
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Custom Field</DialogTitle>
                          <DialogDescription>
                            Create a new field for {title.toLowerCase()}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="field-name">Field Name</Label>
                            <Input
                              id="field-name"
                              placeholder="e.g., Occupation, Age, Powers..."
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Field Type</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={newFieldType === 'input' ? 'default' : 'outline'}
                                onClick={() => setNewFieldType('input')}
                                className="flex-1"
                              >
                                Short Text
                              </Button>
                              <Button
                                type="button"
                                variant={newFieldType === 'textarea' ? 'default' : 'outline'}
                                onClick={() => setNewFieldType('textarea')}
                                className="flex-1"
                              >
                                Long Text
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleAddField}
                            disabled={!newFieldName.trim()}
                          >
                            Add Field
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Field Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Field
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the field "{defaultFields.find(f => f.key === fieldToDelete)?.label}" 
              from <strong>all {title.toLowerCase()}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFieldToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteField}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 