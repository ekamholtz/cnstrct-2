import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "March 16, 2025";
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>CNSTRCT Network, LLC PRIVACY POLICY</CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>Last Updated: {lastUpdated}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            CNSTRCT Network, LLC (the "Company") is committed to maintaining robust privacy protections for its users. 
            Our Privacy Policy ("Privacy Policy") is designed to help you understand how we collect, use and safeguard the 
            information you provide to us and to assist you in making informed decisions when using our Service.
          </p>

          <p>
            For purposes of this Agreement, "Site" refers to the Company's website, which can be accessed at 
            www.cnstrctnetwork.com or through our mobile application.
            "Service" refers to the Company's services accessed via the Site, in which users can manage construction 
            projects, invoices, payments, and financial data.
            The terms "we," "us," and "our" refer to the Company.
            "You" refers to you, as a user of our Site or our Service.
            By accessing our Site or our Service, you accept our Privacy Policy and Terms of Use (found here: 
            <a href="/terms" className="text-blue-600 hover:underline"> Terms of Service</a>), and you consent to our collection, 
            storage, use and disclosure of your Personal Information as described in this Privacy Policy.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">I. INFORMATION WE COLLECT</h2>
          <p>
            We collect "Non-Personal Information" and "Personal Information." Non-Personal Information includes information 
            that cannot be used to personally identify you, such as anonymous usage data, general demographic information 
            we may collect, referring/exit pages and URLs, platform types, preferences you submit and preferences that are 
            generated based on the data you submit and number of clicks. Personal Information includes your email, name, 
            company information, address, phone number, and financial information related to construction projects, which 
            you submit to us through the registration process and use of the Service.
          </p>

          <h3 className="text-lg font-semibold mb-1">1. Information collected via Technology</h3>
          <p>
            To activate the Service you do not need to submit any Personal Information other than your email address. 
            To use the Service thereafter, you do need to submit further Personal Information, which may include: name, 
            company details, address, phone number, and financial information related to construction projects. However, 
            in an effort to improve the quality of the Service, we track information provided to us by your browser or by 
            our software application when you view or use the Service, such as the website you came from (known as the 
            "referring URL"), the type of browser you use, the device from which you connected to the Service, the time 
            and date of access, and other information that does not personally identify you. We track this information 
            using cookies, or small text files which include an anonymous unique identifier. Cookies are sent to a user's 
            browser from our servers and are stored on the user's computer hard drive. Sending a cookie to a user's browser 
            enables us to collect Non-Personal information about that user and keep a record of the user's preferences when 
            utilizing our services, both on an individual and aggregate basis. For example, the Company may use cookies to 
            collect the following information:
          </p>
          <ul className="list-disc pl-8 space-y-1">
            <li>User preferences and settings</li>
            <li>Login status and authentication information</li>
            <li>Analytics data about how you interact with our Service</li>
            <li>Information to personalize your experience</li>
          </ul>
          <p>
            The Company may use both persistent and session cookies; persistent cookies remain on your computer after you 
            close your session and until you delete them, while session cookies expire when you close your browser. For 
            example, we store a persistent cookie to track user authentication status and preferences.
          </p>

          <h3 className="text-lg font-semibold mb-1">2. Information you provide us by registering for an account</h3>
          <p>
            In addition to the information provided automatically by your browser when you visit the Site, to become a 
            subscriber to the Service you will need to create a personal profile. You can create a profile by registering 
            with the Service and entering your email address, and creating a user name and a password. By registering, 
            you are authorizing us to collect, store and use your email address in accordance with this Privacy Policy.
          </p>

          <h3 className="text-lg font-semibold mb-1">3. Children's Privacy</h3>
          <p>
            The Site and the Service are not directed to anyone under the age of 13. The Site does not knowingly collect 
            or solicit information from anyone under the age of 13, or allow anyone under the age of 13 to sign up for 
            the Service. In the event that we learn that we have gathered personal information from anyone under the age 
            of 13 without the consent of a parent or guardian, we will delete that information as soon as possible. If 
            you believe we have collected such information, please contact us at ekamholtz@cnstrctnetwork.com.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">II. HOW WE USE AND SHARE INFORMATION</h2>
          <h3 className="text-lg font-semibold mb-1">Personal Information:</h3>
          <p>
            Except as otherwise stated in this Privacy Policy, we do not sell, trade, rent or otherwise share for marketing 
            purposes your Personal Information with third parties without your consent. We do share Personal Information 
            with vendors who are performing services for the Company, such as the servers for our email communications who 
            are provided access to user's email address for purposes of sending emails from us. Those vendors use your 
            Personal Information only at our direction and in accordance with our Privacy Policy.
          </p>
          <p>
            In general, the Personal Information you provide to us is used to help us communicate with you. For example, 
            we use Personal Information to contact users in response to questions, solicit feedback from users, provide 
            technical support, and inform users about promotional offers.
          </p>
          <p>
            We may share Personal Information with outside parties if we have a good-faith belief that access, use, 
            preservation or disclosure of the information is reasonably necessary to meet any applicable legal process 
            or enforceable governmental request; to enforce applicable Terms of Service, including investigation of 
            potential violations; address fraud, security or technical concerns; or to protect against harm to the rights, 
            property, or safety of our users or the public as required or permitted by law.
          </p>

          <h3 className="text-lg font-semibold mb-1">Non-Personal Information</h3>
          <p>
            In general, we use Non-Personal Information to help us improve the Service and customize the user experience. 
            We also aggregate Non-Personal Information in order to track trends and analyze use patterns on the Site. 
            This Privacy Policy does not limit in any way our use or disclosure of Non-Personal Information and we reserve 
            the right to use and disclose such Non-Personal Information to our partners, advertisers and other third 
            parties at our discretion.
          </p>
          <p>
            In the event we undergo a business transaction such as a merger, acquisition by another company, or sale of 
            all or a portion of our assets, your Personal Information may be among the assets transferred. You acknowledge 
            and consent that such transfers may occur and are permitted by this Privacy Policy, and that any acquirer of 
            our assets may continue to process your Personal Information as set forth in this Privacy Policy. If our 
            information practices change at any time in the future, we will post the policy changes to the Site so that 
            you may opt out of the new information practices. We suggest that you check the Site periodically if you are 
            concerned about how your information is used.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">III. HOW WE PROTECT INFORMATION</h2>
          <p>
            We implement security measures designed to protect your information from unauthorized access. Your account is 
            protected by your account password and we urge you to take steps to keep your personal information safe by not 
            disclosing your password and by logging out of your account after each use. We further protect your information 
            from potential security breaches by implementing certain technological security measures including encryption, 
            firewalls and secure socket layer technology. However, these measures do not guarantee that your information 
            will not be accessed, disclosed, altered or destroyed by breach of such firewalls and secure server software. 
            By using our Service, you acknowledge that you understand and agree to assume these risks.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">IV. YOUR RIGHTS REGARDING THE USE OF YOUR PERSONAL INFORMATION</h2>
          <p>
            You have the right at any time to prevent us from contacting you for marketing purposes. When we send a 
            promotional communication to a user, the user can opt out of further promotional communications by following 
            the unsubscribe instructions provided in each promotional e-mail. You can also indicate that you do not wish 
            to receive marketing communications from us in the Settings section of your account. Please note that 
            notwithstanding the promotional preferences you indicate by either unsubscribing or opting out in the Settings 
            section of the Site, we may continue to send you administrative emails including, for example, periodic updates 
            to our Privacy Policy.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">V. LINKS TO OTHER WEBSITES</h2>
          <p>
            As part of the Service, we may provide links to or compatibility with other websites or applications. However, 
            we are not responsible for the privacy practices employed by those websites or the information or content they 
            contain. This Privacy Policy applies solely to information collected by us through the Site and the Service. 
            Therefore, this Privacy Policy does not apply to your use of a third party website accessed by selecting a link 
            on our Site or via our Service. To the extent that you access or use the Service through or on another website 
            or application, then the privacy policy of that other website or application will apply to your access or use 
            of that site or application. We encourage our users to read the privacy statements of other websites before 
            proceeding to use them.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">VI. CHANGES TO OUR PRIVACY POLICY</h2>
          <p>
            The Company reserves the right to change this policy and our Terms of Service at any time. We will notify you 
            of significant changes to our Privacy Policy by sending a notice to the primary email address specified in your 
            account or by placing a prominent notice on our site. Significant changes will go into effect 30 days following 
            such notification. Non-material changes or clarifications will take effect immediately. You should periodically 
            check the Site and this privacy page for updates.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">VII. CONTACT US</h2>
          <p>
            If you have any questions regarding this Privacy Policy or the practices of this Site, please contact us by 
            sending an email to ekamholtz@cnstrctnetwork.com.
          </p>
          <p className="mt-4">
            Last Updated: {lastUpdated}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
