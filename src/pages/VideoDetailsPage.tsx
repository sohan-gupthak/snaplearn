import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoApi, transcriptApi, questionApi, Video, Transcript, Question, TranscriptSegment, SegmentQuestion } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { formatTime } from '../lib/utils';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';

export default function VideoDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [video, setVideo] = useState<Video | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [expandedSegments, setExpandedSegments] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Get the ID from the URL parameters
    const rawId = id;
    
    if (!rawId) {
      setError('Invalid video ID');
      setLoading(false);
      return;
    }
    
    let normalizedId = id?.replace(/\s/g, '');
    if (!normalizedId) return;
    
    if (normalizedId.length !== 24) {
      console.log('ID is not a standard MongoDB ObjectId, trying to extract...');
      const idMatch = normalizedId.match(/([0-9a-f]{24})/i);
      if (idMatch && idMatch[1]) {
        normalizedId = idMatch[1];
      } else {
        // Remove any non-alphanumeric characters as a last resort
        normalizedId = normalizedId.replace(/[^a-z0-9]/gi, '');
      }
    }
    
    console.log('Raw ID from URL:', id);
    console.log('Normalized ID for API call:', normalizedId);
    
    let isMounted = true;
    let pollingInterval: NodeJS.Timeout | null = null;
    
    const fetchAllData = async () => {
      if (!normalizedId) return;
      
      try {
        const videoData = await videoApi.getVideoById(normalizedId);
        if (isMounted) {
          setVideo(videoData);
        }
        
        if (videoData.status === 'completed' || videoData.status === 'generating_questions') {
          try {
            const transcriptData = await transcriptApi.getTranscriptByVideoId(normalizedId);
            if (isMounted) {
              setTranscript(transcriptData);
            }
          } catch (err) {
            console.error('Error fetching transcript:', err);
            console.log('Transcript not available yet, will poll for it later');
          }
        } else {
          console.log(`Video status is ${videoData.status}, not fetching transcript yet`);
        }
        
        try {
          const questionsData = await questionApi.getQuestionsByVideoId(normalizedId);
          if (isMounted) {
            setQuestions(questionsData);
          }
        } catch (err) {
          console.error('Error fetching questions:', err);
        }
        
        // Set up polling if video is still processing
        if (videoData.status === 'transcribing' || videoData.status === 'generating_questions') {
          if (!pollingInterval) {
            console.log('Setting up polling for updates...');
            pollingInterval = setInterval(async () => {
              if (!isMounted) return;
              
              try {
                const updatedVideoData = await videoApi.getVideoById(normalizedId);
                console.log('Polling update - Video data:', updatedVideoData);
                console.log('Processing progress:', updatedVideoData.processingProgress);
                
                if (isMounted) {
                  setVideo(updatedVideoData);
                }
                
                if (updatedVideoData.status === 'completed' || updatedVideoData.status === 'generating_questions') {
                  try {
                    console.log('Attempting to fetch transcript during polling...');
                    const updatedTranscriptData = await transcriptApi.getTranscriptByVideoId(normalizedId);
                    if (isMounted) {
                      console.log('Successfully fetched transcript during polling');
                      setTranscript(updatedTranscriptData);
                    }
                  } catch (err) {
                    console.log('Transcript not available yet during polling, will try again later');
                    // Don't stop polling if transcript isn't available yet - i.e. it is still processing
                  }
                } else {
                  console.log(`Video status is ${updatedVideoData.status}, not fetching transcript during polling`);
                }
                
                if (updatedVideoData.status === 'completed' || updatedVideoData.status === 'generating_questions') {
                  try {
                    console.log('Attempting to fetch questions during polling...');
                    const updatedQuestionsData = await questionApi.getQuestionsByVideoId(normalizedId);
                    if (isMounted) {
                      console.log(`Successfully fetched ${updatedQuestionsData.length} questions during polling`);
                      setQuestions(updatedQuestionsData);
                    }
                  } catch (err) {
                    console.log('Questions not available yet during polling, will try again later');
                  }
                } else {
                  console.log(`Video status is ${updatedVideoData.status}, not fetching questions during polling`);
                }
                
                // If processing is complete, clear polling interval
                if (updatedVideoData.status === 'completed') {
                  console.log('Processing complete, clearing polling interval');
                  if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                  }
                }
              } catch (err) {
                console.error('Error polling for updates:', err);
              }
            }, 5000); // Poll for every 5 seconds
          }
        } else if (pollingInterval) {
          // Clearing polling interval if video is no longer processing
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      } catch (err) {
        console.error('Error fetching video details:', err);
        if (isMounted) {
          setError('Failed to load video details. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    setLoading(true);
    fetchAllData();
    
    return () => {
      console.log('Cleaning up polling interval');
      isMounted = false;
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      setUserAnswers({});
      setShowExplanations({});
      setExpandedSegments({});
      setCurrentSegmentIndex(0); // Reset to first segment for new videos
    }
  }, [id]);
  
// Todo: Remove this comment
  const getUniqueQuestionId = (segmentIndex: number, question: SegmentQuestion, questionIndex: number) => {
    return `segment-${segmentIndex}-${question.id || `question-${questionIndex}`}`;
  };
  
// Todo: Remove this comment
  const getUniqueOptionId = (questionId: string, option: any, optionIndex: number) => {
    return `${questionId}-option-${optionIndex}-${option.id || ''}`;
  };

  useEffect(() => {
    if (!transcript || !transcript.segments || transcript.segments.length === 0) return;
    
    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);
      
      // Find the segment that corresponds to the current time
      let segmentIndex = -1;
      for (let i = 0; i < transcript.segments.length; i++) {
        const segment = transcript.segments[i];
        if (currentTime >= segment.startTime && currentTime < segment.endTime) {
          segmentIndex = i;
          break;
        }
      }
      
      // Only update the segment index if we found a valid segment and it's different from the current one
      if (segmentIndex !== -1 && segmentIndex !== currentSegmentIndex) {
        console.log(`Time update: Changing segment from ${currentSegmentIndex} to ${segmentIndex}`);
        setCurrentSegmentIndex(segmentIndex);
      }
    };
    
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
    }
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [transcript, currentSegmentIndex]);

  const handleSegmentClick = (index: number, segment: TranscriptSegment) => {
    setCurrentSegmentIndex(index);
    
    // If the segment has a start time, seek to that position in the video
    if (segment.startTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = segment.startTime;
      videoRef.current.play().catch(err => console.error('Error playing video:', err));
    }
  };
  
  const toggleSegmentExpansion = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setExpandedSegments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    if (!userAnswers[questionId]) {
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: optionId
      }));
      
      setShowExplanations(prev => ({
        ...prev,
        [questionId]: true
      }));
    }
  };

  const handleManualTranscription = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await transcriptApi.transcribeVideo(id);
      
      // Refresh video data
      const videoData = await videoApi.getVideoById(id);
      setVideo(videoData);
      
      setError(null);
    } catch (err) {
      console.error('Error starting transcription:', err);
      setError('Failed to start transcription. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const questionsData = await questionApi.generateQuestionsForVideo(id);
      setQuestions(questionsData);
      
      // Refresh video data
      const videoData = await videoApi.getVideoById(id);
      setVideo(videoData);
      
      setError(null);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError('Failed to generate questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const exportQuestionsToCSV = () => {
    if (!questions.length) return;
    
    const headers = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation'];
    
    const csvRows = [
      headers.join(','),
      ...questions.map(q => {
        const options = q.options.map(opt => opt.text);
        const correctIndex = q.options.findIndex(opt => opt.isCorrect);
        const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];
        
        return [
          `"${q.questionText.replace(/"/g, '""')}"`,
          ...options.map(opt => `"${opt.replace(/"/g, '""')}"`),
          correctLetter,
          `"${(q.explanation || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${video?.title || 'questions'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusText = () => {
    if (!video) return '';
    
    switch (video.status) {
      case 'uploaded':
        return 'Preparing for transcription...';
      case 'transcribing':
        return 'Transcribing video...';
      case 'generating_questions':
        return 'Generating questions...';
      case 'completed':
        return 'Processing complete';
      case 'error':
        return `Error: ${video.errorMessage || 'Unknown error'}`;
      default:
        return '';
    }
  };
  
  const getStatusProgress = () => {
    if (!video) return 0;
    
    console.log('Video progress data:', video.processingProgress);
    
    if (video.processingProgress !== undefined && video.processingProgress !== null) {
      let progress;
      
      if (typeof video.processingProgress === 'number') {
        progress = video.processingProgress;
      } else if (typeof video.processingProgress === 'string') {
        progress = parseFloat(video.processingProgress);
      } else {
        progress = 0;
      }
      
      console.log('Parsed progress value:', progress);
      
      // progress tracking for percentage
      if (progress > 0 && progress < 1) {
        return Math.round(progress * 100);
      }
      
      return Math.round(progress);
    }
    
    // Default progress tracking for status, To Do: Remove this comment
    switch (video.status) {
      case 'uploaded':
        return 10;
      case 'transcribing':
        return 40;
      case 'generating_questions':
        return 70;
      case 'completed':
        return 100;
      case 'error':
        return 100;
      default:
        return 0;
    }
  };

  if (loading && !video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Back to Videos
          </Button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Video not found</span>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Back to Videos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Videos
      </Button>
      
      <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
      
      {video.status !== 'completed' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-blue-700">{getStatusText()}</span>
            <span className="font-medium text-blue-700">{getStatusProgress()}% complete</span>
          </div>
          <Progress value={getStatusProgress()} className="h-3" />
          <p className="text-sm text-gray-600 mt-2">
            {video.status === 'transcribing' ? 
              'Your video is being transcribed. This process may take a few minutes depending on the video length.' : 
              video.status === 'generating_questions' ? 
                'Questions are being generated for each segment of your video. This may take a few minutes.' :
                'Processing your video. Please wait.'}
          </p>
        </div>
      )}
      
      {video.status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">Error: {video.errorMessage || 'Unknown error'}</span>
          <Button
            onClick={handleManualTranscription}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Transcription
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Video</CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={videoRef}
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}/uploads/${video.filename}`}
                controls
                crossOrigin="anonymous"
                onLoadedMetadata={(e) => {
                  // Update video duration in database if it's not already set
                  const videoElement = e.currentTarget;
                  if (videoElement.duration && (!video.duration || video.duration === 0) && id) {
                    console.log(`Updating video duration to ${videoElement.duration} seconds`);
                    videoApi.updateVideo(id, { duration: videoElement.duration });
                  }
                }}
                className="w-full rounded-md"
                poster={video.status === 'error' ? undefined : undefined}
                onError={(e) => console.error('Video error:', e)}
              ></video>
              
              {video.status !== 'completed' && video.status !== 'error' && (
                <div className="mt-2 bg-yellow-50 p-2 rounded-md text-sm">
                  <p className="text-yellow-700 flex items-center">
                    <span className="inline-block h-2 w-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                    {getStatusText()} You can watch the video while processing continues.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transcript</CardTitle>
              {transcript && (
                <div className="text-sm text-gray-500">
                  Current: {formatTime(currentTime)}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {transcript && transcript.segments && transcript.segments.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {(video.status === 'transcribing' || video.status === 'generating_questions') && (
                    <div className="bg-blue-50 p-2 rounded-md mb-4 text-sm flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      <p className="text-blue-700">
                        {video.status === 'transcribing' ? 'Still transcribing more content...' : 'Generating questions...'}
                        <span className="ml-1 text-blue-500 text-xs">{getStatusProgress()}% complete</span>
                      </p>
                    </div>
                  )}
                  
                  {transcript.segments.map((segment, index) => (
                    <div
                      key={index}
                      className={`p-3 mb-2 rounded-md cursor-pointer ${
                        index === currentSegmentIndex
                          ? 'bg-orange-100 border-l-4 border-orange-500 text-orange-900'
                          : segment.questions && segment.questions.length > 0
                            ? 'hover:bg-green-50 border border-green-100'
                            : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleSegmentClick(index, segment)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">
                          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                        </div>
                        {segment.questions && segment.questions.length > 0 && (
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            {segment.questions.length} MCQs
                          </div>
                        )}
                      </div>
                      
                      {/* full transcript text */}
                      <div>
                        {segment.text && segment.text.length > 150 && !expandedSegments[index] ? (
                          <>
                            <p className="mb-1">{segment.text.substring(0, 150)}...</p>
                            <button 
                              onClick={(e) => toggleSegmentExpansion(index, e)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              See more
                            </button>
                          </>
                        ) : segment.text && segment.text.length > 150 ? (
                          <>
                            <p className="mb-1">{segment.text}</p>
                            <button 
                              onClick={(e) => toggleSegmentExpansion(index, e)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              See less
                            </button>
                          </>
                        ) : (
                          <p>{segment.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : video.status === 'transcribing' || video.status === 'generating_questions' ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-blue-700 mb-2">
                    {video.status === 'transcribing' ? 'Processing transcript...' : 'Generating questions...'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {video.status === 'transcribing' ? 
                      'The video is being transcribed. This may take a few minutes.' : 
                      'Questions are being generated for each segment. This may take a few minutes.'}
                  </p>
                </div>
              ) : video.status === 'error' ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Failed to transcribe video</p>
                  <Button onClick={handleManualTranscription}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry Transcription
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No transcript available yet</p>
                  <Button onClick={handleManualTranscription}>
                    Start Transcription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Questions */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Questions</CardTitle>
              {(questions.length > 0 || (transcript && transcript.segments && transcript.segments.some(s => s.questions && s.questions.length > 0))) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportQuestionsToCSV}
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {transcript && transcript.segments && transcript.segments.length > 0 ? (
                <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {transcript.segments && transcript.segments.length > 1 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <h3 className="text-sm font-medium mb-2">Select Segment:</h3>
                      <div className="flex flex-wrap gap-2">
                        {transcript.segments.map((segment, idx) => {
                          // Check if this segment has questions
                          const hasQuestions = segment.questions && segment.questions.length > 0;
                          return (
                            <button
                              key={`segment-btn-${idx}`}
                              onClick={() => {
                                console.log(`Selecting segment ${idx}`);
                                setCurrentSegmentIndex(idx);
                                // Also seek to this segment in the video
                                if (videoRef.current && segment.startTime !== undefined) {
                                  videoRef.current.currentTime = segment.startTime;
                                }
                              }}
                              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                                idx === currentSegmentIndex
                                  ? 'bg-orange-500 text-white ring-2 ring-orange-300 ring-opacity-50'
                                  : hasQuestions 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {Math.floor(segment.startTime / 60)}:{(segment.startTime % 60).toString().padStart(2, '0')}
                              {hasQuestions && ' ✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Questions for current segment */}
                  {currentSegmentIndex >= 0 && transcript.segments[currentSegmentIndex] && (
                    <div>
                      <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">
                            Showing questions for segment {currentSegmentIndex + 1} of {transcript.segments.length}
                            <span className="ml-2 text-gray-500">
                              ({formatTime(transcript.segments[currentSegmentIndex].startTime)} - 
                              {formatTime(transcript.segments[currentSegmentIndex].endTime)})
                            </span>
                          </h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              // Reset answers for current segment questions
                              const newUserAnswers = {...userAnswers};
                              const newShowExplanations = {...showExplanations};
                              
                              // Clear all answers for this segment using the segment prefix
                              Object.keys(newUserAnswers).forEach(key => {
                                if (key.startsWith(`segment-${currentSegmentIndex}-`)) {
                                  delete newUserAnswers[key];
                                  delete newShowExplanations[key];
                                }
                              });
                              
                              setUserAnswers(newUserAnswers);
                              setShowExplanations(newShowExplanations);
                            }}
                          >
                            Reset Quiz
                          </Button>
                        </div>
                      </div>
                      
                      {transcript.segments[currentSegmentIndex].questions && 
                      transcript.segments[currentSegmentIndex].questions.length > 0 ? (
                        <div className="space-y-4">
                          {transcript.segments[currentSegmentIndex].questions.map((question, qIndex) => {
                            const uniqueId = `segment-${currentSegmentIndex}-question-${qIndex}-${question.id || ''}`;
                            
                            return (
                              <div key={uniqueId} className="border rounded-md p-4 mb-3">
                                <h3 className="font-medium mb-3">
                                  {qIndex + 1}. {question.question}
                                </h3>
                                <div className="space-y-2 ml-4">
                                  {question.options.map((option, oIndex) => {
                                    const optionId = `${uniqueId}-option-${oIndex}`;
                                    const isSelected = userAnswers[uniqueId] === optionId;
                                    const hasAnswered = userAnswers[uniqueId] !== undefined;
                                    
                                    let optionStyle = '';
                                    if (hasAnswered) {
                                      if (option.isCorrect) {
                                        optionStyle = 'bg-green-100 border border-green-500 text-green-800';
                                      } else if (isSelected) {
                                        optionStyle = 'bg-red-100 border border-red-500 text-red-800';
                                      } else {
                                        optionStyle = 'bg-gray-50 border border-gray-200 text-gray-800';
                                      }
                                    } else {
                                      optionStyle = 'bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer';
                                    }
                                    
                                    return (
                                      <div
                                        key={optionId}
                                        className={`p-2 rounded-md transition-colors ${optionStyle}`}
                                        onClick={() => handleAnswerSelect(uniqueId, optionId)}
                                      >
                                        <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                                        {option.text}
                                        {hasAnswered && option.isCorrect && (
                                          <span className="ml-2 text-green-600">✓</span>
                                        )}
                                        {hasAnswered && isSelected && !option.isCorrect && (
                                          <span className="ml-2 text-red-600">✗</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {question.explanation && showExplanations[uniqueId] && (
                                  <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-3 rounded-md border border-blue-200">
                                    <span className="font-medium">Explanation: </span>
                                    {question.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-gray-50 rounded-md">
                          <p className="text-gray-500">No questions available for this segment.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {questions.length > 0 && currentSegmentIndex >= 0 && 
                   transcript.segments[currentSegmentIndex] && 
                   (!transcript.segments[currentSegmentIndex].questions || 
                    transcript.segments[currentSegmentIndex].questions.length === 0) ? (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">
                            Showing questions from database
                            {transcript && currentSegmentIndex !== -1 && (
                              <span className="ml-2 text-gray-500">
                                (Segment {currentSegmentIndex + 1}: 
                                {Math.floor(transcript.segments[currentSegmentIndex].startTime / 60)}:{(transcript.segments[currentSegmentIndex].startTime % 60).toString().padStart(2, '0')} - 
                                {Math.floor(transcript.segments[currentSegmentIndex].endTime / 60)}:{(transcript.segments[currentSegmentIndex].endTime % 60).toString().padStart(2, '0')})
                              </span>
                            )}
                          </h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              const filteredQuestions = questions.filter(q => 
                                transcript && currentSegmentIndex !== -1
                                  ? q.segmentStartTime === transcript.segments[currentSegmentIndex].startTime
                                  : true
                              );
                              
                              const newUserAnswers = {...userAnswers};
                              const newShowExplanations = {...showExplanations};
                              
                              // Clear answers for legacy questions
                              filteredQuestions.forEach((q, idx) => {
                                delete newUserAnswers[q.id];
                                delete newShowExplanations[q.id];
                                delete newUserAnswers[`legacy-q-${idx}`];
                                delete newShowExplanations[`legacy-q-${idx}`];
                              });
                              
                              // Also clear any keys that start with 'legacy-'
                              Object.keys(newUserAnswers).forEach(key => {
                                if (key.startsWith('legacy-')) {
                                  delete newUserAnswers[key];
                                  delete newShowExplanations[key];
                                }
                              });
                              
                              setUserAnswers(newUserAnswers);
                              setShowExplanations(newShowExplanations);
                            }}
                          >
                            Reset Quiz
                          </Button>
                        </div>
                      </div>
                      
                      {questions
                        .filter(q => 
                          transcript && currentSegmentIndex !== -1
                            ? q.segmentStartTime === transcript.segments[currentSegmentIndex].startTime
                            : true
                        )
                        .map((question, qIndex) => (
                          <div key={question.id} className="border rounded-md p-4">
                            <h3 className="font-medium mb-3">
                              {qIndex + 1}. {question.questionText}
                            </h3>
                            <div className="space-y-2 ml-4">
                              {question.options.map((option, oIndex) => {
                                const questionId = question.id || `legacy-q-${qIndex}`;
                                const optionId = `legacy-opt-${qIndex}-${oIndex}`;
                                const isSelected = userAnswers[questionId] === optionId;
                                const hasAnswered = userAnswers[questionId] !== undefined;
                                
                                // Right answer in green, wrong answer in red, unselected in gray
                                let optionStyle = '';
                                if (hasAnswered) {
                                  if (option.isCorrect) {
                                    optionStyle = 'bg-green-100 border border-green-500 text-green-800';
                                  } else if (isSelected) {
                                    optionStyle = 'bg-red-100 border border-red-500 text-red-800';
                                  } else {
                                    optionStyle = 'bg-gray-50 border border-gray-200 text-gray-800';
                                  }
                                } else {
                                  optionStyle = 'bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer';
                                }
                                
                                return (
                                  <div
                                    key={optionId}
                                    className={`p-2 rounded-md transition-colors ${optionStyle}`}
                                    onClick={() => handleAnswerSelect(questionId, optionId)}
                                  >
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                                    {option.text}
                                    {hasAnswered && option.isCorrect && (
                                      <span className="ml-2 text-green-600">✓</span>
                                    )}
                                    {hasAnswered && isSelected && !option.isCorrect && (
                                      <span className="ml-2 text-red-600">✗</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {question.explanation && showExplanations[question.id || `legacy-q-${qIndex}`] && (
                              <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-3 rounded-md border border-blue-200">
                                <span className="font-medium">Explanation: </span>
                                {question.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      {video.status === 'generating_questions' ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                          <p className="text-blue-700">
                            Generating questions for segments... ({getStatusProgress()}% complete)
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Questions will appear here as they're generated. Check segments with a green indicator.
                          </p>
                        </div>
                      ) : transcript && transcript.segments && transcript.segments.some(s => s.questions && s.questions.length > 0) ? (
                        <div>
                          <p className="text-gray-500 mb-4">
                            No questions available for this segment. Select another segment with a green indicator.
                          </p>
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                            <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded-full">MCQs</span>
                            <span>= Questions available</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 mb-4">
                            No questions available for any segment yet.
                          </p>
                          <Button onClick={handleGenerateQuestions}>
                            Generate Questions
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : video.status === 'generating_questions' ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p>Generating questions...</p>
                </div>
              ) : video.status === 'error' ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Failed to generate questions</p>
                  <Button onClick={handleGenerateQuestions}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry Question Generation
                  </Button>
                </div>
              ) : video.status === 'completed' ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No questions available yet</p>
                  <Button onClick={handleGenerateQuestions}>
                    Generate Questions
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Questions will be generated after transcription is complete
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
