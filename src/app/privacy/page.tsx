export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Dynasty Real Estate',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: April 3, 2026</p>

      <section className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, phone number, and real estate preferences when you submit a form on our website.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Respond to your real estate inquiries</li>
            <li>Schedule and confirm consultations</li>
            <li>Send you property updates and market information relevant to your search</li>
            <li>Send SMS and email communications you have consented to receive</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. SMS Communications</h2>
          <p>By providing your phone number and checking the SMS consent box on our forms, you agree to receive text messages from Dynasty Real Estate. Message and data rates may apply. Message frequency varies. Reply <strong>STOP</strong> at any time to opt out. Reply <strong>HELP</strong> for help.</p>
          <p className="mt-2">We do not share your phone number with third parties for their marketing purposes.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Data Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share information with service providers who assist us in operating our website and communicating with you, subject to confidentiality agreements.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Data Retention</h2>
          <p>We retain your information for as long as necessary to provide our services and comply with legal obligations.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal information by contacting us at <a href="mailto:adreanne@dynastypartnersllc.com" className="text-blue-600 underline">adreanne@dynastypartnersllc.com</a>.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Contact</h2>
          <p>Dynasty Real Estate<br />
          Phone: (225) 284-6854<br />
          Email: adreanne@dynastypartnersllc.com</p>
        </div>
      </section>
    </main>
  );
}
