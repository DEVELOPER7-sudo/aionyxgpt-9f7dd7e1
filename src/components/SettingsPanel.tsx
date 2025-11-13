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
  const [modelSearch, setModelSearch] = useState('');
  const [isTextModelOpen, setIsTextModelOpen] = useState(false);

  // Get all models including custom ones
  const ALL_TEXT_MODELS = getAllTextModels();
  
  // Filter models based on search
  const filteredModels = ALL_TEXT_MODELS.filter((model: any) => 
    model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    model.provider.toLowerCase().includes(modelSearch.toLowerCase()) ||
    model.id.toLowerCase().includes(modelSearch.toLowerCase())
  );

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
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden">
      <div className="max-w-5xl mx-auto p-3 md:p-6 space-y-6">
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

      {/* Venice Uncensored Configuration */}
      {localSettings.textModel.includes('dolphin-mistral-24b-venice') && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Venice Uncensored Model Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure OpenRouter API for Venice uncensored model
            </p>
          </div>
          
          <div className="space-y-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="venice-openrouter-key">OpenRouter API Key (Required for Venice)</Label>
              <Input
                id="venice-openrouter-key"
                type="password"
                placeholder="sk-or-v1-..."
                value={localSettings.customOpenRouterKey || ''}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, customOpenRouterKey: e.target.value })
                }
                className="bg-input"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ <strong>Security Warning:</strong> Your API key is stored in browser storage. Use a dedicated key for this app.
              </p>
            </div>
          </div>
        </Card>
      )}

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
              open={isTextModelOpen}
              onOpenChange={setIsTextModelOpen}
              value={localSettings.textModel}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, textModel: value })
              }
            >
              <SelectTrigger id="text-model" className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="max-h-[400px]"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="px-2 pb-2 sticky top-0 bg-popover z-10">
                  <Input
                    placeholder="Search models..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onFocusCapture={(e) => e.stopPropagation()}
                    inputMode="search"
                    className="h-8 text-sm"
                  />
                </div>
                {filteredModels.filter((model: any) => !model.isCustom && model.id.includes('venice')).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🐬 Uncensored Model (OpenRouter)</div>
                    {filteredModels.filter((model: any) => !model.isCustom && model.id.includes('venice')).map((model: any) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {filteredModels.filter((model: any) => !model.isCustom && !model.id.includes('venice') && (model.id.includes('gpt-5') || model.id.includes('claude-sonnet-4.5') || model.id.includes('gemini-2.5-pro') || model.id.includes('deepseek-r1') || model.id.includes('grok-3') || model.id.includes('llama-4') || model.id.includes('qwen3-max') || model.id.includes('sonar-pro'))).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">⚡ Featured Models (Puter JS)</div>
                    {filteredModels.filter((model: any) => !model.isCustom && !model.id.includes('venice') && (model.id.includes('gpt-5') || model.id.includes('claude-sonnet-4.5') || model.id.includes('gemini-2.5-pro') || model.id.includes('deepseek-r1') || model.id.includes('grok-3') || model.id.includes('llama-4') || model.id.includes('qwen3-max') || model.id.includes('sonar-pro'))).map((model: any) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </SelectItem>
                    ))}
                  </>
                )}
                {filteredModels.filter((model: any) => !model.isCustom && !model.id.includes('venice') && !model.id.includes('gpt-5') && !model.id.includes('claude-sonnet-4.5') && !model.id.includes('gemini-2.5-pro') && !model.id.includes('deepseek-r1') && !model.id.includes('grok-3') && !model.id.includes('llama-4') && !model.id.includes('qwen3-max') && !model.id.includes('sonar-pro')).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">🚀 Other Models (Puter JS)</div>
                    {filteredModels.filter((model: any) => !model.isCustom && !model.id.includes('venice') && !model.id.includes('gpt-5') && !model.id.includes('claude-sonnet-4.5') && !model.id.includes('gemini-2.5-pro') && !model.id.includes('deepseek-r1') && !model.id.includes('grok-3') && !model.id.includes('llama-4') && !model.id.includes('qwen3-max') && !model.id.includes('sonar-pro')).map((model: any) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </SelectItem>
                    ))}
                  </>
                )}
                {filteredModels.length === 0 && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No models found
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              🐬 Venice model uses OpenRouter (requires API key). All others use Puter JS.
            </p>
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
            <Label className="text-base font-semibold">Add Custom Puter Model</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Add any custom model ID supported by Puter JS. These will use the Puter endpoint.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="model-name (e.g. custom-model-v1)"
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

        {/* Advanced Options */}
        <div className="border-t border-border pt-6 space-y-4">
          <div>
            <Label className="text-base font-semibold">Advanced Options</Label>
            <p className="text-xs text-muted-foreground mt-1">Configure advanced AI behavior and privacy settings</p>
          </div>

          {/* Streaming Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="streaming" className="text-base font-medium cursor-pointer flex items-center gap-2">
                ⚡ Enable Streaming Responses
              </Label>
              <p className="text-xs text-muted-foreground">
                Stream AI responses in real-time as they're generated (recommended for faster feedback)
              </p>
            </div>
            <Switch
              id="streaming"
              checked={localSettings.streamingEnabled !== false}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, streamingEnabled: checked })
              }
            />
          </div>

          {/* Incognito Mode */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="incognito" className="text-base font-medium cursor-pointer flex items-center gap-2">
                🔒 Incognito Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Private mode - chats won't be saved to storage or synced to cloud
              </p>
            </div>
            <Switch
              id="incognito"
              checked={localSettings.incognitoMode || false}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, incognitoMode: checked })
              }
            />
          </div>

          {/* Debug Logs */}
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="debug-logs" className="text-base font-medium cursor-pointer">
                🐛 Enable Debug Logs
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

        {/* Color Customization */}
        <div className="border-t border-border pt-6 space-y-4">
          <div>
            <Label className="text-base font-semibold">🎨 Color Customization</Label>
            <p className="text-xs text-muted-foreground mt-1">Customize sidebar and background colors</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sidebar-color">Sidebar Color</Label>
              <Input
                id="sidebar-color"
                type="color"
                value={`#${(localSettings.sidebarColor || '0 0% 10%').split(' ').map(v => 
                  parseInt(v.replace('%', '')).toString(16).padStart(2, '0')
                ).join('')}`}
                onChange={(e) => {
                  const hex = e.target.value;
                  setLocalSettings({ ...localSettings, sidebarColor: hex });
                }}
                className="h-12 w-full"
              />
              <p className="text-xs text-muted-foreground">Click to choose a color</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <Input
                id="bg-color"
                type="color"
                value={`#${(localSettings.backgroundColor || '0 0% 0%').split(' ').map(v => 
                  parseInt(v.replace('%', '')).toString(16).padStart(2, '0')
                ).join('')}`}
                onChange={(e) => {
                  const hex = e.target.value;
                  setLocalSettings({ ...localSettings, backgroundColor: hex });
                }}
                className="h-12 w-full"
              />
              <p className="text-xs text-muted-foreground">Click to choose a color</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => {
              setLocalSettings({ 
                ...localSettings, 
                sidebarColor: '0 0% 10%',
                backgroundColor: '0 0% 0%' 
              });
              toast.success('Colors reset to default');
            }}
            className="w-full"
          >
            Reset to Default Colors
          </Button>
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
    </div>
  );
};

export default SettingsPanel;
