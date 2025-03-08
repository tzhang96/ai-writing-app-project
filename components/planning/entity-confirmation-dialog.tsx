import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Entity {
  type: 'character' | 'location' | 'event';
  data: any;
  existingEntity?: any;
}

interface CharacterRelationship {
  targetName: string;
  type: string;
  description: string;
}

interface LocationCharacterConnection {
  characterName: string;
  connection: string;
}

interface EntityConfirmationDialogProps {
  entities: Entity[];
  onComplete: (confirmedEntities: Entity[]) => void;
  onClose: () => void;
}

// Helper function to filter out existing values
function getNewValues(existing: string | undefined, incoming: string[]): string[] {
  if (!existing) return incoming;
  const existingSet = new Set(existing.split(', '));
  return incoming.filter(item => !existingSet.has(item));
}

// Helper function to filter out existing relationships
function getNewRelationships(existing: string | undefined | null, incoming: CharacterRelationship[]): CharacterRelationship[] {
  // Return just incoming if existing is null, undefined, or not a string
  if (!existing || typeof existing !== 'string' || existing.trim() === '') {
    return incoming;
  }
  
  const existingRelationships = existing.split('\n').map(rel => {
    const [targetAndType, description] = rel.split(': ');
    const [target, type] = targetAndType.split(' - ');
    return { targetName: target, type, description };
  });

  // Merge existing and incoming relationships
  return [...existingRelationships, ...incoming];
}

export function EntityConfirmationDialog({
  entities,
  onComplete,
  onClose,
}: EntityConfirmationDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmedEntities, setConfirmedEntities] = useState<Entity[]>([]);
  
  const currentEntity = entities[currentIndex];
  const isLastEntity = currentIndex === entities.length - 1;
  
  const handleConfirm = () => {
    setConfirmedEntities([...confirmedEntities, currentEntity]);
    if (isLastEntity) {
      onComplete([...confirmedEntities, currentEntity]);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleDeny = () => {
    if (isLastEntity) {
      onComplete(confirmedEntities);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const renderMergeInfo = (entity: Entity) => {
    if (!entity.existingEntity) return null;

    switch (entity.type) {
      case 'character':
        const existingChar = entity.existingEntity;
        const newPersonality = entity.data.attributes?.personality ? 
          getNewValues(existingChar.personality, entity.data.attributes.personality) : [];
        const newAppearance = entity.data.attributes?.appearance ? 
          getNewValues(existingChar.appearance, entity.data.attributes.appearance) : [];
        const newBackground = entity.data.attributes?.background ? 
          getNewValues(existingChar.background, entity.data.attributes.background) : [];
        const newRelationships = entity.data.relationships ? 
          getNewRelationships(existingChar.relationships, entity.data.relationships) : [];

        // Only show the merge info if there are actually new values to merge
        if (!newPersonality.length && !newAppearance.length && 
            !newBackground.length && !newRelationships.length) {
          return (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This character already exists and all this information is already saved.
              </AlertDescription>
            </Alert>
          );
        }

        return (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">This character already exists. The following new information will be added:</div>
              
              {newPersonality.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New personality traits:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {newPersonality.join(', ')}
                  </div>
                </div>
              )}
              
              {newAppearance.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New appearance details:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {newAppearance.join(', ')}
                  </div>
                </div>
              )}
              
              {newBackground.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New background information:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {newBackground.join('. ')}
                  </div>
                </div>
              )}
              
              {newRelationships.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New relationships:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {newRelationships.map(rel => 
                      `${rel.targetName} - ${rel.type}: ${rel.description}`
                    ).join('\n')}
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        );
      
      case 'location':
        const existingLoc = entity.existingEntity;
        const newFeatures = entity.data.attributes?.features ? 
          getNewValues(existingLoc.features, entity.data.attributes.features) : [];
        const newSignificance = entity.data.attributes?.significance ? 
          getNewValues(existingLoc.significance, entity.data.attributes.significance) : [];
        const hasNewType = entity.data.attributes?.type && entity.data.attributes.type !== existingLoc.locationType;
        const newConnections = entity.data.characterConnections ? 
          entity.data.characterConnections.filter((conn: LocationCharacterConnection) => 
            !existingLoc.characterConnections?.some((existing: LocationCharacterConnection) => 
              existing.characterName === conn.characterName && 
              existing.connection === conn.connection
            )
          ) : [];

        // Only show the merge info if there are actually new values to merge
        if (!newFeatures.length && !newSignificance.length && 
            !hasNewType && !newConnections.length) {
          return (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This location already exists and all this information is already saved.
              </AlertDescription>
            </Alert>
          );
        }

        return (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">This location already exists. The following new information will be added:</div>
              
              {hasNewType && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New location type:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {entity.data.attributes.type}
                  </div>
                </div>
              )}
              
              {newFeatures.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New features:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {newFeatures.join(', ')}
                  </div>
                </div>
              )}
              
              {newSignificance.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New significance details:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {newSignificance.join('. ')}
                  </div>
                </div>
              )}
              
              {newConnections.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">• New character connections:</div>
                  <div className="text-sm ml-4 text-muted-foreground">
                    {newConnections.map((conn: LocationCharacterConnection) =>
                      `${conn.characterName}: ${conn.connection}`
                    ).join('\n')}
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        );
      
      default:
        return null;
    }
  };

  const renderEntityContent = (entity: Entity) => {
    switch (entity.type) {
      case 'character':
        return (
          <div className="space-y-4">
            {renderMergeInfo(entity)}
            <div>
              <h4 className="font-medium">Name</h4>
              <p>{entity.data.name}</p>
            </div>
            <div>
              <h4 className="font-medium">Description</h4>
              <p>{entity.data.description || 'No description provided'}</p>
            </div>
            {entity.data.aliases?.length > 0 && (
              <div>
                <h4 className="font-medium">Aliases</h4>
                <p>{entity.data.aliases.join(', ')}</p>
              </div>
            )}
            {entity.data.attributes && (
              <>
                {entity.data.attributes.personality && (
                  <div>
                    <h4 className="font-medium">Personality</h4>
                    <p>{entity.data.attributes.personality.join(', ')}</p>
                  </div>
                )}
                {entity.data.attributes.appearance && (
                  <div>
                    <h4 className="font-medium">Appearance</h4>
                    <p>{entity.data.attributes.appearance.join(', ')}</p>
                  </div>
                )}
                {entity.data.attributes.background && (
                  <div>
                    <h4 className="font-medium">Background</h4>
                    <p>{entity.data.attributes.background.join('. ')}</p>
                  </div>
                )}
              </>
            )}
            {entity.data.relationships?.length > 0 && (
              <div>
                <h4 className="font-medium">Relationships</h4>
                {entity.data.relationships.map((rel: any, index: number) => (
                  <div key={index} className="mt-2">
                    <p className="font-medium text-sm">{rel.targetName} - {rel.type}</p>
                    <p className="text-sm text-muted-foreground">{rel.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'location':
        return (
          <div className="space-y-4">
            {renderMergeInfo(entity)}
            <div>
              <h4 className="font-medium">Name</h4>
              <p>{entity.data.name}</p>
            </div>
            <div>
              <h4 className="font-medium">Description</h4>
              <p>{entity.data.description || 'No description provided'}</p>
            </div>
            {entity.data.attributes && (
              <>
                {entity.data.attributes.type && (
                  <div>
                    <h4 className="font-medium">Type</h4>
                    <p>{entity.data.attributes.type}</p>
                  </div>
                )}
                {entity.data.attributes.features && (
                  <div>
                    <h4 className="font-medium">Features</h4>
                    <p>{entity.data.attributes.features.join(', ')}</p>
                  </div>
                )}
                {entity.data.attributes.significance && (
                  <div>
                    <h4 className="font-medium">Significance</h4>
                    <p>{entity.data.attributes.significance.join('. ')}</p>
                  </div>
                )}
              </>
            )}
            {entity.data.characterConnections?.length > 0 && (
              <div>
                <h4 className="font-medium">Character Connections</h4>
                {entity.data.characterConnections.map((conn: any, index: number) => (
                  <div key={index} className="mt-2">
                    <p className="font-medium text-sm">{conn.characterName}</p>
                    <p className="text-sm text-muted-foreground">{conn.connection}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Title</h4>
              <p>{entity.data.title}</p>
            </div>
            <div>
              <h4 className="font-medium">Description</h4>
              <p>{entity.data.description || 'No description provided'}</p>
            </div>
            {entity.data.characters?.length > 0 && (
              <div>
                <h4 className="font-medium">Characters Involved</h4>
                <p>{entity.data.characters.join(', ')}</p>
              </div>
            )}
            {entity.data.locations?.length > 0 && (
              <div>
                <h4 className="font-medium">Locations</h4>
                <p>{entity.data.locations.join(', ')}</p>
              </div>
            )}
          </div>
        );
    }
  };

  const getEntityTypeLabel = (type: Entity['type']) => {
    switch (type) {
      case 'character':
        return 'Character';
      case 'location':
        return 'Location';
      case 'event':
        return 'Plot Event';
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Confirm {getEntityTypeLabel(currentEntity.type)}
          </DialogTitle>
          <DialogDescription>
            {currentEntity.existingEntity 
              ? `Review the new information to merge with the existing ${currentEntity.type}.`
              : `Review the extracted ${currentEntity.type}. Would you like to add this to your story?`}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] mt-4">
          <div className="pr-4">
            {renderEntityContent(currentEntity)}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleDeny}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Skip
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            {currentEntity.existingEntity ? 'Merge' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 