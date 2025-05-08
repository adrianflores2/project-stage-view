
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </BrowserRouter>
);
