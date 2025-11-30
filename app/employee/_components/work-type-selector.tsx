// app/employee/_components/work-type-selector.tsx
"use client";

import * as React from "react";
import { Briefcase } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type WorkType = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
};

type WorkTypeSelectorProps = {
  workTypes: WorkType[];
};

// Global state to share selected work type between components
let selectedWorkTypeIdGlobal = "";
let listeners: Array<(id: string) => void> = [];

export function getSelectedWorkTypeId() {
  return selectedWorkTypeIdGlobal;
}

export function setSelectedWorkTypeId(id: string) {
  selectedWorkTypeIdGlobal = id;
  listeners.forEach((listener) => listener(id));
}

function subscribe(listener: (id: string) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function WorkTypeSelector({ workTypes }: WorkTypeSelectorProps) {
  // Find the default work type or use the first one
  const defaultWorkType = workTypes.find((wt) => wt.isDefault) || workTypes[0];

  const [selectedId, setSelectedId] = React.useState<string>(() => {
    // Initialize global state if not set
    if (!selectedWorkTypeIdGlobal && defaultWorkType) {
      selectedWorkTypeIdGlobal = defaultWorkType.id;
    }
    return selectedWorkTypeIdGlobal || defaultWorkType?.id || "";
  });

  React.useEffect(() => {
    // Subscribe to changes from other components
    const unsubscribe = subscribe((id) => {
      setSelectedId(id);
    });
    return unsubscribe;
  }, []);

  function handleChange(value: string) {
    setSelectedId(value);
    setSelectedWorkTypeId(value);
  }

  if (workTypes.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground flex items-center gap-2">
        <Briefcase className="h-4 w-4" />
        סוג עבודה
      </Label>
      <Select value={selectedId} onValueChange={handleChange} dir="rtl">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="בחר סוג עבודה" />
        </SelectTrigger>
        <SelectContent>
          {workTypes.map((wt) => (
            <SelectItem key={wt.id} value={wt.id}>
              {wt.name}
              {wt.isDefault && (
                <span className="mr-2 text-xs text-muted-foreground">
                  (ברירת מחדל)
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
