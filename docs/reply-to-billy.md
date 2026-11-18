# Reply to Billy (William DePhillipo, Keystone Power Holdings)

**Subject:** Re: Ideas for your project enquiry flow (built out so you can click through)

---

Hi Billy,

Thanks for getting back to me. Rather than send a list of written ideas, we built them into a working preview of keystoneph.com. It uses your own projects, press coverage and founder bios, so you can see exactly how each idea would look and work.

**Preview:** [LINK]

It works on phones, tablets and desktop. Here's what we added and how each part helps turn project enquiries into signed agreements:

**1. A savings estimator on the homepage.** A facilities director picks their sector, slides to their annual electricity spend and sees an estimated year-one saving, 25-year savings, an indicative system size and "$0 upfront" straight away. The estimate is based on the results your clients have reported publicly (Georgetown 12%+, Abingdon 18%+, the JCC 20%+). When they click "Get my real numbers", their inputs carry into the enquiry form, so they don't have to type them again.

**2. A four-step project enquiry form that qualifies and routes each lead.** Visitors choose their organization type, site (rooftop, ground-mount, canopy or open land), annual spend or acreage, state and timing. Each enquiry is then:
- **routed by state** to the right office (Midwest to St. Charles, Mid-Atlantic and Southeast to Richmond, everything else to Paoli)
- **given a priority score** (A hot / B warm / C nurture), so your team knows which board is ready this budget cycle and which is still exploring
- **delivered to your inbox or CRM** with all the details filled in. It can also trigger an automatic confirmation email and a booking link, so nobody waits for a callback.

**3. A land check for utility-scale landowners.** Four quick questions (acreage, distance to three-phase power or a substation, land use, slope) give the landowner a site fit score and an indicative MW capacity, then invite them to request a free desktop study. This should bring in better land leads without adding work for your development team.

**4. Separate pages for each type of buyer.** Municipalities and water authorities, schools and universities, commercial and industrial clients, non-profits, and utilities and landowners each get their own section, with a proof point from your own portfolio. There's also a plain-English comparison of a PPA against buying the system, and answers to the questions boards usually ask before they sign.

**5. Your track record, up front.** Anthony's 300+ MW and Conergy Americas leadership, your 50+ MW of distributed generation, all 19 featured projects (23.9 MW, filterable by sector), four detailed case studies with quotes from mayors and plant managers, and a map of your footprint across seven states and three offices.

**6. Small details that keep visitors moving.** A live counter of clean energy produced, a sticky "Call / Start a project" bar on mobile, and the right phone number for each office.

None of this replaces your existing content; it builds on what's already there. It can go live on your current domain, and the form can connect to the email or CRM you already use.

Would you have 15 minutes this week or next? I'd like to walk you through it and hear what you'd change.

Best,
Louie Villagomez
Code Bunny

---

### Before sending, check with Billy (or update on the site)
- **Savings figures:** the estimator uses the 12% to 20%+ year-one savings from Keystone's own press releases and is labeled "illustrative". Ask Billy if he'd like different ranges or a different minimum project size (the site says roughly 200 kW and up).
- **Enquiry email:** without a form endpoint, enquiries open a pre-filled email to billy@keystoneph.com (`email` in `keystone/assets/js/config.js`). Confirm which inbox or CRM (HubSpot, Salesforce and so on) leads should go to, then set `formEndpoint`.
- **Booking link:** add a scheduling link (`bookingUrl`) and the thank-you screen will offer "Book a 20-minute intro call".
- **Photos:** the project images are licensed stock photos (Unsplash / Pexels). Swap in Keystone's own project and founder photos if he has them; the founder cards are built to look finished without photos too.
- **Reply promise:** the site says "within one business day". Change `replyPromise` if that's not right.
