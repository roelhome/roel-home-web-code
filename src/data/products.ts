export interface ProductOptionValue {
  name: string;        // e.g. "Wooden", "Steel", "Red", "Yellow"
  color?: string;      // HEX code if swatch (e.g. "#e11d48")
}

export interface ProductOption {
  id: string;          // e.g. "opt_material"
  name: string;        // e.g. "Material", "Color", "Size"
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  name: string;        // Combination title, e.g. "Wooden / Red"
  title?: string;
  sku: string;         // e.g. "ROEL-WD-RED"
  price: string;       // Dedicated price for this exact combination, e.g. "₹12,000"
  images: string[];    // Cloudflare R2 or local photos for this exact combination
  options?: Record<string, string>; // e.g. { "Material": "Wooden", "Color": "Red" }
  is_available?: boolean; // Can be toggled false if this pair is not produced
  
  // Backward compatibility fields
  attribute_type?: string;
  has_color?: boolean;
  color?: string;
}

export interface Product {
  id: string;
  sku: string;
  category: string;
  name: string;
  short: string;
  description: string;
  price: string;
  image: string;
  specs: string[];
  applications: string;
  is_featured?: boolean;
  status?: string;
  options?: ProductOption[];
  variants?: ProductVariant[];
  gallery?: string[];
  created_at?: string;
}

export const initialProducts: Product[] = [
  {
    "id": "linear-grooved-wpc-door",
    "sku": "ROEL / WPC-01",
    "category": "WPC Doors",
    "name": "Linear Grooved WPC Door",
    "short": "Modern moisture-resistant composite door featuring clean architectural vertical CNC routing.",
    "description": "Precision-engineered WPC door crafted for high-humidity coastal and residential zones. 100% waterproof, termite-proof, and fire-retardant with high structural density and a silky matte architectural coating.",
    "price": "₹14,800 / unit",
    "image": "/images/door.webp",
    "specs": [
      "High-density monolithic polymer composite core",
      "100% waterproof & termite-resistant",
      "CNC-routed vertical geometric line detailing",
      "High-grade PU matte finish",
      "Compatible with concealed and magnetic architectural latches"
    ],
    "applications": "Ensuite bathrooms, coastal villas, terrace access doors, utility spaces, and contemporary apartments.",
    "is_featured": true,
    "status": "published",
    "options": [
      {
        "id": "opt_wpc01_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "7 ft × 3 ft (Standard)"
          },
          {
            "name": "8 ft × 3.5 ft (Extended)"
          }
        ]
      },
      {
        "id": "opt_wpc01_color",
        "name": "Finish / Color",
        "values": [
          {
            "name": "Alabaster White",
            "color": "#F7F4EF"
          },
          {
            "name": "Smoked Charcoal",
            "color": "#2D2B2A"
          },
          {
            "name": "Warm Sand",
            "color": "#D7B691"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_wpc01_1",
        "sku": "ROEL/WPC-01-7X3-WHT",
        "name": "7 ft × 3 ft / Alabaster White",
        "title": "7 ft × 3 ft / Alabaster White",
        "price": "₹14,800 / unit",
        "color": "#F7F4EF",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft (Standard)",
          "Finish / Color": "Alabaster White"
        }
      },
      {
        "id": "var_wpc01_2",
        "sku": "ROEL/WPC-01-7X3-CHR",
        "name": "7 ft × 3 ft / Smoked Charcoal",
        "title": "7 ft × 3 ft / Smoked Charcoal",
        "price": "₹15,400 / unit",
        "color": "#2D2B2A",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft (Standard)",
          "Finish / Color": "Smoked Charcoal"
        }
      },
      {
        "id": "var_wpc01_3",
        "sku": "ROEL/WPC-01-7X3-SND",
        "name": "7 ft × 3 ft / Warm Sand",
        "title": "7 ft × 3 ft / Warm Sand",
        "price": "₹15,200 / unit",
        "color": "#D7B691",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft (Standard)",
          "Finish / Color": "Warm Sand"
        }
      },
      {
        "id": "var_wpc01_4",
        "sku": "ROEL/WPC-01-8X35-WHT",
        "name": "8 ft × 3.5 ft / Alabaster White",
        "title": "8 ft × 3.5 ft / Alabaster White",
        "price": "₹17,200 / unit",
        "color": "#F7F4EF",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 3.5 ft (Extended)",
          "Finish / Color": "Alabaster White"
        }
      },
      {
        "id": "var_wpc01_5",
        "sku": "ROEL/WPC-01-8X35-CHR",
        "name": "8 ft × 3.5 ft / Smoked Charcoal",
        "title": "8 ft × 3.5 ft / Smoked Charcoal",
        "price": "₹17,800 / unit",
        "color": "#2D2B2A",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 3.5 ft (Extended)",
          "Finish / Color": "Smoked Charcoal"
        }
      },
      {
        "id": "var_wpc01_6",
        "sku": "ROEL/WPC-01-8X35-SND",
        "name": "8 ft × 3.5 ft / Warm Sand",
        "title": "8 ft × 3.5 ft / Warm Sand",
        "price": "₹17,600 / unit",
        "color": "#D7B691",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 3.5 ft (Extended)",
          "Finish / Color": "Warm Sand"
        }
      }
    ],
    "gallery": [
      "/images/door.webp",
      "/images/projectdoor.webp"
    ]
  },
  {
    "id": "monolith-flush-wpc-door",
    "sku": "ROEL / WPC-02",
    "category": "WPC Doors",
    "name": "Monolith Flush WPC Door",
    "short": "Seamless minimalist door slab with sound-dampening composite core and acoustic seal edge.",
    "description": "An understated flush interior door slab designed for ultra-clean architectural openings. Features a reinforced composite perimeter, calibrated weight distribution for smooth swing motion, and factory-primed or pre-finished surfaces.",
    "price": "₹16,500 / unit",
    "image": "/images/projectdoor.webp",
    "specs": [
      "Monolithic seamless flush face",
      "Integrated perimeter acoustic drop seal option",
      "Zero swelling or warping under tropical humidity",
      "Factory pre-hung frame options available"
    ],
    "applications": "Master bedrooms, private suites, wellness spas, and modern luxury residences.",
    "is_featured": false,
    "status": "published",
    "options": [
      {
        "id": "opt_wpc02_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "7 ft × 3 ft"
          },
          {
            "name": "8 ft × 4 ft (Grand)"
          }
        ]
      },
      {
        "id": "opt_wpc02_color",
        "name": "Finish / Color",
        "values": [
          {
            "name": "Raw Concrete Grey",
            "color": "#8C8884"
          },
          {
            "name": "Espresso Matt",
            "color": "#1F1A17"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_wpc02_1",
        "sku": "ROEL/WPC-02-7X3-GRY",
        "name": "7 ft × 3 ft / Raw Concrete Grey",
        "title": "7 ft × 3 ft / Raw Concrete Grey",
        "price": "₹16,500 / unit",
        "color": "#8C8884",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft",
          "Finish / Color": "Raw Concrete Grey"
        }
      },
      {
        "id": "var_wpc02_2",
        "sku": "ROEL/WPC-02-7X3-ESP",
        "name": "7 ft × 3 ft / Espresso Matt",
        "title": "7 ft × 3 ft / Espresso Matt",
        "price": "₹17,200 / unit",
        "color": "#1F1A17",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft",
          "Finish / Color": "Espresso Matt"
        }
      },
      {
        "id": "var_wpc02_3",
        "sku": "ROEL/WPC-02-8X4-GRY",
        "name": "8 ft × 4 ft / Raw Concrete Grey",
        "title": "8 ft × 4 ft / Raw Concrete Grey",
        "price": "₹21,000 / unit",
        "color": "#8C8884",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 4 ft (Grand)",
          "Finish / Color": "Raw Concrete Grey"
        }
      },
      {
        "id": "var_wpc02_4",
        "sku": "ROEL/WPC-02-8X4-ESP",
        "name": "8 ft × 4 ft / Espresso Matt",
        "title": "8 ft × 4 ft / Espresso Matt",
        "price": "₹21,800 / unit",
        "color": "#1F1A17",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 4 ft (Grand)",
          "Finish / Color": "Espresso Matt"
        }
      }
    ],
    "gallery": [
      "/images/projectdoor.webp",
      "/images/door.webp"
    ]
  },
  {
    "id": "burmese-teak-panel-door",
    "sku": "ROEL / WD-01",
    "category": "Wooden Doors",
    "name": "Burmese Teak Panel Door",
    "short": "Solid seasoned teakwood door featuring balanced architectural paneling and handcrafted grain detailing.",
    "description": "A timeless entrance door built from kiln-dried, seasoned plantation teakwood. Designed with traditional mortise-and-tenon joinery and finished with natural micro-porous oils that let the organic wood grain breathe and age gracefully.",
    "price": "₹38,500 / unit",
    "image": "/images/hero-doors.jpg",
    "specs": [
      "100% solid seasoned teakwood construction",
      "Traditional mortise-and-tenon structural joints",
      "Deep hand-rubbed organic oil polish",
      "Heavy-duty solid brass hinge compatibility"
    ],
    "applications": "Main entrance portals, courtyard entrances, heritage modern villas, and executive suites.",
    "is_featured": true,
    "status": "published",
    "options": [
      {
        "id": "opt_wd01_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "7 ft × 3.5 ft"
          },
          {
            "name": "8 ft × 4 ft (Grand Entrance)"
          }
        ]
      },
      {
        "id": "opt_wd01_tone",
        "name": "Finish / Tone",
        "values": [
          {
            "name": "Natural Golden Teak",
            "color": "#A46838"
          },
          {
            "name": "Deep Walnut Stain",
            "color": "#5A3B22"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_wd01_1",
        "sku": "ROEL/WD-01-7X35-GTK",
        "name": "7 ft × 3.5 ft / Natural Golden Teak",
        "title": "7 ft × 3.5 ft / Natural Golden Teak",
        "price": "₹38,500 / unit",
        "color": "#A46838",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/hero-doors.jpg"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3.5 ft",
          "Finish / Tone": "Natural Golden Teak"
        }
      },
      {
        "id": "var_wd01_2",
        "sku": "ROEL/WD-01-7X35-WNT",
        "name": "7 ft × 3.5 ft / Deep Walnut Stain",
        "title": "7 ft × 3.5 ft / Deep Walnut Stain",
        "price": "₹39,500 / unit",
        "color": "#5A3B22",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3.5 ft",
          "Finish / Tone": "Deep Walnut Stain"
        }
      },
      {
        "id": "var_wd01_3",
        "sku": "ROEL/WD-01-8X4-GTK",
        "name": "8 ft × 4 ft / Natural Golden Teak",
        "title": "8 ft × 4 ft / Natural Golden Teak",
        "price": "₹46,000 / unit",
        "color": "#A46838",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/hero-doors.jpg"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 4 ft (Grand Entrance)",
          "Finish / Tone": "Natural Golden Teak"
        }
      },
      {
        "id": "var_wd01_4",
        "sku": "ROEL/WD-01-8X4-WNT",
        "name": "8 ft × 4 ft / Deep Walnut Stain",
        "title": "8 ft × 4 ft / Deep Walnut Stain",
        "price": "₹47,200 / unit",
        "color": "#5A3B22",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 4 ft (Grand Entrance)",
          "Finish / Tone": "Deep Walnut Stain"
        }
      }
    ],
    "gallery": [
      "/images/hero-doors.jpg",
      "/images/door.webp"
    ]
  },
  {
    "id": "ribbed-hardwood-entrance-door",
    "sku": "ROEL / WD-02",
    "category": "Wooden Doors",
    "name": "Ribbed Hardwood Entrance Door",
    "short": "Sculptural solid oak door with continuous micro-fluting and an integrated solid brass pull handle.",
    "description": "An architectural statement door combining solid white oak stiles with three-dimensional linear fluting. The interplay of light and shadow across the timber slats creates a tactile entrance experience for distinguished architecture.",
    "price": "₹42,000 / unit",
    "image": "/images/door.webp",
    "specs": [
      "Solid rift-sawn European White Oak",
      "Continuous precision micro-ribbed tactile face",
      "Concealed multi-point deadbolt integration",
      "UV-resistant exterior matte polyurethane seal"
    ],
    "applications": "Luxury villa entrances, penthouse access doors, and design-led studio entries.",
    "is_featured": false,
    "status": "published",
    "options": [
      {
        "id": "opt_wd02_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "7.5 ft × 3.5 ft"
          },
          {
            "name": "8.5 ft × 4.5 ft (Pivot Entrance)"
          }
        ]
      },
      {
        "id": "opt_wd02_tone",
        "name": "Finish / Tone",
        "values": [
          {
            "name": "Natural White Oak",
            "color": "#BFA280"
          },
          {
            "name": "Smoked Torrefied Oak",
            "color": "#443831"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_wd02_1",
        "sku": "ROEL/WD-02-75X35-OAK",
        "name": "7.5 ft × 3.5 ft / Natural White Oak",
        "title": "7.5 ft × 3.5 ft / Natural White Oak",
        "price": "₹42,000 / unit",
        "color": "#BFA280",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "7.5 ft × 3.5 ft",
          "Finish / Tone": "Natural White Oak"
        }
      },
      {
        "id": "var_wd02_2",
        "sku": "ROEL/WD-02-75X35-SMK",
        "name": "7.5 ft × 3.5 ft / Smoked Torrefied Oak",
        "title": "7.5 ft × 3.5 ft / Smoked Torrefied Oak",
        "price": "₹44,000 / unit",
        "color": "#443831",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/hero-doors.jpg"
        ],
        "options": {
          "Size / Dimensions": "7.5 ft × 3.5 ft",
          "Finish / Tone": "Smoked Torrefied Oak"
        }
      },
      {
        "id": "var_wd02_3",
        "sku": "ROEL/WD-02-85X45-OAK",
        "name": "8.5 ft × 4.5 ft / Natural White Oak",
        "title": "8.5 ft × 4.5 ft / Natural White Oak",
        "price": "₹58,000 / unit",
        "color": "#BFA280",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "8.5 ft × 4.5 ft (Pivot Entrance)",
          "Finish / Tone": "Natural White Oak"
        }
      },
      {
        "id": "var_wd02_4",
        "sku": "ROEL/WD-02-85X45-SMK",
        "name": "8.5 ft × 4.5 ft / Smoked Torrefied Oak",
        "title": "8.5 ft × 4.5 ft / Smoked Torrefied Oak",
        "price": "₹61,000 / unit",
        "color": "#443831",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/hero-doors.jpg"
        ],
        "options": {
          "Size / Dimensions": "8.5 ft × 4.5 ft (Pivot Entrance)",
          "Finish / Tone": "Smoked Torrefied Oak"
        }
      }
    ],
    "gallery": [
      "/images/door.webp",
      "/images/hero-doors.jpg"
    ]
  },
  {
    "id": "horizontal-grain-walnut-veneer-door",
    "sku": "ROEL / VN-01",
    "category": "Veneer Doors",
    "name": "Horizontal Grain Walnut Veneer Door",
    "short": "Architectural flush door clad in slip-matched American Walnut veneer with satin polyurethane topcoat.",
    "description": "A contemporary door celebrating the rich horizontal striations of natural American Black Walnut veneer. Laid over a solid tubular particle-core for superior acoustic dampening and thermal stability.",
    "price": "₹22,500 / unit",
    "image": "/images/door.webp",
    "specs": [
      "Natural Crown Cut American Walnut veneer (0.6mm thickness)",
      "Horizontal grain orientation with matched face patterns",
      "High-density acoustic core (32 dB sound reduction rating)",
      "Solid hardwood edge-banding on all 4 sides"
    ],
    "applications": "High-end residential corridors, boardrooms, luxury apartments, and private study rooms.",
    "is_featured": true,
    "status": "published",
    "options": [
      {
        "id": "opt_vn01_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "7 ft × 3 ft"
          },
          {
            "name": "8 ft × 3.5 ft"
          }
        ]
      },
      {
        "id": "opt_vn01_tone",
        "name": "Finish / Tone",
        "values": [
          {
            "name": "Natural American Walnut",
            "color": "#5C4033"
          },
          {
            "name": "Ebonized Dark Walnut",
            "color": "#2A211D"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_vn01_1",
        "sku": "ROEL/VN-01-7X3-WNT",
        "name": "7 ft × 3 ft / Natural American Walnut",
        "title": "7 ft × 3 ft / Natural American Walnut",
        "price": "₹22,500 / unit",
        "color": "#5C4033",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft",
          "Finish / Tone": "Natural American Walnut"
        }
      },
      {
        "id": "var_vn01_2",
        "sku": "ROEL/VN-01-7X3-EBN",
        "name": "7 ft × 3 ft / Ebonized Dark Walnut",
        "title": "7 ft × 3 ft / Ebonized Dark Walnut",
        "price": "₹23,500 / unit",
        "color": "#2A211D",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft",
          "Finish / Tone": "Ebonized Dark Walnut"
        }
      },
      {
        "id": "var_vn01_3",
        "sku": "ROEL/VN-01-8X35-WNT",
        "name": "8 ft × 3.5 ft / Natural American Walnut",
        "title": "8 ft × 3.5 ft / Natural American Walnut",
        "price": "₹26,800 / unit",
        "color": "#5C4033",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 3.5 ft",
          "Finish / Tone": "Natural American Walnut"
        }
      },
      {
        "id": "var_vn01_4",
        "sku": "ROEL/VN-01-8X35-EBN",
        "name": "8 ft × 3.5 ft / Ebonized Dark Walnut",
        "title": "8 ft × 3.5 ft / Ebonized Dark Walnut",
        "price": "₹27,800 / unit",
        "color": "#2A211D",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 3.5 ft",
          "Finish / Tone": "Ebonized Dark Walnut"
        }
      }
    ],
    "gallery": [
      "/images/door.webp",
      "/images/slat.webp"
    ]
  },
  {
    "id": "bookmatched-smoked-ash-veneer-door",
    "sku": "ROEL / VN-02",
    "category": "Veneer Doors",
    "name": "Bookmatched Smoked Ash Veneer Door",
    "short": "Expressive vertical bookmatched veneer door with concealed magnetic latches and hidden hinges.",
    "description": "Crafted using hand-selected European Ash veneers subjected to thermal smoking for deep caramelization of the natural wood tones. The symmetrical bookmatching creates an artistic, mirror-image timber canvas.",
    "price": "₹24,800 / unit",
    "image": "/images/projectdoor.webp",
    "specs": [
      "Symmetrical vertical bookmatched veneer layout",
      "Thermo-treated smoked European Ash",
      "Anti-warp structural inner stabilizer layers",
      "Compatible with seamless flush-to-wall secret jamb systems"
    ],
    "applications": "Modern minimalist residences, master bedrooms, gallery spaces, and luxury hospitality.",
    "is_featured": false,
    "status": "published",
    "options": [
      {
        "id": "opt_vn02_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "7 ft × 3 ft"
          },
          {
            "name": "8 ft × 4 ft"
          }
        ]
      },
      {
        "id": "opt_vn02_tone",
        "name": "Finish / Tone",
        "values": [
          {
            "name": "Smoked Caramel Ash",
            "color": "#8C6D4C"
          },
          {
            "name": "Muted Nordic Ash",
            "color": "#B5A28A"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_vn02_1",
        "sku": "ROEL/VN-02-7X3-CAR",
        "name": "7 ft × 3 ft / Smoked Caramel Ash",
        "title": "7 ft × 3 ft / Smoked Caramel Ash",
        "price": "₹24,800 / unit",
        "color": "#8C6D4C",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft",
          "Finish / Tone": "Smoked Caramel Ash"
        }
      },
      {
        "id": "var_vn02_2",
        "sku": "ROEL/VN-02-7X3-NOR",
        "name": "7 ft × 3 ft / Muted Nordic Ash",
        "title": "7 ft × 3 ft / Muted Nordic Ash",
        "price": "₹25,500 / unit",
        "color": "#B5A28A",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "7 ft × 3 ft",
          "Finish / Tone": "Muted Nordic Ash"
        }
      },
      {
        "id": "var_vn02_3",
        "sku": "ROEL/VN-02-8X4-CAR",
        "name": "8 ft × 4 ft / Smoked Caramel Ash",
        "title": "8 ft × 4 ft / Smoked Caramel Ash",
        "price": "₹31,500 / unit",
        "color": "#8C6D4C",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/projectdoor.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 4 ft",
          "Finish / Tone": "Smoked Caramel Ash"
        }
      },
      {
        "id": "var_vn02_4",
        "sku": "ROEL/VN-02-8X4-NOR",
        "name": "8 ft × 4 ft / Muted Nordic Ash",
        "title": "8 ft × 4 ft / Muted Nordic Ash",
        "price": "₹32,200 / unit",
        "color": "#B5A28A",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/door.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 4 ft",
          "Finish / Tone": "Muted Nordic Ash"
        }
      }
    ],
    "gallery": [
      "/images/projectdoor.webp",
      "/images/door.webp"
    ]
  },
  {
    "id": "acoustic-walnut-fluted-slats",
    "sku": "ROEL / WL-01",
    "category": "Wall Solutions",
    "name": "Acoustic Walnut Fluted Slats",
    "short": "Rhythmic solid-feel timber acoustic panels with sound-absorbing recycled felt backing.",
    "description": "Premium modular acoustic slat paneling that transforms plain walls into warm, textural architectural surfaces while dramatically reducing room reverberation and echo.",
    "price": "₹450 / sq. ft.",
    "image": "/images/slat.webp",
    "specs": [
      "Natural wood veneer slats over precision MDF",
      "9mm sound-absorbing PET acoustic felt backing",
      "Tongue-and-groove modular seamless joining",
      "Fire rating Class B1 compliant"
    ],
    "applications": "Home theatres, living room media walls, bedroom headboard backdrops, and executive boardrooms.",
    "is_featured": true,
    "status": "published",
    "options": [
      {
        "id": "opt_wl01_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "8 ft × 2 ft Modular Sheet"
          },
          {
            "name": "9.5 ft × 2 ft Full Height"
          }
        ]
      },
      {
        "id": "opt_wl01_tone",
        "name": "Finish / Tone",
        "values": [
          {
            "name": "Natural Walnut",
            "color": "#5C4033"
          },
          {
            "name": "Scandinavian Oak",
            "color": "#AFA088"
          },
          {
            "name": "Midnight Charcoal",
            "color": "#1F1D1B"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_wl01_1",
        "sku": "ROEL/WL-01-8X2-WNT",
        "name": "8 ft × 2 ft / Natural Walnut",
        "title": "8 ft × 2 ft / Natural Walnut",
        "price": "₹450 / sq. ft.",
        "color": "#5C4033",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/slat.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 2 ft Modular Sheet",
          "Finish / Tone": "Natural Walnut"
        }
      },
      {
        "id": "var_wl01_2",
        "sku": "ROEL/WL-01-8X2-OAK",
        "name": "8 ft × 2 ft / Scandinavian Oak",
        "title": "8 ft × 2 ft / Scandinavian Oak",
        "price": "₹460 / sq. ft.",
        "color": "#AFA088",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/living.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 2 ft Modular Sheet",
          "Finish / Tone": "Scandinavian Oak"
        }
      },
      {
        "id": "var_wl01_3",
        "sku": "ROEL/WL-01-8X2-CHR",
        "name": "8 ft × 2 ft / Midnight Charcoal",
        "title": "8 ft × 2 ft / Midnight Charcoal",
        "price": "₹480 / sq. ft.",
        "color": "#1F1D1B",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/slat.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 2 ft Modular Sheet",
          "Finish / Tone": "Midnight Charcoal"
        }
      },
      {
        "id": "var_wl01_4",
        "sku": "ROEL/WL-01-95X2-WNT",
        "name": "9.5 ft × 2 ft / Natural Walnut",
        "title": "9.5 ft × 2 ft / Natural Walnut",
        "price": "₹520 / sq. ft.",
        "color": "#5C4033",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/slat.webp"
        ],
        "options": {
          "Size / Dimensions": "9.5 ft × 2 ft Full Height",
          "Finish / Tone": "Natural Walnut"
        }
      },
      {
        "id": "var_wl01_5",
        "sku": "ROEL/WL-01-95X2-OAK",
        "name": "9.5 ft × 2 ft / Scandinavian Oak",
        "title": "9.5 ft × 2 ft / Scandinavian Oak",
        "price": "₹530 / sq. ft.",
        "color": "#AFA088",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/living.webp"
        ],
        "options": {
          "Size / Dimensions": "9.5 ft × 2 ft Full Height",
          "Finish / Tone": "Scandinavian Oak"
        }
      },
      {
        "id": "var_wl01_6",
        "sku": "ROEL/WL-01-95X2-CHR",
        "name": "9.5 ft × 2 ft / Midnight Charcoal",
        "title": "9.5 ft × 2 ft / Midnight Charcoal",
        "price": "₹550 / sq. ft.",
        "color": "#1F1D1B",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/slat.webp"
        ],
        "options": {
          "Size / Dimensions": "9.5 ft × 2 ft Full Height",
          "Finish / Tone": "Midnight Charcoal"
        }
      }
    ],
    "gallery": [
      "/images/slat.webp",
      "/images/living.webp"
    ]
  },
  {
    "id": "architectural-ribbed-wall-cladding",
    "sku": "ROEL / WL-02",
    "category": "Wall Solutions",
    "name": "Architectural Ribbed Wall Cladding",
    "short": "Fine-fluted architectural cladding designed for continuous feature walls and curved surfaces.",
    "description": "A versatile linear wall cladding system capable of wrapping flat surfaces and gentle architectural curves. Engineered with precision flutes that catch directional light, bringing subtle motion and tactile warmth to modern interiors.",
    "price": "₹380 / sq. ft.",
    "image": "/images/wave.webp",
    "specs": [
      "Flexible backing capable of accommodating subtle convex/concave curves",
      "Seamless interlocking edge profile",
      "Moisture-resistant interior grade composite",
      "Ready for direct adhesive or cleat mounting"
    ],
    "applications": "Curved reception desks, entry hallways, column wrapping, and dining feature walls.",
    "is_featured": false,
    "status": "published",
    "options": [
      {
        "id": "opt_wl02_size",
        "name": "Size / Dimensions",
        "values": [
          {
            "name": "8 ft × 1 ft Slender Panel"
          },
          {
            "name": "10 ft × 1 ft Grand Panel"
          }
        ]
      },
      {
        "id": "opt_wl02_tone",
        "name": "Finish / Tone",
        "values": [
          {
            "name": "Warm Linen Oak",
            "color": "#A89278"
          },
          {
            "name": "Brushed Teak",
            "color": "#7B5A3D"
          }
        ]
      }
    ],
    "variants": [
      {
        "id": "var_wl02_1",
        "sku": "ROEL/WL-02-8X1-LNN",
        "name": "8 ft × 1 ft / Warm Linen Oak",
        "title": "8 ft × 1 ft / Warm Linen Oak",
        "price": "₹380 / sq. ft.",
        "color": "#A89278",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/wave.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 1 ft Slender Panel",
          "Finish / Tone": "Warm Linen Oak"
        }
      },
      {
        "id": "var_wl02_2",
        "sku": "ROEL/WL-02-8X1-BTK",
        "name": "8 ft × 1 ft / Brushed Teak",
        "title": "8 ft × 1 ft / Brushed Teak",
        "price": "₹410 / sq. ft.",
        "color": "#7B5A3D",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/ceiling.webp"
        ],
        "options": {
          "Size / Dimensions": "8 ft × 1 ft Slender Panel",
          "Finish / Tone": "Brushed Teak"
        }
      },
      {
        "id": "var_wl02_3",
        "sku": "ROEL/WL-02-10X1-LNN",
        "name": "10 ft × 1 ft / Warm Linen Oak",
        "title": "10 ft × 1 ft / Warm Linen Oak",
        "price": "₹440 / sq. ft.",
        "color": "#A89278",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/wave.webp"
        ],
        "options": {
          "Size / Dimensions": "10 ft × 1 ft Grand Panel",
          "Finish / Tone": "Warm Linen Oak"
        }
      },
      {
        "id": "var_wl02_4",
        "sku": "ROEL/WL-02-10X1-BTK",
        "name": "10 ft × 1 ft / Brushed Teak",
        "title": "10 ft × 1 ft / Brushed Teak",
        "price": "₹470 / sq. ft.",
        "color": "#7B5A3D",
        "has_color": true,
        "is_available": true,
        "images": [
          "/images/ceiling.webp"
        ],
        "options": {
          "Size / Dimensions": "10 ft × 1 ft Grand Panel",
          "Finish / Tone": "Brushed Teak"
        }
      }
    ],
    "gallery": [
      "/images/wave.webp",
      "/images/ceiling.webp"
    ]
  }
];
