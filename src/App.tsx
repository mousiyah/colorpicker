import { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Typography,
  Grid,
  Paper,
} from "@mui/material";
import { HexColorPicker } from "react-colorful";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { styled } from "@mui/material/styles";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";

const ColorPreview = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "clamp(50px, 6vh, 70px)",
  borderRadius: theme.shape.borderRadius,
  marginBottom: "clamp(8px, 1.5vh, 16px)",
  marginTop: theme.spacing(0),
  transition: "background-color 0.3s ease",
  display: "flex",
  gap: "clamp(8px, 1.5vw, 16px)",
  padding: "clamp(8px, 1.5vw, 16px)",
}));

const TextPreviewBox = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: theme.shape.borderRadius,
  fontFamily: "Calibri, sans-serif",
  fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
  fontWeight: "bold",
}));

const ShadeSelector = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "clamp(4px, 1vw, 8px)",
  overflowX: "auto",
  padding: "clamp(12px, 2vw, 16px)",
  paddingBottom: "clamp(24px, 3vh, 32px)",
  "&::-webkit-scrollbar": {
    height: "clamp(6px, 1vw, 10px)",
  },
  "&::-webkit-scrollbar-track": {
    background: "#f1f1f1",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#888",
    borderRadius: "4px",
  },
}));

const ShadeBox = styled(Box)<{ color: string; selected?: boolean }>(
  ({ color, selected, theme }) => ({
    minWidth: "clamp(50px, 8vw, 70px)",
    height: "clamp(50px, 8vw, 70px)",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backgroundColor: color,
    position: "relative",
    border: selected
      ? `clamp(3px, 0.5vw, 5px) solid ${theme.palette.primary.main}`
      : `clamp(3px, 0.5vw, 5px) solid transparent`,
    boxShadow: selected ? theme.shadows[4] : "none",
    "&:hover": {
      transform: "scale(1.1)",
      boxShadow: theme.shadows[4],
    },
  })
);

const ShadeLabel = styled(Typography)({
  position: "absolute",
  bottom: "clamp(-10px, -2.5vh, -24px)",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)",
  whiteSpace: "nowrap",
  textAlign: "center",
});

const ColorPickerContainer = styled(Box)({
  position: "relative",
  width: "100%",
  height: "clamp(200px, 30vh, 350px)",
  "& .react-colorful": {
    width: "100%",
    height: "100%",
  },
});

const FavoritesContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(clamp(80px, 15vw, 120px), 1fr))",
  gap: "clamp(4px, 1vw, 8px)",
  maxHeight: "calc(100% - clamp(60px, 8vh, 80px))", // Account for title and search bar
  overflowY: "auto",
  padding: "clamp(4px, 1vw, 8px)",
  "&::-webkit-scrollbar": {
    width: "clamp(6px, 1vw, 10px)",
  },
  "&::-webkit-scrollbar-track": {
    background: "#f1f1f1",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#888",
    borderRadius: "4px",
  },
}));

const FavoriteItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "clamp(2px, 0.5vw, 4px)",
  padding: "clamp(4px, 1vw, 8px)",
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FavoriteColor = styled(Box)<{ color: string }>(({ color }) => ({
  width: "clamp(32px, 6vw, 48px)",
  height: "clamp(32px, 6vw, 48px)",
  borderRadius: "4px",
  backgroundColor: color,
  border: "clamp(1px, 0.2vw, 3px) solid transparent",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "scale(1.1)",
  },
}));

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface CmykColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

interface HsbColor {
  h: number;
  s: number;
  b: number;
}

interface FavoriteColor {
  color: string;
  name: string;
}

function hexToRgb(hex: string): RgbaColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function generateShades(hexColor: string): string[] {
  const shades: string[] = [];
  const rgb = hexToRgb(hexColor);
  if (!rgb) return shades;

  // Generate shades from white (-100%) to the selected color (0%)
  for (let i = -100; i <= 0; i++) {
    const factor = (i + 100) / 100; // Convert -100 to 0 range to 0 to 1
    const shade = {
      r: Math.round(255 * (1 - factor) + rgb.r * factor),
      g: Math.round(255 * (1 - factor) + rgb.g * factor),
      b: Math.round(255 * (1 - factor) + rgb.b * factor),
    };
    shades.push(rgbToHex(shade.r, shade.g, shade.b));
  }

  // Generate shades from the selected color (0%) to black (100%)
  for (let i = 1; i <= 100; i++) {
    const factor = i / 100;
    const shade = {
      r: Math.round(rgb.r * (1 - factor)),
      g: Math.round(rgb.g * (1 - factor)),
      b: Math.round(rgb.b * (1 - factor)),
    };
    shades.push(rgbToHex(shade.r, shade.g, shade.b));
  }

  return shades;
}

function rgbToCmyk(r: number, g: number, b: number): CmykColor {
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  const k = 1 - Math.max(r1, g1, b1);
  const c = (1 - r1 - k) / (1 - k) || 0;
  const m = (1 - g1 - k) / (1 - k) || 0;
  const y = (1 - b1 - k) / (1 - k) || 0;
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Ensure values are within valid ranges
  h = Math.max(0, Math.min(1, h));
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToHsb(r: number, g: number, b: number): HsbColor {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let s = max === 0 ? 0 : d / max;
  let v = max;
  let h = 0;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Ensure values are within valid ranges
  h = Math.max(0, Math.min(1, h));
  s = Math.max(0, Math.min(1, s));
  v = Math.max(0, Math.min(1, v));

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(v * 100),
  };
}

function App() {
  const [color, setColor] = useState("#3f51b5");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [rgb, setRgb] = useState<RgbaColor>({ r: 63, g: 81, b: 181 });
  const [hsl, setHsl] = useState({ h: 231, s: 48, l: 48 });
  const [shades, setShades] = useState<string[]>([]);
  const [selectedShadeIndex, setSelectedShadeIndex] = useState<number | null>(
    null
  );
  const [isShadeSelection, setIsShadeSelection] = useState(false);
  const [hexInput, setHexInput] = useState("#3f51b5");
  const shadeSelectorRef = useRef<HTMLDivElement>(null);
  const [cmyk, setCmyk] = useState<CmykColor>({ c: 0, m: 0, y: 0, k: 0 });
  const [hsb, setHsb] = useState<HsbColor>({ h: 0, s: 0, b: 0 });
  const [favorites, setFavorites] = useState<FavoriteColor[]>(() => {
    // Load favorites from localStorage on component mount
    const savedFavorites = localStorage.getItem("colorPickerFavorites");
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });
  const [favoriteSearch, setFavoriteSearch] = useState("");
  const [editingFavoriteIndex, setEditingFavoriteIndex] = useState<
    number | null
  >(null);

  // Function to find the closest shade index
  const findClosestShadeIndex = (targetColor: string): number => {
    const targetRgb = hexToRgb(targetColor);
    if (!targetRgb) return 100; // Default to center (selected color)

    // Calculate the relative position of the target color
    const maxComponent = Math.max(targetRgb.r, targetRgb.g, targetRgb.b);
    const minComponent = Math.min(targetRgb.r, targetRgb.g, targetRgb.b);

    // If the color is closer to white
    if (maxComponent > 128) {
      // Map to the first half of the shades (-100 to 0)
      const factor = (255 - maxComponent) / 255;
      return Math.round(-100 * factor);
    } else {
      // Map to the second half of the shades (0 to 100)
      const factor = minComponent / 255;
      return Math.round(100 * (1 - factor));
    }
  };

  useEffect(() => {
    const newRgb = hexToRgb(color);
    if (newRgb) {
      setRgb(newRgb);
      setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
      setHsb(rgbToHsb(newRgb.r, newRgb.g, newRgb.b));
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    }
    // Only generate new shades if the color change didn't come from shade selection
    if (!isShadeSelection) {
      setShades(generateShades(color));
      // Set the selected index to 100 (center/0%)
      setSelectedShadeIndex(100);

      if (shadeSelectorRef.current) {
        // Scroll to the center shade (index 100)
        const centerElement = shadeSelectorRef.current
          .children[100] as HTMLElement;
        if (centerElement) {
          centerElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }
  }, [color]);

  const handleCopyColor = () => {
    navigator.clipboard.writeText(color);
    setShowSnackbar(true);
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setHexInput(newColor);
    setIsShadeSelection(false);
  };

  const handleShadeClick = (shade: string, index: number) => {
    setColor(shade);
    setHexInput(shade);
    setIsShadeSelection(true);
    setSelectedShadeIndex(index);
    handleCopyColor();

    if (shadeSelectorRef.current) {
      const shadeElement = shadeSelectorRef.current.children[
        index
      ] as HTMLElement;
      if (shadeElement) {
        shadeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  };

  const handleRgbChange =
    (component: "r" | "g" | "b") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsShadeSelection(false);
      const value = Math.min(
        255,
        Math.max(0, parseInt(event.target.value) || 0)
      );
      const newRgb = { ...rgb, [component]: value };
      setRgb(newRgb);
      setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
      setHsb(rgbToHsb(newRgb.r, newRgb.g, newRgb.b));
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
      const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setColor(newColor);
      setHexInput(newColor);
    };

  const handleHslChange =
    (component: "h" | "s" | "l") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsShadeSelection(false);
      const value = Math.min(
        component === "h" ? 360 : 100,
        Math.max(0, parseInt(event.target.value) || 0)
      );
      const newHsl = { ...hsl, [component]: value };
      setHsl(newHsl);
      const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const newColor = rgbToHex(rgb.r, rgb.g, rgb.b);
      setColor(newColor);
      setHexInput(newColor);
    };

  function hslToRgb(h: number, s: number, l: number): RgbaColor {
    s /= 100;
    l /= 100;

    if (s === 0) {
      // Achromatic (gray)
      const gray = Math.round(l * 255);
      return { r: gray, g: gray, b: gray };
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: Math.max(
        0,
        Math.min(255, Math.round(255 * hue2rgb(p, q, h / 360 + 1 / 3)))
      ),
      g: Math.max(0, Math.min(255, Math.round(255 * hue2rgb(p, q, h / 360)))),
      b: Math.max(
        0,
        Math.min(255, Math.round(255 * hue2rgb(p, q, h / 360 - 1 / 3)))
      ),
    };
  }

  const handleCmykChange =
    (component: keyof CmykColor) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsShadeSelection(false);
      const value = Math.min(
        100,
        Math.max(0, parseInt(event.target.value) || 0)
      );
      const newCmyk = { ...cmyk, [component]: value };
      setCmyk(newCmyk);
      // Convert CMYK to RGB and update color
      const r = Math.max(
        0,
        Math.min(
          255,
          Math.round(255 * (1 - newCmyk.c / 100) * (1 - newCmyk.k / 100))
        )
      );
      const g = Math.max(
        0,
        Math.min(
          255,
          Math.round(255 * (1 - newCmyk.m / 100) * (1 - newCmyk.k / 100))
        )
      );
      const b = Math.max(
        0,
        Math.min(
          255,
          Math.round(255 * (1 - newCmyk.y / 100) * (1 - newCmyk.k / 100))
        )
      );
      const newRgb = { r, g, b };
      setRgb(newRgb);
      setHsb(rgbToHsb(r, g, b));
      setHsl(rgbToHsl(r, g, b));
      const newColor = rgbToHex(r, g, b);
      setColor(newColor);
      setHexInput(newColor);
    };

  const handleHsbChange =
    (component: keyof HsbColor) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsShadeSelection(false);
      const value = Math.min(
        component === "h" ? 360 : 100,
        Math.max(0, parseInt(event.target.value) || 0)
      );
      const newHsb = { ...hsb, [component]: value };
      setHsb(newHsb);
      // Convert HSB to RGB and update color using precise algorithm
      const h = newHsb.h / 360;
      const s = newHsb.s / 100;
      const v = newHsb.b / 100;

      let r = 0,
        g = 0,
        b = 0;

      if (s === 0) {
        // Achromatic (gray)
        r = g = b = v;
      } else {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
          case 0:
            r = v;
            g = t;
            b = p;
            break;
          case 1:
            r = q;
            g = v;
            b = p;
            break;
          case 2:
            r = p;
            g = v;
            b = t;
            break;
          case 3:
            r = p;
            g = q;
            b = v;
            break;
          case 4:
            r = t;
            g = p;
            b = v;
            break;
          case 5:
            r = v;
            g = p;
            b = q;
            break;
        }
      }

      // Ensure values are within valid ranges and round precisely
      const newRgb = {
        r: Math.max(0, Math.min(255, Math.round(r * 255))),
        g: Math.max(0, Math.min(255, Math.round(g * 255))),
        b: Math.max(0, Math.min(255, Math.round(b * 255))),
      };
      setRgb(newRgb);
      setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
      const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setColor(newColor);
      setHexInput(newColor);
    };

  const handleAddToFavorites = () => {
    const isAlreadyFavorite = favorites.some((fav) => fav.color === color);
    if (!isAlreadyFavorite) {
      const newFavorites = [{ color, name: "" }, ...favorites]; // Add to beginning of array
      setFavorites(newFavorites);
      localStorage.setItem(
        "colorPickerFavorites",
        JSON.stringify(newFavorites)
      );
    }
  };

  const handleRemoveFromFavorites = (index: number) => {
    const newFavorites = favorites.filter((_, i) => i !== index);
    setFavorites(newFavorites);
    localStorage.setItem("colorPickerFavorites", JSON.stringify(newFavorites));
  };

  const handleFavoriteNameChange = (index: number, newName: string) => {
    const newFavorites = [...favorites];
    newFavorites[index].name = newName;
    setFavorites(newFavorites);
    localStorage.setItem("colorPickerFavorites", JSON.stringify(newFavorites));
  };

  const handleClearAllFavorites = () => {
    setFavorites([]);
    localStorage.removeItem("colorPickerFavorites");
  };

  const handleFavoriteClick = (color: string) => {
    setColor(color);
    setHexInput(color);
    setIsShadeSelection(false);
  };

  const filteredFavorites = favorites.filter((fav) =>
    fav.name.toLowerCase().includes(favoriteSearch.toLowerCase())
  );

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setHexInput(newHex);

    // Only update color if it's a valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(newHex)) {
      setColor(newHex);
      setIsShadeSelection(false);
    }
  };

  const handleHexBlur = () => {
    // If hex is invalid on blur, reset to current color
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      setHexInput(color);
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ height: "100vh", py: "clamp(16px, 3vh, 32px)", overflow: "hidden" }}
    >
      <Box
        sx={{ height: "100%", display: "flex", gap: "clamp(16px, 3vw, 32px)" }}
      >
        <Box sx={{ flex: 1, height: "100%" }}>
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <ColorPickerContainer>
              <HexColorPicker color={color} onChange={handleColorChange} />
            </ColorPickerContainer>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  mb: "clamp(4px, 1vh, 8px)",
                  mt: "clamp(16px, 3vh, 24px)",
                  ml: "clamp(8px, 1.5vw, 16px)",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "clamp(8px, 1.5vw, 16px)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                      mb: 0,
                    }}
                  >
                    Favorites
                  </Typography>
                  {favorites.length > 0 && (
                    <IconButton
                      size="small"
                      onClick={handleClearAllFavorites}
                      color="error"
                      sx={{
                        minWidth: "clamp(24px, 4vw, 32px)",
                        height: "clamp(24px, 4vw, 32px)",
                      }}
                      title="Clear all favorites"
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <TextField
                  size="small"
                  placeholder="Search..."
                  value={favoriteSearch}
                  onChange={(e) => setFavoriteSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon
                        sx={{
                          mr: "clamp(4px, 1vw, 8px)",
                          color: "text.secondary",
                          fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
                        }}
                      />
                    ),
                  }}
                  sx={{
                    maxWidth: "clamp(120px, 20vw, 180px)",
                    "& .MuiInputBase-input": {
                      fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)",
                    },
                  }}
                />
              </Box>
              <FavoritesContainer>
                {filteredFavorites.map((favorite, index) => (
                  <FavoriteItem key={index}>
                    <FavoriteColor
                      color={favorite.color}
                      onClick={() => handleFavoriteClick(favorite.color)}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)" }}
                    >
                      {favorite.color}
                    </Typography>
                    {editingFavoriteIndex === index ? (
                      <TextField
                        size="small"
                        value={favorite.name}
                        onChange={(e) =>
                          handleFavoriteNameChange(index, e.target.value)
                        }
                        onBlur={() => setEditingFavoriteIndex(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setEditingFavoriteIndex(null);
                          }
                        }}
                        autoFocus
                        placeholder="Enter name..."
                        sx={{
                          width: "100%",
                          "& .MuiInputBase-input": {
                            fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)",
                          },
                        }}
                      />
                    ) : (
                      <Typography
                        onClick={() => setEditingFavoriteIndex(index)}
                        sx={{
                          cursor: "pointer",
                          fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)",
                        }}
                      >
                        {favorite.name || "Click to add name"}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        gap: "clamp(2px, 0.5vw, 4px)",
                        mt: "clamp(2px, 0.5vh, 4px)",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setEditingFavoriteIndex(index)}
                        color="primary"
                        sx={{
                          minWidth: "clamp(24px, 4vw, 32px)",
                          height: "clamp(24px, 4vw, 32px)",
                        }}
                      >
                        <SearchIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFromFavorites(index)}
                        color="error"
                        sx={{
                          minWidth: "clamp(24px, 4vw, 32px)",
                          height: "clamp(24px, 4vw, 32px)",
                        }}
                      >
                        <FavoriteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </FavoriteItem>
                ))}
              </FavoritesContainer>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "clamp(8px, 1.5vh, 16px)",
              overflow: "hidden",
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                  mb: "clamp(8px, 1.5vh, 16px)",
                }}
              >
                Color Shades
              </Typography>
              <ShadeSelector ref={shadeSelectorRef}>
                {shades.map((shade, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: "relative",
                      pb: "clamp(20px, 2.5vh, 28px)",
                    }}
                  >
                    <ShadeBox
                      color={shade}
                      selected={index === selectedShadeIndex}
                      onClick={() => handleShadeClick(shade, index)}
                    />
                    <ShadeLabel>{index - 100}%</ShadeLabel>
                  </Box>
                ))}
              </ShadeSelector>
            </Box>

            <ColorPreview sx={{}}>
              <IconButton
                onClick={handleAddToFavorites}
                color="primary"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                  },
                }}
              >
                {favorites.some((fav) => fav.color === color) ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
              <TextPreviewBox
                sx={{ backgroundColor: color, mr: 0, color: "white" }}
              >
                color
              </TextPreviewBox>
              <TextPreviewBox
                sx={{ backgroundColor: color, mr: 0, color: "black" }}
              >
                color
              </TextPreviewBox>
            </ColorPreview>

            <Box
              sx={{
                mt: "auto",
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                paddingTop: "clamp(8px, 1.5vh, 16px)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(4px, 1vw, 8px)",
                  mb: "clamp(12px, 2vh, 16px)",
                }}
              >
                <TextField
                  fullWidth
                  label="HEX Color"
                  value={hexInput}
                  onChange={handleHexChange}
                  onBlur={handleHexBlur}
                  variant="outlined"
                  sx={{
                    "& .MuiInputLabel-root": {
                      whiteSpace: "nowrap",
                      fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)",
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)",
                    },
                  }}
                />
                <IconButton
                  onClick={handleCopyColor}
                  color="primary"
                  sx={{
                    minWidth: "clamp(36px, 6vw, 48px)",
                    height: "clamp(36px, 6vw, 48px)",
                  }}
                >
                  <ContentCopyIcon
                    sx={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
                  />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: "clamp(8px, 1.5vw, 16px)",
                  mb: "clamp(12px, 2vh, 16px)",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "clamp(8px, 1.5vw, 16px)",
                    flex: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Red"
                    type="number"
                    value={rgb.r}
                    onChange={handleRgbChange("r")}
                    inputProps={{ min: 0, max: 255 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Green"
                    type="number"
                    value={rgb.g}
                    onChange={handleRgbChange("g")}
                    inputProps={{ min: 0, max: 255 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Blue"
                    type="number"
                    value={rgb.b}
                    onChange={handleRgbChange("b")}
                    inputProps={{ min: 0, max: 255 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
                    );
                    setShowSnackbar(true);
                  }}
                  color="primary"
                  sx={{
                    minWidth: "clamp(36px, 6vw, 48px)",
                    height: "clamp(36px, 6vw, 48px)",
                  }}
                >
                  <ContentCopyIcon
                    sx={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
                  />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: "clamp(8px, 1.5vw, 16px)",
                  mb: "clamp(12px, 2vh, 16px)",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "clamp(8px, 1.5vw, 16px)",
                    flex: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Hue"
                    type="number"
                    value={hsl.h}
                    onChange={handleHslChange("h")}
                    inputProps={{ min: 0, max: 360 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Saturation"
                    type="number"
                    value={hsl.s}
                    onChange={handleHslChange("s")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Lightness"
                    type="number"
                    value={hsl.l}
                    onChange={handleHslChange("l")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
                    );
                    setShowSnackbar(true);
                  }}
                  color="primary"
                  sx={{
                    minWidth: "clamp(36px, 6vw, 48px)",
                    height: "clamp(36px, 6vw, 48px)",
                  }}
                >
                  <ContentCopyIcon
                    sx={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
                  />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: "clamp(8px, 1.5vw, 16px)",
                  mb: "clamp(12px, 2vh, 16px)",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "clamp(8px, 1.5vw, 16px)",
                    flex: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Cyan"
                    type="number"
                    value={cmyk.c}
                    onChange={handleCmykChange("c")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Magenta"
                    type="number"
                    value={cmyk.m}
                    onChange={handleCmykChange("m")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Yellow"
                    type="number"
                    value={cmyk.y}
                    onChange={handleCmykChange("y")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Key (Black)"
                    type="number"
                    value={cmyk.k}
                    onChange={handleCmykChange("k")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.65rem, 1.2vw, 0.75rem)",
                      },
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
                    );
                    setShowSnackbar(true);
                  }}
                  color="primary"
                  sx={{
                    minWidth: "clamp(36px, 6vw, 48px)",
                    height: "clamp(36px, 6vw, 48px)",
                  }}
                >
                  <ContentCopyIcon
                    sx={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
                  />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: "clamp(8px, 1.5vw, 16px)",
                  mb: "clamp(12px, 2vh, 16px)",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: "clamp(8px, 1.5vw, 16px)",
                    flex: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Hue"
                    type="number"
                    value={hsb.h}
                    onChange={handleHsbChange("h")}
                    inputProps={{ min: 0, max: 360 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Saturation"
                    type="number"
                    value={hsb.s}
                    onChange={handleHsbChange("s")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Brightness"
                    type="number"
                    value={hsb.b}
                    onChange={handleHsbChange("b")}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "clamp(0.7rem, 1.3vw, 0.8rem)",
                      },
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)`
                    );
                    setShowSnackbar(true);
                  }}
                  color="primary"
                  sx={{
                    minWidth: "clamp(36px, 6vw, 48px)",
                    height: "clamp(36px, 6vw, 48px)",
                  }}
                >
                  <ContentCopyIcon
                    sx={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
                  />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Color copied to clipboard!
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
