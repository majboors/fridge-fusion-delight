
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Utensils, Upload, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  const handleCameraAccess = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Close the stream immediately (we're just testing permissions)
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Camera access granted",
        description: "Your camera is ready to use."
      });
      
      // Here you would normally open a camera view component
      console.log("Camera access granted");
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera access denied",
        description: "Please check your camera permissions in browser settings.",
        variant: "destructive"
      });
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
        
        toast({
          title: `Image uploaded for ${type}`,
          description: `Processing ${file.name}...`
        });
        
        // Here you would normally handle the file upload process
        onOpenChange(false);
      }
    };
    
    // Trigger file selection dialog
    input.click();
  };
  
  // Clean up file input when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open && fileInput) {
      // Remove file input from DOM
      document.body.removeChild(fileInput);
      setFileInput(null);
      setSelectedOption(null);
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogClose className="absolute right-4 top-4 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
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
