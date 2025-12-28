
import React from 'react';
// import { useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from 'react-router-dom';
import { createPremiumCheckout } from '../services/dataService';
import { CheckCircle, TrendingUp, Users, Calendar, Shield, DollarSign, ArrowRight, LayoutDashboard, Globe, MousePointerClick, Image, Rocket, Sparkles, UserCheck, Star, Award, ShieldCheck, Check } from 'lucide-react';

const BecomeMember: React.FC = () => {
  const [email, setEmail] = React.useState("");
  // const navigate = useNavigate();
  // const [searchParams] = useSearchParams();
  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('pricing');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoPremium = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      const res = await createPremiumCheckout({ email });
      if (res?.checkout_url || res?.url) {
        window.location.href = res.checkout_url || res.url;
      } else {
        alert("Unable to start payment. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Payment could not be started. Please try again.");
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* 1. HERO SECTION */}
      <div className="relative h-[85vh] min-h-[700px] w-full bg-gray-900 flex flex-col items-center justify-center mb-32">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
            <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80" 
                alt="Team working" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center -mt-12">
            <div className="inline-block py-2 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-6">
                For Schools & Instructors
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none mb-6 drop-shadow-xl">
                Turn Your Passion <br/> Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Global Business</span>
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                The all-in-one platform to manage bookings, payments, and marketing. 
                Stop chasing emails and start filling your calendar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                    to="/signup/provider" 
                    className="bg-[#132b5b] hover:bg-[#0f234b] text-white px-10 py-4 rounded-full font-black text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center"
                >
                    List Your Business <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button 
                    onClick={scrollToPricing}
                    className="bg-white hover:bg-gray-50 text-gray-900 px-10 py-4 rounded-full font-black text-lg transition-all shadow-lg flex items-center justify-center"
                >
                    View Plans
                </button>
            </div>
            <p className="mt-6 text-sm text-white/60 font-medium">No credit card required • Cancel anytime</p>
        </div>

        {/* FLOATING STATS BAR (Overlap style) */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-6xl px-4 z-20">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-8 items-center divide-x divide-gray-100">
                <div className="text-center px-4">
                    <div className="text-4xl font-black text-[#132b5b] mb-1">2.5x</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Increase</div>
                </div>
                <div className="text-center px-4">
                    <div className="text-4xl font-black text-[#132b5b] mb-1">150+</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Countries</div>
                </div>
                <div className="text-center px-4">
                    <div className="text-4xl font-black text-[#132b5b] mb-1">$10M+</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Partner Revenue</div>
                </div>
                <div className="text-center px-4">
                    <div className="text-4xl font-black text-[#132b5b] mb-1">0%</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upfront Cost</div>
                </div>
            </div>
        </div>
      </div>

      {/* 2. HOW IT WORKS (Process) */}
      <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-20">
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">How it works</h2>
                  <p className="text-lg text-gray-500 max-w-2xl mx-auto">Getting started is simple. We handle the tech so you can focus on teaching.</p>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                  {/* Connector Line */}
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gray-100 rounded-full -z-10"></div>

                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center group">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 border-4 border-gray-50 shadow-xl group-hover:scale-110 transition-transform duration-300">
                          <MousePointerClick className="w-10 h-10 text-brand-600" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-3 uppercase">1. Create Profile</h3>
                      <p className="text-gray-500 leading-relaxed px-4">
                          Sign up in 2 minutes. Add your logo, location, and connect Stripe for secure payouts.
                      </p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center group">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 border-4 border-gray-50 shadow-xl group-hover:scale-110 transition-transform duration-300 delay-100">
                          <Image className="w-10 h-10 text-brand-600" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-3 uppercase">2. List Activities</h3>
                      <p className="text-gray-500 leading-relaxed px-4">
                          Upload photos, set prices, and manage your calendar. Lessons, rentals, or multi-day trips.
                      </p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center group">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 border-4 border-gray-50 shadow-xl group-hover:scale-110 transition-transform duration-300 delay-200">
                          <Rocket className="w-10 h-10 text-brand-600" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-3 uppercase">3. Go Live</h3>
                      <p className="text-gray-500 leading-relaxed px-4">
                          Your listings appear instantly. Receive bookings and get paid automatically.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. VALUE PROPOSITION (Cards) */}
      <div className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="text-brand-600 font-bold tracking-widest uppercase text-xs mb-2 block">Why Partner with Us?</span>
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">Everything you need to grow</h2>
                  <p className="text-lg text-gray-500">We don't just send you leads. We provide the complete infrastructure to manage your extreme sports business.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-blue-50 text-[#132b5b] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#132b5b] group-hover:text-white transition-colors">
                          <Globe className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-3">Global Visibility</h3>
                      <p className="text-gray-500 leading-relaxed">
                          Your activities appear automatically on our city, country, and sport-specific landing pages. Reach travelers before they even arrive.
                      </p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                          <DollarSign className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-3">Seamless Payments</h3>
                      <p className="text-gray-500 leading-relaxed">
                          Integrated with Stripe Connect. Get paid directly to your bank account. Handle deposits, refunds, and multi-currency easily.
                      </p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <LayoutDashboard className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-3">Mission Control</h3>
                      <p className="text-gray-500 leading-relaxed">
                          A powerful dashboard to manage instructors, inventory, calendar availability, and messages in one place.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* 4. INSTRUCTOR REVOLUTION */}
      <div className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                  
                  {/* Visual Side */}
                  <div className="w-full lg:w-1/2 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-100 to-blue-50 rounded-full blur-3xl opacity-60"></div>
                       
                       <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 transform rotate-[-2deg] hover:rotate-0 transition-all duration-500 max-w-md mx-auto">
                           <div className="flex items-center gap-4 mb-6">
                               <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" alt="Instructor" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <h3 className="text-xl font-black text-gray-900">Sarah Jenkins</h3>
                                       <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-50" />
                                   </div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Kitesurf Pro • Tarifa</p>
                                   <div className="flex text-yellow-400 mt-2">
                                       {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                                       <span className="text-gray-400 text-xs ml-2 font-bold text-black">(48)</span>
                                   </div>
                               </div>
                           </div>
                           <div className="space-y-3 mb-6">
                               <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100">
                                   <span className="text-sm font-bold text-gray-600">Private Lesson</span>
                                   <span className="text-sm font-black text-gray-900">$80/hr</span>
                               </div>
                               <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100">
                                   <span className="text-sm font-bold text-gray-600">Full Gear Rental</span>
                                   <span className="text-sm font-black text-gray-900">$120/day</span>
                               </div>
                           </div>
                           <button className="w-full bg-[#132b5b] text-white py-4 rounded-xl font-bold text-sm shadow-lg">Book with Sarah</button>
                       </div>
                  </div>

                  {/* Text Side */}
                  <div className="w-full lg:w-1/2">
                      <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-6 border border-orange-100">
                          <UserCheck className="w-4 h-4" /> For Freelancers
                      </div>
                      <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-none uppercase tracking-tight">
                          The platform built for <span className="text-orange-500">Instructors</span>.
                      </h2>
                      <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                          Tired of being invisible behind a school's logo? We allow you to build your own personal brand, collect reviews, and set your own rates.
                      </p>
                      
                      <div className="space-y-6 mb-10">
                          <div className="flex items-start">
                              <div className="bg-orange-100 p-3 rounded-xl mr-4">
                                  <Award className="w-6 h-6 text-orange-600" />
                              </div>
                              <div>
                                  <h4 className="text-lg font-bold text-gray-900">Build Your Reputation</h4>
                                  <p className="text-gray-500 mt-1">Your reviews travel with you. Become a top-rated instructor in your region.</p>
                              </div>
                          </div>
                          <div className="flex items-start">
                              <div className="bg-orange-100 p-3 rounded-xl mr-4">
                                  <TrendingUp className="w-6 h-6 text-orange-600" />
                              </div>
                              <div>
                                  <h4 className="text-lg font-bold text-gray-900">Be Your Own Boss</h4>
                                  <p className="text-gray-500 mt-1">Manage your schedule, accept bookings directly, and keep more of your earnings.</p>
                              </div>
                          </div>
                      </div>

                      <Link to="/signup/provider" className="text-[#132b5b] font-black text-lg hover:text-blue-700 flex items-center group border-b-2 border-[#132b5b] w-fit pb-1">
                          Create Instructor Profile <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                  </div>
              </div>
          </div>
      </div>

      {/* 5. PRICING SECTION */}
      <div id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-4">Choose Your Path</h2>
                <p className="text-xl text-gray-500">
                    Start for free or accelerate with Premium.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* STARTER PLAN */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 flex flex-col hover:border-gray-300 transition-colors">
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-gray-900 uppercase">Starter</h3>
                    <p className="text-gray-500 mt-2 font-medium">Perfect for new schools & freelancers.</p>
                </div>
                <div className="mb-8">
                    <span className="text-6xl font-black text-gray-900">€0</span>
                    <span className="text-gray-400 text-xl font-bold"> / year</span>
                    <div className="mt-4 inline-block bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold text-gray-600">
                        25% Commission on bookings
                    </div>
                </div>
                <ul className="space-y-5 mb-10 flex-1">
                    {['Standard Visibility', 'Booking Management Dashboard', 'Secure Stripe Payments', 'Basic Support'].map((item, i) => (
                        <li key={i} className="flex items-start">
                            <CheckCircle className="w-6 h-6 text-gray-300 mr-3 flex-shrink-0"/> 
                            <span className="font-bold text-gray-700">{item}</span>
                        </li>
                    ))}
                </ul>
                <Link to="/signup/provider" className="w-full block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 py-5 rounded-2xl font-black text-lg transition-colors">
                    Start for Free
                </Link>
            </div>

            {/* PREMIUM PLAN */}
            <div className="bg-[#132b5b] text-white rounded-[2.5rem] p-10 border-4 border-[#132b5b] relative flex flex-col shadow-2xl shadow-blue-900/20 transform lg:-translate-y-4">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-6 py-2 rounded-full font-black text-sm tracking-widest uppercase shadow-lg">
                    Most Popular
                </div>
                <div className="mb-8 pt-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase">Premium Partner</h3>
                            <p className="text-blue-200 mt-2 font-medium">For scaling businesses.</p>
                        </div>
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
                <div className="mb-8">
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-black text-white line-through opacity-50">€499</span>
                      <span className="text-6xl font-black text-yellow-400">€249</span>
                      <span className="text-blue-200 text-xl font-bold">/ year</span>
                    </div>

                    <div className="mt-4 inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wide">
                      50% OFF · Limited Time
                    </div>
                    <div className="mt-4 inline-block bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold text-white border border-white/20">
                        15% Commission <span className="text-yellow-400">(Save 10%)</span>
                    </div>
                </div>
                <ul className="space-y-5 mb-10 flex-1">
                    {[
                        'Verified Partner Badge (Trust Boost)',
                        'Featured Placement in Search',
                        'Google Ads & Marketing Boost',
                        'Advanced Analytics',
                        'Priority 24/7 Support'
                    ].map((item, i) => (
                        <li key={i} className="flex items-start">
                            <CheckCircle className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0"/> 
                            <span className="font-bold text-white">{item}</span>
                        </li>
                    ))}
                    <li className="flex items-start opacity-70">
                      <Calendar className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0"/>
                      <span className="font-bold text-white">
                        Smart Agenda
                        <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </span>
                    </li>

                    <li className="flex items-start opacity-70">
                      <DollarSign className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0"/>
                      <span className="font-bold text-white">
                        Instructor Finance Panel
                        <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      </span>
                    </li>
                </ul>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full mb-4 px-4 py-3 rounded-xl text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  onClick={handleGoPremium}
                  className="w-full bg-white text-[#132b5b] hover:bg-gray-100 py-5 rounded-2xl font-black text-lg transition-colors shadow-lg"
                >
                  Go Premium
                </button>
            </div>

            </div>
        </div>
      </div>

      {/* 6. FINAL CTA */}
      <div className="bg-white py-20 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-6">Ready to go wild?</h2>
              <p className="text-xl text-gray-500 mb-10">Join the world's fastest-growing extreme sports network today.</p>
              <Link to="/signup/provider" className="bg-[#132b5b] text-white px-12 py-5 rounded-full font-black text-xl hover:bg-[#0f234b] transition-colors shadow-2xl inline-flex items-center">
                  Start Your Journey <ArrowRight className="ml-2 w-6 h-6" />
              </Link>
          </div>
      </div>
    </div>
  );
};

export default BecomeMember;
