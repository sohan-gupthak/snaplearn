import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoApi, Video } from '../services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatTime, formatFileSize } from '../lib/utils';
import { FileVideo, Plus, Trash2 } from 'lucide-react';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const data = await videoApi.getAllVideos();
        setVideos(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleDeleteVideo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await videoApi.deleteVideo(id);
        setVideos(videos.filter(video => !(video.id === id || video._id === id)));
      } catch (err) {
        console.error('Error deleting video:', err);
        setError('Failed to delete video. Please try again later.');
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'transcribing':
        return 'bg-yellow-100 text-yellow-800';
      case 'generating_questions':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Videos</h1>
        <Link to="/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Upload New Video
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No videos</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a video.</p>
          <div className="mt-6">
            <Link to="/upload">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Upload Video
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="truncate">{video.title}</CardTitle>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(video.status)}`}
                  >
                    {video.status.replace('_', ' ')}
                  </span>
                </div>
                <CardDescription>
                  Uploaded on {new Date(video.uploadDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span>{formatTime(video.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Size:</span>
                    <span>{formatFileSize(video.filesize)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link to={`/video/${video.id || video._id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteVideo(video.id || video._id || '')}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
