
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CameraOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Recipe response type from the API
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
}: CameraOptionsDialogProps) {
  const [selectedOption, setSelectedOption] = useState<"calories" | "recipe" | null>(null);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [showRecipeCards, setShowRecipeCards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      
      // Mock handling a captured image
      handleImageProcessing();
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
        
        // Process the image
        handleImageProcessing(file);
      }
    };
    
    // Trigger file selection dialog
    input.click();
  };
  
  // Mock recipe generation API call
  const handleImageProcessing = async (file?: File) => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing image",
        description: "Our AI is analyzing the ingredients. This may take up to 30 seconds."
      });
      
      let apiResponse;
      
      if (file) {
        // If we have a real file, send it to the API
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('https://mealplan.techrealm.online/api/recipe', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to process image');
        }
        
        apiResponse = await response.json();
      } else {
        // Mock data for camera access testing
        apiResponse = {
          fridge_contents: {
            ingredients: [
              "Chicken breast",
              "Broccoli",
              "Rice",
              "Olive oil",
              "Garlic",
              "Soy sauce"
            ]
          },
          recipe: {
            cards: [
              { card: 1, content: "Chicken and Broccoli Stir Fry" },
              { card: 2, content: "Ingredients: Chicken breast, broccoli, rice, olive oil, garlic, soy sauce" },
              { card: 3, content: "Step 1: Slice chicken breast into strips and mince garlic." },
              { card: 4, content: "Step 2: Heat olive oil in a pan and sauté garlic until fragrant." },
              { card: 5, content: "Step 3: Add chicken and cook until no longer pink." },
              { card: 6, content: "Step 4: Add broccoli and stir-fry for 3-4 minutes." },
              { card: 7, content: "Step 5: Add soy sauce and cook for 2 more minutes." },
              { card: 8, content: "Step 6: Serve over cooked rice and enjoy!" }
            ],
            recipe_image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1173&q=80"
          }
        };
      }
      
      console.log("Recipe data:", apiResponse);
      setRecipeData(apiResponse);
      
      // Save recipe to Supabase if user is logged in
      if (user && selectedOption === "recipe") {
        saveRecipeToSupabase(apiResponse);
      }
      
      // Show recipe cards
      setShowRecipeCards(true);
      setCurrentCardIndex(0);
      
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const saveRecipeToSupabase = async (recipeData: RecipeResponse) => {
    if (!user) return;
    
    try {
      // Extract recipe title from first card
      const title = recipeData.recipe.cards[0].content;
      
      // Extract steps from cards (skip the first two cards which are title and ingredients)
      const steps = recipeData.recipe.cards.slice(2).map(card => card.content);
      
      const { error } = await supabase.from('recipes').insert({
        user_id: user.id,
        title: title,
        image_url: recipeData.recipe.recipe_image,
        ingredients: recipeData.fridge_contents.ingredients,
        steps: steps
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Recipe saved",
        description: "The recipe has been saved to your collection."
      });
      
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({
        title: "Error",
        description: "Failed to save the recipe. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleNextCard = () => {
    if (recipeData && currentCardIndex < recipeData.recipe.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };
  
  // Clean up file input when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      if (fileInput) {
        // Remove file input from DOM
        document.body.removeChild(fileInput);
        setFileInput(null);
      }
      setSelectedOption(null);
      setShowRecipeCards(false);
      setRecipeData(null);
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
            {showRecipeCards 
              ? "Recipe Cards" 
              : selectedOption 
                ? `${selectedOption === "calories" ? "Scan for Calories" : "Create Recipe"}` 
                : "What would you like to do?"}
          </DialogTitle>
        </DialogHeader>
        
        {showRecipeCards && recipeData ? (
          // Recipe cards view
          <div className="mt-2">
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              {currentCardIndex === 0 && (
                <div className="h-48 w-full overflow-hidden">
                  <img 
                    src={recipeData.recipe.recipe_image} 
                    alt="Recipe" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="mb-2 text-sm text-gray-500">
                  Card {currentCardIndex + 1} of {recipeData.recipe.cards.length}
                </div>
                
                <h3 className="text-lg font-medium mb-2">
                  {recipeData.recipe.cards[currentCardIndex].content}
                </h3>
                
                {currentCardIndex === 1 && (
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-sm text-gray-700">Detected Ingredients:</p>
                    <ul className="list-disc ml-5 text-sm">
                      {recipeData.fridge_contents.ingredients.map((ingredient, idx) => (
                        <li key={idx}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center p-3 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevCard} 
                  disabled={currentCardIndex === 0}
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {recipeData.recipe.cards.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-2 h-2 rounded-full ${currentCardIndex === idx ? 'bg-primary' : 'bg-gray-300'}`} 
                    />
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextCard} 
                  disabled={currentCardIndex === recipeData.recipe.cards.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>
            
            {selectedOption === "recipe" && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  This recipe has been saved to your collection.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    onOpenChange(false);
                    // Navigate to recipes page
                    window.location.href = '/recipes';
                  }}
                >
                  Go to My Recipes
                </Button>
              </div>
            )}
          </div>
        ) : !selectedOption ? (
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
              disabled={isProcessing}
            >
              <Camera className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm">Take Photo</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-4"
              onClick={() => handleFileUpload(selectedOption)}
              disabled={isProcessing}
            >
              <Upload className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm">Upload Photo</span>
            </Button>
            <Button
              variant="ghost"
              className="col-span-2 mt-2"
              onClick={() => setSelectedOption(null)}
              disabled={isProcessing}
            >
              Back
            </Button>
          </div>
        )}
        
        {isProcessing && (
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse text-center">
              <p>Processing image...</p>
              <p className="text-sm text-gray-500 mt-1">This may take up to 30 seconds</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
