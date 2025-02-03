import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img
              src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
              alt="CNSTRCT Logo"
              className="h-8"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-cnstrct-navy hover:text-cnstrct-orange transition-colors">
              Home
            </a>
            <a href="#" className="text-cnstrct-navy hover:text-cnstrct-orange transition-colors">
              About
            </a>
            <Button variant="outline" className="mr-2">
              Login
            </Button>
            <Button className="bg-cnstrct-orange hover:bg-cnstrct-orange/90">
              Register
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6 text-cnstrct-navy" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-cnstrct-navy hover:text-cnstrct-orange transition-colors">
                Home
              </a>
              <a href="#" className="text-cnstrct-navy hover:text-cnstrct-orange transition-colors">
                About
              </a>
              <Button variant="outline" className="w-full">
                Login
              </Button>
              <Button className="w-full bg-cnstrct-orange hover:bg-cnstrct-orange/90">
                Register
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};