
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RecipeFlashCards } from "./RecipeFlashCards";

interface CameraOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface RecipeCard {
  card: number;
  content: string;
}

interface RecipeResponse {
  fridge_contents: {
    ingredients: string[];
  };
  recipe: {
    cards: RecipeCard[];
    recipe_image: string;
  };
}

export function CameraOptionsDialog({
  open,
  onOpenChange,
  onSuccess
}: CameraOptionsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<"camera" | "upload" | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipeResponse, setRecipeResponse] = useState<RecipeResponse | null>(null);

  const handleSelectOption = (option: "camera" | "upload") => {
    setSelectedOption(option);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImageFile(files[0]);
      handleUploadImage(files[0]);
    }
  };

  const handleCaptureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImageFile(files[0]);
      handleUploadImage(files[0]);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create recipes",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("https://mealplan.techrealm.online/api/recipe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data: RecipeResponse = await response.json();
      setRecipeResponse(data);
      
      // Extract recipe information
      const recipeTitle = data.recipe.cards[0].content;
      const recipeSteps = data.recipe.cards.slice(1).map(card => card.content);
      const recipeImageUrl = data.recipe.recipe_image;
      const ingredients = data.fridge_contents.ingredients || [];

      // Save recipe to Supabase
      const { error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: recipeTitle,
          image_url: recipeImageUrl,
          ingredients: ingredients,
          steps: recipeSteps,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Recipe created successfully",
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setImageFile(null);
    setRecipeResponse(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recipe From Image</DialogTitle>
          <DialogDescription>
            Take a photo of your fridge or ingredients to generate a recipe
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              Analyzing your ingredients and creating a recipe...
            </p>
          </div>
        ) : recipeResponse ? (
          <RecipeFlashCards 
            recipeCards={recipeResponse.recipe.cards}
            recipeImage={recipeResponse.recipe.recipe_image}
            onClose={handleClose}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Button
              className={`flex flex-col items-center justify-center h-32 ${
                selectedOption === "camera" ? "ring-2 ring-primary" : ""
              }`}
              variant="outline"
              onClick={() => handleSelectOption("camera")}
            >
              <Camera className="h-10 w-10 mb-2" />
              <span>Take Photo</span>
              {selectedOption === "camera" && (
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCaptureImage}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              )}
            </Button>

            <Button
              className={`flex flex-col items-center justify-center h-32 ${
                selectedOption === "upload" ? "ring-2 ring-primary" : ""
              }`}
              variant="outline"
              onClick={() => handleSelectOption("upload")}
            >
              <Upload className="h-10 w-10 mb-2" />
              <span>Upload Image</span>
              {selectedOption === "upload" && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
