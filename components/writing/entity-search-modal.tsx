import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';
import { Entity } from '@/lib/db/types';
import { searchEntities } from '@/lib/db/chapters';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EntitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entity: Entity) => void;
  projectId: string;
  entityType: 'character' | 'setting' | 'plotPoint';
  title: string;
}

export function EntitySearchModal({
  isOpen,
  onClose,
  onSelect,
  projectId,
  entityType,
  title
}: EntitySearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  
  // Load all entities when modal opens
  useEffect(() => {
    const loadAllEntities = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const searchResults = await searchEntities(projectId, entityType, '');
          setResults(searchResults);
        } catch (error) {
          console.error('Error loading entities:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadAllEntities();
  }, [isOpen, projectId, entityType]);
  
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedEntity(null);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsLoading(true);
        try {
          const searchResults = await searchEntities(projectId, entityType, searchTerm);
          setResults(searchResults);
        } catch (error) {
          console.error('Error searching entities:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }, 300);
    
    return () => clearTimeout(searchTimeout);
  }, [searchTerm, projectId, entityType]);
  
  const handleSelect = (entity: Entity) => {
    setSelectedEntity(entity);
  };
  
  const handleConfirm = () => {
    if (selectedEntity) {
      onSelect(selectedEntity);
      onClose();
    }
  };
  
  const renderEntityMetadata = (entity: Entity) => {
    const metadata = entity.metadata || {};
    
    switch (entity.type) {
      case 'character':
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {metadata.aliases?.map((alias: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {alias}
              </Badge>
            ))}
            {metadata.attributes?.personality?.map((trait: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {trait}
              </Badge>
            ))}
          </div>
        );
      
      case 'setting':
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {metadata.attributes?.type && (
              <Badge variant="secondary" className="text-xs">
                {metadata.attributes.type}
              </Badge>
            )}
            {metadata.attributes?.features?.map((feature: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        );
      
      case 'plotPoint':
        return (
          <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {metadata.description}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((entity) => (
                  <div
                    key={entity.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors",
                      selectedEntity?.id === entity.id
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => handleSelect(entity)}
                  >
                    <div className="font-medium">{entity.name}</div>
                    {renderEntityMetadata(entity)}
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center text-muted-foreground py-8">
                No results found
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Start typing to search
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedEntity}>
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 