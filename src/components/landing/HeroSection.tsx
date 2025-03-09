
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "glow";
  onClick?: () => void;
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    src: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <section
      className={cn(
        "bg-gradient-to-br from-cnstrct-navy to-cnstrct-navy/90 text-white",
        "pt-32 pb-20",
        "overflow-hidden relative"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-8 max-w-4xl mx-auto">
          {/* Badge */}
          {badge && (
            <Badge 
              variant="outline" 
              className="animate-[fadeIn_0.5s_ease-out] gap-2 border-cnstrct-orange/30 bg-cnstrct-orange/10 text-cnstrct-orange"
            >
              <span>{badge.text}</span>
              <a href={badge.action.href} className="flex items-center gap-1">
                {badge.action.text}
                <ArrowRightIcon className="h-3 w-3" />
              </a>
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight animate-[slideUp_0.5s_ease-out]">
            {title}
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed animate-[slideUp_0.5s_ease-out_0.1s] opacity-0 [animation-fill-mode:forwards]">
            {description}
          </p>

          {/* Actions */}
          {!user && (
            <div className="flex flex-col md:flex-row gap-6 justify-center animate-[slideUp_0.5s_ease-out_0.2s] opacity-0 [animation-fill-mode:forwards]">
              {actions.map((action, index) => {
                let buttonClass = "";
                if (action.variant === "outline") {
                  buttonClass = "bg-transparent border border-cnstrct-orange text-cnstrct-orange hover:bg-cnstrct-orange/10";
                } else if (action.variant === "glow") {
                  buttonClass = "bg-cnstrct-orange hover:bg-cnstrct-orange/90 shadow-[0_0_15px_rgba(255,87,34,0.5)]";
                } else {
                  buttonClass = "bg-cnstrct-orange hover:bg-cnstrct-orange/90";
                }
                
                return (
                  <Button
                    key={index}
                    size="lg"
                    className={`${buttonClass} text-lg h-14 px-8`}
                    onClick={() => {
                      if (action.onClick) {
                        action.onClick();
                      } else {
                        navigate(action.href);
                      }
                    }}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.text}
                  </Button>
                );
              })}
            </div>
          )}
          
          {!user && (
            <p className="mt-8 text-gray-300 animate-[fadeIn_0.5s_ease-out_0.4s] opacity-0 [animation-fill-mode:forwards]">
              Already managing projects? <Button variant="link" className="text-cnstrct-orange p-0 hover:text-cnstrct-orange/90" onClick={() => navigate("/auth")}>Sign in to your account</Button>
            </p>
          )}

          {/* Image with Glow */}
          <div className="relative pt-12 w-full animate-[slideUp_0.8s_ease-out_0.3s] opacity-0 [animation-fill-mode:forwards]">
            <MockupFrame size="large">
              <Mockup type="browser">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              size="lg"
              className="animate-[fadeIn_1s_ease-out_0.6s] opacity-0 [animation-fill-mode:forwards]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
