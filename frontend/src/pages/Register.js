import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/employee');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/1527549/pexels-photo-1527549.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)',
        }}
      ></div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl tracking-tighter font-black mb-2" data-testid="register-page-title">
              CREATE ACCOUNT
            </h1>
            <p className="text-sm text-zinc-500">Register as a new employee</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            <div>
              <Label htmlFor="name" className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="register-name-input"
                className="mt-1 rounded-none border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:border-zinc-950"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="register-email-input"
                className="mt-1 rounded-none border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:border-zinc-950"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="register-password-input"
                className="mt-1 rounded-none border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:border-zinc-950"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200" data-testid="register-error-message">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full rounded-none border border-zinc-950 shadow-none hover:bg-zinc-900 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-zinc-950 hover:underline" data-testid="register-login-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
