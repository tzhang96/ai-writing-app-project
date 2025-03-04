"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, LucideIcon, X, MoreVertical, AlertTriangle } from 'lucide-react';
import { AiScribePopup, useAiScribe } from '@/components/ai-scribe-popup';
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
  
  // Create refs for textareas - one for description and one for each custom textarea field
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const customFieldRefs = useRef<{[key: string]: React.RefObject<HTMLTextAreaElement>}>({});
  
  // Initialize refs for custom textarea fields
  useEffect(() => {
    if (selectedEntity) {
      // Create refs for custom textarea fields
      defaultFields.forEach(field => {
        if (field.type === 'textarea') {
          if (!customFieldRefs.current[field.key]) {
            customFieldRefs.current[field.key] = React.createRef<HTMLTextAreaElement>();
          }
        }
      });
    }
  }, [selectedEntity, defaultFields]);
  
  // Use AI Scribe hooks - these must be called unconditionally
  const descriptionAiScribe = useAiScribe(descriptionRef, true);
  
  // Create a fixed set of AI Scribe hooks for custom fields
  // We'll use a maximum of 10 custom textarea fields to avoid dynamic hook creation
  const customField1Ref = useRef<HTMLTextAreaElement>(null);
  const customField2Ref = useRef<HTMLTextAreaElement>(null);
  const customField3Ref = useRef<HTMLTextAreaElement>(null);
  const customField4Ref = useRef<HTMLTextAreaElement>(null);
  const customField5Ref = useRef<HTMLTextAreaElement>(null);
  const customField6Ref = useRef<HTMLTextAreaElement>(null);
  const customField7Ref = useRef<HTMLTextAreaElement>(null);
  const customField8Ref = useRef<HTMLTextAreaElement>(null);
  const customField9Ref = useRef<HTMLTextAreaElement>(null);
  const customField10Ref = useRef<HTMLTextAreaElement>(null);
  
  const customField1AiScribe = useAiScribe(customField1Ref, true);
  const customField2AiScribe = useAiScribe(customField2Ref, true);
  const customField3AiScribe = useAiScribe(customField3Ref, true);
  const customField4AiScribe = useAiScribe(customField4Ref, true);
  const customField5AiScribe = useAiScribe(customField5Ref, true);
  const customField6AiScribe = useAiScribe(customField6Ref, true);
  const customField7AiScribe = useAiScribe(customField7Ref, true);
  const customField8AiScribe = useAiScribe(customField8Ref, true);
  const customField9AiScribe = useAiScribe(customField9Ref, true);
  const customField10AiScribe = useAiScribe(customField10Ref, true);
  
  // Map of custom field keys to their refs and AI Scribe hooks
  const customFieldsMap = useRef<{[key: string]: {
    ref: React.RefObject<HTMLTextAreaElement>,
    aiScribe: ReturnType<typeof useAiScribe>
  }}>({});
  
  // Update the map when custom fields change
  useEffect(() => {
    const customTextareaFields = defaultFields.filter(field => field.type === 'textarea');
    
    // Assign refs and hooks to custom fields (up to 10)
    const refs = [
      customField1Ref, customField2Ref, customField3Ref, customField4Ref, customField5Ref,
      customField6Ref, customField7Ref, customField8Ref, customField9Ref, customField10Ref
    ];
    
    const hooks = [
      customField1AiScribe, customField2AiScribe, customField3AiScribe, customField4AiScribe, customField5AiScribe,
      customField6AiScribe, customField7AiScribe, customField8AiScribe, customField9AiScribe, customField10AiScribe
    ];
    
    customTextareaFields.forEach((field, index) => {
      if (index < 10) {
        customFieldsMap.current[field.key] = {
          ref: refs[index],
          aiScribe: hooks[index]
        };
      }
    });
  }, [defaultFields]);
  
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
    let ref = null;
    let aiScribeHook = null;
    
    if (isTextarea) {
      if (field.key === 'description') {
        ref = descriptionRef;
        aiScribeHook = descriptionAiScribe;
      } else if (customFieldsMap.current[field.key]) {
        ref = customFieldsMap.current[field.key].ref;
        aiScribeHook = customFieldsMap.current[field.key].aiScribe;
      }
    }
    
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
          <Textarea 
            ref={ref}
            value={entity[field.key] || ''} 
            onChange={(e) => onUpdate(entity.id, field.key, e.target.value)}
            className="min-h-[100px] text-sm"
            placeholder={field.placeholder}
          />
        ) : (
          <Input 
            value={entity[field.key] || ''} 
            onChange={(e) => onUpdate(entity.id, field.key, e.target.value)}
            className="h-8 text-sm"
            placeholder={field.placeholder}
          />
        )}
        
        {isTextarea && aiScribeHook && aiScribeHook.showAiPopup && (
          <AiScribePopup
            selectedText={aiScribeHook.selectedText}
            position={aiScribeHook.popupPosition}
            onClose={aiScribeHook.closePopup}
            onAction={(action, instructions) => {
              // Handle AI actions here
              console.log(`Action ${action} with instructions: ${instructions}`);
              aiScribeHook.handleAiAction(action, instructions);
            }}
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