import axios from "axios";
import logger from "../logger";

// Free Virtual Phone Number Services
// Note: These are temporary/testing services. For production, use Twilio, Vonage, or similar paid services.

interface VirtualNumber {
  number: string;
  country: string;
  provider: string;
  expiresAt?: Date;
  capabilities: string[];
}

/**
 * Generate a free virtual phone number for testing/development
 *
 * Free Services Available:
 * 1. TextNow (https://www.textnow.com/) - Free US/Canada numbers
 * 2. Google Voice (https://voice.google.com/) - Free US numbers with Gmail
 * 3. FreeTone (https://www.freetone.com/) - Free calling/texting
 * 4. TextMe (https://textme.com/) - Free virtual numbers
 * 5. Dingtone (https://www.dingtone.me/) - Free international numbers
 */

export async function generateVirtualNumber(
  countryCode: string = "US",
): Promise<VirtualNumber> {
  logger.info("Generating virtual phone number", { countryCode });

  // For production, integrate with Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return await generateTwilioNumber(countryCode);
  }

  // Generate a placeholder number for development
  const testNumber = generateTestNumber(countryCode);

  logger.info("Generated test phone number", { number: testNumber.number });

  return testNumber;
}

/**
 * Generate test/development phone numbers
 */
function generateTestNumber(countryCode: string): VirtualNumber {
  const prefixes: Record<string, string> = {
    US: "+1",
    UK: "+44",
    CA: "+1",
    AU: "+61",
    DE: "+49",
    FR: "+33",
    IT: "+39",
    ES: "+34",
    NL: "+31",
    BE: "+32",
  };

  const prefix = prefixes[countryCode] || "+1";
  const randomDigits = Math.floor(Math.random() * 9000000000) + 1000000000;

  return {
    number: `${prefix}${randomDigits}`,
    country: countryCode,
    provider: "TEST",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    capabilities: ["SMS", "Voice", "Development Only"],
  };
}

/**
 * Generate Twilio virtual number (production)
 */
async function generateTwilioNumber(
  countryCode: string,
): Promise<VirtualNumber> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  try {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
      new URLSearchParams({
        PhoneNumber: "", // Twilio will assign one
        FriendlyName: "Advancia Pay Business Line",
      }),
      {
        auth: {
          username: accountSid!,
          password: authToken!,
        },
      },
    );

    logger.info("Twilio number provisioned", {
      number: response.data.phone_number,
    });

    return {
      number: response.data.phone_number,
      country: countryCode,
      provider: "Twilio",
      capabilities: ["SMS", "Voice", "MMS"],
    };
  } catch (error: any) {
    logger.error("Failed to provision Twilio number", { error: error.message });
    throw new Error(`Twilio provisioning failed: ${error.message}`);
  }
}

/**
 * Recommended Free Services (Manual Setup Required)
 */
export const FREE_PHONE_SERVICES = [
  {
    name: "TextNow",
    url: "https://www.textnow.com/",
    description: "Free US/Canada phone numbers with unlimited texting",
    features: ["SMS", "Voice", "Free forever"],
    countries: ["US", "CA"],
    setup: "Download app or use web version, sign up with email",
  },
  {
    name: "Google Voice",
    url: "https://voice.google.com/",
    description: "Free US phone number linked to Gmail",
    features: ["SMS", "Voice", "Voicemail transcription", "Call forwarding"],
    countries: ["US"],
    setup: "Requires Gmail account, available in US only",
  },
  {
    name: "FreeTone",
    url: "https://www.freetone.com/",
    description: "Free calling and texting app",
    features: ["SMS", "Voice", "Group messaging"],
    countries: ["US", "CA"],
    setup: "Download iOS/Android app, sign up",
  },
  {
    name: "TextMe",
    url: "https://textme.com/",
    description: "Free second phone number",
    features: ["SMS", "Voice", "Picture messaging"],
    countries: ["US", "CA", "UK"],
    setup: "Download app, choose your number",
  },
  {
    name: "Dingtone",
    url: "https://www.dingtone.me/",
    description: "Free international calling and texting",
    features: ["SMS", "Voice", "International calls"],
    countries: ["US", "CA", "UK", "AU", "and more"],
    setup: "Download app, get free credits",
  },
  {
    name: "TextFree",
    url: "https://www.pinger.com/textfree/",
    description: "Free texting and calling app",
    features: ["SMS", "Voice", "Custom voicemail"],
    countries: ["US", "CA"],
    setup: "Download app, register",
  },
];

/**
 * Premium Services for Production (Paid but Reliable)
 */
export const PREMIUM_PHONE_SERVICES = [
  {
    name: "Twilio",
    url: "https://www.twilio.com/",
    pricing: "$1/month per number + $0.0075/SMS",
    features: ["SMS", "Voice", "MMS", "Programmable", "Worldwide"],
    recommended: true,
  },
  {
    name: "Vonage (Nexmo)",
    url: "https://www.vonage.com/",
    pricing: "$0.90/month per number + $0.006/SMS",
    features: ["SMS", "Voice", "Video", "Global coverage"],
    recommended: true,
  },
  {
    name: "Plivo",
    url: "https://www.plivo.com/",
    pricing: "$0.80/month per number",
    features: ["SMS", "Voice", "Carrier-grade"],
    recommended: false,
  },
  {
    name: "Bandwidth",
    url: "https://www.bandwidth.com/",
    pricing: "Enterprise pricing",
    features: ["SMS", "Voice", "Emergency services", "Compliance"],
    recommended: false,
  },
];

export default {
  generateVirtualNumber,
  FREE_PHONE_SERVICES,
  PREMIUM_PHONE_SERVICES,
};
