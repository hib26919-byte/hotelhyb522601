import { createContext, useContext, useMemo, useState } from "react";

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openBooking = (room) => {
    setSelectedRoom(room || null);
    setIsOpen(true);
  };

  const closeBooking = () => setIsOpen(false);

  const value = useMemo(
    () => ({
      selectedRoom,
      setSelectedRoom,
      isOpen,
      openBooking,
      closeBooking,
    }),
    [isOpen, selectedRoom],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBooking = () => useContext(BookingContext);

export default BookingContext;

