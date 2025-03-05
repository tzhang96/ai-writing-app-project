"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AiEnhancedTextarea } from '@/components/ui/ai-enhanced-textarea';
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
  
  // Combine built-in fields with custom fields
  const allFields: EntityField[] = [
    { key: 'name', label: 'Name', type: 'input', isDefault: true },
    { key: 'description', label: 'Description', type: 'textarea', isDefault: true, 
      placeholder: 'Enter a description...' },
    ...defaultFields
  ];
  
  const selectedEntity = entities.find(e => e.id === selectedId);
  
  // Updated handlers for AI content
  const handleDescriptionAiGeneratedContent = (newContent: string) => {
    if (selectedEntity) {
      const currentContent = selectedEntity.description || '';
      const newValue = currentContent + newContent;
      onUpdate(selectedEntity.id, 'description', newValue);
    }
  };
  
  const handleCustomFieldAiGeneratedContent = (fieldKey: string, newContent: string) => {
    if (selectedEntity) {
      const currentContent = selectedEntity[fieldKey] || '';
      const newValue = currentContent + newContent;
      onUpdate(selectedEntity.id, fieldKey, newValue);
    }
  };

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

  const renderField = (entity: Entity, field: EntityField) => {
    const isTextarea = field.type === 'textarea';
    
    return (
      <div key={field.key} className="space-y-1.5 relative">
        <div className="flex justify-between items-center">
          <Label className="text-xs font-medium">{field.label}</Label>
          {onRemoveField && !field.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => handleDeleteField(field.key)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        {isTextarea ? (
          <AiEnhancedTextarea
            value={entity[field.key] || ''} 
            onChange={(e) => onUpdate(entity.id, field.key, e.target.value)}
            className="min-h-[100px] text-sm"
            placeholder={field.placeholder}
            aiScribeEnabled={true}
            onAiContent={(newContent) => {
              if (field.key === 'description') {
                handleDescriptionAiGeneratedContent(newContent);
              } else {
                handleCustomFieldAiGeneratedContent(field.key, newContent);
              }
            }}
          />
        ) : (
          <Input 
            value={entity[field.key] || ''} 
            onChange={(e) => onUpdate(entity.id, field.key, e.target.value)}
            className="h-8 text-sm"
            placeholder={field.placeholder}
          />
        )}
      </div>
    );
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
                  {/* Render fields */}
                  {allFields.map(field => renderField(selectedEntity, field))}
                  
                  {/* Add Field Button */}
                  {onAddField && (
                    <div className="pt-2">
                      {isAddingField ? (
                        <div className="space-y-3 border rounded-md p-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Field Name</Label>
                            <Input 
                              value={newFieldName}
                              onChange={(e) => setNewFieldName(e.target.value)}
                              placeholder="Enter field name..."
                              className="h-8 text-sm"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs">Field Type</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={newFieldType === 'input' ? 'default' : 'outline'}
                                onClick={() => setNewFieldType('input')}
                                className="text-xs flex-1"
                              >
                                Short Text
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={newFieldType === 'textarea' ? 'default' : 'outline'}
                                onClick={() => setNewFieldType('textarea')}
                                className="text-xs flex-1"
                              >
                                Long Text
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setIsAddingField(false)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddField}
                              className="text-xs"
                              disabled={!newFieldName.trim()}
                            >
                              Add Field
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingField(true)}
                          className="w-full gap-1 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Custom Field
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Delete Field Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the field and its data from all {title.toLowerCase()}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteField} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 