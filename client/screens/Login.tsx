
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockLogin, mockGoogleLogin, checkUserExists } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User } from '../types';
import { Building2, Users, FileText, Bell, TrendingUp } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const SLIDES = [
  {
    id: 1,
    title: "Central hub for all departments",
    text: "Create Spaces for HR, Sales, Operations and more in one intranet.",
    icon: Users
  },
  {
    id: 2,
    title: "Share pages, documents and policies",
    text: "Publish important information once and keep everyone aligned.",
    icon: FileText
  },
  {
    id: 3,
    title: "Stay updated with announcements & events",
    text: "Company-wide news, events and updates in a single dashboard.",
    icon: Bell
  },
  {
    id: 4,
    title: "Scale from small teams to large companies",
    text: "Start simple and grow into advanced workflows with CompanyHub Pro.",
    icon: TrendingUp
  }
];

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      const user = await mockLogin(email, password);
      onLogin(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setGoogleLoading(true);
      setError('');
      try {
          const googleProfile = await mockGoogleLogin();
          const existingUser = checkUserExists(googleProfile.email);
          if (existingUser) {
              localStorage.setItem('intranet_session', JSON.stringify(existingUser));
              onLogin(existingUser);
              navigate('/');
          } else {
              navigate('/google-signup', { state: { profile: googleProfile } });
          }
      } catch (err: any) {
          setError('Google Sign In failed. Please try again.');
      } finally {
          setGoogleLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT COLUMN - LOGIN */}
      <div className="w-full md:w-[40%] flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 bg-white relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <Building2 size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">CompanyHub</span>
          </div>
          <p className="text-slate-500 font-medium">Your Company’s Internal Workspace</p>
        </div>

        <div className="w-full max-w-sm mx-auto md:mx-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign in to CompanyHub</h1>
            <p className="text-slate-500">Welcome back! Please enter your details.</p>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>}

          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
             <p><strong>Admin:</strong> admin@demo.com / password</p>
             <p><strong>Super Admin:</strong> super@platform.com / password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input 
              label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} 
              placeholder="name@company.com" className="h-11"
            />
            <div>
              <Input 
                label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" className="h-11"
              />
              <div className="flex justify-end mt-1">
                <button type="button" className="text-sm text-red-600 hover:text-red-700 font-medium">Forgot password?</button>
              </div>
            </div>
            
            <Button type="submit" className="w-full h-11 text-base bg-red-600 hover:bg-red-700 focus:ring-red-500" isLoading={loading}>
              Login
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-70"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-red-600 font-semibold hover:underline">
              Register your company
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - ROTATING SLIDES */}
      <div className="hidden md:flex md:w-[60%] bg-gradient-to-br from-red-50 to-slate-50 relative overflow-hidden flex-col justify-center items-center p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-lg w-full">
           <div className="relative h-80">
             {SLIDES.map((slide, index) => {
               const Icon = slide.icon;
               return (
                 <div 
                    key={slide.id}
                    className={`absolute inset-0 flex flex-col items-center text-center transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 translate-x-0' : index < currentSlide ? 'opacity-0 -translate-x-12' : 'opacity-0 translate-x-12'}`}
                 >
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-8 text-red-600 transform transition-transform duration-500 hover:scale-110">
                        <Icon size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      {slide.text}
                    </p>
                 </div>
               );
             })}
           </div>
           <div className="flex justify-center gap-3 mt-8">
             {SLIDES.map((_, index) => (
               <button
                 key={index}
                 onClick={() => setCurrentSlide(index)}
                 className={`transition-all duration-300 rounded-full ${index === currentSlide ? 'w-8 h-2 bg-red-600' : 'w-2 h-2 bg-red-200 hover:bg-red-300'}`}
                 aria-label={`Go to slide ${index + 1}`}
               />
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};
