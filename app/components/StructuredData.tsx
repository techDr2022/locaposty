import React from "react";

export default function OrganizationStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "LocaPosty",
          applicationCategory: "BusinessApplication",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              priceType: "https://schema.org/FreeTrial",
              unitText: "day",
              price: "0",
              priceCurrency: "USD",
              referenceQuantity: {
                "@type": "QuantitativeValue",
                value: "14",
                unitText: "day",
              },
            },
          },
          operatingSystem: "Web browser",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "253",
          },
          creator: {
            "@type": "Organization",
            name: "LocaPosty",
            url: "https://locaposty.com",
            logo: "https://locaposty.com/logo.png",
            sameAs: [
              "https://twitter.com/locaposty",
              "https://facebook.com/locaposty",
              "https://linkedin.com/company/locaposty",
            ],
          },
        }),
      }}
    />
  );
}
