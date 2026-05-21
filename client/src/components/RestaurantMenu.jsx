import { useState } from "react";
import SectionHeading from "./SectionHeading";

const MENU_DATA = {
  "Soups": [
    { name: "Tomato Dhaniya Soup", price: "100.00" },
    { name: "Veg Corn Soup", price: "100.00" },
    { name: "Veg Clear Soup", price: "100.00" },
    { name: "Veg Hot and Sour Soup", price: "100.00" },
    { name: "Veg Schezwan Soup", price: "100.00" },
    { name: "Veg Cantonese Soup", price: "100.00" },
    { name: "Chicken Corn Soup", price: "120.00" },
    { name: "Chicken Hot and Sour Soup", price: "120.00" },
    { name: "Chicken Schezwan Soup", price: "120.00" },
    { name: "Chicken Cantonese Soup", price: "120.00" },
  ],
  "Veg Starters": [
    { name: "Diced Vegetable", price: "230.00" },
    { name: "Veg Manchuria", price: "230.00" },
    { name: "Hongkong Veg", price: "230.00" },
    { name: "Baby Corn (Manchuria/65/Chilli/Majestic/Crispy)", price: "260.00" },
    { name: "Paneer (Manchuria/65/Chilli/Majestic/Crispy)", price: "260.00" },
    { name: "Mushroom (Chilli/65/Manchuria)", price: "260.00" },
    { name: "Veg Lollipop", price: "260.00" },
    { name: "Special Veg", price: "230.00" },
  ],
  "Non-Veg Starters": [
    { name: "Shimla Chicken", price: "299.00" },
    { name: "Schezwan Chicken", price: "299.00" },
    { name: "Hongkong Chicken", price: "299.00" },
    { name: "Dragon Chicken", price: "299.00" },
    { name: "Chicken 20 20", price: "299.00" },
    { name: "Chicken 555", price: "299.00" },
    { name: "Chicken 65", price: "299.00" },
    { name: "Chicken Majestic", price: "299.00" },
    { name: "Chicken Vepudu", price: "319.00" },
    { name: "Chicken Kali Mirchi", price: "319.00" },
    { name: "Chicken Ghee Roast", price: "319.00" },
    { name: "Mutton Kali Mirchi", price: "399.00" },
    { name: "Mutton Ghee Roast", price: "399.00" },
  ],
  "Tandoori": [
    { name: "Veg Sheek Kabab", price: "280.00" },
    { name: "Paneer Tikka", price: "300.00" },
    { name: "Mushroom Tikka", price: "300.00" },
    { name: "Tandoori Chicken (H/F)", price: "249.00/450.00" },
    { name: "Chicken Tikka", price: "320.00" },
    { name: "Tangidi Kabab", price: "380.00" },
    { name: "Hariyali Chicken Kabab", price: "320.00" },
    { name: "Boti Kebab", price: "449.00" },
    { name: "Mutton Kabab", price: "449.00" },
  ],
  "Veg Curries": [
    { name: "Dhal Thadka", price: "170.00" },
    { name: "Dhal Fry", price: "170.00" },
    { name: "Tomato Pappu", price: "170.00" },
    { name: "Kaju Tomato", price: "260.00" },
    { name: "Mix Veg Curry", price: "260.00" },
    { name: "Kadai Veg", price: "260.00" },
    { name: "Paneer Butter Masala", price: "290.00" },
  ],
  "Non-Veg Curries": [
    { name: "Telangana Chicken Curry", price: "329.00" },
    { name: "Rayalaseema Chicken Curry", price: "329.00" },
    { name: "Gongura Chicken Curry", price: "329.00" },
    { name: "Chicken Kali Mirchi", price: "329.00" },
    { name: "Nawab/Noorzahan", price: "329.00" },
    { name: "Natukodi Pulusu", price: "390.00" },
    { name: "Mutton Rogan Josh", price: "390.00" },
    { name: "Mutton Keema Masala", price: "399.00" },
  ],
  "Sea Food": [
    { name: "Prawns Masala / Kadai", price: "379.00" },
    { name: "Prawns Curry", price: "379.00" },
    { name: "Fish Masala / Kadai", price: "379.00" },
  ]
};

const RestaurantMenu = () => {
  const [activeTab, setActiveTab] = useState("Soups");
  const categories = Object.keys(MENU_DATA);

  return (
    <section className="section" style={{ background: "#0a0a0a", color: "#faf8f5", padding: "6rem 0" }}>
      <div className="container" style={{ width: "min(100vw - 2rem, 1200px)", margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <SectionHeading
            eyebrow="The Menu"
            title="Culinary Excellence"
            description="Explore a symphony of flavors crafted by our master chefs, featuring authentic Indian traditions and contemporary twists."
            centered
          />
        </div>

        {/* Desktop Tabs */}
        <div className="menu-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`menu-tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          <div className="menu-category-header">
             <div className="menu-line"></div>
             <h3>{activeTab}</h3>
             <div className="menu-line"></div>
          </div>
          
          <div className="menu-items-container">
            {MENU_DATA[activeTab].map((item, idx) => (
              <div key={idx} className="menu-item reveal stagger-item">
                <div className="menu-item-name">{item.name}</div>
                <div className="menu-item-dots"></div>
                <div className="menu-item-price">₹ {item.price}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .menu-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 3rem;
        }
        
        .menu-tab {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(201, 168, 76, 0.2);
          color: rgba(250, 248, 245, 0.7);
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          cursor: pointer;
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }
        
        .menu-tab:hover {
          background: rgba(201, 168, 76, 0.1);
          color: #c9a84c;
        }
        
        .menu-tab.active {
          background: linear-gradient(135deg, #e8d5a3, #c9a84c);
          color: #1a1a1a;
          border-color: #c9a84c;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(201, 168, 76, 0.3);
        }

        .menu-grid {
          background: rgba(26, 26, 26, 0.6);
          border: 1px solid rgba(201, 168, 76, 0.15);
          border-radius: 24px;
          padding: 3rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .menu-category-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .menu-category-header h3 {
          font-family: 'Cinzel', serif;
          font-size: 2rem;
          color: #c9a84c;
          margin: 0;
          white-space: nowrap;
        }

        .menu-line {
          height: 2px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
          max-width: 200px;
        }

        .menu-items-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          column-gap: 4rem;
          row-gap: 1.5rem;
        }

        .menu-item {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .menu-item-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          color: #faf8f5;
          text-transform: capitalize;
        }

        .menu-item-dots {
          flex: 1;
          border-bottom: 1px dashed rgba(201, 168, 76, 0.3);
          margin-bottom: 0.4rem;
        }

        .menu-item-price {
          font-family: 'Cinzel', serif;
          color: #c9a84c;
          font-size: 1rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .menu-grid { padding: 1.5rem; }
          .menu-category-header h3 { font-size: 1.5rem; }
          .menu-items-container { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
};

export default RestaurantMenu;
