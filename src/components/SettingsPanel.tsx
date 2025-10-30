import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AppSettings } from '@/types/chat';
import { getAllTextModels, IMAGE_MODELS } from '@/lib/models';
import { beautifyModelName, getCustomModels, addCustomModel, removeCustomModel } from '@/lib/model-utils';
import { toast } from 'sonner';
import { Download, Upload, LogOut, LogIn, Trash2, Plus, X } from 'lucide-react';
import { ThemeCustomizer } from '@/components/ThemeCustomizer';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportChats: () => void;
  onImportChats: (file: File) => void;
  onClearAllData: () => void;
}

const SettingsPanel = ({
  settings,
  onUpdateSettings,
  onExportChats,
  onImportChats,
  onClearAllData,
}: SettingsPanelProps) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isPuterSignedIn, setIsPuterSignedIn] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [customModels, setCustomModels] = useState<string[]>(getCustomModels());

  // Get all models including custom ones
  const ALL_TEXT_MODELS = getAllTextModels();

  const handleSave = () => {
    onUpdateSettings(localSettings);
    toast.success('Settings saved');
  };

  const handlePuterSignIn = async () => {
    try {
      // @ts-ignore - Puter is loaded via script tag
      await puter.auth.signIn();
      setIsPuterSignedIn(true);
      toast.success('Signed in to Puter');
    } catch (error) {
      toast.error('Failed to sign in to Puter');
    }
  };

  const handlePuterSignOut = async () => {
    try {
      // @ts-ignore
      await puter.auth.signOut();
      setIsPuterSignedIn(false);
      toast.success('Signed out from Puter');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportChats(file);
    }
  };

  const handleAddCustomModel = () => {
    if (!customModelInput.trim()) {
      toast.error('Please enter a model ID');
      return;
    }

    const modelId = customModelInput.trim();
    const success = addCustomModel(modelId);
    
    if (success) {
      setCustomModels(getCustomModels());
      setCustomModelInput('');
      toast.success(`Added custom model: ${beautifyModelName(modelId)}`);
    } else {
      toast.error('Model already exists');
    }
  };

  const handleRemoveCustomModel = (modelId: string) => {
    removeCustomModel(modelId);
    setCustomModels(getCustomModels());
    toast.success('Custom model removed');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your AI models, theme, and data preferences</p>
      </div>

      {/* Theme Customization */}
      <ThemeCustomizer settings={localSettings} onUpdateSettings={onUpdateSettings} />

      {/* Puter Account */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Puter Account</h2>
          <p className="text-sm text-muted-foreground">
            Sign in to a Puter account to use AI features. Get 400M free tokens per month per account.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {!isPuterSignedIn ? (
            <Button onClick={handlePuterSignIn} size="lg" className="glow-blue">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Puter
            </Button>
          ) : (
            <Button onClick={handlePuterSignOut} variant="outline" size="lg">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open('https://puter.com', '_blank')}
          >
            Create New Account
          </Button>
        </div>
        
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm"><strong>Check Usage:</strong> Go to puter.com → Settings → Usage</p>
        </div>
      </Card>

      {/* Model Selection */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">AI Models</h2>
          <p className="text-sm text-muted-foreground">Choose your preferred AI models and configure parameters</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="text-model">Text Model (Standard)</Label>
            <Select
              value={localSettings.textModel}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, textModel: value })
              }
            >
              <SelectTrigger id="text-model" className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {ALL_TEXT_MODELS.filter((model: any) => !model.isCustom).map((model: any) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-model-select">Text Model (Custom) ✨</Label>
            <Select
              value={customModels.includes(localSettings.textModel) ? localSettings.textModel : ''}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, textModel: value })
              }
            >
              <SelectTrigger id="custom-model-select" className="bg-input">
                <SelectValue placeholder="Select custom model" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {customModels.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No custom models added yet
                  </SelectItem>
                ) : (
                  customModels.map((modelId) => (
                    <SelectItem key={modelId} value={modelId}>
                      {beautifyModelName(modelId)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="image-model">Image Model</Label>
            <Select
              value={localSettings.imageModel}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, imageModel: value })
              }
            >
              <SelectTrigger id="image-model" className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Model Management */}
        <div className="border-t border-border pt-6 space-y-4">
          <div>
            <Label className="text-base font-semibold">Add Custom OpenRouter Model</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Add any OpenRouter model ID. No need to include "openrouter:" prefix - it's added automatically.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="provider/model-name (e.g. ibm-granite/granite-4.0-h-micro)"
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomModel()}
              className="bg-input flex-1"
            />
            <Button onClick={handleAddCustomModel} className="glow-blue shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          </div>
          
          {/* Custom Models List */}
          {customModels.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Custom Models ({customModels.length}):</Label>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                {customModels.map((modelId) => (
                  <div
                    key={modelId}
                    className="flex items-center justify-between bg-secondary/50 hover:bg-secondary/70 transition-colors rounded-lg p-3 text-sm group"
                  >
                    <span className="truncate flex-1 font-mono text-xs">{beautifyModelName(modelId)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-2 opacity-60 group-hover:opacity-100"
                      onClick={() => handleRemoveCustomModel(modelId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Model Parameters */}
        <div className="border-t border-border pt-6 space-y-6">
          <div>
            <Label className="text-base font-semibold">Model Parameters</Label>
            <p className="text-xs text-muted-foreground mt-1">Fine-tune AI behavior and response generation</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature</Label>
                <span className="text-sm font-medium">{localSettings.temperature}</span>
              </div>
              <Slider
                id="temperature"
                value={[localSettings.temperature]}
                onValueChange={([value]) =>
                  setLocalSettings({ ...localSettings, temperature: value })
                }
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Lower = more focused and deterministic, Higher = more creative and random
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                value={localSettings.maxTokens}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })
                }
                className="bg-input"
              />
              <p className="text-xs text-muted-foreground">
                Maximum length of generated responses
              </p>
            </div>
          </div>
        </div>

        {/* Debug Options */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="debug-logs" className="text-base font-medium cursor-pointer">
                Enable Debug Logs
              </Label>
              <p className="text-xs text-muted-foreground">
                Log detailed API requests, responses, and errors to browser console for troubleshooting
              </p>
            </div>
            <Switch
              id="debug-logs"
              checked={localSettings.enableDebugLogs || false}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, enableDebugLogs: checked })
              }
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} size="lg" className="glow-blue">
            Save Settings
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Data Management</h2>
          <p className="text-sm text-muted-foreground">Export, import, or clear your chat data</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onExportChats} variant="outline" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Export All Chats
          </Button>
          <Button variant="outline" size="lg" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import Chats
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        <div className="border-t border-destructive/20 pt-4 mt-4">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              if (confirm('⚠️ This will permanently delete ALL your data including chats, settings, and custom models. This action cannot be undone. Are you absolutely sure?')) {
                onClearAllData();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* Rate Limit Info */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h2 className="text-xl font-semibold mb-3">💡 Rate Limit Information</h2>
        <div className="space-y-3 text-sm">
          <div className="bg-background/50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-destructive">
              Error: "Failed to get response from AI"
            </p>
            <p>
              This means you've exceeded the 400 million token limit. Create a new Puter account to
              get another 400M tokens instantly.
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary font-medium">
            <span>📊 Track your usage:</span>
            <a 
              href="https://puter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              puter.com → Settings → Usage
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPanel;
