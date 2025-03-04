"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Map, Trash2 } from 'lucide-react';

interface Setting {
  id: string;
  name: string;
  type: string;
  description: string;
  history: string;
  culture: string;
  geography: string;
}

function SettingCard({ setting, onSelect, isSelected }: { 
  setting: Setting; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <Card 
      className={`mb-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Map className="h-4 w-4" />
          {setting.name}
        </CardTitle>
        <CardDescription>{setting.type}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function SettingTab() {
  const [settings, setSettings] = useState<Setting[]>([
    {
      id: '1',
      name: 'Main Setting',
      type: 'Primary Location',
      description: 'The primary setting of your story.',
      history: 'Historical details here...',
      culture: 'Cultural elements...',
      geography: 'Geographic features...'
    }
  ]);
  
  const [selectedSettingId, setSelectedSettingId] = useState<string>(settings[0]?.id || '');
  const selectedSetting = settings.find(s => s.id === selectedSettingId);
  
  const addSetting = () => {
    const newId = Date.now().toString();
    const newSetting: Setting = {
      id: newId,
      name: 'New Setting',
      type: 'Location',
      description: '',
      history: '',
      culture: '',
      geography: ''
    };
    setSettings([...settings, newSetting]);
    setSelectedSettingId(newId);
  };
  
  const updateSetting = (field: keyof Setting, value: string) => {
    setSettings(settings.map(setting => 
      setting.id === selectedSettingId 
        ? { ...setting, [field]: value } 
        : setting
    ));
  };
  
  const deleteSetting = () => {
    const newSettings = settings.filter(s => s.id !== selectedSettingId);
    setSettings(newSettings);
    setSelectedSettingId(newSettings[0]?.id || '');
  };
  
  return (
    <div className="h-full grid grid-cols-[300px_1fr] gap-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Map className="h-5 w-5" />
            Settings
          </h2>
          <Button size="sm" onClick={addSetting}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          {settings.map(setting => (
            <SettingCard 
              key={setting.id} 
              setting={setting} 
              onSelect={() => setSelectedSettingId(setting.id)}
              isSelected={setting.id === selectedSettingId}
            />
          ))}
        </ScrollArea>
      </div>
      
      {selectedSetting && (
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-row justify-between items-start space-y-0">
            <div>
              <CardTitle>Setting Details</CardTitle>
              <CardDescription>Develop your world and locations</CardDescription>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={deleteSetting}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    value={selectedSetting.name} 
                    onChange={(e) => updateSetting('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Input 
                    value={selectedSetting.type} 
                    onChange={(e) => updateSetting('type', e.target.value)}
                  />
                </div>
              </div>
              
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="culture">Culture</TabsTrigger>
                  <TabsTrigger value="geography">Geography</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="Describe this setting's appearance, atmosphere, and general characteristics..."
                    value={selectedSetting.description}
                    onChange={(e) => updateSetting('description', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="history" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="Detail the history of this place, important events, and how it evolved over time..."
                    value={selectedSetting.history}
                    onChange={(e) => updateSetting('history', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="culture" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="Describe the cultural elements, customs, beliefs, and social structures..."
                    value={selectedSetting.culture}
                    onChange={(e) => updateSetting('culture', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="geography" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="Describe the physical features, climate, terrain, and natural elements..."
                    value={selectedSetting.geography}
                    onChange={(e) => updateSetting('geography', e.target.value)}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}