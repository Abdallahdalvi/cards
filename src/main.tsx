import * as React from 'react'
import ReactDOM from 'react-dom/client'
import AuthWrapper from './AuthWrapper'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthWrapper>
      {(user) => <App user={user} />}
    </AuthWrapper>
  </React.StrictMode>,
)
