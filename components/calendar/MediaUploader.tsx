import React, { useState } from "react";
import { Image, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaUploaderProps {
  mediaUrls: string[];
  onMediaChange: (urls: string[]) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  mediaUrls,
  onMediaChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Process each file one at a time
      const newUrls = [...mediaUrls];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.match("image/jpeg|image/png|image/gif")) {
          setUploadError("Only JPG, PNG, and GIF images are allowed");
          continue;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadError("File size cannot exceed 10MB");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to upload file");
        }

        const data = await response.json();
        newUrls.push(data.fileUrl);
      }

      onMediaChange(newUrls);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Clear the file input
      e.target.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newUrls = [...mediaUrls];
    newUrls.splice(index, 1);
    onMediaChange(newUrls);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
        <Image className="h-10 w-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-600">Drag & drop image here or</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 relative"
          disabled={isUploading}
        >
          {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isUploading ? "Uploading..." : "Select File"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
            multiple
            disabled={isUploading}
          />
        </Button>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF up to 10MB</p>
        {uploadError && (
          <p className="text-xs text-red-500 mt-2">{uploadError}</p>
        )}
      </div>

      {mediaUrls.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Uploaded Media</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {mediaUrls.map((url, index) => (
              <div
                key={index}
                className="relative aspect-video border rounded-md overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
