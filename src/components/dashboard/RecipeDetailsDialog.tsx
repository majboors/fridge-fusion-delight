
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { RecipeFlashCards } from "./RecipeFlashCards";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  ingredients: string[];
  steps: string[];
  created_at: string;
}

interface RecipeDetailsDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailsDialog({ recipe, open, onOpenChange }: RecipeDetailsDialogProps) {
  if (!recipe) return null;
  
  const [currentTab, setCurrentTab] = useState<"ingredients" | "instructions" | "flashcards">("ingredients");
  
  // Reset to ingredients view when a new recipe is opened
  useEffect(() => {
    if (open) {
      setCurrentTab("ingredients");
    }
  }, [open, recipe?.id]);
  
  // Prepare data for flash cards format
  const flashCardData = recipe ? [
    { card: 1, content: recipe.title },
    ...recipe.steps.map((step, index) => ({
      card: index + 2,
      content: step
    }))
  ] : [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
        </DialogHeader>
        
        {recipe.image_url && (
          <div className="w-full h-48 overflow-hidden">
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        {/* Navigation tabs */}
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full rounded-none">
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="flashcards">Flash Cards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ingredients" className="m-0">
            <div className="relative h-64">
              <ScrollArea className="h-full p-6">
                <div>
                  <ul className="list-disc pl-5 mb-6 space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="instructions" className="m-0">
            <div className="relative h-64">
              <ScrollArea className="h-full p-6">
                <div>
                  <ol className="list-decimal pl-5 space-y-4">
                    {recipe.steps.map((step, index) => (
                      <li key={index} className="pl-2">{step}</li>
                    ))}
                  </ol>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="flashcards" className="m-0 p-0">
            <div className="h-64">
              <RecipeFlashCards 
                recipeCards={flashCardData} 
                recipeImage={recipe.image_url || ""} 
                onClose={() => setCurrentTab("ingredients")}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="p-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
