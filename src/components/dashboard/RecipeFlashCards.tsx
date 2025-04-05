
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X, ArrowLeft } from "lucide-react";

interface RecipeCard {
  card: number;
  content: string;
}

interface RecipeFlashCardsProps {
  recipeCards: RecipeCard[];
  recipeImage: string;
  onClose: () => void;
}

export function RecipeFlashCards({ recipeCards, recipeImage, onClose }: RecipeFlashCardsProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const totalCards = recipeCards.length;

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const currentCard = recipeCards[currentCardIndex];
  const isFirstCard = currentCardIndex === 0;
  const isLastCard = currentCardIndex === totalCards - 1;

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center mb-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to recipe
        </Button>
        <div className="text-sm text-muted-foreground">
          Card {currentCardIndex + 1} of {totalCards}
        </div>
      </div>
      
      <div className="relative">
        {isFirstCard && recipeImage && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={recipeImage}
              alt="Recipe"
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        
        <Card className="min-h-[200px] flex flex-col justify-center">
          <CardContent className="py-6">
            <p className={`text-center ${isFirstCard ? 'text-2xl font-bold' : 'text-lg'}`}>
              {currentCard.content}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={isFirstCard}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex space-x-1">
          {recipeCards.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentCardIndex ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={isLastCard}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button variant="secondary" size="sm" onClick={onClose}>
          <X className="h-4 w-4 mr-2" /> Close
        </Button>
      </div>
    </div>
  );
}
