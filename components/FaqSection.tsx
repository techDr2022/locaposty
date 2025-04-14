
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqSection = () => {
  const faqs = [
    {
      question: "How does the 14-day free trial work?",
      answer: "Our 14-day free trial gives you full access to all features of the plan you select. No credit card is required to sign up, and you'll receive a reminder before the trial ends. You can downgrade or cancel at any time."
    },
    {
      question: "Can I manage multiple Google Business Profiles?",
      answer: "Yes! Our Standard plan supports up to 3 Google Business Profiles, while our Pro plan supports up to 10. If you need to manage more locations, we offer custom enterprise plans tailored to your needs."
    },
    {
      question: "How does the AI review management work?",
      answer: "Our AI analyzes customer reviews and generates personalized response suggestions based on the review content. You can edit these responses before posting them, ensuring they match your brand voice while saving you time crafting responses from scratch."
    },
    {
      question: "Is my Google Business Profile data secure?",
      answer: "Absolutely. We use OAuth 2.0 for secure authentication with Google, and your data is encrypted both in transit and at rest. We never share your data with third parties, and we're compliant with GDPR and CCPA regulations."
    },
    {
      question: "Can I schedule recurring posts?",
      answer: "Yes! You can set up recurring posts on daily, weekly, or monthly schedules. This is perfect for regular promotions, opening hours reminders, or seasonal updates that you want to post regularly."
    },
    {
      question: "Do you offer integration with other platforms?",
      answer: "Currently, we focus on Google Business Profile integration for the best possible experience. We offer API access on our Pro plan, allowing you to connect LocaPosty with your existing tools and workflows."
    },
    {
      question: "What kind of support do you offer?",
      answer: "All plans include email support. Standard plan customers receive priority email support, while Pro plan customers get priority phone and email support. We also have an extensive knowledge base with tutorials and best practices."
    }
  ];

  return (
    <section id="faq" className="bg-white py-20">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-locaposty-text-dark mb-4">
            Frequently Asked <span className="text-locaposty-primary">Questions</span>
          </h2>
          <p className="text-lg text-locaposty-text-medium max-w-3xl mx-auto">
            Everything you need to know about LocaPosty. Can't find the answer you're looking for? 
            <a href="#" className="text-locaposty-primary font-medium hover:underline ml-1">Contact our support team</a>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                <AccordionTrigger className="text-lg font-semibold text-locaposty-text-dark hover:text-locaposty-primary py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-locaposty-text-medium pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
