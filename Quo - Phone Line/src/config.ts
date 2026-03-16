/**
 * Property configuration for The Parcel Co.
 *
 * Map each Hospitable property ID to its lock code and address.
 * Update the lockCode field whenever you change a lock combination.
 *
 * Property IDs come from Hospitable (my.hospitable.com > Properties).
 */

export interface PropertyConfig {
  name: string;                 // Short display name used in SMS replies
  address: string;              // Full street address
  lockCode: string;             // Current keypad / smart lock entry code
  checkInTime: string;          // e.g. "4:00 PM"
  checkOutTime: string;         // e.g. "11:00 AM"
  wifiName: string;             // WiFi network name (SSID)
  wifiPassword: string;         // WiFi password
  parkingInstructions: string;  // Where and how to park
  checkInInstructions: string;  // Extra arrival instructions beyond time/code
  checkOutInstructions: string; // What to do before leaving
}

export const PROPERTY_CONFIGS: Record<string, PropertyConfig> = {
  "e1f79f66-4c70-421d-b88d-dd4eb25017c2": {
    name: "Sycamore Unit B",
    address: "524 S Sycamore Ave Unit B, Pasco, WA 99301",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "28b40b14-de05-4343-9b02-24b8661dc76a": {
    name: "Sycamore Unit A",
    address: "524 S Sycamore Ave Unit A, Pasco, WA 99301",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "2d5da9e5-53fd-4ea7-a982-81f7b301be37": {
    name: "Edison Unit B",
    address: "19 S Edison St Unit B, Kennewick, WA 99336",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "cca44cd2-b3c1-4dad-a26b-df75f4f153c8": {
    name: "Edison Unit C",
    address: "19 S Edison St Unit C, Kennewick, WA 99336",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "aef48432-89d9-4ad9-812b-4014cc17f132": {
    name: "1st Place Kennewick",
    address: "3513 W 1st Pl, Kennewick, WA 99336",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "875b1216-d2c7-4c8d-aa76-632c6c99b706": {
    name: "Estate Ave Richland",
    address: "2271 Estate Ave, Richland, WA 99352",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "1091ee9d-dc2b-4c56-8a9e-6682690644ec": {
    name: "Jadwin Ave Richland",
    address: "1431 Jadwin Ave, Richland, WA 99352",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "4633cb07-7d21-46c2-acd8-97c067840712": {
    name: "129th Place Vancouver",
    address: "5629 NE 129th Place, Vancouver, WA 98682",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "a5951f62-f9f0-4a66-9a32-3d33ed719e23": {
    name: "Everett Ave Spokane",
    address: "811 E Everett Ave, Spokane, WA 99207",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "97a12246-bfe2-405d-829a-599960864729": {
    name: "Pierre Dr Pasco",
    address: "5814 Pierre Dr Unit B, Pasco, WA 99301",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
  "b7cdff7e-5611-4293-bc3f-ef4734d3cc5f": {
    name: "Downing Dr Georgia",
    address: "34 Downing Dr, Adairsville, GA 30103",
    lockCode: "XXXX",
    checkInTime: "4:00 PM",
    checkOutTime: "11:00 AM",
    wifiName: "PLACEHOLDER",
    wifiPassword: "PLACEHOLDER",
    parkingInstructions: "PLACEHOLDER",
    checkInInstructions: "PLACEHOLDER",
    checkOutInstructions: "PLACEHOLDER",
  },
};

// Your Quo phone line ID
export const QUO_PHONE_NUMBER_ID = "PNomB1DvdK";

// Fallback message when caller is not a recognized guest
export const FALLBACK_LOCKOUT_REPLY =
  "Hi! We received your message. We couldn't find an active reservation linked to your number. Please call us back or reply with your booking confirmation code and we'll help right away.";

export const FALLBACK_INFO_REPLY =
  "Hi! We received your message. We couldn't find an active reservation linked to your number. Please reply with your booking confirmation code and we'll get you the info you need right away.";
