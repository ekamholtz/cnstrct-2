import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © {currentYear} CNSTRCT. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link to="/help" className="text-sm text-gray-600 hover:text-cnstrct-navy">
              Help
            </Link>
            <Link to="/privacy-policy" className="text-sm text-gray-600 hover:text-cnstrct-navy">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-cnstrct-navy">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
