import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import UploadPage from '../pages/UploadPage';
import VideoDetailsPage from '../pages/VideoDetailsPage';

const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/upload" element={<UploadPage />} />
			<Route path="/video/:id" element={<VideoDetailsPage />} />
		</Routes>
	);
};

export default AppRoutes;
