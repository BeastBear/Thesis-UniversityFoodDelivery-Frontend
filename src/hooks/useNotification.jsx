import { toast } from "react-toastify";
import { useCallback } from "react";

// You can map notification types to sound files here
// Ensure these files exist in your public folder
const SOUND_MAP = {
  default: "/notification1.mp3",
  success: "/notification1.mp3",
  error: "/notification1.mp3",
  info: "/notification1.mp3",
  warning: "/notification1.mp3",
};

const useNotification = () => {
  const playSound = useCallback((type = "default") => {
    const soundFile = SOUND_MAP[type] || SOUND_MAP.default;
    const audio = new Audio(soundFile);
    audio.play().catch((err) => {
      // Audio play might fail if user hasn't interacted with the document yet
    });
  }, []);

  const notify = useCallback(
    (message, type = "default", options = {}) => {
      // Play sound
      playSound(type);
    },
    [playSound],
  );

  return { notify };
};

export default useNotification;
