import { loadFont as loadBaloo } from "@remotion/google-fonts/BalooTammudu2";
import { loadFont as loadNoto } from "@remotion/google-fonts/NotoSansTelugu";

// Rounded bold Telugu display for captions, Noto Telugu for smaller labels.
export const TE_DISPLAY = loadBaloo().fontFamily;
export const TE_BODY = loadNoto().fontFamily;
