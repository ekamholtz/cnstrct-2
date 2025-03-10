import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginFormData } from "./authSchemas";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onSubmit: (values: LoginFormData) => Promise<void>;
  loading: boolean;
  onForgotPassword: () => void;
}

export const LoginForm = ({ onSubmit, loading, onForgotPassword }: LoginFormProps) => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                <button
                  type="button"
                  className="text-sm text-cnstrct-orange hover:text-cnstrct-orange/80 font-medium"
                  onClick={onForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-white/70 border-gray-200 pl-10 py-6 rounded-xl focus:ring-cnstrct-orange focus:border-cnstrct-orange"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cnstrct-orange to-cnstrct-orange/90 hover:from-cnstrct-orange/90 hover:to-cnstrct-orange text-white py-6 rounded-xl mt-6 font-medium text-base shadow-lg hover:shadow-xl transition-all"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
};