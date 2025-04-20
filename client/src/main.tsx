import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

// Set document title
document.title = "Molina Prior Authorization Checker";

// Add meta description
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Check if medications require prior authorization based on Molina Washington Apple Health 2025 formulary';
document.head.appendChild(metaDescription);

// Initialize the app
createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);
