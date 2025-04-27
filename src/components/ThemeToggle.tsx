
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing after component has mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null; // Prevent rendering during server-side rendering
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative"
      aria-label="Toggle theme"
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
    </Button>
  );
}
