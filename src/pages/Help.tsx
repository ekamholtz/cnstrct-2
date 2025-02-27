
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MessageSquare, Send, User, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type FormData = z.infer<typeof formSchema>;

export default function Help() {
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "Hello! This is a placeholder for our AI chatbot. We'll be integrating with Intercom soon. For now, you can use the contact form to reach our support team.", isUser: false },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    toast({
      title: "Support request submitted",
      description: "We'll get back to you as soon as possible.",
    });
    form.reset();
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      setChatMessages([...chatMessages, { text: inputMessage, isUser: true }]);
      
      // Simulate a response (placeholder for actual Intercom integration)
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev, 
          { text: "This is a placeholder response. We'll be integrating with Intercom soon for real-time AI chat support.", isUser: false }
        ]);
      }, 1000);
      
      setInputMessage("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold text-center mb-10">Help & Support</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Form Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Fill out the form below and our team will get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input placeholder="Your name" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input placeholder="Your email" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input placeholder="Your phone number" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question or Issue</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your question or issue in detail..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">Submit Request</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Chatbot Placeholder Section */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Support Chat (Coming Soon)
              </CardTitle>
              <CardDescription>
                This is a placeholder for our upcoming AI chat support powered by Intercom.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              <div className="bg-muted/50 rounded-lg p-4 h-[400px] flex flex-col">
                <div className="flex-grow overflow-auto mb-4 space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.isUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Input 
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-grow"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                This is a demo of our upcoming AI chat support. Full integration with Intercom coming soon.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
