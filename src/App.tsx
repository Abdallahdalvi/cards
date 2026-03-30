import * as React from 'react';
import AuthWrapper from './AuthWrapper';
import { AuthProvider } from './contexts/AuthContext';
import MainApp from './MainApp';

/**
 * Root App component.
 * - Wraps the entire tree with AuthProvider (Supabase Auth context)
 * - AuthWrapper handles login/signup UI and renders children when authenticated
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthWrapper>
        {(userId) => <MainApp userId={userId} />}
      </AuthWrapper>
    </AuthProvider>
  );
};

export default App;
