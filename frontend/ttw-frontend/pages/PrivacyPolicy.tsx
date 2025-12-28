import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-semibold mb-4">Privacy Policy</h1>
      <p className="mb-8 text-gray-700">Last updated: 2025-01-01</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Who we are</h2>
        <p className="mb-2">
          <strong>The Travel Wild</strong> is the controller of your personal data.
          If you have any questions about this Privacy Policy or how we handle your data, please contact us at{" "}
          <a href="mailto:privacy@thetravelwild.com" className="text-blue-600 underline">
            privacy@thetravelwild.com
          </a>.
        </p>
        <p className="mb-2">We operate from the European Union (EU) and provide our services globally. This Privacy Policy applies to users worldwide.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">What data we collect</h2>
        <p>We collect the following types of personal data:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Account data (e.g., name, email, login credentials)</li>
          <li>Profile data for Providers and Instructors (e.g., biography, qualifications)</li>
          <li>Booking and payment-related data (e.g., booking details, payment information)</li>
          <li>Communications you send to us (e.g., support requests, messages)</li>
          <li>Technical data such as IP address, device information, and browser type</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">How we use data</h2>
        <p>We use your personal data to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Provide and maintain our services</li>
          <li>Onboard Providers and Instructors</li>
          <li>Manage bookings and process payments</li>
          <li>Respond to your inquiries and provide support</li>
          <li>Prevent fraud and ensure security</li>
          <li>Perform analytics and improve our services, only if you have consented</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Legal bases</h2>
        <p>We process your personal data based on one or more of the following legal bases:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Performance of a contract with you</li>
          <li>Your consent, where required</li>
          <li>Our legitimate interests, such as improving our services and preventing fraud</li>
          <li>Compliance with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Cookies &amp; analytics</h2>
        <p>
          We use cookies to improve your experience. For detailed information, please see our{" "}
          <a href="/cookies" className="text-blue-600 underline">
            Cookies Policy
          </a>.
        </p>
        <p>You can change your cookie preferences or withdraw consent at any time via the “Cookie preferences” link in the website footer.</p>
        <p>
          We use Google Analytics 4 (GA4) only if you have given your consent. GA4 helps us understand how you use our website so we can improve it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Sharing &amp; third parties</h2>
        <p>We may share your personal data with trusted third-party service providers, including:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Stripe for payment processing</li>
          <li>Payment card details are processed securely by Stripe and are not stored on our servers.</li>
          <li>Cloudinary for media storage and delivery</li>
          <li>Email delivery providers for communications</li>
          <li>Hosting providers for website infrastructure</li>
          <li>Analytics providers, but only if you consent</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">International transfers</h2>
        <p>
          Your personal data may be transferred and processed outside the European Union. Where applicable, we use safeguards such as Standard Contractual Clauses (SCCs) to protect your data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Data retention</h2>
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Your rights</h2>
        <p>You have the following rights under GDPR:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Right of access to your personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to restriction of processing</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
          <li>Right to withdraw consent at any time</li>
          <li>Right to lodge a complaint with a supervisory authority</li>
        </ul>
        <p className="mt-2 text-gray-700">You may lodge a complaint with a supervisory authority in the EU member state of your habitual residence, place of work, or where an alleged infringement of data protection law occurred.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Children’s privacy</h2>
        <p>
          Our services are not directed to children under the age of 16 (or the local age of majority where applicable). We do not knowingly collect personal data from children under this age.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We encourage you to review it periodically. Continued use of our services after changes indicates your acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-8">
        <p className="text-sm text-gray-600">
          This document provides general information about our privacy practices. If you have questions about your personal data or this policy, please contact our support team.
        </p>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
