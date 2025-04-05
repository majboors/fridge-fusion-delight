
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Utensils } from "lucide-react";

interface CameraOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (option: "calories" | "recipe") => void;
}

export function CameraOptionsDialog({
  open,
  onOpenChange,
  onSelectOption,
}: CameraOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture Options</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-28 p-4"
            onClick={() => onSelectOption("calories")}
          >
            <Camera className="h-10 w-10 mb-2 text-primary" />
            <span>Scan for Calories</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-28 p-4"
            onClick={() => onSelectOption("recipe")}
          >
            <Utensils className="h-10 w-10 mb-2 text-primary" />
            <span>Create Recipe</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
