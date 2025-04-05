
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
    <div className="space-y-4">
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
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <p className="text-xs text-muted-foreground">
            {currentCardIndex + 1} / {totalCards}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={isFirstCard}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button variant="secondary" onClick={onClose}>
          <X className="h-4 w-4 mr-2" /> Close
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={isLastCard}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
