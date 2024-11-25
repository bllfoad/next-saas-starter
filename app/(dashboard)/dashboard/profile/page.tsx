'use client';

import { useState, useRef } from 'react';
import { useUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { updateProfile, uploadProfileImage } from './actions';
import { toast } from 'sonner';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

export default function ProfilePage() {
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [mainLanguage, setMainLanguage] = useState(user?.mainLanguage || 'en');
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(
    user?.preferredLanguages as string[] || ['en']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        avatarUrl,
        mainLanguage,
        preferredLanguages,
      });
      router.refresh();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadProfileImage(formData);
      if (result.imageUrl) {
        setAvatarUrl(result.imageUrl);
        toast.success('Profile picture uploaded successfully');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const addPreferredLanguage = (lang: string) => {
    if (preferredLanguages.length < 3 && !preferredLanguages.includes(lang)) {
      setPreferredLanguages([...preferredLanguages, lang]);
    }
  };

  const removePreferredLanguage = (lang: string) => {
    setPreferredLanguages(preferredLanguages.filter(l => l !== lang));
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your profile information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || user?.image || ''} />
                <AvatarFallback>{name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Main Language</Label>
            <Select value={mainLanguage} onValueChange={setMainLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Preferred Languages (Max 3)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {preferredLanguages.map((lang) => (
                <Badge key={lang} variant="secondary" className="gap-1">
                  {languages.find(l => l.code === lang)?.name}
                  <button
                    onClick={() => removePreferredLanguage(lang)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={addPreferredLanguage}
              disabled={preferredLanguages.length >= 3}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add a language" />
              </SelectTrigger>
              <SelectContent>
                {languages
                  .filter((lang) => !preferredLanguages.includes(lang.code))
                  .map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
