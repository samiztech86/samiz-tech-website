export const SAMIZ_AI_MARKER = "[[SAMIZ_AI_REPLY]]";

export function getSamizAutoReply(message: string, subject = ""): string {
  const text = `${subject} ${message}`.toLowerCase();

  if (/\b(solar|solar panel|inverter|battery|hybrid system|solar installation)\b/.test(text)) {
    return "Thank you for contacting Samiz Tech Engineering Ltd. We provide solar power and backup-energy solutions. To help us understand your project, please share your location, the type of property, and the appliances or loads you need to power. Our team can review your requirements and advise on the next steps. A final system recommendation and quotation require a project assessment.";
  }

  if (/\b(electrical|wiring|distribution board|circuit breaker|switchgear|automation|electrical installation)\b/.test(text)) {
    return "Thank you for your enquiry. Samiz Tech provides electrical engineering, smart electrical systems, automation, and related engineering services. Please share your project location, property or facility type, and a brief description of the work required. Our support team can review your enquiry and follow up.";
  }

  if (/\b(marketplace|product|supplier|vendor|list my|list our|register as a supplier)\b/.test(text)) {
    return "Thank you for contacting Samiz Tech Marketplace. Buyers can explore listed products and request quotations where available. Suppliers can register and submit product listings for review; submitted products are not public until approved. Please tell us whether you are buying a product or registering as a supplier so we can guide you.";
  }

  if (/\b(quote|quotation|estimate|pricing|price|cost|how much|budget)\b/.test(text)) {
    return "Thank you for your quotation enquiry. To help our team review it, please share the product or service you need, your location, and any relevant specifications or quantities. Prices and availability must be confirmed for the specific request; this automated response is not a quotation.";
  }

  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(text)) {
    return "Hello, and welcome to Samiz Tech Engineering Ltd. I can help direct your enquiry about solar power, electrical engineering, or the Samiz Tech Marketplace. Please tell us what you need, and our support team can follow up.";
  }

  return "Thank you for contacting Samiz Tech Engineering Ltd. Your message has been received. We work across solar power, electrical engineering, smart energy solutions, and our online marketplace. Please share any relevant project details or tell us which service you need help with. Our support team can review your enquiry and reply here.";
}
