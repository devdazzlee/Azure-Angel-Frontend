import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 md:p-12"
      >
        <h1 className="text-4xl font-bold text-teal-600 mb-4 text-center">
          Privacy Policy for Founderport
        </h1>
        <p className="text-center text-gray-600 mb-8">Effective Date: August 24, 2025</p>

        <div className="prose prose-slate max-w-none space-y-6 text-gray-700 leading-relaxed">
          
          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Introduction</h2>
          <p>
            Founderport, Inc. ("Founderport," "we," "us," or "our") is a California-based technology company offering an AI-driven entrepreneurial support tool called Founderport. We are committed to protecting your privacy and complying with applicable data protection laws in the United States and internationally. This Privacy Policy explains what information we collect from users ("you" or "user"), how we use and share it, and your rights regarding that information. Founderport primarily serves U.S. customers but welcomes a global user base, and we adhere to major privacy laws including the EU General Data Protection Regulation (GDPR) and California Consumer Privacy Act/California Privacy Rights Act (CCPA/CPRA), among others. Our platform is intended for adults (18 years and older) and is not directed at children or minors. By using Founderport or any Founderport services, you agree to the practices described in this policy. We encourage you to read it carefully and contact us with any questions.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Information We Collect</h2>
          <p>
            We collect both personal information and business-related information from you to provide and improve our services. This includes:
          </p>
          
          <div className="space-y-4 ml-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Identifiers</h3>
              <p>Your name and contact details (such as email address and login credentials). We also collect basic location information (e.g. city, state, country) to tailor service provider recommendations to your region.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">Demographic Details</h3>
              <p>Your age (date of birth or age range) and other profile information such as education level and professional experience. This helps Founderport customize advice based on your background. We only allow users 18 or older, and do not intentionally collect data from anyone under 18 (see Children's Privacy below).</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
              <p>Details about your business ideas, plans, and entrepreneurial goals that you choose to share with Founderport. This can include descriptions of your proposed products or services, business strategies, and any other information you input into the platform about your startup or project. We understand these ideas may be sensitive, and we treat them as confidential user data.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">Usage Data</h3>
              <p>Information about how you interact with our platform. This includes technical data like your IP address, device type, browser type, and operating system, as well as logs of your activities within Founderport (e.g. pages or features used, timestamps, error reports). We may also collect information via cookies and similar technologies (see Cookies and Tracking below), such as your preferences and browsing actions on our site. This usage data helps us secure the service and improve user experience.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">Third-Party Integrations</h3>
              <p>If you choose to connect Founderport with external services (for example, in the future connecting to accounting software or e-commerce platforms), we may receive information from those services with your permission. We will inform you and obtain consent when such integrations involve transferring your personal data.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">Communications</h3>
              <p>If you contact us for support or feedback, we collect the information you provide in those correspondences (email address, the content of your message, etc.). We also retain your responses to any surveys or questionnaires (like our initial Get to Know You (GKY) onboarding questionnaire) that help us tailor Founderport's guidance to you.</p>
            </div>
          </div>

          <p className="mt-4">
            We collect most information directly from you. In some cases, we may collect data automatically (e.g. via cookies) or from third parties (for example, if we add features to import data from social profiles or partner services, with your consent). We will only collect and process personal information that is adequate, relevant, and limited to what is necessary in relation to the purposes described in this policy, consistent with principles of data minimization under GDPR.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">How We Use Your Information</h2>
          <p>
            Founderport uses the collected information to operate, provide, and improve the Founderport platform and related services. The primary purposes for which we use your personal and business information include:
          </p>

          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Providing Services:</strong> We use your information to create and personalize your Founderport experience. For example, Founderport uses your input (profile details, business idea information, etc.) to generate customized business plans, guidance, and task roadmaps tailored to you. We also use personal identifiers to maintain your account and authenticate you at login. Processing your data for these purposes is generally necessary to perform our contract with you (providing the services you signed up for).</li>
            
            <li><strong>Platform Functionality and Support:</strong> Your data allows Founderport to carry out features you request, such as connecting you with relevant service providers in the Business Services Network (BSN). For instance, Founderport might use your location or industry information to suggest local service providers or resources. We may also use information about your progress and usage (e.g. which tasks you've completed) to deliver gamification features like progress bars and achievement badges. Additionally, we use contact information to send you service-related communications (e.g. important account notices or customer support responses).</li>
            
            <li><strong>Improvement and Analytics:</strong> We analyze usage data and feedback to understand how our platform is used and to improve its functionality, performance, and user experience. This helps us troubleshoot issues, develop new features, and refine Founderport's AI capabilities. For example, we may review aggregated usage patterns to decide which new integrations or educational resources would benefit our users. We may also use anonymized business idea data in aggregate to identify common challenges entrepreneurs face and improve our advice. These processing activities are in our legitimate interests as a business to continuously enhance our services, provided they do not override your privacy rights. Additionally, we collect information provided by you and Founderport to analyze for economic, entrepreneurship and other pertinent insights which we may share with institutions (educational institutions, non-government organizations, government entities, economic-related organizations etc.) to study for economic insights.</li>
            
            <li><strong>Security and Fraud Prevention:</strong> We are committed to protecting user data and the integrity of our platform. Information (like IP addresses and log-in history) is used to monitor for suspicious activities, verify user identities as needed, and prevent unauthorized access or fraud. We employ measures such as encryption, firewalls, and access controls to secure your data. Using data for security purposes also helps us comply with legal obligations to safeguard personal information.</li>
            
            <li><strong>Legal Compliance:</strong> We may process and retain your information as needed to comply with applicable laws and regulations. For example, we could be required to retain certain data for tax, audit, or court order purposes, or to respond to lawful requests by government authorities.</li>
            
            <li><strong>Communications and Marketing:</strong> We do not spam our users, but with your consent we may send newsletters or promotional communications about new features, offers, or resources that could help in your entrepreneurial journey. You have the choice to opt out of marketing emails at any time (see Your Rights and Choices below). Even if you opt out of marketing messages, you will continue to receive essential transactional or account communications (for instance, password resets or important service notices). We may also provide anonymized Founderport customer data to share with advertisers.</li>
          </ul>

          <p className="mt-4">
            We will ask for your consent before using your personal data for any purpose that is not covered by the above bases or that is incompatible with the purposes for which it was originally collected. In all cases, we strive to be transparent about our data practices and to ensure that we have a valid legal basis for processing your information under laws like the GDPR. We do not engage in automated decision-making that produces legal or similarly significant effects on you without human involvement; Founderport's AI provides suggestions and assistance, but final decisions (such as entering into contracts or obtaining licenses) remain with you as the user.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">How We Share Your Information</h2>
          <p>
            Founderport understands the importance of your personal and business information and only shares it in limited situations, with appropriate safeguards. We do not sell your personal information to third parties for profit. We may disclose information to the following categories of recipients for the purposes outlined below:
          </p>

          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Service Providers:</strong> We share personal data with trusted third-party service providers who perform functions on our behalf. These include cloud hosting providers (for data storage and servers), analytics services (to help us understand how users interact with our platform), email or IT service providers, and customer support tools. These companies are bound by contractual obligations to process personal data only under our instructions and to protect it.</li>
            
            <li><strong>Business Services Network (BSN) Partners:</strong> One of Founderport's features is connecting entrepreneurs with external service providers (like legal, financial, or technical experts) through our BSN. By default, when Founderport searches the BSN for suitable providers for you, we share only anonymized or aggregated information about your needs rather than your personal identity. For instance, Founderport might communicate that "a user's startup needs a prototyping service in Seattle" without revealing who you are.</li>
            
            <li><strong>Business Partners and Integrations:</strong> In the future, Founderport may integrate with or form partnerships with external platforms (e.g. accounting software like QuickBooks, e-commerce platforms like Shopify, etc.) to enhance Founderport's capabilities. If you choose to use such integrations, we will share the minimum necessary data with those partners to activate or operate the integration – only with your knowledge and consent.</li>
            
            <li><strong>Anonymized Insights:</strong> We may compile and share information in an aggregated, de-identified form that cannot reasonably identify you. For example, we might publish statistics like "X% of Founderport users are interested in tech startups" or share anonymized usage trends with research collaborators or investors. Such aggregated data is not considered personal under privacy laws because it does not reveal individual identities.</li>
            
            <li><strong>Legal and Safety Disclosures:</strong> We may disclose personal information if required to do so by law or legal process, or if we have a good-faith belief that such action is necessary to (i) comply with applicable laws, regulations, legal requests (e.g. a subpoena or court order); (ii) enforce our Terms of Service or other agreements; (iii) protect the rights, property, or safety of Founderport, our users, or the public.</li>
            
            <li><strong>Business Transfers:</strong> If Founderport undergoes a business transaction such as a merger, acquisition by another company, reorganization, or sale of all or part of its assets, user information (which is one of our business assets) may be transferred to the successor entity. Should such an event occur, we will ensure that your personal data remains protected by this Privacy Policy (unless, and until, it is amended as described in Changes to This Policy).</li>
          </ul>

          <p className="mt-4">
            <strong>No Sale of Personal Information:</strong> Founderport does not sell your personal information to third parties for monetary value. In the context of U.S. privacy laws, "sale" can include certain data sharing. We want to clarify that any data sharing we do is either (a) with service providers under strict data use contracts, or (b) in anonymized form with partners, or (c) at your direct request – none of which constitutes selling your data for profit.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Cookies and Tracking Technologies</h2>
          
          <h3 className="text-lg font-semibold text-gray-900 mt-4">What Are Cookies?</h3>
          <p>
            Cookies are small text files stored on your device by websites you visit. We, and our third-party analytics and advertising partners, use cookies and similar technologies (such as web beacons and local storage) to ensure our platform functions properly, to analyze usage, and to personalize your experience.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">Types of Cookies We Use:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Essential Cookies:</strong> These are necessary for the operation of our website and platform. For example, they enable core functionalities such as user authentication and security.</li>
            <li><strong>Analytics and Performance Cookies:</strong> We use these to collect information about how users interact with our site (e.g. which pages are visited most often, and if users get error messages on certain pages). This helps us improve how the website works.</li>
            <li><strong>Functional Cookies:</strong> These remember your choices and preferences to provide a more personalized experience.</li>
            <li><strong>Advertising/Marketing Cookies:</strong> As of now, Founderport does not display third-party ads on the platform, so we do not use advertising cookies for third-party targeted ads.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">Cookie Consent and Your Choices</h3>
          <p>
            In jurisdictions that require it (such as the EU/EEA under the GDPR), we will obtain your consent before using non-essential cookies on our site. You can change your cookie preferences at any time by adjusting the settings in that banner (if available) or by modifying your browser settings. Most web browsers allow you to refuse or delete cookies through the browser's settings.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Data Storage and Retention</h2>
          
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Data Storage Locations</h3>
          <p>
            Founderport is headquartered in the United States, and the personal data we collect is primarily stored and processed on secure servers located in the U.S. We may use reputable cloud service providers to host our application and data (for example, AWS or Azure data centers in the U.S.). If you are accessing our platform from outside the U.S., be aware that your information will be transferred to and stored on servers in the U.S.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">Security Measures</h3>
          <p>
            We maintain appropriate technical and organizational security measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. This includes using encryption in transit and at rest, firewalls, secure network architectures, access controls, and data segregation. For example, data you provide to our website is transmitted using TLS/SSL encryption. We restrict access to personal data to authorized personnel who need it to operate our business, and they are subject to confidentiality obligations.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">Data Retention Period</h3>
          <p>
            We will retain your personal data only for as long as necessary to fulfill the purposes we collected it for, including for the purposes of providing the service and satisfying any legal, accounting, or reporting requirements. In practical terms:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>For active account holders, we keep the information you provide for as long as your account is in use so that we can provide the service to you.</li>
            <li>If you decide to delete your account or if your account becomes inactive, we will initiate the process to delete or anonymize your personal information.</li>
            <li>Any data that we do keep will be subject to this Privacy Policy and will only be used for the aforementioned necessary reasons.</li>
          </ul>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">International Data Transfers</h2>
          <p>
            Founderport's users are global, so your personal information may be transferred to, and processed in, countries other than your country of residence. Primarily, data is collected and stored in the United States. If you reside outside the U.S., this means your data will likely be transferred to the U.S. for processing. The U.S. may not have the same level of data protection laws as those in your home country, but please be assured that we take steps to protect your privacy in line with this Policy and applicable law.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Your Rights and Choices</h2>
          <p>
            You have important privacy rights regarding the personal information we hold about you. Founderport is committed to honoring your rights under applicable data protection laws such as GDPR and CCPA/CPRA. Depending on your jurisdiction, these rights may include:
          </p>

          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Right to Access:</strong> You can request confirmation of whether we are processing your personal data, and if so, request a copy of the data we have about you.</li>
            <li><strong>Right to Rectification (Correction):</strong> If any of your personal information is inaccurate or incomplete, you have the right to request that we correct or update it.</li>
            <li><strong>Right to Deletion:</strong> You may request that we delete the personal information we have collected from you (and direct our service providers to do the same), subject to certain exceptions.</li>
            <li><strong>Right to Data Portability:</strong> You have the right to obtain your personal data in a structured, commonly used, and machine-readable format, and to have that data transmitted to another controller where technically feasible.</li>
            <li><strong>Right to Restrict or Object to Processing:</strong> Under GDPR, you can request that we restrict processing of your data in certain circumstances – for instance, if you contest the accuracy of the data or if you object to our processing.</li>
            <li><strong>Right to Withdraw Consent:</strong> In cases where we rely on your consent to process personal data (e.g. for sending promotional emails or collecting certain cookies), you have the right to withdraw that consent at any time.</li>
            <li><strong>Right to Non-Discrimination:</strong> If you exercise any of your privacy rights, we will not discriminate against you for doing so.</li>
            <li><strong>Right to Complain:</strong> If you believe your privacy rights have been violated, you have the right to lodge a complaint with a supervisory authority.</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-4">Exercising Your Rights</h3>
          <p>
            You may exercise any of the above rights by contacting us using the information provided in the Contact Us section below. For certain requests (access, deletion, etc.), we will need to verify your identity to ensure we are protecting your information from unauthorized access or deletion by someone else.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Children's Privacy</h2>
          <p>
            Founderport is not intended for individuals under the age of 18. We do not knowingly solicit or collect personal information from children or teenagers under 18 years old. Our platform is designed for adult entrepreneurs and requires users to attest that they are 18 or older during the account registration process. If you are under 18, you should not use the Founderport platform or provide any personal information to us. If we become aware that we have inadvertently received personal information from someone under 18, we will take immediate steps to delete that information.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Changes to This Policy</h2>
          <p>
            We may update or modify this Privacy Policy from time to time to reflect changes in our business, legal or regulatory requirements, or to address new features and data practices. When we make changes, we will post the updated policy on our website and change the "Last Updated" or "Effective Date" at the top of this policy. If the changes are significant, we will provide a more prominent notice (such as by email notification to registered users or a notice on our homepage) to inform you of the update. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting the personal information we collect.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please do not hesitate to contact us. We are here to help and committed to addressing any privacy-related issues. You may reach our privacy team through the following:
          </p>
          
          <div className="bg-teal-50 border-l-4 border-teal-400 p-4 my-6">
            <p className="font-semibold text-gray-900">Email: support@founderport.ai</p>
            <p className="mt-2 text-gray-700">Postal Mail: Founderport, Inc., Attn: Privacy Officer, San Diego, CA, USA</p>
            <p className="mt-2 text-gray-700">In-App: If you are logged in, you may also send us a message through the support/chat feature of the Founderport platform for privacy inquiries.</p>
          </div>

          <p>
            We will respond to legitimate inquiries as soon as reasonably possible, and at latest within any timeframes required by law. If you contact us to exercise a privacy right, please provide sufficient information for us to verify your identity and to understand and respond to your request.
          </p>

          <p className="mt-4">
            Thank you for trusting Founderport with your entrepreneurial journey. We value your privacy and are constantly striving to protect and respect your personal information while delivering a transformative business-building experience. If anything in this Privacy Policy is unclear, please reach out – we're here to help. Your use of our platform is subject not only to this Privacy Policy but also to our Terms of Service. We encourage you to read both documents fully.
          </p>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Last Updated: August 24, 2025</p>
            <p className="mt-2">© {new Date().getFullYear()} Founderport Corporation. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;

