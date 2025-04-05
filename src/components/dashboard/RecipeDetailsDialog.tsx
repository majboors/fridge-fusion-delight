
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
        </DialogHeader>
        
        {recipe.image_url && (
          <div className="w-full h-64 overflow-hidden">
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <ScrollArea className="px-6 h-[calc(80vh-64px-80px)]">
          <div className="py-4">
            <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
            <ul className="list-disc pl-5 mb-6 space-y-1">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
            
            <h3 className="font-semibold text-lg mb-2">Instructions</h3>
            <ol className="list-decimal pl-5 space-y-3">
              {recipe.steps.map((step, index) => (
                <li key={index} className="pl-2">{step}</li>
              ))}
            </ol>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
