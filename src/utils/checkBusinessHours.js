// Utility function to check if a shop is currently open based on business hours
export const checkBusinessHours = (businessHours, temporaryClosure = null, specialHolidays = null) => {
  const now = new Date();
  
  // Check special holidays first
  if (specialHolidays && Array.isArray(specialHolidays) && specialHolidays.length > 0) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    for (const holiday of specialHolidays) {
      const startDate = new Date(holiday.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(holiday.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      // If today is within the holiday period, shop is closed
      if (today >= startDate && today <= endDate) {
        return { isOpen: false, isClosingSoon: false, closureReason: "special_holiday" };
      }
    }
  }
  
  // Check temporary closure - if shop is temporarily closed, it's always closed
  if (temporaryClosure?.isClosed) {
    // If closedUntil is set, check if we've passed that date
    if (temporaryClosure.closedUntil) {
      const closedUntil = new Date(temporaryClosure.closedUntil);
      // Add a small buffer (1 second) to account for timing differences
      if (now.getTime() > closedUntil.getTime() + 1000) {
        // Closure period has passed, check business hours normally
        // Continue to business hours check below (treat as if no closure)
      } else {
        // Still within closure period
        return { isOpen: false, isClosingSoon: false, closureReason: temporaryClosure.reopenTime ? "temporarily_closed" : "closed" };
      }
    } else if (temporaryClosure.reopenTime) {
      // No closedUntil date, check reopenTime
      const [hour, minute] = temporaryClosure.reopenTime.split(":").map(Number);
      if (!isNaN(hour) && !isNaN(minute)) {
        const reopenDate = new Date();
        reopenDate.setHours(hour, minute, 0, 0);
        
        // If reopen time is earlier than current time today, it might be for today or tomorrow
        // Check if we've already passed the reopen time today
        const reopenTimeToday = new Date(now);
        reopenTimeToday.setHours(hour, minute, 0, 0);
        
        // If current time is past the reopen time today, closure has expired
        if (now.getTime() >= reopenTimeToday.getTime()) {
          // Reopen time has passed, check business hours normally
          // Continue to business hours check below (treat as if no closure)
        } else {
          // Reopen time hasn't arrived yet today, shop is still closed
          return { isOpen: false, isClosingSoon: false, closureReason: "temporarily_closed" };
        }
      }
    } else {
      // No closedUntil date and no reopenTime, shop is closed indefinitely
      return { isOpen: false, isClosingSoon: false, closureReason: "closed" };
    }
  }

  // If no business hours data, assume shop is open
  if (!businessHours || !Array.isArray(businessHours) || businessHours.length === 0) {
    return { isOpen: true, isClosingSoon: false };
  }

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const currentDay = dayNames[now.getDay()];
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = businessHours.find((h) => h && h.day === currentDay);

  // If no hours set for today, assume open
  if (!todayHours) {
    return { isOpen: true, isClosingSoon: false };
  }

  // If shop is marked as closed for today, return closed
  if (todayHours.isClosed === true) {
    return { isOpen: false, isClosingSoon: false };
  }

  // Check if using new format with timeSlots
  if (todayHours.timeSlots && Array.isArray(todayHours.timeSlots) && todayHours.timeSlots.length > 0) {
    for (const slot of todayHours.timeSlots) {
      if (slot.is24Hours) {
        return { isOpen: true, isClosingSoon: false };
      }

      if (!slot.openTime || !slot.closeTime) continue;

      const [openHour, openMin] = slot.openTime.split(":").map(Number);
      const [closeHour, closeMin] = slot.closeTime.split(":").map(Number);
      
      if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) continue;
      
      const openTimeInMinutes = openHour * 60 + openMin;
      const closeTimeInMinutes = closeHour * 60 + closeMin;

      let isWithinSlot = false;
      let minutesUntilClose = Infinity;

      if (closeTimeInMinutes < openTimeInMinutes) {
        // Overnight hours (e.g., 22:00 - 02:00)
        isWithinSlot = currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes;
        if (isWithinSlot) {
          if (currentTimeInMinutes >= openTimeInMinutes) {
            minutesUntilClose = 24 * 60 - currentTimeInMinutes + closeTimeInMinutes;
          } else {
            minutesUntilClose = closeTimeInMinutes - currentTimeInMinutes;
          }
        }
      } else {
        // Normal hours (e.g., 09:00 - 17:00)
        isWithinSlot = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
        if (isWithinSlot) {
          minutesUntilClose = closeTimeInMinutes - currentTimeInMinutes;
        }
      }

      if (isWithinSlot) {
        return {
          isOpen: true,
          isClosingSoon: minutesUntilClose <= 30 && minutesUntilClose > 0,
        };
      }
    }
    // If we get here, current time doesn't fall within any time slot
    return { isOpen: false, isClosingSoon: false };
  }

  // Legacy format support (for backward compatibility)
  if (todayHours.openTime && todayHours.closeTime) {
    const openTimeParts = todayHours.openTime.split(":");
    const closeTimeParts = todayHours.closeTime.split(":");
    
    if (openTimeParts.length !== 2 || closeTimeParts.length !== 2) {
      return { isOpen: true, isClosingSoon: false };
    }
    
    const [openHour, openMin] = openTimeParts.map(Number);
    const [closeHour, closeMin] = closeTimeParts.map(Number);
    
    if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) {
      return { isOpen: true, isClosingSoon: false };
    }
    
    const openTimeInMinutes = openHour * 60 + openMin;
    const closeTimeInMinutes = closeHour * 60 + closeMin;

    let isOpenStatus = false;
    let isClosingSoonStatus = false;

    if (closeTimeInMinutes < openTimeInMinutes) {
      // Overnight hours
      isOpenStatus = currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes;
      if (isOpenStatus) {
        if (currentTimeInMinutes >= openTimeInMinutes) {
          const minutesUntilClose = 24 * 60 - currentTimeInMinutes + closeTimeInMinutes;
          isClosingSoonStatus = minutesUntilClose <= 30;
        } else {
          const minutesUntilClose = closeTimeInMinutes - currentTimeInMinutes;
          isClosingSoonStatus = minutesUntilClose <= 30 && minutesUntilClose > 0;
        }
      }
    } else {
      // Normal hours
      isOpenStatus = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
      if (isOpenStatus) {
        const minutesUntilClose = closeTimeInMinutes - currentTimeInMinutes;
        isClosingSoonStatus = minutesUntilClose <= 30 && minutesUntilClose > 0;
      }
    }

    return { isOpen: isOpenStatus, isClosingSoon: isClosingSoonStatus };
  }

  return { isOpen: true, isClosingSoon: false };
};

