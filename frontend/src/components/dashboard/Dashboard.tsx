import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadDropzone from '../upload/UploadDropzone';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUploadSuccess = (document: any) => {
    console.log('Document uploaded:', document);
    // In Day 4, we will add this document to the list
    alert('Document uploaded successfully!');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
          DocSign
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-slate-300 text-sm">Welcome, {user.name}</span>
          <button 
            onClick={handleLogout}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Upload a Document</h2>
          <p className="text-slate-400">Upload a PDF to start the signing process.</p>
          <UploadDropzone onUploadSuccess={handleUploadSuccess} />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Your Documents</h2>
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
            <p className="text-slate-400 text-lg">
              No documents yet. Upload one above!
            </p>
            <p className="text-slate-500 text-sm mt-2">
              (Document listing will be fully implemented in Day 4)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
