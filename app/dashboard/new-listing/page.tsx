'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader as Loader2, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function NewListingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<any>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (files.length + selectedFiles.length > 10) {
      toast.error('En fazla 10 fotoğraf yükleyebilirsiniz');
      return;
    }

    setFiles([...files, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUploadAndAnalyze = async () => {
    if (files.length === 0) {
      toast.error('Lütfen en az bir fotoğraf yükleyin');
      return;
    }

    setUploading(true);

    try {
      const listingId = crypto.randomUUID();
      const imageUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${listingId}/${i}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      setUploading(false);
      setAnalyzing(true);

      const response = await fetch('/api/analyze-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls }),
      });

      if (!response.ok) throw new Error('AI analizi başarısız oldu');

      const { title: aiTitle, description: aiDescription, features: aiFeatures } = await response.json();

      setTitle(aiTitle);
      setDescription(aiDescription);
      setFeatures(aiFeatures);

      const { error: insertError } = await supabase.from('listings').insert({
        id: listingId,
        user_id: user?.id,
        title: aiTitle,
        description: aiDescription,
        image_urls: imageUrls,
        property_features: aiFeatures,
        status: 'draft',
      });

      if (insertError) throw insertError;

      toast.success('İlan başarıyla oluşturuldu!');
      setAnalyzing(false);

      router.push(`/dashboard/listings/${listingId}`);
    } catch (error: any) {
      toast.error('Bir hata oluştu', {
        description: error.message,
      });
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Yeni İlan Oluştur</h1>
        <p className="mt-2 text-slate-600">
          Emlak fotoğraflarını yükleyin, AI sizin için profesyonel bir ilan metni oluştursun.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Fotoğraf Yükleme</span>
          </CardTitle>
          <CardDescription>
            Evinizin fotoğraflarını yükleyin (En fazla 10 adet, JPG/PNG)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
              <ImageIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-sm text-slate-600 mb-2">
                Fotoğrafları sürükleyin veya tıklayarak seçin
              </p>
              <Button type="button" variant="outline" disabled={uploading || analyzing} asChild>
                <div>
                  <Upload className="mr-2 h-4 w-4" />
                  Fotoğraf Seç
                </div>
              </Button>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploading || analyzing}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <Button
              onClick={handleUploadAndAnalyze}
              className="w-full"
              size="lg"
              disabled={uploading || analyzing}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fotoğraflar yükleniyor...
                </>
              ) : analyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  AI analiz yapıyor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Yükle ve AI ile Analiz Et
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {(title || description) && (
        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-slate-900" />
              <span>AI Tarafından Oluşturulan İlan</span>
            </CardTitle>
            <CardDescription>
              Gemini AI tarafından üretildi - İstediğiniz gibi düzenleyebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="İlan başlığı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="İlan açıklaması"
                rows={8}
                className="resize-none"
              />
            </div>
            {features && Object.keys(features).length > 0 && (
              <div className="space-y-2">
                <Label>AI Tarafından Tespit Edilen Özellikler</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(features).map(([key, value]) => (
                    <div key={key} className="bg-white border rounded-lg p-3">
                      <p className="text-xs text-slate-500 capitalize">{key}</p>
                      <p className="font-medium text-slate-900">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
