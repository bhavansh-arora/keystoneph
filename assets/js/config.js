/* ==========================================================================
   Site configuration: the only file that needs editing to connect the
   enquiry flow. Leave a value empty and the site falls back gracefully.
   ========================================================================== */
window.SITE_CONFIG = {
  company: "Keystone Power Holdings",
  phone: "+1 484.301.0755",
  phoneHref: "tel:+14843010755",

  /* Where enquiries go when no formEndpoint is set (opens a pre-filled email). */
  email: "billy@keystoneph.com",

  /* Endpoint that accepts a JSON POST: HubSpot / Salesforce web-to-lead,
     Formspree, Make.com or Zapier webhook, etc. Every enquiry arrives with
     sector, site type, scale, state, timeline, a priority score and the
     office it was routed to, ready for CRM + auto-reply automations. */
  formEndpoint: "",

  /* Optional scheduling link (Calendly, HubSpot Meetings…). When set, the
     thank-you screen offers "Book a 20-minute intro call" straight away. */
  bookingUrl: "",

  /* Promise shown after an enquiry is sent. */
  replyPromise: "within one business day",

  /* Offices used for automatic routing by state. */
  offices: {
    HQ: { name: "Paoli, PA (Headquarters)", phone: "+1 484.301.0755" },
    IL: { name: "St. Charles, IL (Midwest)", phone: "+1 630.338.1650" },
    VA: { name: "Richmond, VA (Mid-Atlantic)", phone: "+1 804.521.2666" }
  }
};
