
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Upload } from "lucide-react";

interface CameraOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (option: "calories" | "recipe") => void;
  onSelectUpload: (option: "calories" | "recipe") => void;
}

export function CameraOptionsDialog({
  open,
  onOpenChange,
  onSelectOption,
  onSelectUpload,
}: CameraOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture Options</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h3 className="text-sm font-medium mb-2">Scan for Calories</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-4"
                onClick={() => onSelectOption("calories")}
              >
                <Camera className="h-8 w-8 mb-2 text-primary" />
                <span className="text-sm">Capture</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-4"
                onClick={() => onSelectUpload("calories")}
              >
                <Upload className="h-8 w-8 mb-2 text-primary" />
                <span className="text-sm">Upload</span>
              </Button>
            </div>
          </div>
          
          <div className="col-span-2 mt-2">
            <h3 className="text-sm font-medium mb-2">Create Recipe</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-4"
                onClick={() => onSelectOption("recipe")}
              >
                <Camera className="h-8 w-8 mb-2 text-primary" />
                <span className="text-sm">Capture</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-4"
                onClick={() => onSelectUpload("recipe")}
              >
                <Upload className="h-8 w-8 mb-2 text-primary" />
                <span className="text-sm">Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
