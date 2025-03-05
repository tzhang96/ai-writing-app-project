import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MetadataCardProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function MetadataCard({ 
  title, 
  icon, 
  isExpanded, 
  onToggle, 
  children 
}: MetadataCardProps) {
  return (
    <Card className="w-full transition-all duration-200 ease-in-out">
      <CardHeader 
        className="pb-3 cursor-pointer flex flex-row items-center justify-between"
        onClick={onToggle}
      >
        <CardTitle className="text-md flex items-center">
          {icon}
          {title}
        </CardTitle>
        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
          {isExpanded ? 
            <ChevronDown className="h-5 w-5" /> : 
            <ChevronRight className="h-5 w-5" />
          }
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

interface MetadataItemProps {
  title: React.ReactNode;
  onRemove?: () => void;
  children: React.ReactNode;
}

export function MetadataItem({ 
  title, 
  onRemove, 
  children 
}: MetadataItemProps) {
  return (
    <Card className="border shadow-sm">
      <div className="p-3 bg-muted/30 flex items-center justify-between">
        <div className="flex-1">
          {title}
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRemove}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        )}
      </div>
      <div className="p-3 pt-2">
        {children}
      </div>
    </Card>
  );
}

interface AddItemButtonProps {
  onClick: () => void;
  label: string;
}

export function AddItemButton({ onClick, label }: AddItemButtonProps) {
  return (
    <Button 
      variant="outline" 
      className="w-full mt-4"
      onClick={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 mr-2"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
      {label}
    </Button>
  );
} 