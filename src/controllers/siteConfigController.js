// Public site configuration. All values live in the server's .env (never in a
// client bundle) and are delivered to the frontend at runtime via
// GET /api/site-config. Only intentionally-public details are exposed here.
const readValue = (name, fallback = "") => {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const getSiteConfig = (_req, res) => {
  res.json({
    success: true,
    data: {
      contactEmail: readValue("CONTACT_EMAIL", "info@primesoftechs.com"),
      contactMobile: readValue("CONTACT_MOBILE", "+91 70647 02015"),
      careersEmail: readValue("CAREERS_EMAIL", "hr@primesoftechs.com"),
      linkedInUrl: readValue(
        "LINKEDIN_URL",
        "https://in.linkedin.com/company/primesoftech",
      ),
      instagramUrl: readValue(
        "INSTAGRAM_URL",
        "https://www.instagram.com/prime_softech/",
      ),
      facebookUrl: readValue(
        "FACEBOOK_URL",
        "https://www.facebook.com/primesoftech67",
      ),
      office: {
        name: readValue("OFFICE_NAME", "Prime Softech"),
        location: readValue("OFFICE_LOCATION", "Surat, Gujarat, India"),
        address: readValue("OFFICE_ADDRESS", "Surat, Gujarat, India"),
        timezone: readValue(
          "OFFICE_TIMEZONE",
          "India Standard Time · UTC+5:30",
        ),
        hours: readValue(
          "OFFICE_HOURS",
          "Monday to Saturday: 10:00am - 7:00pm",
        ),
        mapEmbedUrl: readValue("MAP_EMBED_URL"),
        directionsUrl: readValue(
          "MAP_DIRECTIONS_URL",
          "https://www.openstreetmap.org",
        ),
      },
      animations: {
        home: readValue("HOME_LOTTIE_URL"),
        career: readValue("CAREER_LOTTIE_URL"),
        contact: readValue("CONTACT_LOTTIE_URL"),
        about: readValue("ABOUT_LOTTIE_URL"),
        android: readValue("ANDROID_LOTTIE_URL"),
        flutter: readValue("FLUTTER_LOTTIE_URL"),
        ios: readValue("IOS_LOTTIE_URL"),
        unity: readValue("UNITY_LOTTIE_URL"),
        unityBackground: readValue("UNITY_BACKGROUND_LOTTIE_URL"),
        angular: readValue("ANGULAR_LOTTIE_URL"),
        typescript: readValue("TYPESCRIPT_LOTTIE_URL"),
        html5: readValue("HTML5_LOTTIE_URL"),
      },
    },
  });
};

module.exports = { getSiteConfig };
