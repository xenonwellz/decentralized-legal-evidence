import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/ui/layout";
import Dashboard from "./pages/dashboard";
import Cases from "./pages/cases";
import EvidencePage from "./pages/evidence";
import CaseDetailPage from "./pages/case-detail";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <Layout>
                            <Dashboard />
                        </Layout>
                    }
                />
                <Route
                    path="/cases"
                    element={
                        <Layout>
                            <Cases />
                        </Layout>
                    }
                />
                <Route
                    path="/evidence"
                    element={
                        <Layout>
                            <EvidencePage />
                        </Layout>
                    }
                />
                {/* Case detail view */}
                <Route
                    path="/cases/:caseId"
                    element={
                        <Layout>
                            <CaseDetailPage />
                        </Layout>
                    }
                />
                <Route
                    path="*"
                    element={
                        <Layout>
                            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                                <div className="mb-4 text-6xl font-bold text-gray-300">
                                    404
                                </div>
                                <h1 className="text-2xl font-bold text-gray-700 mb-4">
                                    Page Not Found
                                </h1>
                                <p className="text-gray-500 mb-6">
                                    The page you're looking for doesn't exist or
                                    has been moved.
                                </p>
                                <a
                                    href="/"
                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Go Back Home
                                </a>
                            </div>
                        </Layout>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
