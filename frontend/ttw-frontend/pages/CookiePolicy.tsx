

import React from "react";

const CookiePolicy: React.FC = () => (
  <main className="max-w-4xl mx-auto px-6 py-12">
    <h1 className="text-3xl font-bold mb-2 text-center">Cookie Policy</h1>
    <p className="text-sm text-gray-500 mb-10 text-center">Last updated: 2025-01-01</p>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Introduction</h2>
      <p className="text-gray-700">
        Cookies help us provide, protect, and improve your experience on The Travel Wild website. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Who we are</h2>
      <p className="text-gray-700">
        The Travel Wild is operated from the European Union. We are the data controller responsible for how cookies are used on this website.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">What are cookies</h2>
      <p className="text-gray-700">
        Cookies are small text files stored on your device by your browser when you visit a website. They help websites remember information about your visit, such as your preferences and settings. We also use similar technologies like pixels and local storage for related purposes.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Types of cookies we use</h2>
      <div className="mb-4">
        <h3 className="font-medium mb-1">Essential cookies</h3>
        <p className="text-gray-700">
          These cookies are always active and required for the website to function properly. They enable core features such as security, network management, and accessibility.
        </p>
      </div>
      <div>
        <h3 className="font-medium mb-1">Analytics cookies</h3>
        <p className="text-gray-700">
          Analytics cookies help us understand how visitors interact with our site. These cookies are only set with your consent and help us improve our services.
        </p>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Cookies we use</h2>
      <div className="mb-4">
        <h3 className="font-medium mb-1">Essential</h3>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <span className="font-mono bg-gray-100 rounded px-1 py-0.5 mr-1">ttw_cookie_consent</span>
            – stores your cookie preference
          </li>
          <li>
            Authentication/session cookies – used to keep you logged in and maintain your session (no personal data is stored in these cookies)
          </li>
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-1">Analytics (Google Analytics 4)</h3>
        <ul className="list-disc pl-6 text-gray-700">
          <li>
            <span className="font-mono bg-gray-100 rounded px-1 py-0.5 mr-1">_ga</span>
            – used to distinguish users
          </li>
          <li>
            <span className="font-mono bg-gray-100 rounded px-1 py-0.5 mr-1">_ga_*</span>
            – used to persist session state
          </li>
        </ul>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Google Analytics</h2>
      <p className="text-gray-700">
        We use Google Analytics 4, provided by Google LLC, to gather anonymous statistics on how our website is used. This helps us improve our services and user experience. All analytics data is anonymized and does not identify you personally. Google Analytics cookies are only loaded after you provide consent.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Managing your preferences</h2>
      <p className="text-gray-700 mb-2">
        When you first visit our site, you can accept or reject analytics cookies via the cookie banner. You can withdraw or change your consent at any time by clicking the &quot;Cookie preferences&quot; link in our website footer. Please note that disabling some cookies may impact the functionality of the site.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Third-party cookies</h2>
      <p className="text-gray-700">
        Third-party cookies may be set by services such as Google Analytics, but only with your explicit consent. We do not allow any other third-party cookies without your permission.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold mb-2">Updates to this policy</h2>
      <p className="text-gray-700">
        We may update this Cookie Policy from time to time. Please review this page periodically to stay informed about how we use cookies.
      </p>
    </section>
  </main>
);

export default CookiePolicy;