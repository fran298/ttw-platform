import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Globe, ArrowRight, CheckCircle } from 'lucide-react';

const Contact: React.FC = () => {
  const [formStatus, setFormStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS'>('IDLE');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const name = (form.querySelector('input[type="text"]') as HTMLInputElement)?.value;
    const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value;
    const subject = (form.querySelector('select') as HTMLSelectElement)?.value;
    const message = (form.querySelector('textarea') as HTMLTextAreaElement)?.value;

    const mailSubject = subject === "Booking Cancellation"
      ? "Cancellation"
      : subject;

    const body = `
Name: ${name}
Email: ${email}

Message:
${message}
    `;

    const recipient =
      subject === "Become a Partner"
        ? "partners@thetravelwild.com"
        : "support@thetravelwild.com";

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      
      {/* 1. HERO SECTION - Solid Background */}
      <div className="relative h-[450px] md:h-[380px] w-full bg-[#132b5b] flex items-center justify-center mb-12 md:mb-24">
        <div className="relative z-10 text-center px-4 -mt-12 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-xl uppercase">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md">
            Questions, feedback, or just want to say hello? We're here for you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* LEFT COLUMN: Info & Context */}
            <div className="space-y-12">
                
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">How can we help?</h2>
                    <p className="text-gray-500 text-lg leading-relaxed mb-8">
                        Whether you're a traveler looking for the perfect wave or a school wanting to join our network, our team is ready to assist.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 1 */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#132b5b] group-hover:text-white transition-colors text-blue-600">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Support</h3>
                            <p className="text-sm text-gray-500 mb-4">Need help with a booking?</p>
                            <a href="mailto:support@thetravelwild.com" className="text-brand-600 font-bold text-sm hover:underline">
                              support@thetravelwild.com
                            </a>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors text-orange-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Partnerships</h3>
                            <p className="text-sm text-gray-500 mb-4">For schools and instructors.</p>
                            <a href="mailto:partners@thetravelwild.com" className="text-brand-600 font-bold text-sm hover:underline">
                              partners@thetravelwild.com
                            </a>
                        </div>
                    </div>
                </div>
                

            </div>

            {/* RIGHT COLUMN: Form */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100 relative overflow-hidden">
                {formStatus === 'SUCCESS' ? (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20 animate-in fade-in duration-500 text-center p-8">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">Message Sent!</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8">We've received your inquiry and will get back to you within 24 hours.</p>
                        <button 
                            onClick={() => setFormStatus('IDLE')}
                            className="text-brand-600 font-bold hover:underline"
                        >
                            Send another message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1">Send a message</h3>
                            <p className="text-gray-500 text-sm">We typically reply within a few hours.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name</label>
                                <input type="text" required className="w-full border-gray-300 rounded-lg p-3 focus:ring-[#132b5b] focus:border-[#132b5b]" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                                <input type="email" required className="w-full border-gray-300 rounded-lg p-3 focus:ring-[#132b5b] focus:border-[#132b5b]" placeholder="john@example.com" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
                            <select className="w-full border-gray-300 rounded-lg p-3 focus:ring-[#132b5b] focus:border-[#132b5b] bg-white">
                                <option>General Inquiry</option>
                                <option>Booking Issue</option>
                                <option>Booking Cancellation</option>
                                <option>Become a Partner</option>
                                <option>Press / Media</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label>
                            <textarea required rows={5} className="w-full border-gray-300 rounded-lg p-3 focus:ring-[#132b5b] focus:border-[#132b5b]" placeholder="How can we help you today?"></textarea>
                        </div>

                        <button 
                            type="submit" 
                            disabled={formStatus === 'SENDING'}
                            className="w-full bg-[#132b5b] hover:bg-[#0f234b] text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center"
                        >
                            {formStatus === 'SENDING' ? 'Sending...' : 'Send Message'} 
                            {!formStatus && <Send className="w-5 h-5 ml-2" />}
                        </button>
                    </form>
                )}
            </div>

        </div>

        {/* FAQ Section */}
        <div className="mt-24 pt-16 border-t border-gray-200">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-3xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-gray-500">Quick answers to common questions.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                      q: "How do I cancel a booking?",
                      a: "To cancel a booking, please send us an email with the subject 'Cancellation' including the full name, email address, and booking reference of the person who made the booking. Our team will assist you as soon as possible."
                    },
                    { q: "Is my payment secure?", a: "Yes, we use Stripe for all transactions. We never store your credit card details." },
                    { q: "Can I list my school?", a: "Absolutely! Click 'Become a Partner' in the menu to get started in minutes." }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-2">{item.q}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
