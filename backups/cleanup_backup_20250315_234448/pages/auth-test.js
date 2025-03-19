import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function AuthTest() {
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    if (user) {
      setUserDetails(user);
    }
  }, [user]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Signed in successfully!' });
      setUserDetails(data.user);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: 'Sign up successful! Please check your email for confirmation.'
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserDetails(null);
      setMessage({ type: 'success', text: 'Signed out successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Supabase Auth Test</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded border ${
          message.type === 'success' 
            ? 'bg-green-100 border-green-400 text-green-700' 
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {userDetails ? (
        <div className="mb-6">
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">User Details</h2>
            <p><strong>Email:</strong> {userDetails.email}</p>
            <p><strong>ID:</strong> {userDetails.id}</p>
            <pre className="bg-gray-200 p-2 rounded mt-2 overflow-x-auto text-xs">
              {JSON.stringify(userDetails, null, 2)}
            </pre>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Loading...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <form className="bg-white rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </div>
        </form>
      )}
      
      <div className="mt-8">
        <a href="/" className="text-blue-500 hover:underline">Back to home</a>
      </div>
    </div>
  );
} 