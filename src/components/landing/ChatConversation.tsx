
import { MessageSquare } from "lucide-react";

export const ChatConversation = () => {
  const conversation = [
    {
      sender: "GC1",
      message: "I'm constantly dealing with project delays and endless paperwork. It's a nightmare trying to keep track of everything manually!",
    },
    {
      sender: "GC2",
      message: "I used to struggle with that too, but since I started using CNSTRCT, all my projects are streamlined and real-time tracking has made delays a thing of the past.",
    },
    {
      sender: "GC1",
      message: "Invoicing was a total headache—late payments and constant errors were the norm.",
    },
    {
      sender: "GC2",
      message: "Absolutely! CNSTRCT automates invoicing and payments, so now I never miss a payment or deal with errors.",
    },
    {
      sender: "GC1",
      message: "And the communication on job sites? It was always so disorganized.",
    },
    {
      sender: "GC2",
      message: "With CNSTRCT, everyone is connected with real-time updates and collaborative tools. It's completely transformed how we work.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-cnstrct-navy mb-4">
            Real Contractors, Real Solutions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how contractors like you are transforming their business with CNSTRCT
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === "GC2" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start max-w-[80%] md:max-w-[70%] ${
                  message.sender === "GC2" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full ${
                    message.sender === "GC2" ? "ml-3" : "mr-3"
                  } ${
                    message.sender === "GC2" ? "bg-cnstrct-orange" : "bg-cnstrct-navy"
                  }`}
                >
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div
                  className={`p-4 rounded-2xl ${
                    message.sender === "GC2"
                      ? "bg-cnstrct-orange text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className={`text-sm md:text-base ${
                    message.sender === "GC2" ? "text-white" : "text-gray-700"
                  }`}>
                    {message.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
