import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AppSettings } from '@/types/chat';
import { toast } from 'sonner';

interface ThemeCustomizerProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const PRESET_THEMES = [
  { name: 'Blue', primary: '217 91% 60%', accent: '217 91% 60%', bg: '0 0% 0%' },
  { name: 'Purple', primary: '270 75% 60%', accent: '270 75% 60%', bg: '0 0% 0%' },
  { name: 'Green', primary: '142 76% 36%', accent: '142 76% 36%', bg: '0 0% 0%' },
  { name: 'Red', primary: '0 72% 51%', accent: '0 72% 51%', bg: '0 0% 0%' },
  { name: 'Orange', primary: '25 95% 53%', accent: '25 95% 53%', bg: '0 0% 0%' },
  { name: 'Pink', primary: '330 81% 60%', accent: '330 81% 60%', bg: '0 0% 0%' },
  { name: 'Teal', primary: '180 65% 50%', accent: '180 65% 50%', bg: '0 0% 0%' },
  { name: 'Cyan', primary: '195 75% 60%', accent: '195 75% 60%', bg: '0 0% 0%' },
];

export const ThemeCustomizer = ({ settings, onUpdateSettings }: ThemeCustomizerProps) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const applyTheme = (theme: typeof PRESET_THEMES[0]) => {
    const newSettings = {
      ...localSettings,
      themeColor: theme.primary,
      accentColor: theme.accent,
      backgroundColor: theme.bg,
    };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
    toast.success(`${theme.name} theme applied`);
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Theme Customization</h2>
      <p className="text-sm text-muted-foreground">
        Choose a color theme for your OnyxGPT
      </p>

      <div className="space-y-3">
        <Label>Preset Themes</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRESET_THEMES.map((theme) => (
            <Button
              key={theme.name}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform"
              onClick={() => applyTheme(theme)}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-border"
                style={{
                  backgroundColor: `hsl(${theme.primary})`,
                  boxShadow: `0 0 15px hsl(${theme.primary} / 0.5)`,
                }}
              />
              <span className="text-sm">{theme.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
        <strong>Note:</strong> Theme changes apply instantly. Your preference is saved automatically.
      </div>
    </Card>
  );
};
