
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from '@/context/AppContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentUser, users } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Fetch user data from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (userError) {
          // If user doesn't exist in our users table, check if they're in our local context
          const contextUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (contextUser) {
            // If found in context, also create them in Supabase users table
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                name: contextUser.name,
                email: contextUser.email,
                role: contextUser.role
              });
              
            if (insertError) {
              console.error("Error storing user in database:", insertError);
            } else {
              setCurrentUser({
                id: data.user.id,
                name: contextUser.name,
                email: contextUser.email,
                role: contextUser.role
              });
            }
          } else {
            // Create default worker user if not found
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                name: email.split('@')[0],
                email: email,
                role: 'worker'
              });
              
            if (insertError) {
              console.error("Error creating default user:", insertError);
            } else {
              setCurrentUser({
                id: data.user.id,
                name: email.split('@')[0],
                email: email,
                role: 'worker'
              });
            }
          }
        } else {
          // User found in our database
          setCurrentUser(userData);
        }
        
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex justify-center">
            <Lock className="mr-2" /> Task Management System
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
