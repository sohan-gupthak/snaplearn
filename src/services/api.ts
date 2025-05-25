// import axios from 'axios';
import api from '../lib/axios';
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

export interface Video {
  id?: string;
  _id?: string; // MongoDB _id
  title: string;
  filename: string;
  filepath: string;
  duration: number;
  filesize: number;
  mimetype: string;
  uploadDate: Date | string; 
  status: 'uploaded' | 'transcribing' | 'generating_questions' | 'completed' | 'error';
  processingProgress?: number; 
  errorMessage?: string;
  createdAt: Date | string; 
  updatedAt: Date | string;
  __v?: number;    // MongoDB version field
}

export interface QuestionOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface SegmentQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  explanation?: string;
}

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  questions?: SegmentQuestion[];
}

export interface Transcript {
  id: string;
  videoId: string;
  fullTranscript: string;
  segments: TranscriptSegment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  videoId: string;
  transcriptSegmentId: string;
  segmentStartTime: number;
  segmentEndTime: number;
  questionText: string;
  options: QuestionOption[];
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const videoApi = {
  uploadVideo: async (file: File, title: string, language?: string): Promise<Video> => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    
    if (language) {
      formData.append('language', language);
    }

    try {
      console.log('Uploading video with title:', title, language ? `language: ${language}` : 'auto-detect language');
      const response = await api.post<ApiResponse<Video>>('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload video');
      }
      
      if (!response.data.data) {
        console.warn('Warning: No data returned in successful response');
        return { 
          title, 
          filename: '', 
          filepath: '',
          duration: 0,
          filesize: 0,
          mimetype: 'video/mp4',
          uploadDate: new Date().toISOString(),
          status: 'uploaded',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Video;
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error in uploadVideo API call:', error);
      throw error;
    }
  },

  getAllVideos: async (): Promise<Video[]> => {
    const response = await api.get<ApiResponse<Video[]>>('/videos');
    return response.data.data;
  },

  getVideoById: async (id: string): Promise<Video> => {
    try {
      if (!id) {
        throw new Error('Video ID is required');
      }
      
      let cleanId = id.trim();
      
      if (cleanId.includes('success') || cleanId.includes('{') || cleanId.includes('}')) {
        try {
          if (cleanId.startsWith('{') && cleanId.endsWith('}')) {
            const parsed = JSON.parse(cleanId);
            cleanId = parsed.id || parsed._id || cleanId;
          } else {
            const idMatch = cleanId.match(/([0-9a-f]{24})/i);
            if (idMatch && idMatch[1]) {
              cleanId = idMatch[1];
            }
          }
        } catch (e) {
          console.warn('Failed to parse ID as JSON, using as-is:', e);
        }
      }
      
      console.log(`Making API request to get video with cleaned ID: ${cleanId}`);
      
      const response = await api.get<ApiResponse<Video>>(`/videos/${cleanId}`);
      
      console.log('Video details response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get video details');
      }
      
      if (!response.data.data) {
        throw new Error('No video data returned from the server');
      }
      
      const videoData = response.data.data;
      
      if (!videoData.id && videoData._id) {
        videoData.id = videoData._id;
      }
      
      return videoData;
    } catch (error) {
      console.error(`Error fetching video with ID ${id}:`, error);
      throw error;
    }
  },

  deleteVideo: async (id: string): Promise<boolean> => {
    const response = await api.delete<ApiResponse<boolean>>(`/videos/${id}`);
    return response.data.success;
  },
  
  updateVideo: async (id: string, updates: Partial<Video>): Promise<Video> => {
    const response = await api.patch<ApiResponse<Video>>(`/videos/${id}`, updates);
    return response.data.data;
  },
};

export const transcriptApi = {
  getTranscriptByVideoId: async (videoId: string): Promise<Transcript> => {
    try {
      const cleanId = videoId.trim();
      console.log(`Fetching transcript for video ID: ${cleanId}`);
      
      const response = await api.get<ApiResponse<Transcript>>(`/transcripts/video/${cleanId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get transcript');
      }
      
      if (!response.data.data) {
        throw new Error('No transcript data returned from the server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching transcript for video ID ${videoId}:`, error);
      throw error;
    }
  },

  transcribeVideo: async (videoId: string): Promise<Transcript> => {
    try {
      const cleanId = videoId.trim();
      console.log(`Requesting transcription for video ID: ${cleanId}`);
      
      const response = await api.get<ApiResponse<Transcript>>(`/transcripts/transcribe/${cleanId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to transcribe video');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error transcribing video ID ${videoId}:`, error);
      throw error;
    }
  },
};

export const questionApi = {
  getQuestionsByVideoId: async (videoId: string): Promise<Question[]> => {
    try {
      const cleanId = videoId.trim();
      console.log(`Fetching questions for video ID: ${cleanId}`);
      
      const response = await api.get<ApiResponse<Question[]>>(`/questions/video/${cleanId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get questions');
      }
      
      if (!response.data.data) {
        console.warn('No questions data returned from the server');
        return [];
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching questions for video ID ${videoId}:`, error);
      return [];
    }
  },

  getQuestionsByTimeRange: async (videoId: string, startTime: number, endTime: number): Promise<Question[]> => {
    try {
      const cleanId = videoId.trim();
      console.log(`Fetching questions for video ID: ${cleanId} in time range ${startTime}-${endTime}`);
      
      const response = await api.get<ApiResponse<Question[]>>(`/questions/video/${cleanId}/timerange`, {
        data: { startTime, endTime },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get questions for time range');
      }
      
      if (!response.data.data) {
        console.warn('No questions data returned for time range');
        return [];
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching questions for time range:`, error);
      return [];
    }
  },

  generateQuestionsForVideo: async (videoId: string): Promise<Question[]> => {
    try {
      const cleanId = videoId.trim();
      console.log(`Generating questions for video ID: ${cleanId}`);
      
      const response = await api.post<ApiResponse<Question[]>>(`/questions/generate/${cleanId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate questions');
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Error generating questions for video ID ${videoId}:`, error);
      return [];
    }
  },

  updateQuestion: async (questionId: string, questionData: Partial<Question>): Promise<Question> => {
    try {
      const cleanId = questionId.trim();
      console.log(`Updating question with ID: ${cleanId}`);
      
      const response = await api.put<ApiResponse<Question>>(`/questions/${cleanId}`, questionData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update question');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error updating question with ID ${questionId}:`, error);
      throw error;
    }
  },

  deleteQuestion: async (questionId: string): Promise<boolean> => {
    try {
      const cleanId = questionId.trim();
      console.log(`Deleting question with ID: ${cleanId}`);
      
      const response = await api.delete<ApiResponse<null>>(`/questions/${cleanId}`);
      
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting question with ID ${questionId}:`, error);
      throw error;
    }
  },
};

export default api;
