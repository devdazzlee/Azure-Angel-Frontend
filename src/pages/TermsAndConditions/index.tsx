import React from 'react';
import { motion } from 'framer-motion';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 md:p-12"
      >
        <h1 className="text-4xl font-bold text-teal-600 mb-8 text-center">
          TERMS AND CONDITIONS
        </h1>

        <div className="prose prose-slate max-w-none space-y-6 text-gray-700 leading-relaxed">
          <p>
            These Terms and Conditions govern the User Experience Agreement between you the User (in this
            Agreement hereinafter referred to as either "you," "your," "client," "contributor," "customer," and/or
            "user"), and Founderport Corporation, (in this agreement hereinafter referred to as either "Founderport Corporation," "Founderport," "Company," " we", "us" the Tool, or "our") and applies to your use of the Founderport Corporation, Founderport Corporation platform and Tool. This Agreement is applicable to registered members, as well as any visitor or user who uses the Tool in any way, shape or form. By utilizing this Tool, you hereby to abide by these Terms and Conditions and waive any objections to these Terms and Conditions.
          </p>

          <p>
            Further, by opening an account or accessing the Founderport Corporation and Founderport Corporation Tool, you agree to the following Terms:
          </p>

          <ul className="list-disc pl-6 space-y-3">
            <li>You accept both the Terms of Service and the Privacy Policy.</li>
            <li>These policies may be changed at any time, with or without notice. It is your responsibility to regularly review the policies.</li>
            <li>You are at least 18 years of age, or the age of majority in your country.</li>
            <li>You understand, accept and agree that the purchase and sale of cryptocurrency involves risk. Depending on price fluctuations which are often unpredictable, there may be an increase or loss in value in holdings.</li>
            <li>You acknowledge and agree that purchasing services or following guidance offered by the Tool involves some risk of loss, and you will not hold Founderport Corporation accountable for any losses.</li>
            <li>As a user of Founderport Corporation, you acknowledge that Founderport Corporation has no responsibility for any losses that you incur as a direct or indirect result of the Tool or any of our services.</li>
            <li>You hereby waive any actionable rights to pursue any legal remedies for losses that you may incur.</li>
            <li>Founderport Corporation does not guarantee stability, availability or any functions of the network. You may lose access if the network ceases to operate for any reason.</li>
            <li>Transactions performed by you or generated may change your balance or nullify it. You are responsible for safeguarding your credentials. Any unauthorized access is your responsibility.</li>
            <li>It is the user's responsibility to secure his or her account. Any resulting losses from negligent use or mishandling of the Tool will not be the responsibility of Founderport Corporation.</li>
            <li>We do not provide, offer or exchange securities, investment contracts or any other form of financial instrument that may be considered by law to be a security as governed by the Securities and Exchange commission.</li>
            <li>Founderport Corporation is not a bank or a financial institution. Fundings in any currency or digital cryptocurrency are not protected by any government insurance policy.</li>
            <li>The Founderport CorporationTool and any related service is provided "as is". We make no warranties, expressed or implied.</li>
            <li>Any associated content and services provided by Founderport Corporation are for informational purposes only and are not intended to and does not provide legal, financial, tax, accounting, or investment advice.</li>
            <li>It is the responsibility of the user to ensure that he/she is in compliance with the applicable rules and laws in the jurisdiction. The user hereby indemnifies and absolves Founderport Corporation of any liability for any outcome resulting of non-compliance with the laws.</li>
            <li>In the event that Founderport Corporation or its directors face legal action as a result of your actions, you agree cover any damages, including legal fees, that Founderport Corporation incurs as a result.</li>
            <li>You hereby agree to indemnify Founderport Corporation and its partners against any action, liability, cost, claim, loss, damage, proceeding, or expense suffered or incurred if direct or not directly arising from your use of Founderport Corporationor its services, or from your violation of these Terms and Conditions.</li>
            <li>Other than publicly available information, You hereby agree not to copy any information from the Founderport Corporation Tool, without our permission</li>
            <li>Neither Founderport Corporation or its associates, affiliates, or subsidiaries be liable for any damages, including damage for loss of data or profit, arising out of the use of the services of materials provided, regardless of negligence.</li>
            <li>To the extent permitted by applicable law, Founderport Corporation is not liable or responsible, and you agree not to hold it liable or responsible, for any damages or losses (including, but not limited to, loss of any virtual currency, goodwill, reputation, profits, business opportunity or any other intangible losses or any special, indirect, or consequential damages) resulting directly or indirectly from the use of the Founderport Corporation Services.</li>
            <li>Founderport and Angel make no promises to the accuracy of the information it provides and it is the responsibility of the user to verify any and all information provided by the Tool.</li>
            <li>You are at least 18 years of age or the legally-defined adult age of your jurisdiction or you have the express permission of a legal adult-aged guardian to use Founderport.</li>
            <li>You agree that Founderport may display or facilitate advertising and partnerships with other entities and organizations using the information you provide.</li>
            <li>You, the customer, can cancel your subscription at any time. If you are a monthly subscriber, your monthly subscription will not auto renew and your subscription will continue to run for the remainder of your paid through period without a refund. If you are an annual subscriber, your subscription will run through the end of your current monthly period and you will receive a refund for the balance of your not yet used month(s) of your annual membership, not including the current month during which your subscription was active and had not yet requested cancellation.</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
            <p className="font-semibold text-gray-900">
              YOU FURTHER AGREE THAT ANY DISPUTES BETWEEN YOU AND FOUNDERPORT CORPORATION WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION. IF YOU DO NOT AGREE TO ABIDE BY ALL OF THE TERMS AND CONDITIONS CONTAINED THEREIN, PLEASE DO NOT USE THIS SITE.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">
            User Representations and Covenants
          </h2>
          <p>
            In addition to any other representations and warranties contained within these Terms and Conditions, User further represents and warrants:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li>All information supplied by you is true and accurate.</li>
            <li>You have read and agree to these Terms and Conditions and waive any challenge thereof.</li>
            <li>Covenants to ensure that any information you post, or permit or cause to be posted, on the Tool, will be non-confidential or non-proprietary, and not offensive, illegal under any applicable rules or laws.</li>
            <li>Covenants to accept and all responsibility for any arising consequences of any information posted on the Tool.</li>
            <li>Covenant not to use the Tool for any illegal purpose or in any other manner inconsistent with these Terms and Conditions including but not limited to any interference with the functionality of the Tool.</li>
            <li>Each Contributor shall declare, bear and pay all such taxes, duties, imposts, levies, tariffs and surcharges that might be imposed by the laws and regulations of any jurisdiction as a result of or in connection with the receipt, holding, use, purchase, appreciation, trading or divestment of (no matter whether rewarded for participating in the Funding or otherwise acquired). Each Contributor shall be solely liable for all such penalties, claims, fines, punishments, liabilities or otherwise arising from his/her underpayment, undue payment or belated payment of any applicable tax. BAM provides no advice and makes no representation as to the tax implication of any jurisdiction.</li>
          </ul>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">
            User Confidentiality and Protection
          </h2>
          <p>
            You are responsible for maintaining the confidentiality and security of your information and accept responsibility for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">
            Intellectual Property
          </h2>
          <p>
            The content and information on this Tool are the property of Founderport Corporation. The content may not be downloaded, reproduced, for any use other than individual use.
          </p>
          <p>
            All intellectual property rights including but not limited to texts, graphics, logos, images, audio clips, data compilations, scripts, software, technology, sound or any other materials or works found in the Tool belongs to Founderport Corporation.
          </p>
          <p>
            All graphics, animations, texts and other content, including functionality, distribution and location of specific elements used on Tool are law protected copyright works.
          </p>
          <p>
            No part of the Tool may be copied, distributed, adapted, modified, reproduced, republished, displayed, broadcasted or transmitted in any manner or by any means, any part of the Tool without written permission.
          </p>
          <p>
            Nothing in these Terms and Conditions grants you or any other person or entity any legal rights to Founderport Corporation and Founderport Corporation's Tool, other than as necessary to enable access. You agree not to adjust or try to circumvent or delete any notices contained on the Tool (including any Intellectual Property notices) and in particular any digital rights or other security embedded or contained within the Tool.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">
            Limitation of Liability
          </h2>
          <p>
            In no event shall Founderport Corporation be liable whether in an action in negligence, contract or tort based on a warranty or otherwise for any damage, loss, expense or costs of any kind (including loss of profits, revenue, or loss or inaccuracy of data), whether direct or indirect, incidental, punitive, special, consequential or economic, even if Founderport Corporation's actions factored as a possible direct or indirect cause, or arising from or in connection with, but not limited to the following:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li>The use or inability to access or use of the Tool or any of the Services.</li>
            <li>Your reliance on or use or inability to use the content and information of the Tool.</li>
            <li>Any failure of performance, error, omission, interruption, defect, delay in operation or system failure of the Tool.</li>
            <li>The cost of procurement of substitute goods and services resulting from any goods, data, information or services purchased or obtained or messages received, or transactions entered into through or from the Tool.</li>
            <li>The unauthorized access to or alteration of your information.</li>
            <li>Statements and/or conduct of any third party on the Tool.</li>
          </ul>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">
            Disclaimers
          </h2>
          <p>
            The contents of the Tool are provided on an "as is" and "as available" basis without warranties of any kind and are made available for your general information only. No warranty of any kind, express, implied or statutory, is given in conjunction with the contents of the Tool, the tools contained in the Tool or the Tool in general.
          </p>
          <p>
            Founderport Corporation does not warrant the accuracy, adequacy, completeness, reliability, timeliness, non-infringement, title, merchantability or fitness for any purpose of the information on the Tool or that the information available on the Tool will be uninterrupted or error-free, or other harmful effects, or that defects.
          </p>
          <p>
            Founderport Corporation does not guarantee the confidentiality or privacy of any communication or information transmitted on the Tool or any site linked to the Tool. We will not be liable for the privacy or security of information, e-mail addresses, registration and identification information, storage space, communications, confidential or proprietary information, or any other content transmitted over networks accessed by the site, or otherwise connected with your use of the Tool.
          </p>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">
            Final Provisions
          </h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>Services provided in accordance with the Regulations shall be provided in and shall be subject to the law applicable therein.</li>
            <li>In case of any disputes between Founderport Corporation and a User binding arbitration must be conducted by AAA Arbitrators be competent to settle such disputes.</li>
            <li>Recognition of any provision of these Terms and Conditions as being unlawful will not affect the effectiveness and validity of the remaining provisions of the Regulations.</li>
            <li>You agree to defend, reimburse and/or compensate and any affiliates, third party providers, employees, agents, or persons who are authorized to act on our behalf, and their respective directors, shareholders, officers, employees or agents, and hold them harmless against any action, including legal action, claim, demand, loss, liability, expense, cost and fee, including attorney fees, arising directly, indirectly or in any connection from the use of the Tool or any Services or due to or arising out of your breach of any of these Terms and Conditions or laws.</li>
            <li>The liability of Founderport Corporation and its service providers towards the User is limited to the value of a given Transaction expressed in a given currency or Cryptocurrency. Liability for lost profits is excluded, and liability for any other damage (actual, direct, indirect, intangible, etc.), regardless of whether it results from the contract, tort, negligence, etc., resulting from or related to the authorized or unauthorized use of the Tool is limited to the value of funds provided by the User for the execution of a given Transaction subject to the preceding section.</li>
            <li>In the event of a dispute between the User and another User, the User shall indemnify the Service Provider and the Service Provider's service providers against all claims and claims for damage (actual or lost benefits) of any kind resulting from or in any way related to such disputes.</li>
            <li>Founderport is not responsible for the actions of Service Providers which includes the quality of services provided to users. Users are responsible for researching, vetting and ultimately choose the right Service Providers with which to engage.</li>
            <li>Founderport Corporation, in its sole discretion, may terminate any applicable Terms with immediate effect any time despite any rights that have accrued under applicable Terms.</li>
            <li>Once User commits a material breach of any of Founderport Corporation's Terms. Such breach constitutes ground for terminating User access at Founderport Corporation's discretion.</li>
            <li>In the event that a user repeatedly breaches any of these Terms and Conditions, he/she may be banned indefinitely from accessing the Tool.</li>
            <li>Any terms which by their nature should survive, will survive the termination of these Applicable Terms and Conditions.</li>
          </ul>

          <h2 className="text-2xl font-bold text-teal-600 mt-8 mb-4">
            Angel AI Assistant Coverage
          </h2>
          <p>
            Angel is an AI-powered assistant and product feature of Founderport Corporation. By using Angel, you agree that:
          </p>
          <ul className="list-disc pl-6 space-y-3">
            <li>Angel is provided under the same Terms and Conditions as the Founderport platform.</li>
            <li>All disclaimers, limitations of liability, indemnities, and restrictions that apply to Founderport equally apply to Angel.</li>
            <li>Angel provides research, drafting, and guidance but does not act as a legal, financial, or filing agent on your behalf.</li>
          </ul>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Last Updated: November 24, 2025</p>
            <p className="mt-2">© {new Date().getFullYear()} Founderport Corporation. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsAndConditions;

