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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-cnstrct-orange hover:bg-cnstrct-orange/90"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-cnstrct-orange hover:underline"
            onClick={onForgotPassword}
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </Form>
  );
};