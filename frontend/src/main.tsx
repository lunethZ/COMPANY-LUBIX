import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import { CartProvider } from "./context/CartContext";
import { AuthModalProvider } from "./context/AuthModalContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AuthModalProvider>
            <App />
          </AuthModalProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);
