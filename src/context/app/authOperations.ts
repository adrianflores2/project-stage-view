
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { User } from '@/types';

export function useAuthOperations(
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>,
  loadInitialData: () => Promise<void>,
  users: User[]
) {
  // Login function implementation
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Fetch user from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
          
        if (!userError && userData) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
          await loadInitialData();
          return true;
        } else {
          console.error("User not found in our database", userError);
          // Check if the user exists in our application's state
          const contextUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (contextUser) {
            // Create user in Supabase users table
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
              return false;
            } else {
              setCurrentUser({
                id: data.user.id,
                name: contextUser.name,
                email: contextUser.email,
                role: contextUser.role
              });
              setIsAuthenticated(true);
              await loadInitialData();
              return true;
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
              return false;
            } else {
              setCurrentUser({
                id: data.user.id,
                name: email.split('@')[0],
                email: email,
                role: 'worker'
              });
              setIsAuthenticated(true);
              await loadInitialData();
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };
  
  // Logout function implementation
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
  };

  return { login, logout };
}
