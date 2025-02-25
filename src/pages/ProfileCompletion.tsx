
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainNav } from "@/components/navigation/MainNav";
import { ProfileCompletionForm } from "@/components/profile-completion/ProfileCompletionForm";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

const ProfileCompletion = () => {
  const { form, onSubmit } = useProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto py-8 mt-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileCompletionForm form={form} onSubmit={onSubmit} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCompletion;
