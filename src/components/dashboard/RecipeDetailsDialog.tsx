
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, X, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  
  const [currentView, setCurrentView] = useState<"ingredients" | "instructions">("ingredients");
  const [showFlashcards, setShowFlashcards] = useState(false);
  
  // Reset to ingredients view when a new recipe is opened
  useEffect(() => {
    if (open) {
      setCurrentView("ingredients");
      setShowFlashcards(false);
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
        {!showFlashcards ? (
          <>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
            </DialogHeader>
            
            {recipe.image_url && (
              <div className="w-full h-48 overflow-hidden">
                <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            {/* Navigation tabs */}
            <div className="flex border-b">
              <Button
                variant={currentView === "ingredients" ? "default" : "ghost"}
                className="flex-1 rounded-none"
                onClick={() => setCurrentView("ingredients")}
              >
                Ingredients
              </Button>
              <Button
                variant={currentView === "instructions" ? "default" : "ghost"} 
                className="flex-1 rounded-none"
                onClick={() => setCurrentView("instructions")}
              >
                Instructions
              </Button>
            </div>
            
            {/* Content area with fixed height */}
            <div className="relative h-64">
              <ScrollArea className="h-full p-6">
                {currentView === "ingredients" ? (
                  <div>
                    <ul className="list-disc pl-5 mb-6 space-y-2">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <ol className="list-decimal pl-5 space-y-4">
                      {recipe.steps.map((step, index) => (
                        <li key={index} className="pl-2">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </ScrollArea>
            </div>
            
            {/* Pagination */}
            <div className="p-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentView("ingredients")}
                      className={currentView === "ingredients" ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive={currentView === "ingredients"}>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive={currentView === "instructions"}>2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentView("instructions")}
                      className={currentView === "instructions" ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
            
            <div className="p-4 border-t flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setShowFlashcards(true)}
                className="flex items-center gap-2"
              >
                <Layers className="h-4 w-4" /> Flash Cards
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
            </div>
          </>
        ) : (
          <RecipeFlashCards 
            recipeCards={flashCardData} 
            recipeImage={recipe.image_url || ""} 
            onClose={() => setShowFlashcards(false)} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
