
import { format } from "date-fns";
import { Profile } from "../types";

interface ProfileDisplayProps {
  profile: Profile;
  userRole: string | undefined;
}

export function ProfileDisplay({ profile, userRole }: ProfileDisplayProps) {
  const renderField = (label: string, value: string) => (
    <div className="mb-4">
      <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900">{value || "Not provided"}</div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderField("Full Name", profile.full_name)}
        {renderField("Email", profile.email)}
        {renderField("Phone Number", profile.phone_number)}
        {renderField("Address", profile.address)}
        {userRole === "gc_admin" && (
          <>
            {renderField("Company Name", profile.company_name)}
            {renderField("License Number", profile.license_number)}
            {renderField("Website", profile.website)}
          </>
        )}
        {renderField("About", profile.bio)}
        {renderField("Member Since", profile.join_date ? format(new Date(profile.join_date), 'MMMM dd, yyyy') : 'Not available')}
      </div>
    </div>
  );
}
