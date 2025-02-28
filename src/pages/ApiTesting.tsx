
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Camera, FileImage } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const ApiTesting = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string>("");
  const [apiStatus, setApiStatus] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };

  const handleDemoImage = () => {
    toast({
      title: "Demo image selected",
      description: "We've loaded a sample image for you to try."
    });
    setPreviewUrl("https://www.cameronskitchen.com.au/app/uploads/2020/11/The-Importance-of-Healthy-High-Quality-Ingredients-In-Your-Diet.jpeg");
  };

  const testApi = async () => {
    if (!file && !previewUrl) {
      toast({
        title: "No image selected",
        description: "Please upload a photo or use our demo image.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setApiResponse("");
    setApiStatus("Sending request...");
    
    try {
      // Create FormData object to send to the API
      const formData = new FormData();
      
      if (file) {
        formData.append('image', file);
      } else if (previewUrl) {
        // For demo image, we need to fetch it and convert to a file
        try {
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          formData.append('image', blob, 'demo-image.jpg');
        } catch (error) {
          console.error("Error converting demo image to blob:", error);
          setApiStatus("Error: Failed to process demo image");
          throw new Error("Failed to process demo image");
        }
      }
      
      // Track request start time
      const startTime = Date.now();
      setApiStatus("Request sent. Waiting for response...");
      
      // Send request to the API
      const response = await fetch('https://mealplan.techrealm.online/api/recipe', {
        method: 'POST',
        body: formData,
      });
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("API error:", errorData);
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        
        setApiStatus(`Error: ${response.status} ${response.statusText} (${responseTime}ms)`);
        setApiResponse(JSON.stringify(errorData || {}, null, 2));
        throw new Error(`Failed with status: ${response.status}`);
      }
      
      const rawText = await response.text();
      setApiStatus(`Success: ${response.status} ${response.statusText} (${responseTime}ms)`);
      
      try {
        // Try to parse as JSON for prettier display
        const data = JSON.parse(rawText);
        setApiResponse(JSON.stringify(data, null, 2));
      } catch (e) {
        // If not valid JSON, show as raw text
        setApiResponse(rawText);
      }
      
      toast({
        title: "API Response Received",
        description: `Response received in ${responseTime}ms`
      });
    } catch (error) {
      console.error("Error in API test:", error);
      setApiStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to make API request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Testing Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Recipe API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div className="space-y-2">
              <Label htmlFor="test-image" className="text-gray-700">Choose an image</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 h-52 flex flex-col items-center justify-center text-center transition-all hover:border-amber-300 cursor-pointer">
                <Input
                  type="file"
                  id="test-image"
                  className="hidden"
                  accept="image/jpeg, image/png"
                  onChange={handleFileChange}
                />
                <Label 
                  htmlFor="test-image" 
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-amber-500 mb-3" />
                  <span className="text-gray-800 font-medium">
                    {file ? file.name : "Drag & drop or click to browse"}
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Or use demo image"}
                  </span>
                </Label>
              </div>
              <button 
                onClick={handleDemoImage}
                className="text-sm text-amber-600 hover:text-amber-800 font-medium flex items-center justify-center mx-auto mt-2"
              >
                <FileImage className="w-4 h-4 mr-1" /> Use demo image
              </button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-700">Preview</Label>
              <div className="border border-gray-200 rounded-xl h-52 flex items-center justify-center bg-gray-50 overflow-hidden">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <Camera className="h-10 w-10 mx-auto mb-2" />
                    <p>Image preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={testApi}
            disabled={isLoading}
            className="w-full mb-4"
          >
            {isLoading ? "Testing API..." : "Test API"}
          </Button>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-gray-700">API Status</Label>
              <span className={`text-sm px-2 py-1 rounded ${
                apiStatus.includes('Success') 
                  ? 'bg-green-100 text-green-800' 
                  : apiStatus.includes('Error') 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
              }`}>
                {apiStatus || 'Not tested yet'}
              </span>
            </div>
            
            <Label className="text-gray-700 block mb-2">API Response</Label>
            <Textarea 
              value={apiResponse}
              readOnly
              className="font-mono text-sm h-80"
              placeholder="API response will appear here"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Home
        </Button>
        <Button variant="outline" onClick={() => setApiResponse("")}>
          Clear Response
        </Button>
      </div>
    </div>
  );
};

export default ApiTesting;
