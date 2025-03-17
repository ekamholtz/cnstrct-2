import { Facebook, Linkedin, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="contact" className="bg-cnstrct-navy text-white pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-4">
            <img
              src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
              alt="CNSTRCT Logo"
              className="h-10 mb-6"
            />
            <p className="text-gray-300 mb-6 max-w-md">
              Revolutionizing construction financial management with digital solutions that streamline payments, invoicing, and project tracking.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cnstrct-orange transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cnstrct-orange transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-cnstrct-orange transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="font-bold text-lg mb-5">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-gray-300 hover:text-cnstrct-orange transition-colors inline-block">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-300 hover:text-cnstrct-orange transition-colors inline-block">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-300 hover:text-cnstrct-orange transition-colors inline-block">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-300 hover:text-cnstrct-orange transition-colors inline-block">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h4 className="font-bold text-lg mb-5">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="/privacy" className="text-gray-300 hover:text-cnstrct-orange transition-colors inline-block">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-300 hover:text-cnstrct-orange transition-colors inline-block">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-cnstrct-orange transition-colors inline-block">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-4">
            <h4 className="font-bold text-lg mb-5">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-cnstrct-orange mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">
                  123 Construction Way<br />
                  Building Suite 101<br />
                  San Francisco, CA 94105
                </p>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-cnstrct-orange mr-3 flex-shrink-0" />
                <a href="tel:+1234567890" className="text-gray-300 hover:text-cnstrct-orange transition-colors">
                  (123) 456-7890
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-cnstrct-orange mr-3 flex-shrink-0" />
                <a href="mailto:info@cnstrct.com" className="text-gray-300 hover:text-cnstrct-orange transition-colors">
                  info@cnstrct.com
                </a>
              </div>
              
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cnstrct-orange focus:border-transparent"
                  />
                  <Button className="bg-cnstrct-orange hover:bg-cnstrct-orangeLight text-white">
                    Subscribe
                  </Button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Subscribe to our newsletter for updates
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} CNSTRCT. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li>
                <a href="#" className="text-gray-400 hover:text-cnstrct-orange text-sm transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cnstrct-orange text-sm transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cnstrct-orange text-sm transition-colors">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
