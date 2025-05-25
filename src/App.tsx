import AppRoutes from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-primary">SnapLearn</h1>
            <p className="text-sm text-gray-500">Generate MCQs from lecture videos</p>
          </div>
        </header>
        <main>
          <AppRoutes />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
