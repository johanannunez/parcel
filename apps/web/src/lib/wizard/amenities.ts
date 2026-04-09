export type AmenityDetailField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
};

/** Count-based repeater: "How many TVs?" then per-item fields */
export type AmenityRepeater = {
  countLabel: string;
  countPlaceholder: string;
  maxCount: number;
  itemLabel: string;
  fields: AmenityDetailField[];
};

export type Amenity = {
  id: string;
  label: string;
  iconName: string;
  /** Simple detail fields (location, count, type) */
  detailFields?: AmenityDetailField[];
  /** Repeater: count + per-item structured fields (TVs, etc.) */
  repeater?: AmenityRepeater;
};

export type AmenityCategory = {
  id: string;
  label: string;
  iconName: string;
  items: Amenity[];
};

/** Structured detail values keyed by amenity id, then field key */
export type AmenityDetails = Record<string, Record<string, string>>;

/* ── Shared option lists ─────────────────────────────────── */

const TV_SIZES: { value: string; label: string }[] = [
  { value: "24", label: '24" or smaller' },
  { value: "32", label: '32"' },
  { value: "40", label: '40"' },
  { value: "43", label: '43"' },
  { value: "50", label: '50"' },
  { value: "55", label: '55"' },
  { value: "60", label: '60"' },
  { value: "65", label: '65"' },
  { value: "70", label: '70"' },
  { value: "75", label: '75"' },
  { value: "85", label: '85" or larger' },
];

const TV_LOCATIONS: { value: string; label: string }[] = [
  { value: "living_room", label: "Living room" },
  { value: "primary_bedroom", label: "Primary bedroom" },
  { value: "bedroom_2", label: "Bedroom 2" },
  { value: "bedroom_3", label: "Bedroom 3" },
  { value: "bedroom_4", label: "Bedroom 4" },
  { value: "bedroom_5", label: "Bedroom 5" },
  { value: "guest_room", label: "Guest room" },
  { value: "kitchen", label: "Kitchen" },
  { value: "dining_area", label: "Dining area" },
  { value: "den", label: "Den / Study" },
  { value: "loft", label: "Loft" },
  { value: "game_room", label: "Game room" },
  { value: "office", label: "Home office" },
  { value: "patio", label: "Patio / Outdoor" },
  { value: "basement", label: "Basement" },
  { value: "garage", label: "Garage" },
];

const GRILL_TYPES: { value: string; label: string }[] = [
  { value: "gas", label: "Gas" },
  { value: "charcoal", label: "Charcoal" },
  { value: "pellet", label: "Pellet" },
  { value: "electric", label: "Electric" },
  { value: "kamado", label: "Kamado / Ceramic" },
];

/* ── Categories ──────────────────────────────────────────── */

export const amenityCategories: AmenityCategory[] = [
  {
    id: "guest_essentials",
    label: "Guest essentials",
    iconName: "Sparkle",
    items: [
      { id: "essentials", label: "Essentials", iconName: "Sparkle" },
      { id: "bed_linens", label: "Bed linens", iconName: "Bed" },
      { id: "body_soap", label: "Body soap", iconName: "Drop" },
      { id: "shampoo", label: "Shampoo", iconName: "Drop" },
      { id: "conditioner", label: "Conditioner", iconName: "Drop" },
      { id: "shower_gel", label: "Shower gel", iconName: "Shower" },
      { id: "hangers", label: "Hangers", iconName: "CoatHanger" },
      { id: "iron", label: "Iron", iconName: "TShirt" },
      { id: "hair_dryer", label: "Hair dryer", iconName: "HairDryer" },
      { id: "extra_pillows_blankets", label: "Extra pillows and blankets", iconName: "Bed" },
      { id: "hot_water_kettle", label: "Hot water kettle", iconName: "CookingPot" },
    ],
  },
  {
    id: "heating_cooling",
    label: "Heating and cooling",
    iconName: "ThermometerHot",
    items: [
      { id: "hot_water", label: "Hot water", iconName: "Thermometer" },
      { id: "heating", label: "Heating", iconName: "ThermometerHot" },
      { id: "air_conditioning", label: "Air conditioning", iconName: "Wind" },
      { id: "ceiling_fan", label: "Ceiling fan", iconName: "Fan" },
      { id: "portable_fans", label: "Portable fans", iconName: "Fan" },
      { id: "indoor_fireplace", label: "Indoor fireplace", iconName: "Fire" },
    ],
  },
  {
    id: "kitchen_dining",
    label: "Kitchen and dining",
    iconName: "CookingPot",
    items: [
      { id: "kitchen", label: "Kitchen", iconName: "CookingPot" },
      { id: "kitchenette", label: "Kitchenette", iconName: "CookingPot" },
      { id: "refrigerator", label: "Refrigerator", iconName: "Cube" },
      { id: "mini_fridge", label: "Mini fridge", iconName: "Cube" },
      { id: "freezer", label: "Freezer", iconName: "Snowflake" },
      { id: "oven", label: "Oven", iconName: "Oven" },
      { id: "stove", label: "Stove", iconName: "Fire" },
      { id: "microwave", label: "Microwave", iconName: "Timer" },
      { id: "cooking_basics", label: "Cooking basics", iconName: "CookingPot" },
      { id: "dishes_silverware", label: "Dishes and silverware", iconName: "ForkKnife" },
      { id: "dishwasher", label: "Dishwasher", iconName: "Drop" },
      { id: "coffee_maker", label: "Coffee maker", iconName: "Coffee" },
      { id: "coffee", label: "Coffee", iconName: "Coffee" },
      { id: "blender", label: "Blender", iconName: "Blender" },
      { id: "toaster", label: "Toaster", iconName: "BreadSlice" },
      { id: "rice_maker", label: "Rice maker", iconName: "Bowl" },
      { id: "bread_maker", label: "Bread maker", iconName: "BreadSlice" },
      { id: "dining_table", label: "Dining table", iconName: "Table" },
      { id: "wine_glasses", label: "Wine glasses", iconName: "Wine" },
      { id: "trash_compactor", label: "Trash compactor", iconName: "Trash" },
      { id: "barbecue_utensils", label: "Barbecue utensils", iconName: "ForkKnife" },
      { id: "baking_sheet", label: "Baking sheet", iconName: "CookingPot" },
    ],
  },
  {
    id: "bed_bath",
    label: "Bed and bath",
    iconName: "Bathtub",
    items: [
      { id: "bathtub", label: "Bathtub", iconName: "Bathtub" },
      { id: "bidet", label: "Bidet", iconName: "Drop" },
      { id: "room_darkening_shades", label: "Room-darkening shades", iconName: "Moon" },
      { id: "safe", label: "Safe", iconName: "Lock" },
      { id: "mosquito_net", label: "Mosquito net", iconName: "Bug" },
    ],
  },
  {
    id: "laundry_cleaning",
    label: "Laundry and cleaning",
    iconName: "TShirt",
    items: [
      { id: "washer", label: "Washer", iconName: "TShirt" },
      { id: "dryer", label: "Dryer", iconName: "Wind" },
      { id: "cleaning_products", label: "Cleaning products", iconName: "SprayBottle" },
      { id: "cleaning_during_stay", label: "Cleaning available during stay", iconName: "Broom" },
      { id: "drying_rack", label: "Drying rack for clothing", iconName: "CoatHanger" },
      { id: "clothing_storage", label: "Clothing storage", iconName: "Dresser" },
      { id: "laundromat_nearby", label: "Laundromat nearby", iconName: "MapPin" },
    ],
  },
  {
    id: "internet_office",
    label: "Internet and office",
    iconName: "WifiHigh",
    items: [
      { id: "wifi", label: "Wifi", iconName: "WifiHigh" },
      { id: "pocket_wifi", label: "Pocket wifi", iconName: "WifiHigh" },
      { id: "ethernet", label: "Ethernet connection", iconName: "WifiHigh" },
      { id: "dedicated_workspace", label: "Dedicated workspace", iconName: "Desk" },
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    iconName: "Television",
    items: [
      {
        id: "tv",
        label: "TV",
        iconName: "Television",
        repeater: {
          countLabel: "How many TVs?",
          countPlaceholder: "e.g. 3",
          maxCount: 10,
          itemLabel: "TV",
          fields: [
            { key: "size", label: "Screen size", type: "select", options: TV_SIZES },
            { key: "location", label: "Location", type: "select", options: TV_LOCATIONS },
          ],
        },
      },
      { id: "sound_system", label: "Sound system", iconName: "SpeakerHigh" },
      { id: "game_console", label: "Game console", iconName: "GameController" },
      { id: "record_player", label: "Record player", iconName: "Disc" },
      { id: "piano", label: "Piano", iconName: "MusicNote" },
      { id: "board_games", label: "Board games", iconName: "Dice" },
      { id: "books_reading", label: "Books and reading material", iconName: "Book" },
      { id: "arcade_games", label: "Arcade games", iconName: "GameController" },
      { id: "theme_room", label: "Theme room", iconName: "Star" },
    ],
  },
  {
    id: "family_kids",
    label: "Family and kids",
    iconName: "UsersThree",
    items: [
      { id: "crib", label: "Crib", iconName: "Baby" },
      { id: "pack_n_play", label: "Pack 'n play / Travel crib", iconName: "Baby" },
      { id: "changing_table", label: "Changing table", iconName: "Baby" },
      { id: "high_chair", label: "High chair", iconName: "Chair" },
      { id: "baby_bath", label: "Baby bath", iconName: "Baby" },
      { id: "baby_monitor", label: "Baby monitor", iconName: "Baby" },
      { id: "baby_safety_gates", label: "Baby safety gates", iconName: "ShieldCheck" },
      { id: "babysitter_recs", label: "Babysitter recommendations", iconName: "Phone" },
      { id: "children_books_toys", label: "Children's books and toys", iconName: "Puzzle" },
      { id: "children_dinnerware", label: "Children's dinnerware", iconName: "ForkKnife" },
      { id: "children_bikes", label: "Children's bikes", iconName: "Bicycle" },
      { id: "children_playroom", label: "Children's playroom", iconName: "Puzzle" },
      { id: "outlet_covers", label: "Outlet covers", iconName: "Plug" },
      { id: "table_corner_guards", label: "Table corner guards", iconName: "ShieldCheck" },
      { id: "window_guards", label: "Window guards", iconName: "ShieldCheck" },
    ],
  },
  {
    id: "outdoor",
    label: "Outdoor spaces",
    iconName: "Tree",
    items: [
      { id: "backyard", label: "Backyard", iconName: "Tree" },
      { id: "patio_balcony", label: "Patio or balcony", iconName: "Sun" },
      { id: "outdoor_furniture", label: "Outdoor furniture", iconName: "Chair" },
      { id: "outdoor_dining", label: "Outdoor dining area", iconName: "ForkKnife" },
      { id: "outdoor_kitchen", label: "Outdoor kitchen", iconName: "CookingPot" },
      { id: "outdoor_shower", label: "Outdoor shower", iconName: "Shower" },
      { id: "outdoor_playground", label: "Outdoor playground", iconName: "Ladder" },
      {
        id: "bbq_grill",
        label: "BBQ grill",
        iconName: "Fire",
        detailFields: [
          { key: "type", label: "What type of grill?", type: "select", options: GRILL_TYPES },
        ],
      },
      { id: "firepit", label: "Fire pit", iconName: "Campfire" },
      { id: "hammock", label: "Hammock", iconName: "Tree" },
      { id: "sun_loungers", label: "Sun loungers", iconName: "Sun" },
      { id: "pool", label: "Pool", iconName: "SwimmingPool" },
      { id: "hot_tub", label: "Hot tub", iconName: "Bathtub" },
      { id: "sauna", label: "Sauna", iconName: "ThermometerHot" },
      { id: "beach_access", label: "Beach access", iconName: "Waves" },
      { id: "lake_access", label: "Lake access", iconName: "Waves" },
      { id: "waterfront", label: "Waterfront", iconName: "Waves" },
      { id: "resort_access", label: "Resort access", iconName: "MapPin" },
    ],
  },
  {
    id: "parking_access",
    label: "Parking and access",
    iconName: "Car",
    items: [
      { id: "free_parking", label: "Free parking on premises", iconName: "Car" },
      { id: "free_street_parking", label: "Free street parking", iconName: "Car" },
      { id: "paid_parking_on", label: "Paid parking on premises", iconName: "Car" },
      { id: "paid_parking_off", label: "Paid parking off premises", iconName: "Car" },
      { id: "ev_charger", label: "EV charger", iconName: "Lightning" },
      { id: "private_entrance", label: "Private entrance", iconName: "Door" },
      { id: "elevator", label: "Elevator", iconName: "ArrowsVertical" },
      { id: "luggage_dropoff", label: "Luggage dropoff allowed", iconName: "Suitcase" },
      {
        id: "bikes",
        label: "Bikes",
        iconName: "Bicycle",
        detailFields: [
          { key: "count", label: "How many bikes?", type: "number", placeholder: "e.g. 4" },
        ],
      },
      { id: "kayak", label: "Kayak", iconName: "Boat" },
      { id: "boat_slip", label: "Boat slip", iconName: "Boat" },
      { id: "single_level", label: "Single level home", iconName: "House" },
      { id: "wide_doorways", label: "Wide doorways", iconName: "Door" },
      { id: "long_term_allowed", label: "Long-term stays allowed", iconName: "Calendar" },
    ],
  },
  {
    id: "safety_security",
    label: "Safety and security",
    iconName: "ShieldCheck",
    items: [
      { id: "smoke_alarm", label: "Smoke alarm", iconName: "Bell" },
      { id: "carbon_monoxide_alarm", label: "Carbon monoxide alarm", iconName: "Bell" },
      {
        id: "fire_extinguisher",
        label: "Fire extinguisher",
        iconName: "FireExtinguisher",
        detailFields: [
          { key: "count", label: "How many?", type: "number", placeholder: "e.g. 2" },
          { key: "locations", label: "Where are they?", type: "text", placeholder: "e.g. Kitchen pantry, garage wall" },
        ],
      },
      {
        id: "first_aid_kit",
        label: "First aid kit",
        iconName: "FirstAid",
        detailFields: [
          { key: "count", label: "How many?", type: "number", placeholder: "e.g. 2" },
          { key: "locations", label: "Where are they?", type: "text", placeholder: "e.g. Hall closet, master bath" },
        ],
      },
      { id: "fireplace_guards", label: "Fireplace guards", iconName: "ShieldCheck" },
      {
        id: "security_cameras",
        label: "Security cameras",
        iconName: "SecurityCamera",
        detailFields: [
          { key: "count", label: "How many?", type: "number", placeholder: "e.g. 3" },
          { key: "locations", label: "Where are they?", type: "text", placeholder: "e.g. Front door, back porch, driveway" },
        ],
      },
    ],
  },
  {
    id: "sports_recreation",
    label: "Sports and recreation",
    iconName: "Basketball",
    items: [
      { id: "gym", label: "Gym", iconName: "Barbell" },
      { id: "exercise_equipment", label: "Exercise equipment", iconName: "Barbell" },
      { id: "pool_table", label: "Pool table", iconName: "Circle" },
      { id: "ping_pong", label: "Ping pong table", iconName: "Circle" },
      { id: "mini_golf", label: "Mini golf", iconName: "GolfHole" },
      { id: "climbing_wall", label: "Climbing wall", iconName: "Mountains" },
      { id: "bowling_alley", label: "Bowling alley", iconName: "Circle" },
      { id: "hockey_rink", label: "Hockey rink", iconName: "Circle" },
      { id: "ski_in_out", label: "Ski-in / Ski-out", iconName: "Mountains" },
      { id: "skate_ramp", label: "Skate ramp", iconName: "Lightning" },
      { id: "batting_cage", label: "Batting cage", iconName: "Baseball" },
      { id: "laser_tag", label: "Laser tag", iconName: "Crosshair" },
      { id: "life_size_games", label: "Life-size games", iconName: "Dice" },
    ],
  },
];

/** Flat list of all amenities for search */
export const allAmenities: Amenity[] = amenityCategories.flatMap(
  (cat) => cat.items,
);
