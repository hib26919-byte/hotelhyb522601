import React from "react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const slots = ["Morning", "Afternoon", "Evening", "Night"];

const BookingHeatmap = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Flatten if data is array of arrays
  const flatData = Array.isArray(data[0]) ? data.flat() : data;

  return (
    <div style={{ width: "100%", overflowX: "auto", padding: "0.5rem 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto repeat(7, 1fr)", gap: "4px", minWidth: 400 }}>
        <div /> {/* Empty corner */}
        {days.map((day) => (
          <div key={day} style={{ textAlign: "center", fontSize: "0.7rem", color: "#8f8579", paddingBottom: "4px" }}>
            {day}
          </div>
        ))}

        {slots.map((slot, sIdx) => (
          <React.Fragment key={slot}>
            <div style={{ fontSize: "0.7rem", color: "#8f8579", textAlign: "right", paddingRight: "8px", alignSelf: "center" }}>
              {slot}
            </div>
            {days.map((_, dIdx) => {
              const cellData = flatData.find(d => d.slot === sIdx && d.day === dIdx);
              const value = cellData ? cellData.value : 0;
              // Scale opacity based on value
              const opacity = Math.min(value / 5 + 0.1, 1);
              return (
                <div
                  key={`${sIdx}-${dIdx}`}
                  title={`${value} bookings`}
                  style={{
                    height: 28,
                    borderRadius: 4,
                    background: value > 0 ? `rgba(201,168,76,${opacity})` : "rgba(0,0,0,0.03)",
                    border: "1px solid rgba(201,168,76,0.1)",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => e.currentTarget.style.border = "1px solid rgba(201,168,76,0.5)"}
                  onMouseLeave={e => e.currentTarget.style.border = "1px solid rgba(201,168,76,0.1)"}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem", fontSize: "0.65rem", color: "#8f8579" }}>
        <span>Less</span>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(201,168,76,0.1)" }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(201,168,76,0.3)" }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(201,168,76,0.6)" }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(201,168,76,1)" }} />
        <span>More</span>
      </div>
    </div>
  );
};

export default BookingHeatmap;
