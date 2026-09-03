export const SITE_DEFINITIONS = {
  "demo://voyager-stays": {
    id: "voyager",
    title: "Voyager Stays",
    category: "Travel",
    candidates: [
      {
        name: "search_stays",
        title: "Search stays",
        description: "Search the visible stay inventory by destination, dates, and guests, then update the shared results.",
        risk: "read",
        inputSchema: {
          type: "object",
          properties: {
            destination: { type: "string", description: "City or region to search" },
            checkIn: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
            checkOut: { type: "string", description: "Check-out date in YYYY-MM-DD format" },
            guests: { type: "integer", minimum: 1, maximum: 8, description: "Number of guests" }
          },
          required: ["destination", "checkIn", "checkOut", "guests"]
        }
      },
      {
        name: "shortlist_stay",
        title: "Shortlist a stay",
        description: "Add a visible property to the user's shortlist. This changes saved page state but does not make a booking.",
        risk: "write",
        inputSchema: {
          type: "object",
          properties: { propertyId: { type: "string", enum: ["harbor-house", "pine-retreat", "atelier-loft"] } },
          required: ["propertyId"]
        }
      }
    ]
  },
  "demo://civic-desk": {
    id: "civic",
    title: "Civic Desk",
    category: "Public services",
    candidates: [
      {
        name: "check_permit_requirements",
        title: "Check permit requirements",
        description: "Find the documents and fees required for a permit type. Returns public information only.",
        risk: "read",
        inputSchema: {
          type: "object",
          properties: {
            permitType: { type: "string", enum: ["street-event", "home-renovation", "food-stall"] },
            applicants: { type: "integer", minimum: 1, maximum: 1000 }
          },
          required: ["permitType"]
        }
      },
      {
        name: "prepare_permit_draft",
        title: "Prepare application draft",
        description: "Populate a visible, editable permit draft. It never submits the application.",
        risk: "write",
        inputSchema: {
          type: "object",
          properties: {
            permitType: { type: "string", enum: ["street-event", "home-renovation", "food-stall"] },
            applicantName: { type: "string", minLength: 2, maxLength: 80 },
            summary: { type: "string", minLength: 10, maxLength: 500 }
          },
          required: ["permitType", "applicantName", "summary"]
        }
      }
    ]
  }
};

export function normalizeAddress(value) {
  const input = String(value || "").trim();
  if (!input) return "demo://voyager-stays";
  if (SITE_DEFINITIONS[input]) return input;
  if (/^https?:\/\//i.test(input)) return input;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) return `https://${input}`;
  return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
}

export function validateToolInput(schema, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "Input must be an object.";
  for (const key of schema.required || []) if (input[key] === undefined || input[key] === "") return `Missing required field: ${key}`;
  for (const [key, value] of Object.entries(input)) {
    const rule = schema.properties?.[key];
    if (!rule) return `Unexpected field: ${key}`;
    if (rule.type === "string" && typeof value !== "string") return `${key} must be a string.`;
    if (rule.type === "integer" && !Number.isInteger(value)) return `${key} must be an integer.`;
    if (rule.enum && !rule.enum.includes(value)) return `${key} must be one of: ${rule.enum.join(", ")}.`;
    if (rule.minLength && String(value).length < rule.minLength) return `${key} is too short.`;
    if (rule.maxLength && String(value).length > rule.maxLength) return `${key} is too long.`;
    if (rule.minimum !== undefined && value < rule.minimum) return `${key} must be at least ${rule.minimum}.`;
    if (rule.maximum !== undefined && value > rule.maximum) return `${key} must be at most ${rule.maximum}.`;
  }
  return null;
}

export function toolAnnotations(tool) {
  return { readOnlyHint: tool.risk === "read", untrustedContentHint: true };
}
