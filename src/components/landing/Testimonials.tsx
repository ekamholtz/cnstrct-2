
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

export const Testimonials = () => {
  const testimonials = [
    {
      quote: "CNSTRCT has revolutionized the way we manage our projects—everything is so streamlined and efficient!",
      author: "John Smith",
      role: "General Contractor",
      company: "Smith Construction Inc.",
    },
    {
      quote: "Our team is more connected and our financial processes are simpler than ever thanks to CNSTRCT.",
      author: "Sarah Johnson",
      role: "Project Manager",
      company: "Johnson Builders LLC",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-cnstrct-navy mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from construction professionals who have transformed their business with CNSTRCT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 border-gray-100">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-cnstrct-orange mb-4" />
                <p className="text-lg text-gray-700 italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex flex-col">
                  <span className="font-semibold text-cnstrct-navy">
                    {testimonial.author}
                  </span>
                  <span className="text-sm text-gray-600">
                    {testimonial.role}
                  </span>
                  <span className="text-sm text-gray-600">
                    {testimonial.company}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
