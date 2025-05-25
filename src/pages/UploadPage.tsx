import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoApi } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { languageOptions } from '../lib/utils';
import {
  Button,
  FileUpload,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components';

export default function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('auto'); // 'auto' means auto-detect

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    // Auto generate title from filename if not set
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setTitle(fileName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title for the video');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Tracking upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95; // Hold at 95% until the actual upload completes
          }
          return newProgress;
        });
      }, 300);

      // Upload the video
      console.log('Starting video upload with title::', title, 'language::', language);
      const uploadedVideo = await videoApi.uploadVideo(selectedFile, title, language);

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Upload complete! Response data::', JSON.stringify(uploadedVideo, null, 2));
      
      if (!uploadedVideo) {
        console.error('No video data found in response');
        setError('Upload failed: No video data returned from server');
        setUploading(false);
        return;
      }
      
      let videoId = null;
      
      if (typeof uploadedVideo._id === 'string') {
        videoId = uploadedVideo._id;
        console.log(`Using _id string value: ${videoId}`);
      } else if (typeof uploadedVideo.id === 'string') {
        videoId = uploadedVideo.id;
        console.log(`Using id string value: ${videoId}`);
      } else {
        const videoStr = JSON.stringify(uploadedVideo);
        console.log(`Searching for ID in JSON string: ${videoStr}`);
        
        const idMatch = videoStr.match(/"_id"\s*:\s*"([0-9a-f]{24})"/i) || 
                       videoStr.match(/"id"\s*:\s*"([0-9a-f]{24})"/i);
        
        if (idMatch && idMatch[1]) {
          videoId = idMatch[1];
          console.log(`Extracted ID from JSON: ${videoId}`);
        }
      }
      
      console.log('Final extracted video ID:', videoId);
      
      if (!videoId) {
        console.error('Failed to extract a valid video ID from the response');
        setError('Failed to get a valid video ID. Please try again.');
        setUploading(false);
        return;
      }
      
      setError(null);
      
      const navigationPath = `/video/${videoId}`;
      console.log(`Navigation path: ${navigationPath}`);
      
      setTimeout(() => {
        navigate(navigationPath);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error uploading video::', err);
      const errorMessage = err?.message || 'Failed to upload video. Please try again later.';
      setError(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Videos
        </Button>
        <h1 className="text-3xl font-bold">Upload New Video</h1>
        <p className="text-gray-500 mt-2">
          Upload an MP4 video file to transcribe and generate questions
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Video Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Enter video title"
            disabled={uploading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video File
          </label>
          <FileUpload
            onFileSelected={handleFileSelected}
            accept="video/mp4"
            maxSize={500 * 1024 * 1024} // 500MB
            label="Upload Lecture Video"
          />
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Transcription Language
          </label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language (auto-detect if not specified)" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Select the language of the video for more accurate transcription. Leave as auto-detect if unsure.
          </p>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            className="mr-4"
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedFile || !title.trim() || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </div>
      </form>
    </div>
  );
}
