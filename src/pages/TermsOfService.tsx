import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Website Terms of Use</CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>Version 1.0</p>
            <p>Last revised on: March 11, 2025</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The website located at www.cnstrctnetwork.com (the "Site") is a copyrighted work belonging to CNSTRCT Network, LLC ("Company", "us", "our", and "we"). Certain features of the Site may be subject to additional guidelines, terms, or rules, which will be posted on the Site in connection with such features. All such additional terms, guidelines, and rules are incorporated by reference into these Terms.
          </p>

          <p className="font-semibold">
            THESE TERMS OF USE (THESE "TERMS") SET FORTH THE LEGALLY BINDING TERMS AND CONDITIONS THAT GOVERN YOUR USE OF THE SITE. BY ACCESSING OR USING THE SITE, YOU ARE ACCEPTING THESE TERMS (ON BEHALF OF YOURSELF OR THE ENTITY THAT YOU REPRESENT), AND YOU REPRESENT AND WARRANT THAT YOU HAVE THE RIGHT, AUTHORITY, AND CAPACITY TO ENTER INTO THESE TERMS (ON BEHALF OF YOURSELF OR THE ENTITY THAT YOU REPRESENT). YOU MAY NOT ACCESS OR USE THE SITE OR ACCEPT THE TERMS IF YOU ARE NOT AT LEAST 18 YEARS OLD. IF YOU DO NOT AGREE WITH ALL OF THE PROVISIONS OF THESE TERMS, DO NOT ACCESS AND/OR USE THE SITE.
          </p>

          <p className="font-semibold">
            PLEASE BE AWARE THAT SECTION 8.2 CONTAINS PROVISIONS GOVERNING HOW TO RESOLVE DISPUTES BETWEEN YOU AND COMPANY. AMONG OTHER THINGS, SECTION 8.2 INCLUDES AN AGREEMENT TO ARBITRATE WHICH REQUIRES, WITH LIMITED EXCEPTIONS, THAT ALL DISPUTES BETWEEN YOU AND US SHALL BE RESOLVED BY BINDING AND FINAL ARBITRATION. SECTION 8.2 ALSO CONTAINS A CLASS ACTION AND JURY TRIAL WAIVER. PLEASE READ SECTION 8.2 CAREFULLY.
          </p>

          <p className="font-semibold">
            UNLESS YOU OPT OUT OF THE AGREEMENT TO ARBITRATE WITHIN 30 DAYS: (1) YOU WILL ONLY BE PERMITTED TO PURSUE DISPUTES OR CLAIMS AND SEEK RELIEF AGAINST US ON AN INDIVIDUAL BASIS, NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE ACTION OR PROCEEDING AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION; AND (2) YOU ARE WAIVING YOUR RIGHT TO PURSUE DISPUTES OR CLAIMS AND SEEK RELIEF IN A COURT OF LAW AND TO HAVE A JURY TRIAL.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">1. Accounts</h2>

          <h3 className="text-lg font-semibold mb-1">1.1 Account Creation</h3>
          <p>
            In order to use certain features of the Site, you must register for an account ("Account") and provide certain information about yourself as prompted by the account registration form. You represent and warrant that: (a) all required registration information you submit is truthful and accurate; (b) you will maintain the accuracy of such information. You may delete your Account at any time, for any reason, by following the instructions on the Site. Company may suspend or terminate your Account in accordance with Section 7.
          </p>

          <h3 className="text-lg font-semibold mb-1">1.2 Account Responsibilities</h3>
          <p>
            You are responsible for maintaining the confidentiality of your Account login information and are fully responsible for all activities that occur under your Account. You agree to immediately notify Company of any unauthorized use, or suspected unauthorized use of your Account or any other breach of security. Company cannot and will not be liable for any loss or damage arising from your failure to comply with the above requirements.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">2. Access to the Site</h2>

          <h3 className="text-lg font-semibold mb-1">2.1 License</h3>
          <p>
            Subject to these Terms, Company grants you a non-transferable, non-exclusive, revocable, limited license to use and access the Site solely for your own personal, noncommercial use.
          </p>

          <h3 className="text-lg font-semibold mb-1">2.2 Certain Restrictions</h3>
          <p>
            The rights granted to you in these Terms are subject to the following restrictions: (a) you shall not license, sell, rent, lease, transfer, assign, distribute, host, or otherwise commercially exploit the Site, whether in whole or in part, or any content displayed on the Site; (b) you shall not modify, make derivative works of, disassemble, reverse compile or reverse engineer any part of the Site; (c) you shall not access the Site in order to build a similar or competitive website, product, or service; and (d) except as expressly stated herein, no part of the Site may be copied, reproduced, distributed, republished, downloaded, displayed, posted or transmitted in any form or by any means. Unless otherwise indicated, any future release, update, or other addition to functionality of the Site shall be subject to these Terms. All copyright and other proprietary notices on the Site (or on any content displayed on the Site) must be retained on all copies thereof.
          </p>

          <h3 className="text-lg font-semibold mb-1">2.3 Modification</h3>
          <p>
            Company reserves the right, at any time, to modify, suspend, or discontinue the Site (in whole or in part) with or without notice to you. You agree that Company will not be liable to you or to any third party for any modification, suspension, or discontinuation of the Site or any part thereof.
          </p>

          <h3 className="text-lg font-semibold mb-1">2.4 No Support or Maintenance</h3>
          <p>
            You acknowledge and agree that Company will have no obligation to provide you with any support or maintenance in connection with the Site.
          </p>

          <h3 className="text-lg font-semibold mb-1">2.5 Ownership</h3>
          <p>
            You acknowledge that all the intellectual property rights, including copyrights, patents, trade marks, and trade secrets, in the Site and its content are owned by Company or Company's suppliers. Neither these Terms (nor your access to the Site) transfers to you or any third party any rights, title or interest in or to such intellectual property rights, except for the limited access rights expressly set forth in Section 2.1. Company and its suppliers reserve all rights not granted in these Terms. There are no implied licenses granted under these Terms.
          </p>

          <h3 className="text-lg font-semibold mb-1">2.6 Feedback</h3>
          <p>
            If you provide Company with any feedback or suggestions regarding the Site ("Feedback"), you hereby assign to Company all rights in such Feedback and agree that Company shall have the right to use and fully exploit such Feedback and related information in any manner it deems appropriate. Company will treat any Feedback you provide to Company as non-confidential and non-proprietary. You agree that you will not submit to Company any information or ideas that you consider to be confidential or proprietary.
          </p>

          <h3 className="text-lg font-semibold mb-1">2.7 Indemnification</h3>
          <p>
            You agree to indemnify and hold Company (and its officers, employees, and agents) harmless, including costs and attorneys' fees, from any claim or demand made by any third party due to or arising out of (a) your use of the Site, (b) your violation of these Terms or (c) your violation of applicable laws or regulations. Company reserves the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate with our defense of these claims. You agree not to settle any matter without the prior written consent of Company. Company will use reasonable efforts to notify you of any such claim, action or proceeding upon becoming aware of it.
          </p>

          {/* Sections 3-8 would continue in the same format */}
          
          <h2 className="text-xl font-bold mt-6 mb-2">3. Third-Party Links & Ads; Other Users</h2>
          
          {/* Additional sections content would be added here */}
          
          <h2 className="text-xl font-bold mt-6 mb-2">8. General</h2>
          
          <h3 className="text-lg font-semibold mb-1">8.1 Changes</h3>
          <p>
            These Terms are subject to occasional revision, and if we make any substantial changes, we may notify you by sending you an e-mail to the last e-mail address you provided to us (if any), and/or by prominently posting notice of the changes on our Site. You are responsible for providing us with your most current e-mail address. In the event that the last e-mail address that you have provided us is not valid, or for any reason is not capable of delivering to you the notice described above, our dispatch of the e-mail containing such notice will nonetheless constitute effective notice of the changes described in the notice. Continued use of our Site following notice of such changes shall indicate your acknowledgement of such changes and agreement to be bound by the terms and conditions of such changes.
          </p>
          
          <h3 className="text-lg font-semibold mb-1">8.2 Dispute Resolution</h3>
          <p>
            Please read the following arbitration agreement in this Section (the "Arbitration Agreement") carefully. It requires you to arbitrate disputes with Company, its parent companies, subsidiaries, affiliates, successors and assigns and all of their respective officers, directors, employees, agents, and representatives (collectively, the "Company Parties") and limits the manner in which you can seek relief from the Company Parties.
          </p>
          
          {/* Additional dispute resolution content would be added here */}
          
          <p className="mt-6">
            For the complete Terms of Service, please visit our website at www.cnstrctnetwork.com/terms.
          </p>
          
          <h2 className="text-xl font-bold mt-6 mb-2">Contact Information:</h2>
          <p>
            Eli Kamholtz<br />
            Address: 1039 West Remington Dr, Sunnyvale, California 94087<br />
            Telephone: 5617151885<br />
            Email: ekamholtz@cnstrctnetwork.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
