
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Upload } from "lucide-react";
import { useState } from "react";

interface CameraOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraOptionsDialog({
  open,
  onOpenChange,
}: CameraOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<"calories" | "recipe" | null>(null);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  
  const handleCameraAccess = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Close the stream immediately (we're just testing permissions)
      stream.getTracks().forEach(track => track.stop());
      
      // Here you would normally open a camera view component
      console.log("Camera access granted");
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check your permissions.");
    }
  };
  
  const handleFileUpload = (type: "calories" | "recipe") => {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;
    
    // Store reference to remove later
    setFileInput(input);
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        console.log(`Selected file for ${type}:`, file);
        
        // Here you would normally handle the file upload process
        // For now just close the dialog
        onOpenChange(false);
      }
    };
    
    // Trigger file selection dialog
    input.click();
  };
  
  // Clean up file input when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open && fileInput) {
      document.body.removeChild(fileInput);
      setFileInput(null);
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedOption ? 
              `${selectedOption === "calories" ? "Scan for Calories" : "Create Recipe"}` : 
              "What would you like to do?"}
          </DialogTitle>
        </DialogHeader>
        
        {!selectedOption ? (
          // First step: Choose between Calories or Recipe
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4"
              onClick={() => setSelectedOption("calories")}
            >
              <Camera className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm">Scan for Calories</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4"
              onClick={() => setSelectedOption("recipe")}
            >
              <Utensils className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm">Create Recipe</span>
            </Button>
          </div>
        ) : (
          // Second step: Choose between Capture or Upload
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4"
              onClick={handleCameraAccess}
            >
              <Camera className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm">Take Photo</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4"
              onClick={() => handleFileUpload(selectedOption)}
            >
              <Upload className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm">Upload Photo</span>
            </Button>
            <Button
              variant="ghost"
              className="col-span-2 mt-2"
              onClick={() => setSelectedOption(null)}
            >
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
