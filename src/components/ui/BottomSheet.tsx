import * as React from "react";
import { Sheet, SheetContent, SheetOverlay, SheetPortal } from "./sheet";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onOpenChange, children }: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetPortal>
        <SheetOverlay className="bg-transparent pointer-events-none" />
        <SheetContent
          side="bottom"
          className="w-full max-h-[80vh] overflow-y-auto rounded-t-xl border-t bg-background/80 backdrop-blur-md"
        >
          {children}
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
}
