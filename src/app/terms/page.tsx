export const metadata = {
  title: 'Terms and Conditions',
  description: 'Terms and Conditions for Dynasty Real Estate',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: April 3, 2026</p>

      <section className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Program Description</h2>
          <p>Dynasty Real Estate provides real estate services including buyer representation, seller representation, and relocation assistance. By submitting a form on our website, you may receive follow-up communications via SMS and email.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. SMS Messaging Program</h2>
          <p>When you opt in to SMS communications, you agree to receive text messages from Dynasty Real Estate at the phone number provided. Messages may include:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Consultation reminders and confirmations</li>
            <li>Property updates and market information</li>
            <li>Follow-up messages related to your real estate inquiry</li>
          </ul>
          <p className="mt-2"><strong>Message frequency:</strong> Varies based on your inquiry and preferences.</p>
          <p className="mt-2"><strong>Message and data rates may apply.</strong></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Opt-Out Instructions</h2>
          <p>You may opt out of SMS messages at any time by replying <strong>STOP</strong> to any message. After opting out, you will receive one confirmation message and no further SMS messages will be sent.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Help</h2>
          <p>Reply <strong>HELP</strong> to any message for assistance, or contact us directly at:</p>
          <p className="mt-2">Email: adreanne@dynastypartnersllc.com<br />Phone: (225) 284-6854</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Supported Carriers</h2>
          <p>Carriers are not liable for delayed or undelivered messages.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Use of Service</h2>
          <p>Our website and services are provided for personal, non-commercial use in connection with real estate transactions. You agree not to misuse our contact forms or communication channels.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Changes to Terms</h2>
          <p>We reserve the right to update these terms at any time. Continued use of our services constitutes acceptance of the updated terms.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contact</h2>
          <p>Dynasty Real Estate<br />
          Phone: (225) 284-6854<br />
          Email: adreanne@dynastypartnersllc.com</p>
        </div>
      </section>
    </main>
  );
}
