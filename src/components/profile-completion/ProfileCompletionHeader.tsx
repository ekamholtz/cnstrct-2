import { Progress } from "@/components/ui/progress";

export const ProfileCompletionHeader = () => {
  return (
    <div className="mb-8 text-center">
      <img
        src="/lovable-uploads/9f95e618-31d8-475b-b1f6-978f1ffaadce.png"
        alt="CNSTRCT Logo"
        className="mx-auto h-12 mb-6"
      />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
        <p className="text-gray-500">Please provide your information to continue</p>
      </div>
      <Progress value={66} className="mt-4" />
      <p className="text-sm text-gray-500 mt-2">Step 2 of 3: Profile Information</p>
    </div>
  );
};